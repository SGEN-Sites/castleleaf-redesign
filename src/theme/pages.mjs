// pages.mjs - PAGES lane: the client's own pages on the LANTERN KEEP design. /about/, /book-a-budtender/, /contact/, /faqs/,
// /stores/, /stores/brighton-ma/, /directions/, /reviews/, /recreational/ + the 124 town pages (one template), /jobs/,
// /advertising-with-us/, /accessibility/, /privacy-policy/, /terms-of-use/. Every captured word is printed (D2); D2a delivery
// answer on the FAQs; forms are demoForm() (D9). Lane classes are prefixed p- (src/styles/pages.css).
import { esc, escA, linkAttrs, gimg, photo, rewriteLinks, liveHref, menu, demoForm, stripTags, slugify } from './util.mjs';
import { page, pageHero, blocks, hoursHtml, stars, icon, bandBg } from './shell.mjs';

// ---------------------------------------------------------------- small helpers
const flat = (rec) => ((rec && rec.sections) || []).flatMap((s) => s.blocks || []);
const H = (h) => rewriteLinks(h ?? '');
const txt = (h) => stripTags(String(h ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/(p|li|dt|dd|h[1-6])>/gi, ' $&').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const isExt = (u) => /^https?:/i.test(String(u));
const arrowFor = (u) => icon(isExt(u) ? 'ext' : /^(tel|mailto):/i.test(String(u)) ? (/^tel:/i.test(String(u)) ? 'phone' : 'mail') : 'arrow');
const btn = (u, label, cls = 'btn') => `<a class="${escA(cls)}"${linkAttrs(u)}>${label}${arrowFor(u)}</a>`;
const arrowLink = (u, label, cls = 'link-arrow') => `<a class="${escA(cls)}"${linkAttrs(u)}>${label}${arrowFor(u)}</a>`;
const firstLink = (html) => { const m = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(String(html || '')); return m ? { href: m[1].replace(/&amp;/g, '&'), html: m[2] } : null; };
const accent = (h, word) => { const s = esc(h); const w = esc(word); const i = s.lastIndexOf(w); return i < 0 ? s : `${s.slice(0, i)}<em class="accent">${w}</em>${s.slice(i + w.length)}`; };
const SUBRE = /^Cannabis Dispensary located near Brighton, MA$/;
const linksOf = (b) => ((b && b.items) || []).filter((x) => x && x.href != null);
const tel = (ctx) => ctx.site.phoneHref;
const mailto = (ctx) => 'mailto:' + ctx.site.email;

// pageHero + the captured sub heading (an h2 kept as a heading, set as a calm line under the H1). Revision 1: a hero with a
// frame gets ONE gold paint accent (g-tex-gold-stroke, screen-blended) inside its .band__clip, low behind the frame and away
// from the type, unless the shell already paints one.
function hero(ctx, { sub = '', ...o }) {
  let h = pageHero({ ctx, ...o });
  if (sub) h = h.replace('</h1>', `</h1>\n<h2 class="p-hero-sub" data-reveal style="--i:2">${sub}</h2>`);
  if (/page-hero--media/.test(h) && !/gold-accent|g-tex-gold-stroke/.test(h)) {
    h = h.replace('<div class="band__clip" aria-hidden="true">', (m) => `${m}${gimg('g-tex-gold-stroke', { alt: '', cls: 'gold-accent p-hero-paint', sizes: '(min-width: 1024px) 760px, 96vw' })}`);
  }
  return h;
}
// a generated texture ground for one band (R3): kind = vein | haze | leaf | obsidian
const tex = (kind) => ({
  vein: () => bandBg('g-tex-obsidian-vein', { cls: 'p-tex p-tex--vein', veil: 'calm' }),
  haze: () => bandBg('g-tex-gold-haze', { cls: 'p-tex p-tex--haze' }),
  leaf: () => bandBg('g-tex-gold-leaf', { cls: 'p-tex p-tex--leaf', veil: 'gold' }),
  obsidian: () => bandBg('g-tex-obsidian', { cls: 'p-tex p-tex--obsidian', veil: 'obsidian', eager: true }),
}[kind] || (() => ''))();
function out(ctx, rec, { path, main, crumbs = [], jsonld = [], title, description, bodyClass = '' }) {
  return {
    path,
    html: page({ ctx, path, title: title ?? rec.title, description: description ?? rec.description ?? '', crumbs, heroCrumbs: true, jsonld, bodyClass: `p-page${bodyClass ? ' ' + bodyClass : ''}`, main }),
  };
}
// section head: kicker (glue) + heading (captured or glue html) + optional intro
function head({ kicker = '', h = '', level = 2, lede = '', cls = '', id = '' } = {}) {
  return `<header class="p-head${cls ? ' ' + cls : ''}">${kicker ? `<p class="kicker" data-reveal>${esc(kicker)}</p>` : ''}${h ? `<h${level} class="display p-head__h" data-reveal style="--i:1"${id ? ` id="${escA(id)}"` : ''}>${h}</h${level}>` : ''}${lede ? `<p class="lede p-head__lede" data-reveal style="--i:2">${lede}</p>` : ''}</header>`;
}
// captured blocks -> blocks() input: two-cell list rows (hours) become a definition list; empty headings go
function prep(list) {
  return (list || []).flatMap((b) => {
    if (!b) return [];
    if (b.t === 'ul' && b.items && b.items.length && b.items.every((it) => it && it.blocks && it.blocks.length === 2 && it.blocks.every((x) => x.t === 'text'))) {
      return [{ t: 'dl', items: b.items.map((it) => [it.blocks[0].html, it.blocks[1].html]) }];
    }
    if (/^h[1-6]$/.test(b.t) && !txt(b.html ?? b.text)) return [];
    return [b];
  });
}
const mapHtml = (ctx, cls = '') => `<figure class="p-map${cls ? ' ' + cls : ''}"><div class="p-map__frame"><iframe src="${escA(ctx.site.mapEmbed)}" title="Map of CastleLeaf at ${escA(ctx.site.address.full)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><figcaption class="p-map__cap">${arrowLink(ctx.site.directions, 'Open the map in Google Maps')}</figcaption></figure>`;
const addrHtml = (ctx) => `${esc(ctx.site.address.street)}<br>${esc(ctx.site.address.city)}, ${esc(ctx.site.address.state)} ${esc(ctx.site.address.zip)}`;

// the client's own line-art icons (about page values): root size removed so CSS sizes them; never a <style> leak
function cleanSvg(raw, cls) {
  return String(raw || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/^<svg\b([^>]*)>/i, (m, a) => `<svg${a.replace(/\s(width|height|class|id)="[^"]*"/g, '')} class="${cls}" aria-hidden="true" focusable="false">`);
}

// ---------------------------------------------------------------- shared captured pieces
function reviewsOf(ul) {
  return ((ul && ul.items) || []).map((it) => {
    const t = (it.blocks || []).filter((b) => b.t === 'text').map((b) => b.html);
    return { name: t[0] || '', date: t[1] || '', rating: t[2] || '', text: t.slice(3).join(' ') };
  }).filter((r) => r.name || r.text);
}
function reviewCards(list) {
  return list.map((r, i) => {
    const score = txt(r.rating);
    const n = Math.round(parseFloat(score) || 5);
    const long = txt(r.text).length > 70;
    return `<article class="review p-review${long ? ' p-review--wide' : ''}" data-spot data-reveal style="--i:${i % 4}">
<div class="p-review__top">${stars(n)}<span class="p-review__score">${esc(score)}</span>${icon('quote', 'p-review__q')}</div>
<p class="review__text">${H(r.text)}</p>
<p class="p-review__by"><span class="review__name">${H(r.name)}</span><span class="review__date">${H(r.date)}</span></p>
</article>`;
  }).join('\n');
}
function catCards(ctx, grid) {
  const cards = ((grid && grid.blocks) || []).filter((b) => b.t === 'linkcard');
  return `<div class="p-cats">${cards.map((lc, i) => {
    const h3 = (lc.blocks || []).find((x) => /^h[2-4]$/.test(x.t));
    const cta = (lc.blocks || []).find((x) => x.t === 'text');
    const label = txt(h3 && h3.html);
    const cat = (ctx.site.categories || []).find((c) => c.label.toLowerCase() === label.toLowerCase());
    const u = liveHref(lc.href);
    const pic = cat ? photo(ctx, cat.photo, { alt: '', sizes: '(min-width: 1024px) 220px, 42vw' }) : '';
    return `<a class="cat-card p-cat"${linkAttrs(u)} data-reveal style="--i:${i % 4}"><span class="cat-card__media">${pic}</span><h3 class="cat-card__title">${H(h3 && h3.html)}</h3><span class="cat-card__cta">${H(cta && cta.html)}${arrowFor(u)}</span></a>`;
  }).join('')}</div>`;
}
function effectCards(ctx, grid) {
  const cards = ((grid && grid.blocks) || []).filter((b) => b.t === 'linkcard');
  const effects = (ctx.site.menu && ctx.site.menu.effects) || [];
  return `<div class="p-effects">${cards.map((lc, i) => {
    const h3 = (lc.blocks || []).find((x) => /^h[2-4]$/.test(x.t));
    const cta = (lc.blocks || []).find((x) => x.t === 'text');
    const label = txt(h3 && h3.html);
    const ef = effects.find((e) => e.label.toLowerCase() === label.toLowerCase());
    const u = ef && ef.url ? ef.url : liveHref(lc.href);
    const pic = ef && ef.gimg ? gimg(ef.gimg, { alt: '', sizes: '(min-width: 1024px) 200px, 40vw' }) : ef && ef.photo ? photo(ctx, ef.photo, { alt: '', sizes: '(min-width: 1024px) 200px, 40vw' }) : '';
    return `<a class="tile tile--photo p-effect"${linkAttrs(u)} data-reveal style="--i:${i % 5}"><span class="tile__media">${pic}</span><h3 class="tile__title">${H(h3 && h3.html)}</h3><span class="p-effect__cta">${H(cta && cta.html)}${arrowFor(u)}</span></a>`;
  }).join('')}</div>`;
}
function offersOf(list) {
  const res = [];
  let cur = null;
  for (const b of list) {
    if (b.t === 'linkcard' && /\/specials\//.test(b.href || '')) { cur = { href: b.href }; res.push(cur); continue; }
    if (!cur) continue;
    if (/^h[2-4]$/.test(b.t) && !cur.title) cur.title = b.html;
    else if (b.t === 'text' && !cur.text) cur.text = b.html;
    else if (b.t === 'links' && !cur.cta) { cur.cta = linksOf(b)[0]; cur = null; }
  }
  return res;
}
function offerTiles(offers) {
  return `<div class="p-offers">${offers.map((o, i) => {
    const u = liveHref(o.href);
    return `<article class="tile glass glass--lift p-offer" data-spot data-reveal style="--i:${i % 3}">
<span class="p-offer__ico" aria-hidden="true">${icon(i % 2 ? 'gift' : 'tag')}</span>
<h3 class="tile__title p-offer__title">${H(o.title)}</h3>
${o.text ? `<p class="tile__text">${H(o.text)}</p>` : ''}
${o.cta ? arrowLink(liveHref(o.cta.href), o.cta.html) : ''}
</article>`;
  }).join('\n')}</div>`;
}
// "Featured Brand" / "Favorite Flower" ...: the live page prints each shortcut link twice (two layouts): the first is the
// visible link, the second the tile's stretched link (its words kept as the link's name)
function shortcutTile(h2, p1, p2, i, { level = 2 } = {}) {
  const a2 = p2 ? firstLink(p2.html) : null;
  const a1 = firstLink(p1 && p1.html);
  return `<article class="tile glass glass--lift p-short" data-spot data-reveal style="--i:${i % 4}">
<span class="p-short__ico" aria-hidden="true">${icon('leaf')}</span>
<h${level} class="tile__title p-short__h">${H(h2.html)}</h${level}>
${a1 ? `<p class="p-short__link">${arrowLink(liveHref(a1.href), a1.html)}</p>` : p1 ? `<p>${H(p1.html)}</p>` : ''}
${a2 ? `<a class="tile__link"${linkAttrs(liveHref(a2.href))}><span class="vh">${a2.html}</span></a>` : ''}
</article>`;
}
function eventsTile(ctx, h2, h3, links, { level = 2, cls = '' } = {}) {
  const l = linksOf(links)[0];
  return `<article class="tile tile--photo p-events${cls ? ' ' + cls : ''}" data-reveal>
<span class="tile__media">${gimg('g-feature-events', { alt: '', sizes: '(min-width: 1024px) 560px, 92vw' })}</span>
<span class="kicker">Events</span>
<h${level} class="tile__title">${H(h2 && h2.html)}</h${level}>
${h3 ? `<h${level + 1} class="p-events__none">${H(h3.html)}</h${level + 1}>` : ''}
${l ? arrowLink(liveHref(l.href), l.html, 'btn btn--sm') : ''}
</article>`;
}
function deliveryAnswer(ctx) {
  const d = ctx.site.delivery || {};
  const order = String(d.orderLine || '').replace(/^Order Online\s*/, '');
  return `<div class="prose"><p>${esc(d.line)}</p><p><a${linkAttrs(menu(ctx))}>Order Online</a> ${esc(order)}</p><p>${arrowLink('/delivery/', 'Local Delivery', 'link-arrow')}</p></div>`;
}
function faqItems(ctx, grid) {
  return ((grid && grid.blocks) || []).filter((d) => d.t === 'details').map((d) => {
    const q = txt(d.summary);
    const isDelivery = /^Do you offer delivery\?$/i.test(q);
    const aHtml = isDelivery ? deliveryAnswer(ctx) : blocks(prep(d.blocks), ctx);
    const ld = isDelivery ? `${ctx.site.delivery.line}. ${ctx.site.delivery.orderLine}.` : txt(aHtml);
    return { q, qHtml: H(d.summary), aHtml, ld };
  });
}
const faqHtml = (items) => `<div class="faq p-faq" data-faq>${items.map((x) => `<details><summary>${x.qHtml}${icon('plus', 'faq__ico')}</summary><div class="faq__a">${x.aHtml}</div></details>`).join('\n')}</div>`;
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.ld || txt(x.aHtml) } })) });

