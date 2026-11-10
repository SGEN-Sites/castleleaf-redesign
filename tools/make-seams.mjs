// make-seams.mjs (FOUNDATION scratch): draws assets/brand/seam-*.svg and edge-torn-*.svg with seeded noise.
//   node tools/make-seams.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('assets/brand');
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const f1 = (n) => Number(n.toFixed(1));

// midpoint displacement between two points: an angular, irregular crack line
function crack(a, b, r, rough, depth) {
  let pts = [a, b];
  let amp = Math.hypot(b[0] - a[0], b[1] - a[1]) * rough;
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const nx = -(y1 - y0), ny = x1 - x0, len = Math.hypot(nx, ny) || 1;
      const t = 0.32 + r() * 0.36; // never the exact middle: the segments differ in length
      const off = (r() - 0.5) * amp;
      next.push([x0 + (x1 - x0) * t + (nx / len) * off, y0 + (y1 - y0) * t + (ny / len) * off], pts[i + 1]);
    }
    pts = next;
    amp *= 0.54;
  }
  return pts;
}
const dOf = (pts) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L');
// a sub-range of the polyline by fraction of its point count
const part = (pts, a, b) => pts.slice(Math.floor(a * (pts.length - 1)), Math.ceil(b * (pts.length - 1)) + 1);

function seamFile(n, { w, h, from, to, seed, rough = 0.2, depth = 6, width = 1, forks = 2, swell = 3 }) {
  const r = rng(seed);
  const main = crack(from, to, r, rough, depth);
  const paths = [];
  const push = (pts, sw, a, b) => paths.push(`<path pathLength="1" data-a="${a.toFixed(3)}" data-b="${b.toFixed(3)}" stroke-width="${f1(sw * 10) / 10}" d="${dOf(pts)}"/>`);
  // overlapping strokes: thin full line, thicker towards the middle, so the line tapers at both ends
  push(main, 0.9 * width, 0, 1);
  push(part(main, 0.1, 0.9), 1.5 * width, 0.1, 0.9);
  push(part(main, 0.24, 0.76), 2.2 * width, 0.24, 0.76);
  push(part(main, 0.38, 0.62), 3 * width, 0.38, 0.62);
  // gold pools here and there, where the lacquer gathered
  for (let i = 0; i < swell; i++) {
    const a = 0.08 + r() * 0.74, b = a + 0.04 + r() * 0.07;
    push(part(main, a, b), (2.4 + r() * 1.6) * width, a, b);
  }
  // a small fork or two
  for (let i = 0; i < forks; i++) {
    const at = 0.16 + (0.7 * (i + 0.3 + r() * 0.4)) / forks;
    const idx = Math.floor(at * (main.length - 1));
    const p = main[idx], q = main[Math.min(main.length - 1, idx + 4)];
    const dir = Math.atan2(q[1] - p[1], q[0] - p[0]) + (r() > 0.5 ? 1 : -1) * (0.45 + r() * 0.5);
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]) * (0.07 + r() * 0.08);
    const end = [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len];
    const fork = crack(p, end, r, 0.2, 4);
    push(fork, 0.7 * width, at, Math.min(1, at + 0.14));
    push(part(fork, 0, 0.55), 1.3 * width, at, Math.min(1, at + 0.08));
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none"><defs><linearGradient id="seam-g" gradientUnits="userSpaceOnUse" x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}"><stop offset="0" stop-color="#8e6f24"/><stop offset=".22" stop-color="#d9b65c"/><stop offset=".46" stop-color="#f1e19a"/><stop offset=".7" stop-color="#c8a24b"/><stop offset="1" stop-color="#8e6f24"/></linearGradient></defs><g stroke="url(#seam-g)" stroke-linecap="round" stroke-linejoin="round">${paths.join('')}</g></svg>\n`;
  fs.writeFileSync(path.join(OUT, `seam-${n}.svg`), svg);
  return paths.length;
}

// a long vertical crack, a long diagonal one, a long horizontal one, a short vertical one
console.log('seam-1 strokes', seamFile(1, { w: 240, h: 1500, from: [120, 0], to: [96, 1500], seed: 7, rough: 0.16, forks: 2 }));
console.log('seam-2 strokes', seamFile(2, { w: 900, h: 1100, from: [40, 0], to: [860, 1100], seed: 23, rough: 0.14, forks: 3 }));
console.log('seam-3 strokes', seamFile(3, { w: 1800, h: 260, from: [0, 170], to: [1800, 96], seed: 41, rough: 0.075, depth: 7, forks: 3, swell: 4 }));
console.log('seam-4 strokes', seamFile(4, { w: 170, h: 760, from: [70, 0], to: [104, 760], seed: 59, rough: 0.2, forks: 1, swell: 2 }));

// ---------- hand-torn paper edges: seamless horizontally (periodic noise), W x H, paper fills from the tear to the bottom
const W = 1600, H = 56;
function periodic(r, cells, amp) {
  const v = Array.from({ length: cells }, () => (r() - 0.5) * amp);
  return (x) => {
    const u = (x / W) * cells, i = Math.floor(u), f = u - i, s = f * f * (3 - 2 * f);
    return v[i % cells] * (1 - s) + v[(i + 1) % cells] * s;
  };
}
function tearY(seed, base, scale = 1) {
  const r = rng(seed);
  const n = [periodic(r, 7, 20 * scale), periodic(r, 23, 13 * scale), periodic(r, 67, 7 * scale), periodic(r, 190, 3.6 * scale), periodic(r, 533, 1.7 * scale)];
  return (x) => base + n.reduce((s, f) => s + f(x), 0);
}
function tearPath(fy, step = 4) {
  let d = `M0 ${H + 2}L0 ${f1(fy(0))}`;
  for (let x = step; x < W; x += step) d += `L${x} ${f1(fy(x))}`;
  return d + `L${W} ${f1(fy(0))}L${W} ${H + 2}Z`;
}
const TONES = {
  rice: ['#fbf9f3', '#ffffff'],
  washi: ['#f2eee2', '#fdfaf1'],
  mint: ['#f6fff7', '#ffffff'],
  plaster: ['#e7ddcc', '#f5eedf'],
  sage: ['#e0e4cd', '#eff1e2'],
  moss: ['#2a3219', '#4d5833'],
  indigo: ['#0a2238', '#1f4263'],
};
const A = tearY(101, 30), B = tearY(202, 30);
const fibreA = (x) => A(x) - 3.2 + Math.max(-2.4, Math.min(3, tearY(303, 0, 0.42)(x)));
for (const [tone, [fill, fibre]] of Object.entries(TONES)) {
  fs.writeFileSync(path.join(OUT, `edge-torn-${tone}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none"><path fill="${fibre}" fill-opacity=".9" d="${tearPath(fibreA)}"/><path fill="${fill}" d="${tearPath(A)}"/></svg>\n`);
}
// plain black versions for use as a CSS mask
fs.writeFileSync(path.join(OUT, 'edge-torn-1.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none"><path d="${tearPath(A)}"/></svg>\n`);
fs.writeFileSync(path.join(OUT, 'edge-torn-2.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none"><path d="${tearPath(B)}"/></svg>\n`);
console.log('edges', Object.keys(TONES).length + 2, 'bytes', fs.statSync(path.join(OUT, 'edge-torn-rice.svg')).size);
