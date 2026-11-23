// Makes a 1200x630 PNG cover for each post so WhatsApp and Facebook show a picture.
import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { melodySVG } from "../src/_data/melody.js";
import { coverFromPostFile } from "../lib/cover.js";
const posts = JSON.parse(readFileSync("_site/posts.json", "utf8"));
const make = (seed, file, own) => {
  const svg = own || melodySVG(seed, { w: 1200, h: 630, labels: false });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 }, background: "#ffffff", font: { defaultFontFamily: "DejaVu Sans" } }).render().asPng();
  writeFileSync(file, png);
};
make("music-notes-home", "_site/cover.png");
for (const p of posts) { const slug = p.url.split("/posts/")[1].replace(/\/$/, ""); make(slug, `_site/posts/${slug}/cover.png`, coverFromPostFile(slug)); }
console.log("Covers:", posts.length + 1);