function waysBento(ctx, { h3 = 'h3' } = {}) {
  const items = (ctx.site.ways && ctx.site.ways.items) || [];
  const order = ['delivery', 'budtender', 'online', 'kiosk'];
  const media = { delivery: 'g-feature-delivery', budtender: 'g-feature-budtender' };
  const icons = { online: 'cart', kiosk: 'kiosk', delivery: 'truck', budtender: 'chat' };
  return `<div class="bento p-ways">${order.map((k, i) => {
    const w = items.find((x) => x.key === k);
    if (!w) return '';
    const u = w.href === 'menu' ? menu(ctx) : w.href;
    const big = k === 'delivery';
    const wide = k === 'budtender';
    const photoTile = media[k];
    const cls = big ? 'tile tile--big tile--photo' : wide ? 'tile tile--wide tile--photo' : 'tile glass glass--lift';
    return `<article class="${cls} p-way p-way--${k}" data-spot data-reveal style="--i:${i}">
${photoTile ? `<span class="tile__media">${gimg(photoTile, { alt: '', sizes: big ? '(min-width: 1024px) 620px, 92vw' : '(min-width: 1024px) 620px, 92vw' })}</span>` : `<span class="p-way__ico" aria-hidden="true">${icon(icons[k])}</span>`}
${k === 'budtender' ? `<p class="kicker">${esc(ctx.site.budtenders.operatorClaim)}</p>` : ''}
<${h3} class="tile__title">${esc(w.title)}</${h3}>
<p class="tile__text">${esc(w.line)}</p>
<a class="tile__link"${linkAttrs(u)}><span class="vh">${esc(w.cta)}</span></a>
<span class="p-way__cta" aria-hidden="true">${esc(w.cta)}${arrowFor(u)}</span>
</article>`;
  }).join('\n')}</div>`;
}

// a calm light band with the store's address and hours (closes a page whose dark band would otherwise meet the footer)
function visitBand(ctx) {
  return `<section class="band band--linen p-visit-band" aria-labelledby="p-visit-h">
<div class="wrap p-visit-row">
<figure class="frame frame--bleed-start frame--bleed p-visit-row__frame" data-reveal="wipe">${photo(ctx, 'cl/CL-Image-Hero.webp', { alt: 'The CastleLeaf building in Brighton with its two round towers', cls: 'frame__img', sizes: '(min-width: 1024px) 560px, 92vw' })}</figure>
<div class="glass glass--strong p-visit-row__card" data-spot data-reveal style="--i:1">
<p class="kicker">Visit</p>
<h2 class="display p-visit-row__h" id="p-visit-h">${esc(ctx.site.aboutName)}</h2>
<p class="p-cinfo__addr">${addrHtml(ctx)}</p>
${hoursHtml(ctx, 'p-hours p-hours--compact')}
<p class="btn-row">${btn(ctx.site.directions, 'Directions', 'btn btn--sm')}${btn(tel(ctx), esc(ctx.site.phone), 'btn btn--ghost btn--sm')}</p>
</div>
</div>
</section>`;
}

