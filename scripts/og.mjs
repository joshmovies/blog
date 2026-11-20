// Makes a 1200x630 PNG cover for each post so WhatsApp and Facebook show a picture.
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { melodySVG } from "../src/_data/melody.js";
const posts = JSON.parse(readFileSync("_site/posts.json", "utf8"));
const make = (seed, file) => {
  const svg = melodySVG(seed, { w: 1200, h: 630, labels: false });
  writeFileSync(file, new Resvg(svg).render().asPng());
};
make("music-notes-home", "_site/cover.png");
for (const p of posts) { const slug = p.url.split("/posts/")[1].replace(/\/$/, ""); make(slug, `_site/posts/${slug}/cover.png`); }
console.log("Covers:", posts.length + 1);
