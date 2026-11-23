"""Sends each new MusicMentor subscriber a plain, personal welcome email from
joshua@joshuaediale.com (Hostinger mailbox), then tags them in Kit so they are
never emailed twice.

Runs in GitHub Actions. Needs two repository secrets:
  KIT_API_KEY  - Kit V4 API key
  SMTP_PASS    - password of the joshua@joshuaediale.com mailbox
The repo is public, so this script never prints email addresses or names.
"""
import json
import os
import smtplib
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

API = "https://api.kit.com/v4"
TAG_NAME = "welcome-sent"
SENDER = "joshua@joshuaediale.com"
SMTP_HOST, SMTP_PORT = "smtp.hostinger.com", 465
# Subscribers who joined before this moment already got Kit's own welcome email.
START = datetime(2026, 11, 23, 15, 40, tzinfo=timezone.utc)

KEY = os.environ.get("KIT_API_KEY", "").strip()
PASS = os.environ.get("SMTP_PASS", "")
if not KEY or not PASS:
    print("Secrets not set yet; nothing to do.")
    sys.exit(0)


def kit(method, path, body=None, query=None):
    url = API + path + ("?" + urllib.parse.urlencode(query) if query else "")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "X-Kit-Api-Key": KEY, "Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        txt = r.read().decode() or "{}"
        return json.loads(txt)


def tag_id():
    after = None
    while True:
        q = {"per_page": 1000}
        if after:
            q["after"] = after
        res = kit("GET", "/tags", query=q)
        for t in res.get("tags", []):
            if t.get("name") == TAG_NAME:
                return t["id"]
        pg = res.get("pagination", {})
        if not pg.get("has_next_page"):
            break
        after = pg.get("end_cursor")
    return kit("POST", "/tags", body={"name": TAG_NAME})["tag"]["id"]


def new_subscribers():
    since = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")
    out, after = [], None
    while True:
        q = {"created_after": since, "per_page": 1000, "include": "tags", "status": "active"}
        if after:
            q["after"] = after
        res = kit("GET", "/subscribers", query=q)
        out += res.get("subscribers", [])
        pg = res.get("pagination", {})
        if not pg.get("has_next_page"):
            return out
        after = pg.get("end_cursor")


def body_for(name):
    return f"""Hi {name},

Thanks for joining MusicMentor. You're now on the list.

Most singers wait for a better voice, a bigger stage or the right time before they work on their craft. You didn't. You signed up because you value insight, and you know insight is only useful when you act on it. That's the kind of singer I write for.

So I'll be straight with you. I won't flatter you. Some notes will challenge habits you've had for years, and some will ask you to practise things that feel small and boring. The singers who keep growing are the ones who do that work when nobody is clapping.

Twice a week, on Tuesdays and Fridays, I'll send you a short round-up of new notes. You'll also hear first when I release a guide, a training or a resource for singers.

A little about me: I've led music since 2009, from Warri to CFI UNIBEN, and today I serve as a lead vocalist and music minister at RHOGIC Abuja. I also wrote The Lead Singer's Handbook.

Now, one question, {name}: what do you sing, and where do you lead? Just hit reply and tell me in a line or two.

Joshua Ediale
MusicMentor by Joshua Ediale

P.S. If you didn't sign up for this, reply "remove" and I'll take you off the list.
"""


def main():
    tid = tag_id()
    todo = []
    for s in new_subscribers():
        created = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00"))
        tags = {t.get("id") for t in (s.get("tags") or [])}
        if created >= START and tid not in tags:
            todo.append(s)
    if not todo:
        print("No new subscribers to welcome.")
        return
    ctx = ssl.create_default_context()
    sent = failed = 0
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=30) as smtp:
        smtp.login(SENDER, PASS)
        for s in todo:
            name = (s.get("first_name") or "").strip().split(" ")[0].title() or "friend"
            msg = EmailMessage()
            msg["From"] = f"Joshua Ediale <{SENDER}>"
            msg["To"] = s["email_address"]
            msg["Subject"] = f"Welcome to MusicMentor, {name}"
            msg["Date"] = formatdate(localtime=False)
            msg["Message-ID"] = make_msgid(domain="joshuaediale.com")
            msg.set_content(body_for(name))
            try:
                smtp.send_message(msg)
                kit("POST", f"/tags/{tid}/subscribers/{s['id']}", body={})
                sent += 1
                time.sleep(2)
            except Exception as e:  # keep going; never print the address
                failed += 1
                print("One send failed:", type(e).__name__)
    print(f"Welcomed {sent} new subscriber(s); {failed} failed.")


main()