// ---------------------------------------------------------------- /about/
function about(ctx) {
  const rec = ctx.content.about;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const iIntro = L.findIndex((b) => b.t === 'h3');
  const introH = L[iIntro];
  const introP = L[iIntro + 1];
  const values = [];
  for (let i = 0; i < L.length; i++) {
    if (L[i].t === 'svg' && L[i + 1] && L[i + 1].t === 'h3' && L[i + 2] && L[i + 2].t === 'p') { values.push({ svg: L[i].raw, h: L[i + 1].html, p: L[i + 2].html }); i += 2; }
  }
  const tail = [];
  for (let i = 0; i < L.length; i++) if (L[i].t === 'h3' && L[i + 1] && L[i + 1].t === 'links') tail.push({ h: L[i].html, link: linksOf(L[i + 1])[0] });
  const shapes = ['tile--wide', '', '', '', '', 'tile--wide'];
  const valueTiles = values.map((v, i) => {
    const gallery = /gallery/i.test(txt(v.p));
    return `<article class="tile glass glass--lift p-value ${shapes[i] || ''}${gallery ? ' p-value--gallery' : ''}" data-spot data-reveal style="--i:${i % 4}">
<span class="p-value__ico">${cleanSvg(v.svg, 'p-value__svg')}</span>
<h3 class="tile__title p-value__h">${H(v.h)}</h3>
<p class="tile__text p-value__p">${H(v.p)}</p>
${gallery ? `<p class="p-value__cta">${arrowLink('/contact/', 'Get in touch', 'btn btn--copper btn--sm')}</p>` : ''}
</article>`;
  }).join('\n');
  const tailTiles = tail.map((t, i) => {
    const ev = /event/i.test(txt(t.h));
    return `<article class="tile ${ev ? 'tile--photo' : 'glass glass--lift'} p-next" data-spot data-reveal style="--i:${i}">
${ev ? `<span class="tile__media">${gimg('g-feature-events', { alt: '', sizes: '(min-width: 1024px) 600px, 92vw' })}</span>` : `<span class="tile__media p-next__team">${photo(ctx, 'cl/CL-Team.webp', { alt: '', sizes: '(min-width: 1024px) 600px, 92vw' })}</span>`}
<h3 class="tile__title p-next__h">${H(t.h)}</h3>
${t.link ? arrowLink(liveHref(t.link.href), t.link.html, 'btn btn--sm') : ''}
</article>`;
  }).join('\n');
  const main = `${hero(ctx, {
    kicker: 'Our story', h1Html: accent(rec.h1, 'CastleLeaf'), sub: sub ? H(sub.html) : '',
    lede: esc(ctx.site.tagline) + '. ' + esc(ctx.site.address.full) + '.',
    crumbs: [['/', 'Home'], ['/about/', 'About']],
    cta: [{ label: 'Get Directions', href: '/directions/' }, { label: 'Shop Menu', href: 'menu', ghost: true }],
    media: { photo: 'cl/CL-Image-Hero.webp', alt: 'The CastleLeaf building in Brighton: a white brick block with two round towers', pos: 'center 55%' },
  })}
<section class="band band--cream p-intro" aria-labelledby="p-intro-h">
<div class="wrap p-split">
<div class="p-split__text">
<p class="kicker" data-reveal>Your neighbourhood store</p>
<h3 class="display p-intro__h" id="p-intro-h" data-reveal style="--i:1">${H(introH && introH.html)}</h3>
<div class="prose p-intro__p" data-reveal style="--i:2"><p>${H(introP && introP.html)}</p></div>
</div>
<figure class="arch-frame p-team" data-reveal="arch" data-depth="0.05">${photo(ctx, 'cl/CL-Team.webp', { alt: 'The CastleLeaf team in front of the store', cls: 'frame__img', sizes: '(min-width: 1024px) 520px, 92vw' })}</figure>
</div>
</section>
<section class="band band--sage p-values-band" aria-labelledby="p-values-h">
${tex('vein')}
<div class="wrap">
${head({ kicker: 'What we stand for', h: 'Six lines we <em class="accent">live</em> by', id: 'p-values-h' })}
<div class="bento p-values">${valueTiles}</div>
</div>
</section>
<section class="band band--linen p-next-band" aria-label="Events and careers">
<div class="wrap"><div class="p-next-grid">${tailTiles}</div></div>
</section>`;
  return out(ctx, rec, { path: '/about/', main, crumbs: [['/', 'Home'], ['/about/', 'About']], bodyClass: 'p-about' });
}

// ---------------------------------------------------------------- /book-a-budtender/
function bookBudtender(ctx) {
  const rec = ctx.content['book-a-budtender'];
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const soon = L.find((b) => b.t === 'h2' && /Coming Soon/i.test(txt(b.html)));
  const p = L.find((b) => b.t === 'p');
  const bt = ctx.site.budtenders;
  const helps = [
    { cls: 'tile--tall tile--photo', media: photo(ctx, 'cl/CL-Image-SEO.webp', { alt: '', sizes: '(min-width: 1024px) 360px, 92vw' }), title: 'Your first visit', text: 'New to cannabis? Bring every question and start with a conversation.', href: '/faqs/', cta: 'Read the FAQs' },
    { cls: 'glass glass--lift', icon: 'leaf', title: 'Finding your format', text: 'Flower, pre-rolls, vaporizers, edibles, concentrates, topicals or tinctures: talk it through.', href: '/shop/', cta: 'Browse the shop' },
    { cls: 'glass glass--lift', icon: 'sparkle', title: `The ${ctx.site.flowerDeli.counter}`, text: `Ask about the ${ctx.site.flowerDeli.label} and its bulk flower.`, href: '/products/flower/', cta: 'See flower' },
    { cls: 'tile--wide glass glass--lift', icon: 'chat', title: 'Limits, ID and the law', text: 'Purchase limits, a valid ID and where you can consume, in plain words.', href: '/faqs/', cta: 'Ask a budtender' },
  ];
  const helpTiles = helps.map((x, i) => `<article class="tile ${x.cls} p-help" data-spot data-reveal style="--i:${i}">
${x.media ? `<span class="tile__media">${x.media}</span>` : `<span class="p-help__ico" aria-hidden="true">${icon(x.icon)}</span>`}
<h3 class="tile__title">${esc(x.title)}</h3>
<p class="tile__text">${esc(x.text)}</p>
<a class="tile__link"${linkAttrs(x.href)}><span class="vh">${esc(x.cta)}</span></a>
</article>`).join('\n');
  const callLabel = `Call ${ctx.site.phone}`;
  const main = `${hero(ctx, {
    kicker: bt.operatorClaim, h1Html: accent(rec.h1, 'Budtender'), sub: sub ? H(sub.html) : '',
    lede: esc(bt.lines[0]),
    crumbs: [['/', 'Home'], ['/book-a-budtender/', 'Book A Budtender']],
    cta: `${btn('#p-book', 'Book a time')}${btn(tel(ctx), esc(callLabel), 'btn btn--ghost')}`,
    media: { gimg: 'g-feature-budtender', alt: '', pos: 'center 50%' },
  })}
<section class="band band--cream p-book-band" id="p-book" aria-labelledby="p-soon-h">
${tex('haze')}
<div class="wrap p-book">
<div class="p-book__panel glass glass--strong" data-reveal>
<p class="kicker">${esc(bt.operatorClaim)}</p>
<h2 class="display p-soon" id="p-soon-h">${H(soon && soon.html)}</h2>
<p class="lede p-book__p">${H(p && p.html)}</p>
${demoForm({ id: 'book-form', fields: ['Name', 'Email', 'Phone', 'What would you like to talk about?'], textarea: ['What would you like to talk about?'], button: 'Request a budtender', cls: 'p-book__form' })}
</div>
<div class="p-book__side">
${head({ kicker: 'What a budtender can help with', h: 'Bring your <em class="accent">questions</em>', level: 2 })}
<div class="bento p-helps">${helpTiles}</div>
</div>
</div>
</section>
<section class="band band--gold p-call" aria-labelledby="p-call-h">
${tex('leaf')}
<div class="wrap p-call__inner">
<p class="kicker" data-reveal>Rather talk now?</p>
<h2 class="display p-call__h" id="p-call-h" data-reveal style="--i:1">A real <em class="accent">conversation</em>, at the counter or on the phone</h2>
<p class="lede" data-reveal style="--i:2">${esc(bt.lines[1])}</p>
<div class="btn-row" data-reveal style="--i:3">${btn(tel(ctx), esc(callLabel))}${btn('/directions/', 'Get Directions', 'btn btn--ghost')}</div>
</div>
</section>
${visitBand(ctx)}`;
  return out(ctx, rec, { path: '/book-a-budtender/', main, crumbs: [['/', 'Home'], ['/book-a-budtender/', 'Book A Budtender']], bodyClass: 'p-budtender' });
}

