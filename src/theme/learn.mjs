// learn.mjs - LEARN lane: /blog/ (hub), /blog/<category>/ x5, /blog/<slug>/ (the 4 captured posts verbatim + ctx.posts),
// /events/ + /event/<slug>/ x22 (captured, verbatim), and the resource pages from ctx.resources.
// Lane classes are prefixed n- (src/styles/learn.css); contract classes come from components.css (FOUNDATION).
// Every hero here is LEARN's own markup (n-hero: crumbs, kicker, serif H1, line, CTA, an arched frame standing in the hero
// and crossing its bottom edge into the next band). No JS string literal starts with "/" (D6): URLs live in attributes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { esc, escA, linkAttrs, absUrl, gimg, hasGenerated, photo, menu, rewriteLinks, stripTags, slugify } from './util.mjs';
import { page, crumbsHtml, icon, bandBg } from './shell.mjs';

const BLOG = 'The CastleLeaf Blog';
const NOTE = 'Educational content, not medical or legal advice.';
const CATS = [
  { slug: 'cannabis-101', label: 'Cannabis 101' },
  { slug: 'shopping-and-reviews', label: 'Shopping & Reviews' },
  { slug: 'news-and-culture', label: 'News & Culture' },
  { slug: 'recipes', label: 'Recipes' },
  { slug: 'resources', label: 'Resources' },
];
const CAT = new Map(CATS.map((c) => [c.slug, c]));
const P = (s) => '/' + s.replace(/^\/+/, ''); // path builder: keeps "/" out of the first character of JS string literals
const catPath = (s) => P(`blog/${s}/`);
const titled = (t) => (/\|\s*CastleLeaf\s*$/i.test(t) ? t : `${t} | CastleLeaf`);
const HOME = { label: 'Home', href: P('') };
const BLOGCRUMB = { label: 'Blog', href: P('blog/') };

// The four captured posts: category (operator's assignment) and the photos each captured page used
// (hero = the post's main/og image, body = the photo inside the article; the CastleLeaf Experience swaps them because its
// card photo is 485 px wide and too small for a hero frame).
const CAPTURED = [
  { slug: 'the-castleleaf-experience', cat: 'news-and-culture', hero: 'shutterstock_1264917592.jpg', heroAlt: 'A frosty cannabis flower bud in close-up', body: 'product-preroll.jpg', bodyAlt: 'Hands rolling a joint', quote: { text: 'Our purpose is to find your purpose.', inPlace: true } },
  { slug: 'how-does-cannabis-work', cat: 'cannabis-101', hero: 'Blog2-CannabisOil-Castleleaf.jpeg', heroAlt: 'A dropper of cannabis oil above an amber bottle, flower behind', body: 'Blog2-penimage-castleleaf.jpg', bodyAlt: 'A vape cartridge beside a fresh cannabis leaf', quote: { text: 'Just like Captain Planet, the cannabinoids and terpenes work together to create a more heightened physical and or/psychoactive effect.', inPlace: true } },
  { slug: 'what-to-do-with-your-weed', cat: 'resources', hero: 'Blog3-pipeandflower.jpeg', heroAlt: 'A glass pipe, flower, a lighter and papers on a dark table', body: 'Blog3-concentrate-castleleaf.jpg', bodyAlt: 'Amber cannabis concentrate in a small glass jar', quote: { text: 'there are tons of ways to utilize leftover cannabis trimmings in the kitchen.', inPlace: false } },
  { slug: 'pulling-back-the-curtain-on-cannabis', cat: 'cannabis-101', hero: 'Blog1-Caslteleafflower-mainimage.jpeg', heroAlt: 'Gloved hands trimming fresh cannabis flower', body: 'Blog1-cannabinoids-Castleleaf-1.jpg', bodyAlt: 'A printed page headed Cannabinoids, with reading glasses', quote: { text: 'We recommend keeping a cannabis journal to track which strains suit you best.', inPlace: false } },
];
const ART_POOL = ['g-art-strains', 'g-art-terpenes', 'g-art-cannabinoids', 'g-art-label', 'g-art-budtender', 'g-art-deli', 'g-art-delivery', 'g-art-decarb', 'g-art-butter', 'g-art-history', 'g-art-etiquette', 'g-art-edibles'];

// ---------- small helpers ----------
const photoExists = (file) => fs.existsSync(path.join(ROOT, 'assets/photos/cl', file));
const tOf = (b) => (b && (b.t || b.type)) || '';
const textOf = (b) => (b.html != null ? b.html : esc(b.text || ''));
const wordsIn = (s) => stripTags(String(s || '')).split(/\s+/).filter(Boolean).length;
const readLabel = (n) => `${Math.max(1, Math.round(n / 220))} min read`;
// One italic accent word per heading: the last word of four letters or more. Styling only: the words do not change.
function accented(text) {
  const w = String(text).split(' ');
  let at = -1;
  for (let i = w.length - 1; i >= 0; i--) if (w[i].replace(/[^\p{L}\p{N}]/gu, '').length >= 4) { at = i; break; }
  return w.map((x, i) => (i === at ? `<em class="accent">${esc(x)}</em>` : esc(x))).join(' ');
}
const imgOf = (ctx, it, opts) => (it.photo ? photo(ctx, 'cl/' + it.photo, opts) : gimg(it.image, opts));
const catLabel = (s) => (CAT.get(s) || { label: '' }).label;

