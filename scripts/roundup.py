"""Creates a Kit broadcast from a round-up file written by the Chief of Staff.

Usage: python3 scripts/roundup.py roundups/2026-11-24.json [more files...]
Each file: {"subject": "...", "preview_text": "...", "body": "plain text with blank lines between paragraphs",
            "send_at": "2026-11-24T08:00:00Z" or null for a draft}
Needs the KIT_API_KEY secret. Never prints subscriber data.
"""
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("KIT_API_KEY", "").strip()
if not KEY:
    print("KIT_API_KEY not set; nothing to do.")
    sys.exit(0)

URL_RE = re.compile(r"(https?://[^\s<]+[^\s<.,;:!?)])")


def to_html(text):
    parts = []
    for para in re.split(r"\n\s*\n", text.strip()):
        safe = html.escape(para.strip(), quote=False)
        # Keep Kit's Liquid tags exactly as written.
        safe = safe.replace("&quot;", '"')
        safe = URL_RE.sub(r'<a href="\1">\1</a>', safe)
        parts.append("<p>" + safe.replace("\n", "<br>") + "</p>")
    return "\n".join(parts)


def create(path):
    with open(path, encoding="utf-8") as f:
        r = json.load(f)
    subject, body = r["subject"].strip(), r["body"]
    payload = {
        "subject": subject,
        "preview_text": r.get("preview_text", "") or "",
        "description": "MusicMentor round-up " + os.path.basename(path).replace(".json", ""),
        "content": to_html(body),
        "public": False,
        "published_at": None,
        "send_at": r.get("send_at"),
    }
    req = urllib.request.Request(
        "https://api.kit.com/v4/broadcasts", data=json.dumps(payload).encode(), method="POST",
        headers={"X-Kit-Api-Key": KEY, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            out = json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        print(f"{path}: Kit refused the broadcast (HTTP {e.code}): {e.read().decode()[:300]}")
        return False
    b = out.get("broadcast", {})
    when = r.get("send_at") or "draft (not scheduled)"
    print(f"{path}: broadcast {b.get('id')} created, send_at={when}")
    return True


ok = all(create(p) for p in sys.argv[1:] if p.endswith(".json"))
sys.exit(0 if ok else 1)