// ---------------------------------------------------------------- /contact/
function contact(ctx) {
  const rec = ctx.content.contact;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const intro = L.find((b) => b.t === 'p');
  const h3s = L.filter((b) => b.t === 'h3');
  const hInfo = h3s.find((b) => /Contact Info/i.test(txt(b.html)));
  const hLoc = h3s.find((b) => /^Location$/i.test(txt(b.html)));
  const hHours = h3s.find((b) => /^Hours$/i.test(txt(b.html)));
  const hConnect = h3s.find((b) => /Connect/i.test(txt(b.html)));
  const telL = linksOf(L.find((b) => b.t === 'links'))[0];
  const email = L.find((b) => b.t === 'text');
  const addr = L.find((b) => b.t === 'p' && /Birmingham/i.test(b.html));
  const main = `${hero(ctx, {
    kicker: 'Say hello', h1Html: accent(rec.h1, 'CastleLeaf'), sub: sub ? H(sub.html) : '',
    lede: H(intro && intro.html),
    crumbs: [['/', 'Home'], ['/contact/', 'Contact']],
    cta: `${btn(tel(ctx), esc(ctx.site.phone))}${btn(mailto(ctx), esc(ctx.site.email), 'btn btn--ghost')}`,
    media: { photo: 'cl/CL-Image-Events.webp', alt: 'The CastleLeaf building at dusk', pos: 'center 45%' },
  })}
<section class="band band--cream p-contact-band" aria-label="Contact details">
${tex('haze')}
<div class="wrap">
<div class="bento p-contact">
<article class="tile glass glass--lift p-cinfo" data-spot data-reveal>
<span class="p-cinfo__ico" aria-hidden="true">${icon('phone')}</span>
<h3 class="tile__title">${H(hInfo && hInfo.html)}</h3>
<p class="p-cinfo__line">${telL ? `<a class="link-arrow"${linkAttrs(liveHref(telL.href))}>${telL.html}${icon('phone')}</a>` : ''}</p>
<p class="p-cinfo__line"><a class="link-arrow"${linkAttrs(mailto(ctx))}>${H(email && email.html)}${icon('mail')}</a></p>
</article>
<article class="tile glass glass--lift p-cinfo" data-spot data-reveal style="--i:1">
<span class="p-cinfo__ico" aria-hidden="true">${icon('pin')}</span>
<h3 class="tile__title">${H(hLoc && hLoc.html)}</h3>
<p class="p-cinfo__addr">${H(addr && addr.html)}</p>
${arrowLink(ctx.site.directions, 'Get Directions')}
</article>
<article class="tile glass glass--lift tile--tall p-cinfo p-cinfo--hours" data-spot data-reveal style="--i:2">
<span class="p-cinfo__ico" aria-hidden="true">${icon('clock')}</span>
<h3 class="tile__title">${H(hHours && hHours.html)}</h3>
${hoursHtml(ctx, 'p-hours')}
<p class="p-note">${esc(ctx.site.hours.holidays)}</p>
</article>
<article class="tile tile--wide glass glass--strong p-cform" data-reveal style="--i:3">
<h3 class="tile__title p-cform__h">${H(hConnect && hConnect.html)}</h3>
${demoForm({ id: 'contact-form', fields: ['Name', 'Email', 'Message'], textarea: ['Message'], button: 'Send message' })}
</article>
</div>
</div>
</section>
<section class="band band--linen p-map-band" aria-label="Map">
<div class="wrap">${mapHtml(ctx)}</div>
</section>`;
  return out(ctx, rec, { path: '/contact/', main, crumbs: [['/', 'Home'], ['/contact/', 'Contact']], bodyClass: 'p-contact-page' });
}

// ---------------------------------------------------------------- /faqs/
function faqs(ctx) {
  const rec = ctx.content.faqs;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const grid = L.find((b) => b.t === 'grid');
  const end = [...L].reverse().find((b) => b.t === 'h3');
  const items = faqItems(ctx, grid);
  const main = `${hero(ctx, {
    kicker: 'Answers', h1Html: accent(rec.h1, 'CastleLeaf'), sub: sub ? H(sub.html) : '',
    lede: esc(ctx.site.adultUseOnly),
    crumbs: [['/', 'Home'], ['/faqs/', 'FAQs']],
    cta: [{ label: 'Shop Menu', href: 'menu' }, { label: 'Local Delivery', href: '/delivery/', ghost: true }],
    media: { gimg: 'g-feature-firstvisit', alt: '' },
  })}
<section class="band band--linen p-faq-band" aria-label="Frequently asked questions">
<div class="wrap p-faq-layout">
<aside class="p-faq-aside" data-reveal>
<div class="glass glass--strong p-faq-card" data-spot>
<p class="kicker">Visit</p>
<p class="p-faq-card__addr">${addrHtml(ctx)}</p>
${hoursHtml(ctx, 'p-hours p-hours--compact')}
<p class="btn-row">${btn(tel(ctx), esc(ctx.site.phone), 'btn btn--sm')}${btn(ctx.site.directions, 'Directions', 'btn btn--ghost btn--sm')}</p>
</div>
</aside>
<div class="p-faq-main">${faqHtml(items)}</div>
</div>
</section>
<section class="band band--cream p-ask" aria-labelledby="p-ask-h">
${tex('haze')}
<div class="wrap p-ask__inner">
<div class="p-ask__text">
<p class="kicker" data-reveal>Ask us</p>
<h3 class="display p-ask__h" id="p-ask-h" data-reveal style="--i:1">${H(end && end.html)}</h3>
<p class="p-ask__links" data-reveal style="--i:2">${arrowLink(tel(ctx), esc(ctx.site.phone))} ${arrowLink(mailto(ctx), esc(ctx.site.email))}</p>
</div>
<div class="glass glass--strong p-ask__form" data-reveal style="--i:2">${demoForm({ id: 'faq-form', fields: ['Name', 'Email', 'Message'], textarea: ['Message'], button: 'Send message' })}</div>
</div>
</section>`;
  return out(ctx, rec, { path: '/faqs/', main, crumbs: [['/', 'Home'], ['/faqs/', 'FAQs']], jsonld: [faqLd(items)], bodyClass: 'p-faqs' });
}