// ---------- article index (captured + new) ----------
function capturedItems(ctx) {
  const out = [];
  for (const c of CAPTURED) {
    const rec = ctx.content['blog__' + c.slug];
    if (!rec) continue;
    const bl = (rec.sections || []).flatMap((s) => s.blocks || []);
    const date = (bl.find((b) => tOf(b) === 'ul' && /<time>/.test((b.items || [])[0] || '')) || { items: [''] }).items[0];
    out.push({ kind: 'captured', slug: c.slug, c, rec, path: P(`blog/${c.slug}/`), title: stripTags(rec.h1), cat: c.cat, photo: c.hero, alt: c.heroAlt, date: stripTags(date), dateHtml: date, read: readLabel(bl.reduce((n, b) => n + wordsIn(b.html || (b.items || []).join(' ')), 0)), excerpt: '' });
  }
  // the hub's captured excerpts (blog.json cards), verbatim
  const hub = ctx.content.blog;
  if (hub) {
    const walk = (list) => { for (const b of list || []) { if (tOf(b) === 'card') { const lk = (b.blocks || []).find((x) => tOf(x) === 'linkcard'); const p = (b.blocks || []).find((x) => tOf(x) === 'p'); const more = (b.blocks || []).find((x) => tOf(x) === 'links'); const slug = lk && (lk.href.match(/\/blog\/([^/]+)\//) || [])[1]; const it = out.find((o) => o.slug === slug); if (it) { it.excerpt = p ? p.html : ''; it.more = more && more.items && more.items[0]; } } else if (b.blocks) walk(b.blocks); } };
    for (const s of hub.sections || []) walk(s.blocks);
  }
  return out;
}
function newItems(ctx) {
  return (ctx.posts || []).filter((p) => p && p.slug).slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map((p, i) => {
    const cats = [].concat(p.category || p.categories || []).map((c) => (typeof c === 'string' ? c : c && c.slug)).filter(Boolean);
    const norm = (x) => (CAT.has(x) ? x : (CATS.find((c) => c.label.toLowerCase() === String(x).toLowerCase() || c.slug === slugify(x)) || {}).slug);
    const shelves = [...new Set(cats.map(norm).filter(Boolean))];
    const cat = shelves[0] || 'cannabis-101';
    const image = [p.image, p.gimg, p.hero && p.hero.image, p.img].find((x) => typeof x === 'string' && x) || ART_POOL[i % ART_POOL.length];
    const words = (p.sections || []).reduce((n, s) => n + wordsIn(s.heading) + (s.blocks || []).reduce((m, b) => m + wordsIn(b.html || b.text || (b.items || []).map((x) => (typeof x === 'string' ? x : [x.title, x.text, x.q, x.a_html].join(' '))).join(' ')), 0), 0);
    const rt = p.readTime || p.read_time || p.readingTime;
    return { kind: 'new', slug: p.slug, post: p, path: P(`blog/${p.slug}/`), title: stripTags(p.h1 || p.title), cat, cats: shelves.length ? shelves : [cat], image: image.replace(/^cl\//, ''), photo: /\.(jpe?g|png|webp)$/i.test(image) ? image.replace(/^cl\//, '') : '', alt: p.imageAlt || p.alt || undefined, date: p.date || '', read: typeof rt === 'number' ? `${rt} min read` : rt ? String(rt) : readLabel(words), excerpt: esc(stripTags(p.excerpt || p.dek || p.description || '')) };
  });
}

// ---------- hero ----------
// The contract's inner-page hero markup (components.css .page-hero: crumbs in the hero, serif H1, line, CTA, an arched frame
// standing in the hero and crossing its bottom edge), with two LEARN slots: a sub line under the H1 and kicker markup.
function hero({ crumbs, kicker = '', h1Html, sub = '', lede = '', cta = '', frame = '', mod = '' }) {
  // revision 1: the hero stands on polished obsidian with gold veins (g-tex-obsidian-vein); learn.css holds the text side calm
  return `<section class="page-hero band band--linen${frame ? ' page-hero--media' : ''} n-hero${mod ? ' ' + mod : ''}">
${bandBg('g-tex-obsidian-vein', { cls: 'n-tex n-tex--vein', eager: true })}
<div class="wrap page-hero__inner">
<div class="page-hero__text">
${crumbsHtml(crumbs)}
${kicker ? `<p class="kicker" data-reveal>${kicker}</p>` : ''}
<h1 class="display page-hero__h1" data-reveal style="--i:1">${h1Html}</h1>
${sub}
${lede ? `<p class="lede page-hero__lede" data-reveal style="--i:2">${lede}</p>` : ''}
${cta ? `<div class="btn-row page-hero__cta" data-reveal style="--i:3">${cta}</div>` : ''}
</div>
${frame ? `<div class="page-hero__media" data-depth="-0.06">${frame}</div>` : ''}
</div>
</section>`;
}
const archFrame = (inner) => `<figure class="arch-frame page-hero__frame" data-reveal="arch">${inner}</figure>`;

// ---------- cards ----------
function card(ctx, it, { n = 0, ratio = '3/2', h = 'h3', filter = false, excerpt = true, sizes = '(min-width: 1024px) 30vw, (min-width: 700px) 46vw, 100vw' } = {}) {
  const label = it.more && it.more.html ? stripTags(it.more.html).replace(/[^\p{L}\p{N}\s]/gu, '').trim() : 'Read More';
  const aria = (it.more && it.more['aria-label']) || `Read more about ${it.title}`;
  return `<li class="n-item"${filter ? ` data-filter-item data-tags="${escA((it.cats || [it.cat]).join(' '))}"` : ''} data-reveal style="--i:${n % 3}">
<article class="acard n-card" data-tilt>
<a class="acard__media n-card__media" style="--n-ar:${ratio}"${linkAttrs(it.path)} tabindex="-1" aria-hidden="true">${imgOf(ctx, it, { alt: '', sizes, cls: 'n-card__img' })}</a>
<p class="acard__meta n-meta"><a class="tag n-tag"${linkAttrs(catPath(it.cat))}>${esc(catLabel(it.cat))}</a><span>${esc(it.read)}</span></p>
<${h} class="acard__title n-card__title"><a${linkAttrs(it.path)}>${esc(it.title)}</a></${h}>
${excerpt && it.excerpt ? `<p class="n-card__excerpt">${it.excerpt}</p>` : ''}
<a class="acard__more link-arrow n-card__more"${linkAttrs(it.path)} aria-label="${escA(aria)}">${esc(label)}${icon('arrow')}</a>
</article>
</li>`;
}
// The offset bento: three real columns that start at different heights, photos in three shapes, filled shortest-first.
// Below 1024px the columns dissolve into a two- then one-column grid (learn.css).
const SHAPES = [['4/5', '3/2', '1/1'], ['3/2', '1/1', '4/5'], ['1/1', '4/5', '3/2']];
const ratioH = (r) => { const [a, b] = r.split('/').map(Number); return b / a; };
function mason(ctx, items, { filter = false } = {}) {
  const cols = [0, 1, 2].map((i) => ({ i, list: [], est: [0.35, 0.9, 0.55][i] }));
  for (const it of items) {
    const col = cols.reduce((a, b) => (b.est < a.est ? b : a));
    const r = SHAPES[col.i][col.list.length % 3];
    col.list.push({ it, r });
    col.est += ratioH(r) + (it.excerpt ? 0.62 : 0.4);
  }
  let n = 0;
  return `<div class="n-mason">${cols.map((c) => `<ul class="n-mason__col n-mason__col--${c.i + 1}" role="list">${c.list.map(({ it, r }) => card(ctx, it, { n: n++, ratio: r, filter })).join('\n')}</ul>`).join('\n')}</div>`;
}
const grid = (ctx, items, opts = {}) => `<ul class="n-grid" role="list">${items.map((it, i) => card(ctx, it, { n: i, ...opts })).join('\n')}</ul>`;

function chips({ current = 'all', filter = false } = {}) {
  if (filter) {
    const b = (slug, label) => `<li><button class="chip n-chip" type="button" data-filter="${escA(slug)}"${slug === 'all' ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${esc(label)}</button></li>`;
    return `<ul class="n-chips" role="list" data-filter-group aria-label="Filter articles by category">${b('all', 'All')}${CATS.map((c) => b(c.slug, c.label)).join('')}</ul>`;
  }
  const a = (p, label, on) => `<li><a class="chip n-chip"${linkAttrs(p)}${on ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
  return `<nav class="n-chipnav" aria-label="Blog categories"><ul class="n-chips" role="list">${a(P('blog/'), 'All', current === 'all')}${CATS.map((c) => a(catPath(c.slug), c.label, c.slug === current)).join('')}</ul></nav>`;
}

// ---------- the Shop Menu band (the page's one dark band) ----------
function shopBand(ctx, from = 'var(--linen)') {
  const ways = (ctx.site.ways && ctx.site.ways.items) || [];
  const online = ways.find((w) => w.key === 'online') || {};
  const del = ctx.site.delivery || {};
  // revision 1: the closing band glows with gold haze and dust on black (g-tex-gold-haze); the lantern still follows the pointer
  return `<section class="band band--night band--haze-top n-shop" style="--haze-from:${from}" aria-labelledby="n-shop-h" data-lantern>
${bandBg('g-tex-gold-haze', { cls: 'n-tex n-tex--haze' })}
<div class="wrap n-shop__wrap">
<div class="n-shop__text" data-reveal>
<p class="kicker">${esc(online.title || 'Order Online')}</p>
<h2 class="display n-shop__title" id="n-shop-h">${accented(online.line || 'Shop Menu')}</h2>
${del.line ? `<p class="n-shop__line">${esc(del.title || '')}: ${esc(del.line)}</p>` : ''}
<div class="btn-row"><a class="btn btn--copper"${linkAttrs(menu(ctx))}>Shop Menu${icon('ext')}</a><a class="btn btn--glass"${linkAttrs(P('delivery/'))}>${esc(del.title || 'Local Delivery')}${icon('arrow')}</a></div>
</div>
</div>
</section>`;
}

// ---------- JSON-LD ----------
const orgLd = (ctx) => ({ '@type': 'Organization', name: ctx.site.name, url: absUrl(ctx, P('')) });
const crumbLd = (ctx, crumbs) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: absUrl(ctx, c.href) } : {}) })) });
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((q) => ({ '@type': 'Question', name: stripTags(q.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(q.a_html || q.a || '') } })) });

// ---------- new-content blocks (posts/resources): p h2 h3 h4 ul ol callout steps faq quote img ----------
function faqHtml(items) {
  return `<div class="faq n-faq" data-faq>${items.map((q) => `<details><summary>${esc(stripTags(q.q))}${icon('plus', 'faq__ico')}</summary><div class="faq__a">${rewriteLinks(q.a_html || esc(q.a || ''))}</div></details>`).join('\n')}</div>`;
}
function newBlocks(ctx, list, st) {
  const out = [];
  for (const b of list || []) {
    const t = tOf(b);
    if (t === 'p') out.push(`<p>${rewriteLinks(textOf(b))}</p>`);
    else if (/^h[2-4]$/.test(t)) { const id = slugify(stripTags(b.text || b.html || '')); if (t === 'h2' && st && st.toc) st.toc.push({ id, label: stripTags(b.text || b.html) }); out.push(`<${t} id="${escA(id)}">${b.html != null ? rewriteLinks(b.html) : esc(b.text)}</${t}>`); }
    else if (t === 'ul' || t === 'ol') out.push(`<${t}>${(b.items || []).map((x) => `<li>${rewriteLinks(typeof x === 'string' ? x : x.html || esc(x.text || ''))}</li>`).join('')}</${t}>`);
    else if (t === 'callout') out.push(`<aside class="glass glass--strong n-callout">${b.title ? `<p class="n-callout__title">${esc(b.title)}</p>` : ''}${/^\s*<(p|ul|ol)\b/.test(b.html || '') ? rewriteLinks(b.html) : `<p>${rewriteLinks(textOf(b))}</p>`}</aside>`);
    else if (t === 'steps') out.push(`<ol class="steps n-steps" role="list">${(b.items || []).map((s, i) => `<li class="step"><span class="step__num" aria-hidden="true">${i + 1}</span><div><p class="step__title">${esc(stripTags(s.title || ''))}</p><p class="step__text">${rewriteLinks(s.text || s.html || '')}</p></div></li>`).join('')}</ol>`);
    else if (t === 'faq') { if (st) st.faq.push(...(b.items || [])); out.push(faqHtml(b.items || [])); }
    else if (t === 'quote') { const q = `<figure class="n-pull${st && st.pulled ? ' n-pull--plain' : ''}"><blockquote><p>${rewriteLinks(textOf(b))}</p></blockquote>${b.cite ? `<figcaption>${esc(b.cite)}</figcaption>` : ''}</figure>`; if (st) st.pulled = true; out.push(q); }
    else if (t === 'img') { const id = b.gimg || b.id || b.src; if (id) out.push(`<figure class="frame n-figure">${/\.(jpe?g|png|webp)$/i.test(id) ? photo(ctx, 'cl/' + id.replace(/^cl\//, ''), { alt: b.alt || '', sizes: '(min-width: 1024px) 680px, 92vw', cls: 'frame__img' }) : gimg(id, { alt: b.alt, sizes: '(min-width: 1024px) 680px, 92vw', cls: 'frame__img' })}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`); }
    else if (b.blocks) out.push(newBlocks(ctx, b.blocks, st));
  }
  return out.join('\n');
}

// ---------- captured post body ----------
function capturedBody(ctx, it, st) {
  const bl = (it.rec.sections || []).flatMap((s) => s.blocks || []);
  const out = [];
  const q = it.c.quote;
  let quoteDone = false;
  let h2n = 0;
  const pullDup = () => `<figure class="n-pull n-pull--echo" aria-hidden="true"><blockquote><p>${esc(q.text)}</p></blockquote></figure>`;
  for (const b of bl) {
    const t = tOf(b);
    if (t === 'h1' || t === 'nav' || t === 'svg') continue;
    if (t === 'ul' && /<time>/.test((b.items || [])[0] || '')) continue; // the date: printed in the hero
    if (t === 'links') { for (const x of b.items || []) st.pn.push(x); continue; }
    if (t === 'h2') {
      h2n++;
      if (q && !q.inPlace && !quoteDone && h2n === 2) { out.push(pullDup()); quoteDone = true; }
      const id = slugify(stripTags(b.html));
      st.toc.push({ id, label: stripTags(b.html) });
      out.push(`<h2 id="${escA(id)}">${rewriteLinks(b.html)}</h2>`);
      continue;
    }
    if (/^h[3-6]$/.test(t)) { out.push(`<${t}>${rewriteLinks(b.html)}</${t}>`); continue; }
    if (t === 'p' || t === 'text') {
      if (q && q.inPlace && !quoteDone && stripTags(b.html).trim() === q.text) { out.push(`<figure class="n-pull"><blockquote><p>${rewriteLinks(b.html)}</p></blockquote></figure>`); quoteDone = true; continue; }
      out.push(`<p>${rewriteLinks(b.html)}</p>`);
      continue;
    }
    if (t === 'ul' || t === 'ol') { out.push(`<${t}>${(b.items || []).map((x) => `<li>${rewriteLinks(typeof x === 'string' ? x : x.html || '')}</li>`).join('')}</${t}>`); continue; }
    if (t === 'img') { out.push(`<figure class="frame n-figure" data-reveal="wipe">${photo(ctx, 'cl/' + it.c.body, { alt: it.c.bodyAlt, sizes: '(min-width: 1024px) 680px, 92vw', cls: 'frame__img' })}</figure>`); continue; }
  }
  if (q && !q.inPlace && !quoteDone) out.splice(Math.min(3, out.length), 0, pullDup());
  return out.join('\n');
}

function keepReading(ctx, it, all) {
  const rel = ((it.post && Array.isArray(it.post.related)) ? it.post.related : []).map((s) => all.find((x) => x.slug === s)).filter(Boolean);
  const same = all.filter((x) => x.slug !== it.slug && x.cat === it.cat && !rel.includes(x));
  const rest = all.filter((x) => x.slug !== it.slug && x.cat !== it.cat && !rel.includes(x));
  const pick = rel.concat(same, rest).slice(0, 3);
  if (!pick.length) return '';
  return `<section class="band band--sage n-more" aria-labelledby="n-more-h">
<div class="band__clip" aria-hidden="true"><span class="n-more__pool"></span></div>
<div class="wrap">
<div class="n-more__head" data-reveal><h2 class="display n-more__title" id="n-more-h">Keep <em class="accent">reading</em></h2><a class="link-arrow"${linkAttrs(P('blog/'))}>All articles${icon('arrow')}</a></div>
${grid(ctx, pick, { ratio: '3/2', excerpt: false })}
</div>
</section>`;
}

// ---------- /blog/<slug>/ ----------
function articlePage(ctx, it, all) {
  const st = { toc: [], faq: [], pn: [], pulled: false };
  const isNew = it.kind === 'new';
  const p = it.post;
  let body = '';
  if (isNew) {
    const secs = (p.sections || []).filter(Boolean);
    // the post's one pull quote (posts carry it as `pull`): set after the second section, offset out of the column.
    // When the line also stands in the body it is an echo, hidden from assistive tech so nothing is read twice.
    const pull = stripTags(p.pull || '').trim();
    const flat = stripTags(secs.map((s) => (s.blocks || []).map((b) => b.html || b.text || (b.items || []).map((x) => (typeof x === 'string' ? x : [x.title, x.text].join(' '))).join(' ')).join(' ')).join(' ')).replace(/\s+/g, ' ');
    const echo = pull && flat.includes(pull);
    const pullHtml = pull ? `<figure class="n-pull" data-reveal${echo ? ' aria-hidden="true"' : ''}><blockquote><p>${esc(pull)}</p></blockquote></figure>` : '';
    secs.forEach((s, i) => {
      const id = s.id || slugify(s.heading || '');
      if (s.heading) st.toc.push({ id, label: stripTags(s.heading) });
      body += `<section class="n-sec"${s.heading ? ` id="${escA(id)}" aria-labelledby="${escA(id)}-h"` : ''}>${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}${s.heading ? `<h2 id="${escA(id)}-h">${esc(stripTags(s.heading))}</h2>` : ''}\n${newBlocks(ctx, s.blocks, st)}</section>\n`;
      if (i === Math.min(1, secs.length - 1) && pullHtml && !st.pulled) { body += pullHtml + '\n'; st.pulled = true; }
    });
    // the post's FAQ (posts carry it as a top-level `faq` list): rendered as .faq, and FAQPage JSON-LD below
    const fq = Array.isArray(p.faq) ? p.faq.filter((q) => q && q.q) : [];
    if (fq.length) {
      st.toc.push({ id: 'faq', label: 'Questions and answers' });
      st.faq.push(...fq);
      body += `<section class="n-sec n-faqsec" id="faq" aria-labelledby="faq-h"><h2 id="faq-h">Questions and <em class="accent">answers</em></h2>\n${faqHtml(fq)}</section>\n`;
    }
  }
  else body = capturedBody(ctx, it, st);
  const crumbs = [HOME, BLOGCRUMB, { label: it.title }];
  const metaBits = [`<a class="tag"${linkAttrs(catPath(it.cat))}>${esc(catLabel(it.cat))}</a>`, it.dateHtml ? `<span>${it.dateHtml}</span>` : it.date ? `<span>${esc(it.date)}</span>` : '', `<span>${esc(it.read)}</span>`].filter(Boolean).join('');
  const lede = isNew ? stripTags(p.excerpt || p.lede || p.dek || p.description || '') : '';
  const frameImg = imgOf(ctx, it, { alt: it.alt, eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' });
  const head = hero({ crumbs, kicker: esc(BLOG), h1Html: accented(it.title), sub: `<p class="n-meta" data-reveal style="--i:2">${metaBits}</p>`, lede: lede ? esc(lede) : '', frame: archFrame(frameImg), mod: 'n-hero--article' });
  const toc = st.toc.length > 1 ? `<nav class="n-toc" aria-label="In this article"><p class="n-toc__label">In this article</p><ol role="list">${st.toc.map((x) => `<li><a href="#${escA(x.id)}">${esc(x.label)}</a></li>`).join('')}</ol></nav>` : '';
  const pnRow = st.pn.length ? `<nav class="n-pn" aria-label="More articles">${st.pn.map((x) => { const prev = x.rel === 'prev'; const label = stripTags(x.html).replace(/^Prev/, '').replace(/Next$/, '').trim(); return `<a class="glass n-pn__link n-pn__link--${prev ? 'prev' : 'next'}"${linkAttrs(x.href.replace(/^https?:\/\/(?:www\.)?castleleaf\.com/i, ''))}><span class="n-pn__dir">${prev ? 'Prev' : 'Next'}</span><span class="n-pn__title">${esc(label)}</span></a>`; }).join('')}</nav>` : '';
  const main = `${head}
<section class="band band--linen n-body" aria-label="Article">
<div class="wrap n-body__wrap${toc ? '' : ' n-body__wrap--solo'}">
${toc ? `<aside class="n-body__side">${toc}</aside>` : ''}
<article class="prose n-prose">
${body}
${isNew ? `<p class="n-note">${esc(NOTE)}</p>` : ''}
${pnRow}
</article>
</div>
</section>
${keepReading(ctx, it, all)}
${shopBand(ctx, 'var(--sage-mist)')}`;
  const title = isNew ? titled(stripTags(p.title || it.title)) : it.rec.title;
  const description = isNew ? stripTags(p.description || p.excerpt || it.title) : it.rec.description;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: it.title, description, url: absUrl(ctx, it.path), mainEntityOfPage: absUrl(ctx, it.path), publisher: orgLd(ctx), articleSection: catLabel(it.cat), ...(it.date ? { datePublished: it.date } : {}) },
    crumbLd(ctx, crumbs),
  ];
  if (st.faq.length) jsonld.push(faqLd(st.faq));
  return { path: it.path, html: page({ ctx, path: it.path, title, description, canonical: absUrl(ctx, it.path), og: { title, description, type: 'article', url: absUrl(ctx, it.path) }, jsonld, crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--article', main }) };
}

// ---------- /blog/ ----------
function hubPage(ctx, items) {
  const rec = ctx.content.blog;
  const path0 = P('blog/');
  const crumbs = [HOME, { label: 'Blog' }];
  const sub = rec && rec.sections ? (rec.sections[0].blocks || []).find((b) => tOf(b) === 'h2') : null;
  const feat = items.find((x) => x.slug === 'the-castleleaf-experience') || items[0];
  // revision 1: the client's own dark-table still life (pipe, flower, papers on black slate) suits the black and gold hero;
  // the generated notebook (g-feature-blog) is a white linen scene that read as a blank light box on black
  const heroImg = photoExists('Blog3-pipeandflower.jpeg') ? photo(ctx, 'cl/Blog3-pipeandflower.jpeg', { alt: 'A glass pipe, flower, a lighter and papers on a dark table', eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' }) : gimg('g-feature-blog', { eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' });
  const head = hero({
    id: 'n-h1', crumbs, kicker: 'Read, learn, ask',
    h1Html: `The CastleLeaf <em class="accent">Blog</em>`,
    sub: sub ? `<h2 class="n-hero__sub">${esc(stripTags(sub.html))}</h2>` : '',
    lede: 'Cannabis basics, shopping tips, recipes and news from Brighton, sorted onto five shelves.',
    cta: `<a class="btn"${linkAttrs('#n-all')}>Browse the articles${icon('arrow')}</a><a class="btn btn--ghost"${linkAttrs(menu(ctx))}>Shop Menu${icon('ext')}</a>`,
    frame: archFrame(heroImg), mod: 'n-hero--hub',
  });
  const featHtml = feat ? `<section class="band band--cream n-feat" aria-labelledby="n-feat-h">
<div class="band__clip" aria-hidden="true"><span class="n-feat__pool"></span></div>
<div class="wrap">
<article class="n-feat__card">
<a class="frame frame--bleed frame--bleed-start n-feat__frame"${linkAttrs(feat.path)} tabindex="-1" aria-hidden="true" data-reveal="wipe">${photo(ctx, 'cl/' + (feat.c ? feat.c.hero : feat.photo), { alt: '', cls: 'frame__img', sizes: '(min-width: 1024px) 62vw, 94vw' })}</a>
<div class="glass glass--strong n-feat__pane" data-reveal data-spot>
<p class="kicker">Featured story</p>
<p class="acard__meta n-meta"><a class="tag n-tag"${linkAttrs(catPath(feat.cat))}>${esc(catLabel(feat.cat))}</a>${feat.date ? `<span>${esc(feat.date)}</span>` : ''}<span>${esc(feat.read)}</span></p>
<h2 class="display n-feat__title" id="n-feat-h"><a${linkAttrs(feat.path)}>${accented(feat.title)}</a></h2>
${feat.excerpt ? `<p class="n-feat__excerpt">${feat.excerpt}</p>` : ''}
<a class="btn"${linkAttrs(feat.path)} aria-label="${escA((feat.more && feat.more['aria-label']) || 'Read more about ' + feat.title)}">Read More${icon('arrow')}</a>
</div>
</article>
</div>
</section>` : '';
  const list = `<section class="band band--linen n-all" id="n-all" aria-labelledby="n-all-h" data-filter-scope>
<div class="band__clip" aria-hidden="true"><span class="n-all__pool"></span></div>
<div class="wrap wrap--wide n-all__wrap">
<header class="n-all__head" data-reveal>
<h2 class="display n-all__title" id="n-all-h">All <em class="accent">articles</em></h2>
${chips({ filter: true })}
</header>
${mason(ctx, items, { filter: true })}
<p class="n-empty" data-filter-empty hidden>No articles on this shelf yet.</p>
${chips({ current: 'all' })}
</div>
</section>`;
  const title = rec ? rec.title : titled('Blog');
  const description = rec ? rec.description : 'The CastleLeaf Blog.';
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'Blog', name: BLOG, url: absUrl(ctx, path0), publisher: orgLd(ctx), blogPost: items.map((x) => ({ '@type': 'BlogPosting', headline: x.title, url: absUrl(ctx, x.path) })) }, crumbLd(ctx, [HOME, { label: 'Blog', href: path0 }])];
  return { path: path0, html: page({ ctx, path: path0, title, description, canonical: absUrl(ctx, path0), og: { title, description, type: 'website', url: absUrl(ctx, path0) }, jsonld, crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--hub', main: `${head}\n${featHtml}\n${list}\n${shopBand(ctx)}` }) };
}

// ---------- /blog/<category>/ ----------
const CAT_ART = { 'cannabis-101': 'g-art-cannabinoids', 'shopping-and-reviews': 'g-art-label', 'news-and-culture': 'g-art-history', recipes: 'g-art-butter', resources: 'g-art-etiquette' };
const CAT_PHOTO = { 'cannabis-101': ['Blog1-cannabinoids-Castleleaf-1.jpg', 'A printed page headed Cannabinoids, with reading glasses'], 'shopping-and-reviews': ['Blog2-penimage-castleleaf.jpg', 'A vape cartridge beside a fresh cannabis leaf'], 'news-and-culture': ['shutterstock_1264917592.jpg', 'A frosty cannabis flower bud in close-up'], recipes: ['Blog2-CannabisOil-Castleleaf.jpeg', 'A dropper of cannabis oil above an amber bottle'], resources: ['Blog3-pipeandflower.jpeg', 'A glass pipe, flower, a lighter and papers on a dark table'] };
function categoryPage(ctx, c, items) {
  const path0 = catPath(c.slug);
  const crumbs = [HOME, BLOGCRUMB, { label: c.label }];
  const mine = items.filter((x) => (x.cats || [x.cat]).includes(c.slug));
  const g = (ctx.glue && (ctx.glue['blog-' + c.slug] || ctx.glue[c.slug])) || {};
  const line = stripTags(g.intro || g.lede || g.line || '') || `Articles from ${BLOG} on the ${c.label} shelf.`;
  const id = CAT_ART[c.slug];
  const fr = hasGenerated(id) ? gimg(id, { eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' }) : photo(ctx, 'cl/' + CAT_PHOTO[c.slug][0], { alt: CAT_PHOTO[c.slug][1], eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' });
  const head = hero({ id: 'n-h1', crumbs, kicker: esc(BLOG), h1Html: accented(c.label), lede: esc(line), cta: `<a class="btn btn--ghost"${linkAttrs(P('blog/'))}>All articles${icon('arrow')}</a>`, frame: archFrame(fr), mod: 'n-hero--cat' });
  const list = `<section class="band band--linen n-all n-all--cat" aria-labelledby="n-cat-h">
<div class="band__clip" aria-hidden="true"><span class="n-all__pool"></span></div>
<div class="wrap wrap--wide n-all__wrap">
<header class="n-all__head" data-reveal><h2 class="display n-all__title" id="n-cat-h">${mine.length} ${mine.length === 1 ? 'article' : 'articles'}</h2>${chips({ current: c.slug })}</header>
${mine.length ? (mine.length > 3 ? mason(ctx, mine) : grid(ctx, mine)) : `<p class="n-empty">New articles for this shelf are on the way. <a class="link-arrow"${linkAttrs(P('blog/'))}>Read the whole blog${icon('arrow')}</a></p>`}
</div>
</section>`;
  const title = titled(c.label);
  const description = `${c.label} articles from ${BLOG}, CastleLeaf Cannabis Dispensary in Brighton, MA.`;
  return { path: path0, html: page({ ctx, path: path0, title, description, canonical: absUrl(ctx, path0), og: { title, description, type: 'website', url: absUrl(ctx, path0) }, jsonld: [crumbLd(ctx, [HOME, BLOGCRUMB, { label: c.label, href: path0 }])], crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--cat', main: `${head}\n${list}\n${shopBand(ctx)}` }) };
}

// ---------- events ----------
const STD_P = /^<strong>(We’re Open!|We're Open!|Exhibit Program|Events &amp; Partnerships|Events & Partnerships|Education):?/;
function flyer(ctx, file, { alt = '', sizes = '(min-width: 1024px) 30vw, 90vw', eager = false } = {}) {
  if (file && photoExists(file)) return photo(ctx, 'cl/' + file, { alt, sizes, eager, cls: 'n-flyer__img' });
  return gimg('g-feature-events', { alt: '', sizes, eager, cls: 'n-flyer__img n-flyer__img--mood' });
}
function eventIndex(ctx) {
  const out = [];
  for (const [slug, rec] of Object.entries(ctx.content)) {
    if (!slug.startsWith('event__')) continue;
    const bl = (rec.sections || []).flatMap((s) => s.blocks || []);
    const h1s = bl.filter((b) => tOf(b) === 'h1');
    const title = stripTags((h1s[1] || h1s[0] || {}).html || rec.h1);
    const texts = bl.filter((b) => tOf(b) === 'text').map((b) => b.html);
    const im = bl.find((b) => tOf(b) === 'img' && b.src && !/^data:/.test(b.src));
    const file = im ? decodeURIComponent(im.src.split('/').pop()) : '';
    const det = bl.find((b) => tOf(b) === 'ul' && /^(Date|Start|Time):/.test((b.items || [])[0] || ''));
    const iso = det ? ((det.items[0].match(/title="([\d-]+)"/) || [])[1] || '') : '';
    out.push({ slug: slug.slice(7), rec, bl, title, start: texts[0] || '', end: texts[2] || '', extraText: texts.slice(3), file, w: im ? +im.width : 1, h: im ? +im.height : 1, iso });
  }
  return out.sort((a, b) => (b.iso + b.start).localeCompare(a.iso + a.start));
}
function stdParas(bl) { return bl.filter((b) => tOf(b) === 'p' && STD_P.test(b.html)); }
function aboutEvents(ctx, paras, banner = true) {
  if (!paras.length) return '';
  // revision 1: the events pages' closing band: gold haze behind the glass tiles (g-tex-gold-haze)
  return `<section class="band band--cream n-about" aria-label="Events at CastleLeaf">
${bandBg('g-tex-gold-haze', { cls: 'n-tex n-tex--haze' })}
<div class="wrap">
<div class="bento n-about__bento">${paras.map((b, i) => `<div class="tile glass n-about__tile${i === 1 ? ' n-about__tile--wide' : ''}" data-reveal style="--i:${i}" data-spot><p>${rewriteLinks(b.html)}</p></div>`).join('')}</div>
${banner ? `<figure class="frame n-banner" data-reveal="wipe">${photo(ctx, 'cl/CL-Events.webp', { alt: '', sizes: '(min-width: 1280px) 1200px, 94vw', cls: 'frame__img' })}</figure>` : ''}
</div>
</section>`;
}
function flyerTile(ctx, ev, { n = 0, big = false, dateHtml = '', excerpt = '' } = {}) {
  const tall = ev.h > ev.w * 1.3;
  return `<li class="n-ev${big ? ' n-ev--big' : ''}${tall ? ' n-ev--tall' : ''}" data-reveal style="--i:${n % 4}">
<article class="n-ev__card">
<a class="n-flyer${tall ? ' n-flyer--tall' : ''}"${linkAttrs(P(`event/${ev.slug}/`))} tabindex="-1" aria-hidden="true">${flyer(ctx, ev.file, { sizes: big ? '(min-width: 1024px) 30vw, 90vw' : '(min-width: 1024px) 22vw, (min-width: 700px) 30vw, 46vw' })}</a>
<div class="n-ev__text">
${dateHtml ? `<p class="n-ev__date">${dateHtml}</p>` : ''}
<h3 class="n-ev__title"><a${linkAttrs(P(`event/${ev.slug}/`))}>${esc(ev.title)}</a></h3>
${excerpt ? `<p class="n-ev__excerpt">${excerpt}</p>` : ''}
</div>
</article>
</li>`;
}
function eventsHub(ctx, evs) {
  const rec = ctx.content.events;
  if (!rec) return null;
  const path0 = P('events/');
  const bl = (rec.sections || []).flatMap((s) => s.blocks || []);
  const crumbs = [HOME, { label: 'Events' }];
  const noEvents = (bl.find((b) => tOf(b) === 'text' && /no upcoming events/i.test(b.html)) || {}).html || '';
  const latestH = (bl.find((b) => tOf(b) === 'h2' && /Latest Past Events/i.test(b.html)) || {}).html || 'Latest Past Events';
  // the captured "Latest Past Events" cards, in order, with their short date line, full date/time and excerpt
  const latest = [];
  let lastShort = '';
  for (const b of bl) {
    if (tOf(b) === 'text' && /<time/.test(b.html)) { lastShort = b.html; continue; }
    if (tOf(b) === 'card') {
      const lk = (b.blocks || []).find((x) => tOf(x) === 'linkcard');
      const slug = lk && (lk.href.match(/\/event\/([^/]+)\//) || [])[1];
      const ev = evs.find((e) => e.slug === slug);
      if (!ev) continue;
      const when = ((b.blocks || []).find((x) => tOf(x) === 'text') || {}).html || '';
      const ex = ((b.blocks || []).find((x) => tOf(x) === 'p') || {}).html || '';
      latest.push({ ev, short: lastShort, when, ex });
      lastShort = '';
    }
  }
  const head = hero({
    id: 'n-h1', crumbs, kicker: 'Community, art and pop-ups',
    h1Html: accented(stripTags(rec.h1)),
    sub: noEvents ? `<p class="n-notice" data-reveal style="--i:2">${icon('clock')}<span>${esc(stripTags(noEvents))}</span></p>` : '',
    lede: 'Pop-ups, community nights and art at the castle: every past event, with its flyer.',
    cta: `<a class="btn"${linkAttrs('#n-past')}>See past events${icon('arrow')}</a><a class="btn btn--ghost"${linkAttrs(P('contact/'))}>Contact${icon('arrow')}</a>`,
    frame: archFrame(photo(ctx, 'cl/CL-Image-Events.webp', { alt: 'The CastleLeaf building at dusk', eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' })), mod: 'n-hero--events',
  });
  const latestSlugs = new Set(latest.map((x) => x.ev.slug));
  const earlier = evs.filter((e) => !latestSlugs.has(e.slug));
  const past = `<section class="band band--linen n-past" id="n-past" aria-labelledby="n-past-h">
<div class="band__clip" aria-hidden="true"><span class="n-all__pool"></span></div>
<div class="wrap">
<header class="n-past__head" data-reveal><h2 class="display n-past__title" id="n-past-h">${accented(stripTags(latestH))}</h2></header>
<ul class="n-evbento" role="list">${latest.map((x, i) => flyerTile(ctx, x.ev, { n: i, big: true, dateHtml: `${x.short ? `<span class="n-ev__short">${x.short}</span>` : ''}<span class="n-ev__when">${x.when}</span>`, excerpt: x.ex })).join('\n')}</ul>
${earlier.length ? `<h2 class="display n-past__title n-past__title--sm" id="n-earlier-h">Earlier <em class="accent">events</em></h2>
<ul class="n-evgrid" role="list" aria-labelledby="n-earlier-h">${earlier.map((e, i) => flyerTile(ctx, e, { n: i, dateHtml: `<span class="n-ev__when">${esc(stripTags(e.start))}</span>` })).join('\n')}</ul>` : ''}
</div>
</section>`;
  const title = rec.title;
  const description = stripTags(rec.description || '') || 'Events at CastleLeaf in Brighton, MA.';
  return { path: path0, html: page({ ctx, path: path0, title, description, canonical: absUrl(ctx, path0), og: { title, description, type: 'website', url: absUrl(ctx, path0) }, jsonld: [crumbLd(ctx, [HOME, { label: 'Events', href: path0 }])], crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--events', main: `${head}\n${past}\n${aboutEvents(ctx, stdParas(bl))}` }) };
}
function eventPage(ctx, ev, evs) {
  const rec = ev.rec;
  const bl = ev.bl;
  const path0 = P(`event/${ev.slug}/`);
  const crumbs = [HOME, { label: 'Events', href: P('events/') }, { label: ev.title }];
  const h1s = bl.filter((b) => tOf(b) === 'h1');
  const kick = h1s.length > 1 ? stripTags(h1s[0].html) : 'CastleLeaf Cannabis Dispensary Events';
  const passed = (bl.find((b) => tOf(b) === 'ul' && /event has passed/i.test((b.items || [])[0] || '')) || { items: [''] }).items[0];
  const back = bl.find((b) => tOf(b) === 'p' && /All Events/.test(b.html));
  const det = bl.find((b) => tOf(b) === 'ul' && /^(Date|Start|Time):/.test((b.items || [])[0] || ''));
  const detH = bl.find((b) => tOf(b) === 'h2' && /Details/.test(b.html));
  const navOf = (nav) => ((nav && (nav.blocks || []).find((x) => tOf(x) === 'ul')) || { items: [] }).items.map((h) => {
    const m = String(h).match(/href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    return m ? { prev: /«/.test(m[2]), label: stripTags(m[2]).replace(/[«»]/g, '').trim(), to: m[1].replace(/^https?:\/\/(?:www\.)?castleleaf\.com/i, '') } : null;
  }).filter(Boolean);
  const navs = bl.filter((b) => tOf(b) === 'nav' && /event navigation/i.test(b.label || ''));
  const navTop = navs.length > 1 ? navOf(navs[0]) : [];
  const navItems = navOf(navs[navs.length - 1]);
  const extraP = bl.filter((b) => tOf(b) === 'p' && !STD_P.test(b.html) && !/All Events/.test(b.html) && stripTags(b.html).trim());
  const when = `<span class="n-when"><span>${esc(stripTags(ev.start))}</span>${ev.end ? ` <span class="n-when__to">to</span> <span>${esc(stripTags(ev.end))}</span>` : ''}</span>`;
  const tall = ev.h > ev.w * 1.3;
  const frame = `<figure class="frame n-evframe${tall ? ' n-evframe--tall' : ''}" data-reveal>${flyer(ctx, ev.file, { alt: `${ev.title} flyer`, eager: true, sizes: tall ? '(min-width: 1024px) 24vw, 70vw' : '(min-width: 1024px) 32vw, 82vw' })}</figure>`;
  const head = hero({
    id: 'n-h1', crumbs, kicker: esc(kick), h1Html: accented(ev.title),
    sub: `<p class="n-meta" data-reveal style="--i:2">${passed ? `<span class="tag tag--copper n-passed">${esc(stripTags(passed))}</span>` : ''}${when}</p>`,
    cta: back ? `<a class="btn btn--ghost n-back"${linkAttrs(P('events/'))}>${icon('chev', 'n-back__icon')}${esc(stripTags(back.html).replace(/^[\s«]+/, ''))}</a>` : '',
    frame, mod: `n-hero--event${tall ? ' n-hero--event-tall' : ''}`,
  });
  const navLinks = navItems.map((x) => `<a class="glass n-pn__link n-pn__link--${x.prev ? 'prev' : 'next'}"${linkAttrs(x.to)}><span class="n-pn__dir">${x.prev ? 'Previous event' : 'Next event'}</span><span class="n-pn__title">${esc(x.label)}</span></a>`).join('');
  const topNav = navTop.length ? `<nav class="n-evnav" aria-label="Event navigation">${navTop.map((x) => `<a class="n-evnav__link n-evnav__link--${x.prev ? 'prev' : 'next'}"${linkAttrs(x.to)}>${x.prev ? icon('chev', 'n-evnav__ico') : ''}<span>${esc(x.label)}</span>${x.prev ? '' : icon('chev', 'n-evnav__ico')}</a>`).join('')}</nav>` : '';
  const detail = `<section class="band band--linen n-evbody" aria-labelledby="n-det-h">
<div class="wrap n-evbody__wrap">
${topNav}
<div class="glass glass--strong n-det" data-reveal data-spot>
<h2 class="n-det__h" id="n-det-h">${esc(stripTags(detH ? detH.html : 'Details'))}</h2>
${det ? `<dl class="spec n-det__spec">${det.items.map((x) => { const t = stripTags(x).replace(/\s+/g, ' ').trim(); const i = t.indexOf(':'); return `<div class="spec__row"><dt>${esc(t.slice(0, i))}</dt><dd>${esc(t.slice(i + 1).trim())}</dd></div>`; }).join('')}</dl>` : ''}
</div>
${ev.extraText.length || extraP.length ? `<div class="prose n-evtext" data-reveal>${ev.extraText.map((t) => `<p>${rewriteLinks(t)}</p>`).join('')}${extraP.map((b) => `<p>${rewriteLinks(b.html)}</p>`).join('')}</div>` : ''}
${navLinks ? `<nav class="n-pn n-pn--events" aria-label="Previous and next event">${navLinks}</nav>` : ''}
</div>
</section>`;
  const title = rec.title;
  const description = stripTags(rec.description || '') || `${ev.title}: a past CastleLeaf event, ${stripTags(ev.start)}.`;
  const jsonld = [crumbLd(ctx, [HOME, { label: 'Events', href: P('events/') }, { label: ev.title, href: path0 }])];
  return { path: path0, html: page({ ctx, path: path0, title, description, canonical: absUrl(ctx, path0), og: { title, description, type: 'website', url: absUrl(ctx, path0) }, jsonld, crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--event', main: `${head}\n${detail}\n${aboutEvents(ctx, stdParas(bl))}` }) };
}

// ---------- resource pages ----------
const RES = [
  { slug: 'dispensary-guide', img: 'g-feature-firstvisit', fallback: ['CL-Image-HowToShop.webp', 'Glass doors opening into the bright CastleLeaf shop floor'] },
  { slug: 'massachusetts-cannabis-laws', img: 'g-feature-law', fallback: ['CL-Image-Hero.webp', 'The CastleLeaf building in Brighton'] },
  { slug: 'getting-a-medical-card', img: 'g-feature-card', fallback: ['CL-Image-SEO.webp', 'The CastleLeaf shop wall with copper shelves'] },
];
function resourcePage(ctx, r, items) {
  const res = ctx.resources && ctx.resources[r.slug];
  if (!res) return null;
  const path0 = P(`${r.slug}/`);
  const name = stripTags(res.h1 || res.title || r.slug);
  const crumbs = [HOME, { label: 'Resources', href: catPath('resources') }, { label: name }];
  const st = { toc: [], faq: [], pn: [], pulled: false };
  const secs = (res.sections || []).map((s, i) => {
    const id = s.id || slugify(s.heading || 'section-' + i);
    if (s.heading) st.toc.push({ id, label: stripTags(s.heading) });
    return `<section class="n-rsec" id="${escA(id)}"${s.heading ? ` aria-labelledby="${escA(id)}-h"` : ''} data-reveal>${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}${s.heading ? `<h2 id="${escA(id)}-h">${esc(stripTags(s.heading))}</h2>` : ''}\n${newBlocks(ctx, s.blocks, st)}</section>`;
  }).join('\n');
  const fr = hasGenerated(r.img) ? gimg(r.img, { eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' }) : photo(ctx, 'cl/' + r.fallback[0], { alt: r.fallback[1], eager: true, cls: 'frame__img', sizes: '(min-width: 1024px) 34vw, 82vw' });
  const head = hero({ id: 'n-h1', crumbs, kicker: esc(res.kicker || 'Resources'), h1Html: accented(name), lede: esc(stripTags(res.lede || res.intro || res.description || '')), cta: `<a class="btn"${linkAttrs(menu(ctx))}>Shop Menu${icon('ext')}</a><a class="btn btn--ghost"${linkAttrs(P('book-a-budtender/'))}>Book A Budtender${icon('arrow')}</a>`, frame: archFrame(fr), mod: 'n-hero--res' });
  const toc = st.toc.length > 2 ? `<nav class="n-toc" aria-label="On this page"><p class="n-toc__label">On this page</p><ol role="list">${st.toc.map((x) => `<li><a href="#${escA(x.id)}">${esc(x.label)}</a></li>`).join('')}</ol></nav>` : '';
  const body = `<section class="band band--linen n-body n-body--res" aria-label="${escA(name)}">
<div class="wrap n-body__wrap${toc ? '' : ' n-body__wrap--solo'}">
${toc ? `<aside class="n-body__side">${toc}</aside>` : ''}
<div class="prose n-prose">
<aside class="glass glass--strong n-callout n-callout--adult"><p class="n-callout__title">${icon('crown')}<span>Adult-use only</span></p><p>${esc(ctx.site.adultUseOnly)}</p></aside>
${secs}
<p class="n-note">${esc(NOTE)}</p>
</div>
</div>
</section>`;
  const more = items.slice(0, 3);
  const moreBand = more.length ? `<section class="band band--sage n-more" aria-labelledby="n-more-h"><div class="band__clip" aria-hidden="true"><span class="n-more__pool"></span></div><div class="wrap"><div class="n-more__head" data-reveal><h2 class="display n-more__title" id="n-more-h">From the <em class="accent">blog</em></h2><a class="link-arrow"${linkAttrs(P('blog/'))}>All articles${icon('arrow')}</a></div>${grid(ctx, more, { excerpt: false })}</div></section>` : '';
  const title = titled(stripTags(res.title || name).replace(/\s*\|\s*CastleLeaf\s*$/i, ''));
  const description = stripTags(res.description || name);
  const jsonld = [crumbLd(ctx, [HOME, { label: 'Resources', href: catPath('resources') }, { label: name, href: path0 }])];
  if (st.faq.length) jsonld.push(faqLd(st.faq));
  return { path: path0, html: page({ ctx, path: path0, title, description, canonical: absUrl(ctx, path0), og: { title, description, type: 'article', url: absUrl(ctx, path0) }, jsonld, crumbs, heroCrumbs: true, bodyClass: 'n-page n-page--res', main: `${head}\n${body}\n${moreBand}\n${shopBand(ctx, moreBand ? 'var(--sage-mist)' : 'var(--linen)')}` }) };
}

// ---------- render ----------
export async function render(ctx) {
  const items = [...newItems(ctx), ...capturedItems(ctx)];
  // newest captured first in the captured order; the new articles keep their writer order ahead of them
  const pages = [];
  pages.push(hubPage(ctx, items));
  for (const c of CATS) pages.push(categoryPage(ctx, c, items));
  for (const it of items) pages.push(articlePage(ctx, it, items));
  const evs = eventIndex(ctx);
  const hub = eventsHub(ctx, evs);
  if (hub) pages.push(hub);
  for (const ev of evs) pages.push(eventPage(ctx, ev, evs));
  for (const r of RES) { const p = resourcePage(ctx, r, items); if (p) pages.push(p); }
  return pages.filter(Boolean);
}
