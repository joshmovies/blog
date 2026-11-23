import { melodySVG } from "./src/_data/melody.js";
import { coverFor } from "./lib/cover.js";
export default function (cfg) {
  cfg.addPassthroughCopy({ "src/static": "/" });
  cfg.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").sort((a, b) => (a.data.date < b.data.date ? 1 : -1))
  );
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  cfg.addFilter("niceDate", (d) => { const x = new Date(d); return x.getUTCDate() + " " + MONTHS[x.getUTCMonth()] + " " + x.getUTCFullYear(); });
  cfg.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  cfg.addFilter("readMins", (s) => Math.max(1, Math.round(String(s || "").split(/\s+/).length / 220)));
  cfg.addFilter("year", () => new Date().getUTCFullYear());
  cfg.addFilter("json", (v) => JSON.stringify(v));
  cfg.addFilter("encode", (s) => encodeURIComponent(s));
  cfg.addFilter("take", (a, n) => (a || []).slice(0, n));
  cfg.addFilter("skip", (a, n) => (a || []).slice(n));
  cfg.addFilter("melody", (slug, opts) => melodySVG(slug, opts || {}));
  // Same artwork as a picture, so the solfa letters are not read as page text by search engines and link previews.
  cfg.addFilter("melodyImg", (slug, opts) => {
    const o = opts || {}; const w = o.w || 1200, h = o.h || 420;
    return `<img class="mel" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(melodySVG(slug, o))}" width="${w}" height="${h}" alt="">`;
  });
  // The post's own cover illustration if it has one, otherwise the melody stave.
  cfg.addFilter("coverImg", (slug, fmCover, opts) => {
    const svg = coverFor(slug, fmCover);
    if (!svg) { const o = opts || {}; const w = o.w || 1200, h = o.h || 420; return `<img class="mel" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(melodySVG(slug, o))}" width="${w}" height="${h}" alt="">`; }
    return `<img class="cov" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" width="1200" height="630" alt="">`;
  });
  cfg.addFilter("hasCover", (slug, fmCover) => !!coverFor(slug, fmCover));
  return { dir: { input: "src", includes: "_includes", output: "_site" }, markdownTemplateEngine: false };
}