// ---------------------------------------------------------------- /stores/brighton-ma/ (the location template, one store)
function brighton(ctx) {
  const rec = ctx.content['stores__brighton-ma'];
  const L = flat(rec);
  const at = (pred, from = 0) => { for (let i = from; i < L.length; i++) if (pred(L[i])) return i; return -1; };
  const h2At = (re, from = 0) => at((b) => b.t === 'h2' && re.test(txt(b.html)), from);
  const sub = L[h2At(SUBRE)];
  const shopMenu = linksOf(L.find((b) => b.t === 'links'))[0];
  const iContact = h2At(/^Contact$/);
  const telL = linksOf(L[at((b) => b.t === 'links', iContact)])[0];
  const email = L[at((b) => b.t === 'text', iContact)];
  const iLoc = h2At(/^Location$/);
  const addr = L[at((b) => b.t === 'p', iLoc)];
  const iHours = h2At(/^Hours$/);
  const iRev = h2At(/Customer Reviews/);
  const reviews = reviewsOf(L[at((b) => b.t === 'ul', iRev)]);
  const iCat = h2At(/Shop By Category/);
  const catGrid = L[at((b) => b.t === 'grid', iCat)];
  const iOff = h2At(/Shop Offers/);
  const offers = offersOf(L.slice(iOff));
  const allOffers = L.slice(iOff).find((b) => b.t === 'links' && /Shop All Offers/.test(JSON.stringify(b)));
  const iEv = h2At(/Upcoming Events/);
  const evH3 = L[at((b) => b.t === 'h3', iEv)];
  const evLinks = L[at((b) => b.t === 'links', iEv)];
  const iEff = h2At(/Shop By Effect/);
  const effGrid = L[at((b) => b.t === 'grid', iEff)];
  const shortcuts = [];
  for (let i = 0; i < L.length; i++) {
    if (L[i].t === 'h2' && L[i + 1] && L[i + 1].t === 'p' && L[i + 2] && L[i + 2].t === 'p' && firstLink(L[i + 1].html)) shortcuts.push([L[i], L[i + 1], L[i + 2]]);
  }
  const faqGrid = [...L].reverse().find((b) => b.t === 'grid' && (b.blocks || []).some((x) => x.t === 'details'));
  const items = faqItems(ctx, faqGrid);
  const main = `${hero(ctx, {
    kicker: 'Visit us', h1Html: accent(rec.h1, 'Brighton'), sub: sub ? H(sub.html) : '',
    lede: `${esc(ctx.site.address.full)}. ${esc(ctx.site.hours.text)}.`,
    crumbs: [['/', 'Home'], ['/stores/', 'Stores'], ['/stores/brighton-ma/', 'Brighton, MA']],
    cta: `${shopMenu ? btn(liveHref(shopMenu.href), shopMenu.html) : ''}${btn(tel(ctx), 'Call now', 'btn btn--ghost')}${btn(ctx.site.directions, 'Directions', 'btn btn--ghost')}`,
    media: { photo: 'cl/CL-Image-Hero.webp', alt: 'The CastleLeaf building in Brighton with its two round towers', pos: 'center 55%', chip: `${icon('pin')}<span>${esc(ctx.site.address.street)}</span>` },
  })}
<section class="band band--cream p-visit" aria-label="Visit the store">
<div class="wrap">
<div class="bento p-visit-grid">
<article class="tile glass glass--lift p-cinfo" data-spot data-reveal>
<span class="p-cinfo__ico" aria-hidden="true">${icon('phone')}</span>
<h2 class="tile__title">${H(L[iContact] && L[iContact].html)}</h2>
<p class="p-cinfo__line">${telL ? `<a class="link-arrow"${linkAttrs(liveHref(telL.href))}>${telL.html}${icon('phone')}</a>` : ''}</p>
<p class="p-cinfo__line"><a class="link-arrow"${linkAttrs(mailto(ctx))}>${H(email && email.html)}${icon('mail')}</a></p>
</article>
<article class="tile glass glass--lift p-cinfo" data-spot data-reveal style="--i:1">
<span class="p-cinfo__ico" aria-hidden="true">${icon('pin')}</span>
<h2 class="tile__title">${H(L[iLoc] && L[iLoc].html)}</h2>
<p class="p-cinfo__addr">${H(addr && addr.html)}</p>
${arrowLink(ctx.site.directions, 'Directions')}
</article>
<article class="tile glass glass--lift tile--big p-cinfo p-cinfo--hours" data-spot data-reveal style="--i:2">
<span class="p-cinfo__ico" aria-hidden="true">${icon('clock')}</span>
<h2 class="tile__title">${H(L[iHours] && L[iHours].html)}</h2>
${hoursHtml(ctx, 'p-hours')}
<p class="p-note">${esc(ctx.site.hours.holidays)}</p>
</article>
<div class="tile tile--wide p-map-tile" data-reveal style="--i:3">${mapHtml(ctx, 'p-map--tile')}</div>
</div>
<div class="p-inside">
<figure class="frame p-inside__a" data-reveal="wipe">${photo(ctx, 'cl/CL-Image-SEO.webp', { alt: 'The CastleLeaf shop wall: copper shelves for vapes, concentrates and edibles above the glass counter', cls: 'frame__img', sizes: '(min-width: 1024px) 560px, 92vw' })}</figure>
<figure class="frame frame--bleed p-inside__b" data-reveal="wipe" data-depth="0.06">${photo(ctx, 'cl/CL-Image-HowToShop.webp', { alt: 'Glass doors opening onto the bright CastleLeaf shop floor', cls: 'frame__img', sizes: '(min-width: 1024px) 460px, 80vw' })}</figure>
<figure class="frame p-inside__c" data-reveal="wipe">${photo(ctx, 'cl/CL-Image-Events.webp', { alt: 'The CastleLeaf building at dusk', cls: 'frame__img', sizes: '(min-width: 1024px) 360px, 60vw' })}</figure>
</div>
</div>
</section>
<section class="band band--linen p-rev-band" aria-labelledby="p-rev-h">
<div class="wrap">
${head({ kicker: 'Neighbours say', h: H(L[iRev].html), id: 'p-rev-h' })}
<div class="p-reviews">${reviewCards(reviews)}</div>
<p class="p-more">${arrowLink('/reviews/', 'Read All Reviews')}</p>
</div>
</section>
<section class="band band--sage p-cat-band" aria-labelledby="p-cat-h">
<div class="wrap">
${head({ kicker: 'The live menu', h: H(L[iCat].html), id: 'p-cat-h' })}
${catCards(ctx, catGrid)}
</div>
</section>
<section class="band band--cream p-offer-band" aria-labelledby="p-off-h">
<div class="wrap">
${head({ kicker: 'Bundles', h: H(L[iOff].html), id: 'p-off-h' })}
${offerTiles(offers)}
${allOffers ? `<p class="p-more">${linksOf(allOffers).map((l) => btn(liveHref(l.href), l.html, 'btn btn--copper')).join('')}</p>` : ''}
</div>
</section>
<section class="band band--linen p-short-band" aria-label="Shortcuts to the live menu">
<div class="wrap">
<div class="bento p-shorts">
${shortcuts.map((s, i) => shortcutTile(s[0], s[1], s[2], i)).join('\n')}
${eventsTile(ctx, L[iEv], evH3, evLinks, { cls: 'tile--wide' })}
</div>
</div>
</section>
<section class="band band--sage p-eff-band" aria-labelledby="p-eff-h">
<div class="wrap">
${head({ kicker: 'How do you want to feel?', h: H(L[iEff].html), id: 'p-eff-h' })}
${effectCards(ctx, effGrid)}
</div>
</section>
<section class="band band--linen p-faq-band" aria-labelledby="p-sfaq-h">
<div class="wrap p-faq-layout">
<aside class="p-faq-aside">${head({ kicker: 'Good to know', h: 'Questions, <em class="accent">answered</em>', id: 'p-sfaq-h' })}<p>${arrowLink('/faqs/', 'All FAQs')}</p></aside>
<div class="p-faq-main">${faqHtml(items)}</div>
</div>
</section>`;
  const jsonld = { '@context': 'https://schema.org', '@type': 'Store', name: ctx.site.longName, url: ctx.site.origin + '/stores/brighton-ma/', telephone: ctx.site.phoneHref.replace(/^tel:/, ''), email: ctx.site.email, address: { '@type': 'PostalAddress', streetAddress: ctx.site.address.street, addressLocality: ctx.site.address.city, addressRegion: ctx.site.address.state, postalCode: ctx.site.address.zip, addressCountry: 'US' }, hasMap: ctx.site.directions };
  return out(ctx, rec, { path: '/stores/brighton-ma/', main, crumbs: [['/', 'Home'], ['/stores/', 'Stores'], ['/stores/brighton-ma/', 'Brighton, MA']], jsonld: [jsonld], bodyClass: 'p-store' });
}

// ---------------------------------------------------------------- /stores/
function stores(ctx) {
  const rec = ctx.content.stores;
  const L = flat(rec);
  const card = L.find((b) => b.t === 'card');
  const cb = (card && card.blocks) || [];
  const h2 = cb.find((b) => b.t === 'h2');
  const more = linksOf(cb.find((b) => b.t === 'links'))[0];
  const main = `${hero(ctx, {
    kicker: 'Our store', h1Html: accent(rec.h1, 'Locations'),
    lede: esc(ctx.site.longName) + ', ' + esc(ctx.site.address.full) + '.',
    crumbs: [['/', 'Home'], ['/stores/', 'Stores']],
    cta: [{ label: 'Shop Menu', href: 'menu' }, { label: 'Directions', href: 'directions', ghost: true }],
    media: { photo: 'cl/CL-Image-Events.webp', alt: 'The CastleLeaf building at dusk', pos: 'center 45%' },
  })}
<section class="band band--cream p-stores" aria-label="Store">
${tex('vein')}
<div class="wrap">
<article class="p-store-card glass glass--strong" data-spot data-reveal>
<figure class="arch-frame p-store-card__frame">${photo(ctx, 'cl/CL-Image-Hero.webp', { alt: 'CastleLeaf Exterior', cls: 'frame__img', sizes: '(min-width: 1024px) 420px, 80vw' })}</figure>
<div class="p-store-card__body">
<p class="kicker">${esc(ctx.site.address.neighbourhood)}</p>
<h2 class="display p-store-card__h">${H(h2 && h2.html)}</h2>
<p class="p-store-card__addr">${addrHtml(ctx)}</p>
${hoursHtml(ctx, 'p-hours p-hours--compact')}
<p class="btn-row">${more ? btn(liveHref(more.href), more.html.replace(/\s*⭢\s*$/, '')) : ''}${btn(tel(ctx), 'Call now', 'btn btn--ghost')}${btn(ctx.site.directions, 'Directions', 'btn btn--ghost')}</p>
</div>
</article>
</div>
</section>`;
  return out(ctx, rec, { path: '/stores/', main, crumbs: [['/', 'Home'], ['/stores/', 'Stores']], bodyClass: 'p-stores-page' });
}

