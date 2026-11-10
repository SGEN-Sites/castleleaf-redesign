// data.mjs - load every content file once.
//   ctx.site       src/content/site.json        Castle Leaf's facts (main session; each value traced to its own pages)
//   ctx.ia         src/content/ia.json          the adopted architecture mapped onto one store: promo, nav, footer
//   ctx.images     src/content/images.json      generated media registry (IMAGERY lane)
//   ctx.content    src/content/pages/<slug>.json       the client's captured pages, every visible word
//   ctx.posts      src/content/posts/<slug>.json       NEW journal articles (WRITER lanes), by `order`
//   ctx.resources  src/content/resources/<slug>.json   NEW resource pages (WRITER-C lane)
//   ctx.glue       src/content/category-glue.json      NEW category copy for /products/<slug>/ (WRITER-C lane)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';
import { normaliseDashes } from './punct.mjs';

const readJson = (rel, fallback) => {
  const f = path.join(ROOT, rel);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback;
};
const readDir = (rel) => {
  const dir = path.join(ROOT, rel);
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
};

export function loadAll() {
  const site = normaliseDashes(readJson('src/content/site.json', {}));
  const ia = normaliseDashes(readJson('src/content/ia.json', {}));
  const images = readJson('src/content/images.json', { photos: {}, media: {} });
  // punctuation-only dash normalisation of every copy source (src/lib/punct.mjs); words are unchanged.
  const content = normaliseDashes(readDir('src/content/pages'));
  const posts = normaliseDashes(Object.values(readDir('src/content/posts')).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)));
  const resources = normaliseDashes(readDir('src/content/resources'));
  const glue = normaliseDashes(readJson('src/content/category-glue.json', {}));
  return { site, ia, images, content, posts, resources, glue };
}
