// Per-post cover illustrations.
// Priority: src/covers/<slug>.svg (hand-made or replaced) > "cover" in the post's front matter
// (sent by the Blog Writer inside the Body) > the old melody stave as a fallback.
import { existsSync, readFileSync } from "node:fs";

const COVERS = new URL("../src/covers/", import.meta.url);
const POSTS = new URL("../src/posts/", import.meta.url);

// Keeps only safe, drawable SVG: no scripts, no event handlers, no outside links.
export function cleanSVG(svg) {
  let s = String(svg || "").trim();
  if (!/^<svg[\s>]/i.test(s) || !/<\/svg>\s*$/i.test(s) || !/viewBox=/i.test(s)) return "";
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "");
  if (!/xmlns=/.test(s)) s = s.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return s;
}

// Pulls a <!-- cover --> ... <!-- /cover --> block out of a post body.
export function splitCover(body) {
  const m = String(body || "").match(/<!--\s*cover\s*-->([\s\S]*?)<!--\s*\/cover\s*-->/i);
  if (!m) return { cover: "", body: String(body || "") };
  return { cover: cleanSVG(m[1]), body: String(body).replace(m[0], "").trim() };
}

export function coverFor(slug, fmCover) {
  const file = new URL(slug + ".svg", COVERS);
  if (slug && existsSync(file)) return cleanSVG(readFileSync(file, "utf8"));
  return cleanSVG(fmCover);
}

// For scripts outside Eleventy (the share-image step): read the cover from the post file.
export function coverFromPostFile(slug) {
  const file = new URL(slug + ".md", POSTS);
  let fm = "";
  if (existsSync(file)) {
    const m = readFileSync(file, "utf8").match(/^---json\n([\s\S]*?)\n---/);
    if (m) { try { fm = JSON.parse(m[1]).cover || ""; } catch {} }
  }
  return coverFor(slug, fm);
}