// ---------------------------------------------------------------- /directions/
function directionsPage(ctx) {
  const rec = ctx.content.directions;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const hLoc = L.find((b) => b.t === 'h3' && /^Location$/i.test(txt(b.html)));
  const addr = L.find((b) => b.t === 'p' && /Birmingham Pkwy<br>/i.test(b.html));
  const iHow = L.findIndex((b) => b.t === 'h2' && /How to Get/i.test(txt(b.html)));
  const howP = L[iHow + 1];
  // groups: h3 (mode) -> routes: p strong (route) + ul (steps); loose p after an h3 = a note
  const groups = [];
  let g = null;
  let route = null;
  for (let i = iHow + 2; i < L.length; i++) {
    const b = L[i];
    if (b.t === 'h3') { if (!txt(b.html)) continue; g = { h: b.html, routes: [], notes: [] }; groups.push(g); route = null; continue; }
    if (!g) continue;
    if (b.t === 'p' && /^<strong>[^<]*<\/strong>$/.test(b.html.trim())) { route = { h: b.html, steps: [] }; g.routes.push(route); continue; }
    if (b.t === 'ul' && route) { route.steps = (b.items || []).map((it) => (typeof it === 'string' ? it : (it.blocks || []).map((x) => x.html).join(' '))); continue; }
    if (b.t === 'p') g.notes.push(b.html);
  }
  const ico = (h) => (/driv/i.test(h) ? 'pin' : /transit/i.test(h) ? 'clock' : /bike|walk/i.test(h) ? 'leaf' : /park/i.test(h) ? 'sparkle' : 'arrow');
  const clean = (h) => String(h).replace(/^[^\w<]+/u, '').replace(/^(<strong>)?\s*[^\w<]+\s*/u, '$1');
  const big = groups.filter((x) => x.routes.length);
  const small = groups.filter((x) => !x.routes.length);
  const routeHtml = (r) => `<div class="p-route glass" data-reveal>
<h4 class="p-route__h">${H(r.h)}</h4>
<ol class="steps p-steps">${r.steps.map((s, i) => `<li class="step"><span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div class="step__text">${H(s)}</div></li>`).join('')}</ol>
</div>`;
  const main = `${hero(ctx, {
    kicker: 'Find us', h1Html: accent(rec.h1, 'CastleLeaf'), sub: sub ? H(sub.html) : '',
    lede: esc(ctx.site.address.full) + '.',
    crumbs: [['/', 'Home'], ['/directions/', 'Directions']],
    cta: `${btn(ctx.site.directions, 'Get Directions')}${btn(tel(ctx), esc(ctx.site.phone), 'btn btn--ghost')}`,
    media: { gimg: 'g-feature-law', alt: '' },
  })}
<section class="band band--cream p-dir-map" aria-label="Location and map">
${tex('haze')}
<div class="wrap p-dir-top">
<div class="glass glass--strong p-dir-loc" data-spot data-reveal>
<span class="p-cinfo__ico" aria-hidden="true">${icon('pin')}</span>
<h3 class="tile__title">${H(hLoc && hLoc.html)}</h3>
<p class="p-cinfo__addr">${H(addr && addr.html)}</p>
${hoursHtml(ctx, 'p-hours p-hours--compact')}
${arrowLink(ctx.site.directions, 'Get Directions')}
</div>
${mapHtml(ctx, 'p-map--wide')}
</div>
</section>
<section class="band band--linen p-dir-how" aria-labelledby="p-how-h">
<div class="wrap">
<header class="p-head p-head--wide">
<p class="kicker" data-reveal>Getting here</p>
<h2 class="display p-head__h" id="p-how-h" data-reveal style="--i:1">${H(L[iHow] && L[iHow].html)}</h2>
<div class="prose p-dir-intro" data-reveal style="--i:2"><p>${H(howP && howP.html)}</p></div>
</header>
${big.map((x) => `<div class="p-mode">
<h3 class="p-mode__h" data-reveal><span class="p-mode__ico" aria-hidden="true">${icon(ico(txt(x.h)))}</span>${H(clean(x.h))}</h3>
<div class="p-routes">${x.routes.map(routeHtml).join('\n')}</div>
${x.notes.map((n) => `<p>${H(n)}</p>`).join('')}
</div>`).join('\n')}
<div class="p-dir-more">${small.map((x, i) => `<article class="tile glass glass--lift p-dir-note" data-spot data-reveal style="--i:${i}">
<span class="p-cinfo__ico" aria-hidden="true">${icon(ico(txt(x.h)))}</span>
<h3 class="tile__title">${H(clean(x.h))}</h3>
${x.notes.map((n) => `<p class="tile__text">${H(n)}</p>`).join('')}
</article>`).join('\n')}</div>
</div>
</section>`;
  return out(ctx, rec, { path: '/directions/', main, crumbs: [['/', 'Home'], ['/directions/', 'Directions']], bodyClass: 'p-directions' });
}

// ---------------------------------------------------------------- /reviews/
function reviewsPage(ctx) {
  const rec = ctx.content.reviews;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const shopMenu = linksOf(L.find((b) => b.t === 'links'))[0];
  const h3 = L.find((b) => b.t === 'h3');
  const list = reviewsOf(L.find((b) => b.t === 'ul'));
  const main = `${hero(ctx, {
    kicker: 'In their words', h1Html: accent(rec.h1, 'Reviews'), sub: sub ? H(sub.html) : '',
    crumbs: [['/', 'Home'], ['/reviews/', 'Reviews']],
    cta: `${shopMenu ? btn(liveHref(shopMenu.href), shopMenu.html) : ''}${btn('/directions/', 'Plan a visit', 'btn btn--ghost')}`,
    media: { photo: 'cl/CL-Image-SEO.webp', alt: 'Inside CastleLeaf: copper shelves and the glass counter', pos: 'center 50%' },
  })}
<section class="band band--linen p-rev-band" aria-labelledby="p-revs-h">
<div class="wrap">
${head({ kicker: 'Customer reviews', h: H(h3 && h3.html), level: 3, id: 'p-revs-h' })}
<div class="p-reviews p-reviews--all">${reviewCards(list)}</div>
</div>
</section>`;
  return out(ctx, rec, { path: '/reviews/', main, crumbs: [['/', 'Home'], ['/reviews/', 'Reviews']], bodyClass: 'p-reviews-page' });
}

