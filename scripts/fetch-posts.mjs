// Pulls published posts from Joshua's Chief of Staff feed (Google Apps Script) and writes them as Markdown files.
// Run by the GitHub Action on a schedule; a change triggers a Netlify rebuild.
import { writeFileSync, readdirSync, unlinkSync, readFileSync, existsSync } from "node:fs";
import { splitCover } from "../lib/cover.js";

const FEED = "https://script.google.com/macros/s/AKfycbzWqf6hZCmf3GLizeRKynws9jarkF5DfyHuQIEC0touN_A1N_P5KhFw8KMXwA636Adb/exec?feed=blog";
const DIR = new URL("../src/posts/", import.meta.url);

const res = await fetch(FEED, { redirect: "follow" });
if (!res.ok) throw new Error("Feed fetch failed: " + res.status);
const data = await res.json();
if (!data.ok || !Array.isArray(data.posts)) throw new Error("Feed returned an error: " + JSON.stringify(data).slice(0, 200));

const keep = new Set();
for (const p of data.posts) {
  const slug = String(p.slug || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const date = String(p.date || "").trim();
  if (!slug || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !p.title || !p.body) continue;
  // The Blog Writer puts the post's cover illustration at the top of the Body between <!-- cover --> and <!-- /cover -->.
  const { cover, body } = splitCover(p.body);
  const fm = {
    title: p.title, description: p.description || "", date, slug,
    tags_list: p.category || "Music", why: p.why || "",
    sources: String(p.sources || "").split(/\s+/).filter((s) => /^https?:\/\//.test(s)),
  };
  if (cover) fm.cover = cover;
  const out = "---json\n" + JSON.stringify(fm, null, 2) + "\n---\n\n" + body.trim() + "\n";
  const file = new URL(slug + ".md", DIR);
  keep.add(slug + ".md");
  if (!existsSync(file) || readFileSync(file, "utf8") !== out) writeFileSync(file, out);
}
// Safety: never wipe the blog if the feed comes back empty by mistake.
if (keep.size) for (const f of readdirSync(DIR)) if (f.endsWith(".md") && !keep.has(f)) unlinkSync(new URL(f, DIR));
console.log("Published posts:", keep.size);
