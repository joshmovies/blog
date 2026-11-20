// Turns any text into a short, repeatable "melody" drawn on a 5-line staff.
// Each post gets its own cover from its slug, so no stock photos are needed.
export function notesFor(text, n = 8) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const out = []; let p = 2 + (h % 4);
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const step = [-2, -1, -1, 0, 1, 1, 2, 3][h % 8];
    p = Math.max(0, Math.min(8, p + step));
    out.push(p);
  }
  out[n - 1] = out[0]; // resolve home, like a cadence
  return out;
}
const SOLFA = ["d", "r", "m", "f", "s", "l", "t", "d'", "r'"];
export function melodySVG(text, { w = 1200, h = 420, ink = "#FFFFFF", accent = "#FF8000", bg = "#000000", labels = true } = {}) {
  const notes = notesFor(text);
  const top = h * 0.24, gap = h * 0.085; // 5 lines
  const lineY = (i) => top + i * gap;
  const posY = (p) => lineY(4) - p * (gap / 2); // p=0 bottom line
  const x0 = w * 0.12, dx = (w * 0.78) / (notes.length - 1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Melody artwork">`;
  s += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  for (let i = 0; i < 5; i++) s += `<line x1="0" x2="${w}" y1="${lineY(i)}" y2="${lineY(i)}" stroke="${ink}" stroke-opacity=".28" stroke-width="2"/>`;
  // a soft line tracing the melody
  s += `<polyline fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="3" points="${notes.map((p, i) => `${x0 + i * dx},${posY(p)}`).join(" ")}"/>`;
  notes.forEach((p, i) => {
    const x = x0 + i * dx, y = posY(p), rx = gap * 0.62, ry = gap * 0.44;
    const up = p < 4, sx = up ? x + rx * 0.92 : x - rx * 0.92, sy2 = up ? y - gap * 3.3 : y + gap * 3.3;
    s += `<line x1="${sx}" x2="${sx}" y1="${y}" y2="${sy2}" stroke="${i === 0 || i === notes.length - 1 ? accent : ink}" stroke-width="3"/>`;
    s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-22 ${x} ${y})" fill="${i === 0 || i === notes.length - 1 ? accent : ink}"/>`;
    if (labels) s += `<text x="${x}" y="${h - h * 0.07}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="${gap * 0.9}" fill="${ink}" fill-opacity=".7">${SOLFA[p]}</text>`;
  });
  return s + "</svg>";
}
export default { notesFor, melodySVG };