// ---------------------------------------------------------------- /recreational/ + the 124 town pages
const townRecs = (ctx) => Object.entries(ctx.content || {}).filter(([k]) => k.startsWith('recreational__')).map(([, r]) => r);
function townLabel(r) {
  const t = String(r.title || '').replace(/\s*\W\s*CastleLeaf\s*$/i, '');
  const m = /^(.*?Near)\s+(.+?),\s*MA\s*(\d{5})$/i.exec(t);
  return m ? { pre: m[1], town: m[2], zip: m[3], full: t } : { pre: '', town: t, zip: '', full: t };
}
function recreationalHub(ctx) {
  const rec = ctx.content.recreational;
  const towns = townRecs(ctx).map((r) => ({ r, ...townLabel(r) })).sort((a, b) => a.town.localeCompare(b.town) || a.zip.localeCompare(b.zip));
  const letters = [...new Set(towns.map((t) => t.town[0].toUpperCase()))];
  // the hub's captured cards are towns too: every captured card title is one of the rows below
  const main = `${hero(ctx, {
    kicker: 'Neighbouring towns', h1Html: accent(rec.h1, 'Locations'),
    lede: `${esc(ctx.site.longName)} is one store, at ${esc(ctx.site.address.full)}. Find your town.`,
    crumbs: [['/', 'Home'], ['/recreational/', 'Recreational Geo']],
    cta: [{ label: 'Shop Menu', href: 'menu' }, { label: 'Directions', href: '/directions/', ghost: true }],
    media: { photo: 'cl/CL-Image-Hero.webp', alt: 'The CastleLeaf building in Brighton', pos: 'center 55%' },
  })}
<section class="band band--cream p-towns-band" aria-labelledby="p-towns-h" data-filter-scope>
<div class="wrap">
${head({ kicker: `${towns.length} towns and neighbourhoods`, h: 'Find your <em class="accent">town</em>', id: 'p-towns-h' })}
<ul class="p-chips" role="list" data-filter-group aria-label="Filter towns by first letter">
<li><button class="chip p-chip" type="button" data-filter="all" aria-pressed="true">All</button></li>
${letters.map((l) => `<li><button class="chip p-chip" type="button" data-filter="${escA(l.toLowerCase())}" aria-pressed="false">${esc(l)}</button></li>`).join('')}
</ul>
<ul class="p-towns" role="list">
${towns.map((t) => `<li class="p-town" data-filter-item data-tags="${escA(t.town[0].toLowerCase())}"><a class="p-town__link"${linkAttrs(t.r.path)}><h3 class="p-town__h"><span class="p-town__pre">${esc(t.pre)}</span> <span class="p-town__name">${esc(t.town)}, MA ${esc(t.zip)}</span></h3><span class="p-town__cta">Shop Now${icon('arrow')}</span></a></li>`).join('\n')}
</ul>
<p class="p-empty" data-filter-empty hidden>No town under that letter.</p>
</div>
</section>`;
  return out(ctx, rec, { path: '/recreational/', main, crumbs: [['/', 'Home'], ['/recreational/', 'Recreational Geo']], bodyClass: 'p-rec-hub' });
}
function townPage(ctx, rec) {
  const L = flat(rec);
  const at = (pred, from = 0) => { for (let i = from; i < L.length; i++) if (pred(L[i])) return i; return -1; };
  const h2At = (re, from = 0) => at((b) => b.t === 'h2' && re.test(txt(b.html)), from);
  const lab = townLabel(rec);
  const sub = L[at((b) => b.t === 'h2')];
  const recMenu = linksOf(L.find((b) => b.t === 'links'))[0];
  const iCat = h2At(/Shop By Category/);
  const catGrid = L[at((b) => b.t === 'grid', iCat)];
  const iArea = h2At(/Area Recreational/);
  const areaPs = [];
  for (let i = iArea + 1; i < L.length && L[i].t === 'p'; i++) areaPs.push(L[i]);
  const iVal = h2At(/We Value Our/);
  const valP = L[at((b) => b.t === 'p', iVal)];
  const iRating = at((b) => b.t === 'text', iVal);
  const ratingTexts = [];
  for (let i = iRating; i >= 0 && i < L.length && L[i].t === 'text'; i++) ratingTexts.push(L[i].html);
  const readAll = linksOf(L[at((b) => b.t === 'links', iVal)])[0];
  const iEv = h2At(/Upcoming Events/);
  const evH3 = L[at((b) => b.t === 'h3', iEv)];
  const evLinks = L[at((b) => b.t === 'links', iEv)];
  const iOff = h2At(/Shop Offers/);
  const offers = offersOf(L.slice(iOff));
  const allOffers = L.slice(iOff).find((b) => b.t === 'links' && /Shop All Offers/.test(JSON.stringify(b)));
  const iHow = h2At(/How To Shop/);
  const howP = L[at((b) => b.t === 'p', iHow)];
  const newTo = linksOf(L[at((b) => b.t === 'links', iHow)])[0];
  const iEff = h2At(/Shop By Effect/);
  const effGrid = L[at((b) => b.t === 'grid', iEff)];
  const place = `${lab.town}, MA ${lab.zip}`.trim();
  const crumbs = [['/', 'Home'], ['/recreational/', 'Recreational'], [rec.path, place]];
  const main = `${hero(ctx, {
    kicker: 'Near you', h1Html: accent(rec.h1, place), sub: sub ? H(sub.html) : '',
    lede: `${esc(ctx.site.longName)}, ${esc(ctx.site.address.full)}.`,
    crumbs,
    cta: `${recMenu ? btn(liveHref(recMenu.href), recMenu.html) : ''}${btn(ctx.site.directions, 'Directions', 'btn btn--ghost')}`,
    media: { photo: 'cl/CL-Image-Hero.webp', alt: 'The CastleLeaf building in Brighton', pos: 'center 55%' },
  })}
<section class="band band--cream p-town-intro" aria-labelledby="p-area-h">
<div class="wrap p-town-grid">
<div class="p-town-text">
<p class="kicker" data-reveal>${esc(ctx.site.address.neighbourhood)}</p>
<h2 class="display p-head__h" id="p-area-h" data-reveal style="--i:1">${H(L[iArea] && L[iArea].html)}</h2>
<div class="prose" data-reveal style="--i:2">${areaPs.map((p) => `<p>${H(p.html)}</p>`).join('')}</div>
</div>
<article class="glass glass--strong p-town-value" data-spot data-reveal style="--i:2">
<h2 class="tile__title">${H(L[iVal] && L[iVal].html)}</h2>
<p class="tile__text">${H(valP && valP.html)}</p>
<p class="p-town-rating"><span class="p-town-rating__g">Google</span> ${ratingTexts.map((t) => `<span>${H(t)}</span>`).join(' ')}</p>
${readAll ? arrowLink(liveHref(readAll.href), readAll.html) : ''}
</article>
</div>
</section>
<section class="band band--sage p-cat-band" aria-labelledby="p-tcat-h">
<div class="wrap">
${head({ kicker: 'The live menu', h: H(L[iCat] && L[iCat].html), id: 'p-tcat-h' })}
${catCards(ctx, catGrid)}
</div>
</section>
<section class="band band--linen p-how-band" aria-labelledby="p-thow-h">
${tex('haze')}
<div class="wrap">
${head({ kicker: 'Pick up or delivery', h: H(L[iHow] && L[iHow].html), lede: H(howP && howP.html), id: 'p-thow-h' })}
${waysBento(ctx)}
${newTo ? `<p class="p-more">${arrowLink(liveHref(newTo.href), newTo.html, 'btn btn--ghost')}</p>` : ''}
</div>
</section>
<section class="band band--cream p-offer-band" aria-labelledby="p-toff-h">
<div class="wrap">
${head({ kicker: 'Bundles', h: H(L[iOff] && L[iOff].html), id: 'p-toff-h' })}
${offerTiles(offers)}
${allOffers ? `<p class="p-more">${linksOf(allOffers).map((l) => btn(liveHref(l.href), l.html, 'btn btn--copper')).join('')}</p>` : ''}
</div>
</section>
<section class="band band--linen p-eff-band" aria-labelledby="p-teff-h">
<div class="wrap">
${head({ kicker: 'How do you want to feel?', h: H(L[iEff] && L[iEff].html), id: 'p-teff-h' })}
${effectCards(ctx, effGrid)}
<div class="p-town-events">${eventsTile(ctx, L[iEv], evH3, evLinks)}</div>
</div>
</section>`;
  return out(ctx, rec, { path: rec.path, main, crumbs, bodyClass: 'p-town' });
}

// ---------------------------------------------------------------- reading pages (jobs, advertising, legal)
// Bold-only paragraphs on the legal pages are the client's section headings: they become real headings (same words), with ids
// for the small table of contents.
function readingBlocks(L) {
  const toc = [];
  const used = new Set();
  const idFor = (t) => { let base = 'p-' + slugify(t).slice(0, 48) || 'p-sec'; let id = base; let n = 2; while (used.has(id)) id = `${base}-${n++}`; used.add(id); return id; };
  const list = [];
  for (const b of L) {
    if (!b || b.t === 'h1' || b.t === 'svg' || b.t === 'hidden' || b.t === 'img') continue;
    if ((b.t === 'h2' || b.t === 'h3') && txt(b.html)) { const id = idFor(txt(b.html)); toc.push({ id, label: txt(b.html), lvl: b.t }); list.push({ ...b, id }); continue; }
    if (b.t === 'p') {
      const m = /^\s*<strong>([^<]+)<\/strong>\s*(?:<br\s*\/?>\s*([\s\S]*))?$/i.exec(b.html || '');
      if (m && txt(m[1]).length < 90) {
        const id = idFor(txt(m[1]));
        toc.push({ id, label: txt(m[1]), lvl: 'h2' });
        list.push({ t: 'h2', html: m[1], id });
        if (m[2] && txt(m[2])) list.push({ t: 'p', html: m[2] });
        continue;
      }
    }
    list.push(b);
  }
  return { list: prep(list), toc };
}
function readingPage(ctx, slug, { path, kicker, accentWord, crumbLabel, intro = '', media = '', cta = null, drop = () => false, extra = '' }) {
  const rec = ctx.content[slug];
  const L = flat(rec).filter((b) => !drop(b));
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const body = L.filter((b) => b !== sub);
  const { list, toc } = readingBlocks(body);
  const tocHtml = toc.length > 2 ? `<nav class="p-toc glass glass--strong" aria-label="On this page"><p class="kicker">On this page</p><ol>${toc.map((t) => `<li class="p-toc__${t.lvl}"><a href="#${escA(t.id)}">${esc(t.label)}</a></li>`).join('')}</ol></nav>` : '';
  const main = `${hero(ctx, {
    kicker, h1Html: accent(rec.h1, accentWord), sub: sub ? H(sub.html) : '', lede: intro,
    crumbs: [['/', 'Home'], [path, crumbLabel]], cta, media,
  })}
<section class="band band--linen p-read-band" aria-label="${escA(crumbLabel)}">
<div class="wrap p-read${tocHtml ? '' : ' p-read--solo'}">
${tocHtml ? `<aside class="p-read__aside">${tocHtml}</aside>` : ''}
<div class="p-read__body glass glass--strong">${extra}${blocks(list, ctx)}</div>
</div>
</section>`;
  return out(ctx, rec, { path, main, crumbs: [['/', 'Home'], [path, crumbLabel]], bodyClass: 'p-reading' });
}
function jobs(ctx) {
  const rec = ctx.content.jobs;
  const L = flat(rec);
  const sub = L.find((b) => b.t === 'h2' && SUBRE.test(txt(b.html)));
  const join = L.find((b) => b.t === 'h2' && /Join Our Team/i.test(txt(b.html)));
  const p = L.find((b) => b.t === 'p');
  const indeed = linksOf(L.find((b) => b.t === 'links' && /indeed/i.test(JSON.stringify(b))))[0];
  const main = `${hero(ctx, {
    kicker: 'Careers', h1Html: accent(rec.h1, 'Jobs'), sub: sub ? H(sub.html) : '',
    crumbs: [['/', 'Home'], ['/jobs/', 'Jobs']],
    cta: indeed ? `${btn(indeed.href, indeed.html)}` : null,
    media: { photo: 'cl/CL-Image-Hero.webp', alt: 'The CastleLeaf building in Brighton', pos: 'center 55%' },
  })}
<section class="band band--cream p-jobs" aria-labelledby="p-join-h">
<div class="wrap p-split">
<div class="p-split__text">
<p class="kicker" data-reveal>Purveyors wanted</p>
<h2 class="display p-head__h" id="p-join-h" data-reveal style="--i:1">${H(join && join.html)}</h2>
<div class="prose" data-reveal style="--i:2"><p>${H(p && p.html)}</p></div>
${indeed ? `<p class="btn-row" data-reveal style="--i:3">${btn(indeed.href, indeed.html, 'btn btn--copper')}${btn('/about/', 'About CastleLeaf', 'btn btn--ghost')}</p>` : ''}
</div>
<figure class="frame p-jobs__team" data-reveal="wipe">${photo(ctx, 'cl/CL-Team.webp', { alt: 'The CastleLeaf team in front of the store', cls: 'frame__img', sizes: '(min-width: 1024px) 560px, 92vw' })}</figure>
</div>
</section>`;
  return out(ctx, rec, { path: '/jobs/', main, crumbs: [['/', 'Home'], ['/jobs/', 'Jobs']], bodyClass: 'p-jobs-page' });
}
function advertising(ctx) {
  const rec = ctx.content['advertising-with-us'];
  const L = flat(rec).filter((b) => b.t !== 'hidden' && b.t !== 'svg' && b.t !== 'img');
  const kick = L.find((b) => b.t === 'h2');
  const start = linksOf(L.find((b) => b.t === 'links'))[0];
  const i1 = L.findIndex((b) => b.t === 'h2' && /Where New Customers/i.test(txt(b.html)));
  const p1 = L[i1 + 1];
  const h3list = L[i1 + 2];
  const places = [];
  for (let i = i1 + 3; i < L.length && L[i].t === 'p'; i++) places.push(L[i]);
  const iAdv = L.findIndex((b) => b.t === 'h2' && /Advantages/i.test(txt(b.html)));
  const adv = [];
  for (let i = iAdv + 1; i < L.length && L[i].t !== 'h2'; i++) if (L[i].t === 'h3' && L[i + 1] && L[i + 1].t === 'p') { adv.push({ h: L[i].html, p: L[i + 1].html }); i++; }
  const iPart = L.findIndex((b) => b.t === 'h2' && /Partnership/i.test(txt(b.html)));
  const partP = L[iPart + 1];
  const figs = L.slice(iPart + 2).filter((b) => b.t === 'h3').slice(0, 3);
  const ul = L.find((b) => b.t === 'ul');
  const iReady = L.findIndex((b) => b.t === 'h2' && /Ready To Reach/i.test(txt(b.html)));
  const readyP = L[iReady + 1];
  const figImg = ['g-feature-vip', 'g-feature-deli', 'g-feature-kiosk'];
  const advIco = ['user', 'sparkle', 'tag', 'clock', 'star'];
  const main = `${hero(ctx, {
    kicker: 'For brands', h1Html: accent(rec.h1, 'CastleLeaf'), sub: kick ? H(kick.html) : '',
    crumbs: [['/', 'Home'], ['/advertising-with-us/', 'Advertising With Us']],
    cta: start ? btn('#advertising', start.html) : null,
    media: { gimg: 'g-feature-kiosk', alt: '' },
  })}
<section class="band band--cream p-ad-intro" aria-labelledby="p-ad1-h">
<div class="wrap p-split">
<div class="p-split__text">
<h2 class="display p-head__h" id="p-ad1-h" data-reveal>${H(L[i1] && L[i1].html)}</h2>
<div class="prose" data-reveal style="--i:1"><p>${H(p1 && p1.html)}</p></div>
</div>
<div class="glass glass--strong p-ad-places" data-spot data-reveal style="--i:2">
<h3 class="tile__title">${H(h3list && h3list.html)}</h3>
<ul class="p-ad-places__list">${places.map((x) => `<li>${icon('crown')}<span>${H(x.html)}</span></li>`).join('')}</ul>
</div>
</div>
</section>
<section class="band band--sage p-ad-adv" aria-labelledby="p-adv-h">
<div class="wrap">
${head({ kicker: 'Why here', h: H(L[iAdv] && L[iAdv].html), id: 'p-adv-h' })}
<div class="bento p-advs">${adv.map((a, i) => `<article class="tile glass glass--lift p-adv${i === 0 ? ' tile--wide' : ''}" data-spot data-reveal style="--i:${i % 4}"><span class="p-help__ico" aria-hidden="true">${icon(advIco[i] || 'sparkle')}</span><h3 class="tile__title">${H(a.h)}</h3><p class="tile__text">${H(a.p)}</p></article>`).join('\n')}</div>
</div>
</section>
<section class="band band--linen p-ad-part" aria-labelledby="p-part-h">
<div class="wrap">
${head({ kicker: 'Placements', h: H(L[iPart] && L[iPart].html), lede: H(partP && partP.html), id: 'p-part-h' })}
<div class="p-ad-figs">${figs.map((f, i) => `<article class="tile tile--photo p-ad-fig" data-reveal style="--i:${i}"><span class="tile__media">${gimg(figImg[i], { alt: '', sizes: '(min-width: 1024px) 380px, 92vw' })}</span><h3 class="tile__title">${H(f.html)}</h3></article>`).join('\n')}</div>
${ul ? `<ul class="p-ad-list" role="list">${(ul.items || []).map((x) => `<li class="chip glass">${H(typeof x === 'string' ? x : x.html)}</li>`).join('')}</ul>` : ''}
</div>
</section>
<section class="band band--gold p-ad-ready" id="advertising" aria-labelledby="p-ready-h">
${tex('leaf')}
<div class="wrap p-ad-ready__inner">
<h2 class="display p-head__h" id="p-ready-h">${H(L[iReady] && L[iReady].html)}</h2>
<p class="lede">${H(readyP && readyP.html)}</p>
<p class="btn-row">${btn('/contact/', 'Contact us')}${btn(mailto(ctx), esc(ctx.site.email), 'btn btn--ghost')}</p>
${start ? `<p class="p-ad-start"><a class="link-arrow" href="#advertising">${start.html}${icon('arrow')}</a></p>` : ''}
</div>
</section>`;
  return out(ctx, rec, { path: '/advertising-with-us/', main, crumbs: [['/', 'Home'], ['/advertising-with-us/', 'Advertising With Us']], bodyClass: 'p-ad' });
}

// ---------------------------------------------------------------- render
export async function render(ctx) {
  const outp = [];
  const C = ctx.content || {};
  const tryOne = (name, fn) => { try { const r = fn(); if (r) outp.push(r); } catch (e) { console.warn(`pages: ${name} failed: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`); } };
  if (C['book-a-budtender']) tryOne('book-a-budtender', () => bookBudtender(ctx));
  if (C.about) tryOne('about', () => about(ctx));
  if (C.contact) tryOne('contact', () => contact(ctx));
  if (C.faqs) tryOne('faqs', () => faqs(ctx));
  if (C['stores__brighton-ma']) tryOne('brighton', () => brighton(ctx));
  if (C.stores) tryOne('stores', () => stores(ctx));
  if (C.directions) tryOne('directions', () => directionsPage(ctx));
  if (C.reviews) tryOne('reviews', () => reviewsPage(ctx));
  if (C.recreational) tryOne('recreational', () => recreationalHub(ctx));
  for (const r of townRecs(ctx)) tryOne(r.path, () => townPage(ctx, r));
  if (C.jobs) tryOne('jobs', () => jobs(ctx));
  if (C['advertising-with-us']) tryOne('advertising', () => advertising(ctx));
  if (C.accessibility) tryOne('accessibility', () => readingPage(ctx, 'accessibility', { path: '/accessibility/', kicker: 'For everyone', accentWord: 'Accessibility', crumbLabel: 'Accessibility' }));
  if (C['privacy-policy']) tryOne('privacy', () => readingPage(ctx, 'privacy-policy', { path: '/privacy-policy/', kicker: 'Legal', accentWord: 'Policy', crumbLabel: 'Privacy Policy' }));
  if (C['terms-of-use']) tryOne('terms', () => readingPage(ctx, 'terms-of-use', { path: '/terms-of-use/', kicker: 'Legal', accentWord: 'Use', crumbLabel: 'Terms of Use' }));
  return outp;
}
