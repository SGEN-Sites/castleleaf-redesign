// shop.mjs: SHOP lane (docs/BUILD-CONTRACT.md section 6), "Lantern Keep" shop pages:
//   /delivery/                  the local delivery showcase (client lines, steps + FAQ from ctx.resources.delivery, other ways to shop)
//   /shop/                      hub: the 8 categories as a bento of rounded cat-cards (generated tenebrist series + client photo chip), Flower Deli tile
//   /products/<slug>/ x 8       hero frame, ctx.glue[slug] sections + tip + FAQ, #flower-deli on flower, articles, other categories
//   /specials/ + 6 bundle pages every captured word; bundles as a glass bento; the client's daily-deal banners in a framed rotator
//   /420-deals/, /green-wednesday-deals/   every captured word; generated features instead of the vendor images
//   /loyalty-sign-up/           the VIP Club: site.vip words, a demo form (Name, Email, Phone), nothing about points or tiers
// New words here are neutral glue only (contract D2). Lane classes are prefixed s-.
import { esc, escA, linkAttrs, gimg, photo, absUrl, menu, rewriteLinks, liveHref, stripTags, demoForm } from './util.mjs';
import { page, pageHero, blocks, icon, bandBg, goldAccent } from './shell.mjs';

const NAME = ' | CastleLeaf';

// ---------- small pieces ----------
const rw = (h) => rewriteLinks(h || '');
const plain = (h) => stripTags(String(h || '')).replace(/\s+/g, ' ').trim();
const isExt = (u) => /^https?:/i.test(String(u));
const ico = (n, cls = '') => { try { return icon(n, cls); } catch { return ''; } };
const btn = (u, label, cls = 'btn btn--primary') => `<a class="${cls}"${linkAttrs(u)}>${esc(label)}${isExt(u) ? ico('ext') : ico('arrow')}</a>`;
const kicker = (t, cls = '') => (t ? `<p class="kicker${cls ? ' ' + cls : ''}" data-reveal>${esc(t)}</p>` : '');
// one italic word per heading (index: 0 = first word, -1 = last word); the words themselves never change
function accent(t, at = -1) {
  const w = String(t || '').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  const i = at < 0 ? w.length + at : Math.min(at, w.length - 1);
  return w.map((x, k) => (k === i ? `<em class="accent">${esc(x)}</em>` : esc(x))).join(' ');
}
// a band paints above the band after it, so a hero frame or a pop-out crosses the seam (contract section 3)
const band = ({ tone = 'linen', cls = '', z = 1, clip = '', inner = '', id = '', label = '' }) => `<section class="band band--${tone} s-band${cls ? ' ' + cls : ''}"${id ? ` id="${escA(id)}"` : ''}${label ? ` aria-labelledby="${escA(label)}"` : ''} style="z-index:${z}">
${clip}
${inner}
</section>`;
const clipOf = (...layers) => `<div class="band__clip" aria-hidden="true">${layers.join('')}</div>`;
const pool = (kind, cls = '') => `<span class="s-pool s-pool--${kind}${cls ? ' ' + cls : ''}"></span>`;
const leafArt = (cls = '') => `<span class="s-leafart${cls ? ' ' + cls : ''}"></span>`;
// a texture ground (revision 1, R3) with the lane's own veil, inside the band's clip (a missing id leaves the token ground)
const tex = (id, kind, extra = '') => clipOf(gimg(id, { alt: '', cls: `band__bg s-tex s-tex--${kind}`, sizes: '(max-width: 720px) 720px, 100vw' }), `<span class="s-veil s-veil--${kind}"></span>`, extra);
const arch = (inner, cls = '', depth = '') => `<figure class="arch-frame s-arch${cls ? ' ' + cls : ''}"${depth ? ` data-depth="${depth}"` : ''}>${inner}</figure>`;
const frame = (inner, cls = '', depth = '') => `<figure class="frame s-frame${cls ? ' ' + cls : ''}"${depth ? ` data-depth="${depth}"` : ''}>${inner}</figure>`;
// the inner hero's frame (a rounded rectangle since revision 1), in the shell's own classes (pageHero wraps it in .page-hero__media, which carries the parallax)
const heroArt = (pic, extra = '') => `<figure class="arch-frame page-hero__frame s-heroframe" data-reveal="arch">${pic}</figure>${extra}`;
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((it) => ({ '@type': 'Question', name: plain(it.q), acceptedAnswer: { '@type': 'Answer', text: plain(it.a_html) } })) });

function out(ctx, { path: p, title, description, crumbs = [], bodyClass = '', main, jsonld = [] }) {
  return { path: p, html: page({ ctx, path: p, title, description, canonical: absUrl(ctx, p), crumbs, heroCrumbs: true, bodyClass: `page-shop ${bodyClass}`.trim(), main, og: { title, description, type: 'website', url: absUrl(ctx, p) }, jsonld }) };
}

// pageHero(): the contract documents `cta`; the stub takes one { href, label }, a full shell may take a list. Ask once.
let MULTI_CTA = null;
function heroCta(ctx, list) {
  const l = list.filter(Boolean);
  if (!l.length) return null;
  if (MULTI_CTA === null) {
    try { const t = pageHero({ ctx, h1Html: 'x', cta: [{ href: '#s-cta-a', label: 'A' }, { href: '#s-cta-b', label: 'B' }] }); MULTI_CTA = t.includes('#s-cta-a') && t.includes('#s-cta-b'); } catch { MULTI_CTA = false; }
  }
  return MULTI_CTA ? l : l[0];
}
// The inner hero: the rounded frame is the media; the band right after it carries the overhang.
const hero = (ctx, { cta = [], ...o }) => pageHero({ ctx, tone: 'linen', ...o, cta: heroCta(ctx, [].concat(cta)) });

// ---------- content helpers ----------
const sectionsOf = (res) => (res && Array.isArray(res.sections) ? res.sections : []);
const typeOf = (b) => (b && (b.type || b.t)) || '';
const blocksOf = (s, ...types) => ((s && s.blocks) || []).filter((b) => types.includes(typeOf(b)));
const faqsIn = (res) => sectionsOf(res).flatMap((s) => blocksOf(s, 'faq').flatMap((b) => b.items || []));
const stepsIn = (res) => sectionsOf(res).flatMap((s) => blocksOf(s, 'steps').flatMap((b) => b.items || []));
const isOnly = (s, ...types) => (s.blocks || []).length > 0 && (s.blocks || []).every((b) => types.includes(typeOf(b)));

// prose: every block except what a designed slot lifts out goes through the shell's blocks()
function prose(ctx, list, skip = ['steps', 'faq']) {
  const rest = (list || []).filter((b) => !skip.includes(typeOf(b)));
  return rest.length ? `<div class="prose s-prose">${blocks(rest, ctx)}</div>` : '';
}
function stepsHtml(items) {
  return `<ol class="steps s-steps">${items.map((it, i) => {
    const title = typeof it === 'string' ? '' : it.title || it.heading || '';
    const raw = typeof it === 'string' ? it : it.html || it.text || '';
    const body = /<[a-z]/i.test(raw) ? rw(raw) : esc(raw);
    return `<li class="step s-step" data-reveal style="--i:${i}"><span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${title ? `<h3 class="step__title">${esc(title)}</h3>` : ''}${body ? `<div class="step__text">${body}</div>` : ''}</li>`;
  }).join('')}</ol>`;
}
function faqHtml(items, { open = true } = {}) {
  return `<div class="faq s-faq" data-faq>${items.map((it, i) => `<details${open && i === 0 ? ' open' : ''}><summary><span class="s-faq__q">${esc(plain(it.q))}</span>${ico('plus', 'faq__ico')}</summary><div class="faq__a">${rw(it.a_html || it.a || '')}</div></details>`).join('\n')}</div>`;
}
// a captured FAQ entry from the client's FAQ page, by its question (verbatim question and answer)
function clientFaq(ctx, q) {
  const walk = (list) => {
    for (const b of list || []) {
      if (typeOf(b) === 'details' && plain(b.summary) === q) return { q: plain(b.summary), a_html: blocks(b.blocks || [], ctx) };
      const hit = b.blocks && walk(b.blocks);
      if (hit) return hit;
    }
    return null;
  };
  return walk(sectionsOf(ctx.content.faqs).flatMap((s) => s.blocks || []));
}
const catBy = (ctx, slug) => ctx.site.categories.find((c) => c.slug === slug);

// ---------- cards ----------
function acard(p, i) {
  const pic = String(p.image || '').startsWith('g-') ? gimg(p.image, { alt: '', sizes: '(min-width: 1024px) 380px, 78vw' }) : '';
  const meta = [Array.isArray(p.categories) ? '' : p.category, p.readTime].filter(Boolean).map(esc).join(' · ');
  return `<li class="s-reads__item" data-reveal style="--i:${i}"><article class="acard s-acard">
<span class="acard__media s-acard__media" aria-hidden="true">${pic}</span>
${meta ? `<p class="acard__meta">${meta}</p>` : ''}
<h3 class="acard__title"><a${linkAttrs(p.path || `/blog/${p.slug}/`)}>${esc(p.h1 || p.title)}</a></h3>
<span class="acard__more">Read the article${ico('arrow')}</span>
</article></li>`;
}
function readsBand(ctx, posts, { tone = 'linen', z = 3 } = {}) {
  if (!posts.length) return '';
  return band({ tone, z, cls: 's-reads', label: 's-reads-h', inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('From the blog')}<h2 class="display s-h2" id="s-reads-h" data-reveal style="--i:1">Worth a <em class="accent">read</em></h2></div><a class="link-arrow s-head__all"${linkAttrs('/blog/')}>All articles${ico('arrow')}</a></div>
<ul class="s-reads__list s-swipe" role="list">${posts.map(acard).join('\n')}</ul>
</div>` });
}
// a category card (hub bento and swipe rows): the generated still life, the client's own small photo as a chip
function catCard(ctx, c, i, { sizes = '(min-width: 1024px) 30vw, 70vw', cls = '' } = {}) {
  return `<li class="s-cats__item s-cats__item--${escA(c.slug)}${cls ? ' ' + cls : ''}">
<a class="cat-card s-cat"${linkAttrs(`/products/${c.slug}/`)} data-reveal style="--i:${i % 4}">
<span class="cat-card__media s-cat__media">${gimg(c.gimg, { alt: '', sizes, cls: 's-cat__img' })}<span class="s-cat__chip" aria-hidden="true">${photo(ctx, c.photo, { alt: '', sizes: '80px' })}</span></span>
<span class="cat-card__title s-cat__title">${esc(c.label)}</span>
<span class="cat-card__cta s-cat__cta">Explore${ico('arrow')}</span>
</a></li>`;
}
function otherCats(ctx, slug, { tone = 'cream', z = 2 } = {}) {
  const list = ctx.site.categories.filter((c) => c.slug !== slug);
  return band({ tone, z, cls: 's-others', label: 's-others-h', clip: clipOf(pool('sage', 's-pool--tl')), inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('Keep exploring')}<h2 class="display s-h2" id="s-others-h" data-reveal style="--i:1">More <em class="accent">categories</em></h2></div><a class="link-arrow s-head__all"${linkAttrs('/shop/')}>All categories${ico('arrow')}</a></div>
<ul class="s-others__row s-swipe" role="list">${list.map((c, i) => catCard(ctx, c, i, { sizes: '(min-width: 1024px) 220px, 46vw', cls: 's-cats__item--mini' })).join('\n')}</ul>
</div>` });
}
// the closing band: the page's one dark stage (night, lantern, the gallery niche)
function shopBand(ctx, { h2 = 'Ready when you <em class="accent">are</em>', line = '', primary, secondary, z = 1, id = 's-shop-h' } = {}) {
  return band({ tone: 'night', z, cls: 's-close band--haze-top', label: id, clip: clipOf(`<div class="band__bg s-close__bg">${gimg('g-stage-gallery', { alt: '', sizes: '100vw', cls: 'band__bg-img' })}</div>`, '<span class="s-close__lantern" data-lantern></span>'), inner: `<div class="wrap s-close__wrap">
<span class="s-close__mark" aria-hidden="true">${photo(ctx, 'cl/CL-Favicon.webp', { alt: '', sizes: '72px' })}</span>
<h2 class="display s-close__h" id="${id}" data-reveal>${h2}</h2>
${line ? `<p class="lede s-close__line" data-reveal style="--i:1">${line}</p>` : ''}
<div class="btn-row s-close__btns" data-reveal style="--i:2">${primary || btn(menu(ctx), 'Shop Menu', 'btn btn--copper')}${secondary || ''}</div>
</div>` });
}

// ---------- /delivery/ ----------
function renderDelivery(ctx) {
  const s = ctx.site;
  const res = ctx.resources.delivery || null;
  const p = '/delivery/';
  const crumbs = [{ label: 'Home', href: '/' }, { label: s.delivery.title }];
  const ways = Object.fromEntries(s.ways.items.map((w) => [w.key, w]));
  const secs = sectionsOf(res);
  const secHow = secs.find((x) => blocksOf(x, 'steps').length) || null;
  const secFaq = secs.find((x) => blocksOf(x, 'faq').length) || null;
  const secWays = secs.find((x) => x !== secHow && x !== secFaq) || null;
  const steps = stepsIn(res);
  const faq = [...faqsIn(res), clientFaq(ctx, 'What do I need to make a purchase? Form of ID?'), clientFaq(ctx, 'I am from out of state. Can I make a purchase at CastleLeaf?')]
    .filter(Boolean).filter((it, i, a) => a.findIndex((x) => plain(x.q) === plain(it.q)) === i);
  // the client's own order line, "Order Online" linked to its live menu as on its FAQ
  const orderLine = esc(s.delivery.orderLine).replace(/^Order Online/, `<a${linkAttrs(menu(ctx))}>Order Online</a>`);
  const media = heroArt(gimg('g-feature-delivery', { sizes: '(min-width: 1024px) 38vw, 84vw', eager: true, cls: 'frame__img' }), `<p class="page-hero__chip glass s-heroart__note">${ico('truck', 's-heroart__noteico')}<span>${esc(s.delivery.orderLine)}</span></p>`);
  const how = band({ tone: 'cream', z: 5, cls: 's-after-hero s-dhow', label: 's-dhow-h', clip: tex('g-tex-gold-haze', 'haze'), inner:`<div class="wrap s-dhow__grid">
<div class="s-dhow__text">
${kicker('How it works')}
<h2 class="display s-h2" id="s-dhow-h" data-reveal style="--i:1">${secHow && secHow.heading ? accent(secHow.heading) : 'Straight to your <em class="accent">door</em>'}</h2>
<p class="s-bigline" data-reveal style="--i:2">${esc(s.delivery.line)}</p>
<p class="s-orderline" data-reveal style="--i:3">${ico('truck', 's-orderline__ico')}<span>${orderLine}</span></p>
${secHow ? `<div data-reveal style="--i:4">${prose(ctx, secHow.blocks)}</div>` : ''}
<div class="btn-row" data-reveal style="--i:5">${btn(menu(ctx), 'Shop Menu')}${btn(menu(ctx), 'Order Online', 'btn btn--ghost')}</div>
</div>
<div class="glass glass--strong s-dhow__pane" data-reveal data-spot>
${steps.length ? stepsHtml(steps) : `<ul class="s-buylist" role="list">${s.ways.buyOptions.reduce((acc, x) => (/^\(/.test(x) && acc.length ? (acc[acc.length - 1] += ' ' + x, acc) : acc.concat([x])), []).map((x, i) => `<li data-reveal style="--i:${i}">${ico('leaf')}<span>${esc(x)}</span></li>`).join('')}</ul>`}
</div>
</div>` });
  const faqBand = faq.length ? band({ tone: 'sage', z: 4, cls: 's-dfaq', label: 's-dfaq-h', clip: clipOf(pool('cream', 's-pool--top'), leafArt('s-leafart--br')), inner: `<div class="wrap s-dfaq__grid">
<div class="s-dfaq__head">${kicker('Before you order')}<h2 class="display s-h2" id="s-dfaq-h" data-reveal style="--i:1">${secFaq && secFaq.heading ? accent(secFaq.heading) : 'Good to <em class="accent">know</em>'}</h2><p class="s-dfaq__more" data-reveal style="--i:2"><a class="link-arrow"${linkAttrs('/faqs/')}>All FAQs${ico('arrow')}</a></p></div>
<div class="s-dfaq__list" data-reveal style="--i:2">${faqHtml(faq)}</div>
</div>` }) : '';
  // other ways to shop: a budtender (big, the operator's "Highly educated budtenders"), pick-up, the in-store kiosk
  const tile = (w, { cls = '', img = '', kick = '' }) => `<li class="s-ways__item ${cls}"><article class="tile glass glass--lift s-way${img ? ' s-way--media' : ''}" data-spot data-reveal>
${img ? `<span class="s-way__media">${img}</span>` : ''}
<div class="s-way__body">${kick ? `<p class="kicker s-way__kick">${esc(kick)}</p>` : ''}<h3 class="s-way__title">${esc(w.title)}</h3><p class="s-way__line">${esc(w.line)}</p>
<a class="link-arrow s-way__cta"${linkAttrs(w.href === 'menu' ? menu(ctx) : w.href === 'directions' ? s.directions : w.href)}>${esc(w.cta)}${ico(w.href === 'menu' ? 'ext' : 'arrow')}</a></div>
</article></li>`;
  const waysPs = secWays ? blocksOf(secWays, 'p') : [];
  const waysBand = band({ tone: 'linen', z: 3, cls: 's-ways', label: 's-ways-h', clip: clipOf(pool('sage', 's-pool--tl'), pool('copper', 's-pool--br')), inner: `<div class="wrap">
<div class="s-head">${kicker('More ways in')}<h2 class="display s-h2" id="s-ways-h" data-reveal style="--i:1">${secWays && secWays.heading ? accent(secWays.heading) : 'Other ways to <em class="accent">shop</em>'}</h2><p class="s-head__line" data-reveal style="--i:2">${waysPs[0] ? rw(waysPs[0].html) : esc(s.ways.intro)}</p></div>
<ul class="s-ways__grid" role="list">
${tile(ways.budtender, { cls: 's-ways__item--big', kick: s.budtenders.operatorClaim, img: gimg('g-feature-budtender', { alt: '', sizes: '(min-width: 1024px) 46vw, 84vw', cls: 's-way__img' }) })}
${tile(ways.online, { cls: 's-ways__item--pickup' })}
${tile(ways.kiosk, { cls: 's-ways__item--kiosk', img: gimg('g-feature-kiosk', { alt: '', sizes: '(min-width: 1024px) 24vw, 84vw', cls: 's-way__img' }) })}
</ul>
${waysPs.length > 1 ? `<p class="s-ways__foot" data-reveal>${ico('pin', 's-ways__pin')}<span>${rw(waysPs[waysPs.length - 1].html)}</span></p>` : ''}
</div>` });
  const main = `${hero(ctx, { kicker: (res && res.kicker) || 'Shop from home', h1Html: 'Local <em class="accent">Delivery</em>', lede: esc((res && res.lede) || s.delivery.line), crumbs, cta: [{ href: menu(ctx), label: 'Shop Menu' }, { href: '#s-dhow-h', label: 'How it works' }], media, tone: 'linen', cls: 's-hero s-hero--delivery' })}
${how}
${faqBand}
${waysBand}
${shopBand(ctx, { h2: 'Order from <em class="accent">home</em>', line: orderLine })}`;
  return out(ctx, { path: p, title: (res && res.title) || `${s.delivery.title}${NAME}`, description: (res && res.description) || `${s.delivery.line}. ${s.delivery.orderLine}.`, crumbs, bodyClass: 'page-delivery', main, jsonld: faq.length ? [faqLd(faq)] : [] });
}

// ---------- /shop/ ----------
function renderHub(ctx) {
  const s = ctx.site;
  const res = ctx.resources.shop || null;
  const p = '/shop/';
  const title = (res && res.h1) || 'Shop By Category';
  const crumbs = [{ label: 'Home', href: '/' }, { label: title }];
  const media = heroArt(photo(ctx, 'cl/CL-Image-SEO.webp', { alt: "CastleLeaf's shop wall: copper-coloured shelves labelled Vapes, Concentrates and Edibles above the glass jar counter", sizes: '(min-width: 1024px) 34vw, 84vw', eager: true, cls: 'frame__img' }));
  const deli = `<a class="tile tile--pop glass s-deli"${linkAttrs('/products/flower/#flower-deli')} data-spot data-reveal>
<span class="tile__pop s-deli__pop" aria-hidden="true">${gimg('g-cut-jar', { alt: '', sizes: '(min-width: 1024px) 260px, 40vw' })}</span>
<span class="tile__body s-deli__body">
<span class="kicker s-deli__kick">${esc(s.flowerDeli.counter)}</span>
<span class="s-deli__title">${esc(s.flowerDeli.label)}</span>
<span class="s-deli__line">${esc(s.flowerDeli.deal)}</span>
<span class="s-deli__deal">${esc(s.flowerDeli.dealLine)}</span>
<span class="link-arrow s-deli__cta">Visit the deli${ico('arrow')}</span>
</span>
</a>`;
  const SIZES = { flower: '(min-width: 1024px) 46vw, 72vw', 'pre-rolls': '(min-width: 1024px) 23vw, 72vw' };
  const cats = band({ tone: 'cream', z: 5, cls: 's-after-hero s-cats-band', label: 's-cats-h', clip: clipOf(pool('copper', 's-pool--r'), pool('sage', 's-pool--bl'), leafArt('s-leafart--br'), goldAccent('tr', { sizes: '(max-width: 720px) 90vw, 52vw' })), inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('Eight categories')}<h2 class="display s-h2" id="s-cats-h" data-reveal style="--i:1">Browse the <em class="accent">keep</em></h2></div></div>
${deli}
<ul class="s-cats s-swipe" role="list">
${s.categories.map((c, i) => catCard(ctx, c, i, { sizes: SIZES[c.slug] || '(min-width: 1024px) 23vw, 72vw' })).join('\n')}
</ul>
</div>` });
  const notes = sectionsOf(res).map((sec, i) => band({ tone: i % 2 ? 'linen' : 'sage', z: 4 - Math.min(i, 2), cls: 's-dnote', inner: `<div class="wrap s-split${i % 2 ? ' s-split--flip' : ''}">
<div class="s-split__text">${sec.heading ? `<h2 class="display s-h3" data-reveal>${accent(sec.heading)}</h2>` : ''}${blocksOf(sec, 'steps').length ? stepsHtml(blocksOf(sec, 'steps').flatMap((b) => b.items || [])) : ''}${prose(ctx, sec.blocks)}${blocksOf(sec, 'faq').length ? faqHtml(blocksOf(sec, 'faq').flatMap((b) => b.items || [])) : ''}</div>
<div class="s-split__art">${frame(i % 2 ? photo(ctx, 'cl/CL-Image-HowToShop.webp', { alt: 'Glass doors opening onto the bright CastleLeaf shop floor, with a wood floor and a tall glass counter', sizes: '(min-width: 1024px) 40vw, 90vw', cls: 'frame__img' }) : gimg('g-feature-firstvisit', { alt: '', sizes: '(min-width: 1024px) 40vw, 90vw', cls: 'frame__img' }), 's-split__frame', '0.04')}</div>
</div>` })).join('\n');
  const main = `${hero(ctx, { kicker: 'Explore', h1Html: accent(title), lede: esc((res && res.lede) || s.ways.intro), crumbs, cta: [{ href: menu(ctx), label: 'Shop Menu' }, { href: '/delivery/', label: 'Local Delivery' }], media, cls: 's-hero s-hero--hub' })}
${cats}
${notes}
${shopBand(ctx, { h2: 'The full menu, <em class="accent">live</em>', line: esc(s.ways.items[0].line) })}`;
  return out(ctx, { path: p, title: (res && res.title) || `${title}${NAME}`, description: (res && res.description) || `Shop flower, pre-rolls, vaporizers, edibles, concentrates, topicals, tinctures and accessories at CastleLeaf, ${s.address.full}.`, crumbs, bodyClass: 'page-hub', main, jsonld: faqsIn(res).length ? [faqLd(faqsIn(res))] : [] });
}

// ---------- /products/<slug>/ ----------
// the picture beside each glue section, in order (client photos first where they fit; generated imagery is mood only)
const ART = {
  flower: ['g-art-strains', 'cl/CL-Image-SEO.webp', 'g-art-terpenes'],
  'pre-rolls': ['g-art-etiquette', 'cl/CL-Image-HowToShop.webp', 'g-art-label'],
  vaporizers: ['g-art-cannabinoids', 'cl/CL-Image-SEO.webp', 'g-art-label'],
  edibles: ['g-art-edibles', 'g-art-butter', 'g-art-decarb'],
  concentrates: ['g-art-cannabinoids', 'cl/CL-Image-SEO.webp', 'g-art-decarb'],
  topicals: ['g-art-label', 'g-art-budtender', 'cl/CL-Image-HowToShop.webp'],
  tinctures: ['g-art-label', 'g-art-cannabinoids', 'g-art-budtender'],
  accessories: ['g-art-history', 'cl/CL-Image-HowToShop.webp', 'g-art-etiquette'],
};
const PHOTO_ALT = {
  'cl/CL-Image-SEO.webp': "CastleLeaf's shop wall: copper-coloured shelves labelled Vapes, Concentrates and Edibles above the glass jar counter",
  'cl/CL-Image-HowToShop.webp': 'Glass doors opening onto the bright CastleLeaf shop floor, with a wood floor and a tall glass counter',
};
const artImg = (ctx, id, sizes) => (id.startsWith('cl/') ? photo(ctx, id, { alt: PHOTO_ALT[id] || '', sizes, cls: 'frame__img' }) : gimg(id, { alt: '', sizes, cls: 'frame__img' }));
function glueSection(ctx, c, sec, i) {
  const art = (ART[c.slug] || [])[i % 3];
  const sizes = '(min-width: 1024px) 38vw, 90vw';
  const lifted = blocksOf(sec, 'steps').flatMap((b) => b.items || []);
  const faqs = blocksOf(sec, 'faq').flatMap((b) => b.items || []);
  const body = sec.html ? `<div class="prose s-prose">${rw(sec.html)}</div>` : prose(ctx, sec.blocks);
  return band({ tone: i % 2 ? 'cream' : 'linen', z: 9 - Math.min(i, 4), cls: `s-gsec${i === 0 ? ' s-after-hero' : ''}`, clip: clipOf(pool(i % 2 ? 'copper' : 'sage', i % 2 ? 's-pool--r' : 's-pool--tl')), inner: `<div class="wrap s-split${i % 2 ? ' s-split--flip' : ''}">
<div class="s-split__text">${sec.kicker ? kicker(sec.kicker) : ''}${sec.heading ? `<h2 class="display s-h3" data-reveal>${accent(sec.heading)}</h2>` : ''}${body}${lifted.length ? stepsHtml(lifted) : ''}${faqs.length ? faqHtml(faqs) : ''}</div>
${art ? `<div class="s-split__art">${frame(artImg(ctx, art, sizes), `s-split__frame${i === 0 ? ' frame--bleed' : ''}`, i % 2 ? '-0.04' : '0.05')}</div>` : ''}
</div>` });
}
// the category's glue sections as one bento: the picture (a tall frame) and a glass tile per section
function glueBento(ctx, c, secs) {
  const art = (ART[c.slug] || [])[0];
  const tiles = secs.map((sec, i) => {
    const lifted = blocksOf(sec, 'steps').flatMap((b) => b.items || []);
    const faqs = blocksOf(sec, 'faq').flatMap((b) => b.items || []);
    const body = sec.html ? `<div class="prose s-prose">${rw(sec.html)}</div>` : prose(ctx, sec.blocks);
    return `<article class="tile glass glass--lift s-gtile s-gtile--${i + 1}" data-spot data-reveal style="--i:${i}">
<span class="s-gtile__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
${sec.heading ? `<h2 class="s-gtile__h">${accent(sec.heading)}</h2>` : ''}${body}${lifted.length ? stepsHtml(lifted) : ''}${faqs.length ? faqHtml(faqs) : ''}
</article>`;
  }).join('\n');
  return band({ tone: 'cream', z: 9, cls: 's-after-hero s-gsecs', clip: clipOf(pool('copper', 's-pool--r'), pool('sage', 's-pool--bl'), leafArt('s-leafart--br')), inner: `<div class="wrap s-gbento s-gbento--${Math.min(secs.length, 4)}">
${art ? `<figure class="frame s-gbento__art" data-reveal="wipe">${artImg(ctx, art, '(min-width: 1024px) 30vw, 90vw')}</figure>` : ''}
${tiles}
</div>` });
}
function deliSection(ctx, z) {
  const s = ctx.site;
  const g = (ctx.glue || {})['flower-deli'] || {};
  const secs = Array.isArray(g.sections) ? g.sections : [];
  const body = [g.lede || g.intro ? `<p class="lede">${esc(g.lede || g.intro)}</p>` : '', g.html ? rw(g.html) : '', ...secs.map((sec) => `${sec.heading ? `<h3 class="s-deliband__h3">${esc(sec.heading)}</h3>` : ''}${sec.html ? rw(sec.html) : prose(ctx, sec.blocks)}`)].join('');
  return band({ tone: 'sage', z, id: 'flower-deli', cls: 's-deliband', label: 's-deli-h', clip: clipOf(pool('cream', 's-pool--top'), leafArt('s-leafart--tr')), inner: `<div class="wrap s-deliband__grid">
<div class="s-deliband__art">${frame(gimg('g-feature-deli', { alt: '', sizes: '(min-width: 1024px) 44vw, 90vw', cls: 'frame__img' }), 's-deliband__frame frame--bleed', '0.05')}</div>
<div class="s-deliband__text">
${kicker(s.flowerDeli.counter)}
<h2 class="display s-h2" id="s-deli-h" data-reveal style="--i:1">Flower <em class="accent">Deli</em></h2>
${body ? `<div class="prose s-prose" data-reveal style="--i:2">${body}</div>` : ''}
<div class="glass glass--strong s-deliband__deal" data-reveal style="--i:3" data-spot>
<p class="s-deliband__dealname"><a${linkAttrs('/specials/mix-and-match-our-bulk-flowers/')}>${esc(s.flowerDeli.deal)}</a></p>
<p class="s-deliband__dealline">${esc(s.flowerDeli.dealLine)}</p>
</div>
<div class="btn-row" data-reveal style="--i:4">${btn(menu(ctx, 'flower-deli'), `Shop the ${s.flowerDeli.label}`)}</div>
</div>
</div>` });
}
function renderProduct(ctx, c) {
  const s = ctx.site;
  const g = (ctx.glue || {})[c.slug] || {};
  const label = g.label || c.label;
  const p = `/products/${c.slug}/`;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop/' }, { label }];
  const media = heroArt(gimg(c.gimg, { sizes: '(min-width: 1024px) 30vw, 72vw', eager: true, cls: 'frame__img' }), `<span class="s-heroart__chip" aria-hidden="true">${photo(ctx, c.photo, { alt: '', sizes: '120px' })}</span>`);
  const secs = (Array.isArray(g.sections) ? g.sections : []).filter((x) => x && (x.heading || x.html || (x.blocks || []).length));
  const faq = [...(Array.isArray(g.faq) ? g.faq : []), ...secs.flatMap((x) => blocksOf(x, 'faq').flatMap((b) => b.items || []))];
  const secsNoFaq = secs.filter((x) => !isOnly(x, 'faq'));
  const tip = g.tip ? (typeof g.tip === 'string' ? { text: g.tip } : g.tip) : null;
  const posts = (ctx.posts || []).filter((x) => Array.isArray(x.relatedCategories) && x.relatedCategories.includes(c.slug)).slice(0, 3);
  const shopUrl = menu(ctx, c.slug);
  let z = 12;
  const main = `${hero(ctx, { kicker: g.kicker || 'Shop By Category', h1Html: accent(g.h1 || label), lede: g.lede || g.intro ? esc(g.lede || g.intro) : '', crumbs, cta: [{ href: shopUrl, label: `Shop ${label}` }, { href: '/shop/', label: 'All categories' }], media, cls: `s-hero s-hero--cat s-hero--${c.slug}` })}
${secsNoFaq.length ? glueBento(ctx, c, secsNoFaq) : band({ tone: 'cream', z: 9, cls: 's-after-hero s-gsec s-gsec--empty', clip: clipOf(pool('sage', 's-pool--tl')), inner: `<div class="wrap s-split"><div class="s-split__text">${kicker(s.tagline)}<h2 class="display s-h3" data-reveal>${accent(`${label} at CastleLeaf`, 0)}</h2><p class="s-bigline" data-reveal style="--i:1">${esc(s.ways.items[0].line)}</p><div class="btn-row" data-reveal style="--i:2">${btn(shopUrl, `Shop ${label}`)}</div></div></div>` })}
${tip && (tip.text || tip.html) ? band({ tone: c.slug === 'flower' ? 'linen' : 'sage', z: (z = 7), cls: 's-tip', clip: clipOf(pool('cream', 's-pool--top'), leafArt('s-leafart--bl')), inner: `<div class="wrap s-tip__wrap">
<p class="kicker s-tip__kick" data-reveal>${esc(tip.title || tip.kicker || 'Budtender tip')}</p>
<p class="s-tip__text" data-reveal style="--i:1">${tip.html ? rw(tip.html) : esc(tip.text)}</p>
</div>` }) : ''}
${c.slug === 'flower' ? deliSection(ctx, 6) : ''}
${faq.length ? band({ tone: 'linen', z: 5, cls: 's-pfaq', label: 's-pfaq-h', inner: `<div class="wrap s-dfaq__grid">
<div class="s-dfaq__head">${kicker('Questions')}<h2 class="display s-h2" id="s-pfaq-h" data-reveal style="--i:1">${esc(label)}, <em class="accent">answered</em></h2></div>
<div class="s-dfaq__list" data-reveal style="--i:2">${faqHtml(faq)}</div>
</div>` }) : ''}
${readsBand(ctx, posts, { tone: 'cream', z: 4 })}
${otherCats(ctx, c.slug, { tone: posts.length ? 'linen' : 'cream', z: 3 })}
${shopBand(ctx, { h2: `Shop <em class="accent">${esc(label)}</em>`, line: esc(s.ways.items[0].line), primary: btn(shopUrl, `Shop ${label}`, 'btn btn--copper'), secondary: btn(menu(ctx), 'Shop Menu', 'btn btn--ghost') })}`;
  return out(ctx, { path: p, title: g.title || `${label}${NAME}`, description: g.description || `${label} at CastleLeaf, ${s.address.full}. Browse the category, then shop the live menu.`, crumbs, bodyClass: `page-product page-product--${c.slug}`, main, jsonld: faq.length ? [faqLd(faq)] : [] });
}

// ---------- specials: the captured bundles ----------
const BUNDLE_ART = {
  'concentrates-3-for-40': { gimg: 'g-cat-concentrates', menu: 'concentrates' },
  '1-2g-infused-live-resin-donut-prerolls-2-for-20': { gimg: 'g-cat-prerolls', menu: 'pre-rolls', cut: 'g-cut-preroll' },
  'fast-acting-chill-syrups-500mg-2-for-55-1000mg-2-for-105': { gimg: 'g-cat-edibles', menu: '' },
  '500mg-tinctures-2-for-551000mg-tinctures-2-for100': { gimg: 'g-cat-tinctures', menu: 'tinctures' },
  'nectar-drinks-4-for-20': { gimg: 'g-cat-edibles', menu: '' },
  'mix-and-match-our-bulk-flowers': { gimg: 'g-cat-flower', menu: 'flower-deli' },
};
const slugOfHref = (h) => String(h || '').replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
// the six cards of the captured /specials/ grid, verbatim: heading html, line html, link text
function bundlesOf(ctx) {
  const list = [];
  const walk = (bs) => {
    for (const b of bs || []) {
      if (typeOf(b) === 'card') {
        const lc = (b.blocks || []).find((x) => typeOf(x) === 'linkcard');
        const h = (b.blocks || []).find((x) => /^h[2-4]$/.test(typeOf(x)));
        const pp = (b.blocks || []).find((x) => typeOf(x) === 'p' || typeOf(x) === 'text');
        const ln = (b.blocks || []).find((x) => typeOf(x) === 'links');
        const href = (lc && lc.href) || ((ln && ln.items && ln.items[0]) || {}).href || '';
        list.push({ slug: slugOfHref(href), href, h: h ? h.html : '', hText: plain(h ? h.html : ''), line: pp ? pp.html : '', more: ln && ln.items && ln.items[0] ? plain(ln.items[0].html).replace(/[^\w\s$.,]+$/u, '').trim() : 'Shop Now', aria: ln && ln.items && ln.items[0] ? ln.items[0]['aria-label'] : '' });
      } else if (b.blocks) walk(b.blocks);
    }
  };
  walk(sectionsOf(ctx.content.specials).flatMap((sct) => sct.blocks || []));
  return list;
}
// a bundle tile on the glass bento: the captured h2 (linked), line and "Shop Now"
function bundleTile(b, i) {
  const art = BUNDLE_ART[b.slug] || {};
  const pop = art.cut;
  return `<li class="s-bundles__item s-bundles__item--${i + 1}">
<article class="tile glass glass--lift s-bundle${pop ? ' tile--pop s-bundle--pop' : ''}${i === 0 ? ' s-bundle--photo' : ''}" data-spot data-reveal style="--i:${i % 3}">
${pop ? `<span class="tile__pop s-bundle__pop" aria-hidden="true">${gimg(pop, { alt: '', sizes: '(min-width: 1024px) 200px, 34vw' })}</span>` : ''}
${i === 0 && art.gimg ? `<span class="s-bundle__media" aria-hidden="true">${gimg(art.gimg, { alt: '', sizes: '(min-width: 1024px) 26vw, 84vw' })}</span>` : ''}
<div class="s-bundle__body">
<span class="s-bundle__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
<h2 class="s-bundle__title">${rw(b.h)}</h2>
<p class="s-bundle__line">${rw(b.line)}</p>
<a class="link-arrow s-bundle__more"${linkAttrs(liveHref(b.href))}${b.aria ? ` aria-label="${escA(b.aria)}"` : ''}>${esc(b.more)}${ico('arrow')}</a>
</div>
</article></li>`;
}
// the client's own daily-deal banners (printed text, shown whole); the textless background file is left out
const BANNERS = [
  ['757038b5-70b7-4671-ba69-8cfd2c84be69.png', 'Monday banner: Sparq flowers, PRJs and concentrates. Everyday is preroll day, everyday is flower day.'],
  ['0c383782-4a50-430c-a754-73be4c086c91.png', 'Tuesday banner: prerolls and fresh counters. Premium cannabis, fresh stock, daily counters. Everyday is preroll and flower day.'],
  ['ChatGPT-Image-Aug-25-2026-03_14_09-PM.png', 'Wednesday banner: infused Cali Blaze prerolls and Wyld, Good Tide gummies. Everyday is preroll and flower day.'],
  ['ChatGPT-Image-Aug-25-2026-07_43_42-PM.png', 'Thursday banner: M1 3.5g flowers and disposables. Everyday is preroll day, everyday is flower day.'],
  ['ChatGPT-Image-Aug-25-2026-07_59_00-PM.png', 'Friday banner: infused PRJ, flowers and High Tac flowers. Everyday is preroll day, everyday is flower day.'],
  ['ChatGPT-Image-Aug-25-2026-08_04_39-PM.png', 'Saturday banner: shake and 7g flowers. Everyday is preroll day, everyday is flower day.'],
  ['ChatGPT-Image-Aug-25-2026-07_49_44-PM.png', 'Sunday banner: Bostica and Chargebar. Everyday is preroll day, everyday is flower day.'],
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function bannersBand(ctx, z) {
  return band({ tone: 'linen', z, cls: 's-days', label: 's-days-h', clip: clipOf(pool('copper', 's-pool--r'), leafArt('s-leafart--tl')), inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('From the store')}<h2 class="display s-h2" id="s-days-h" data-reveal style="--i:1">Daily <em class="accent">deals</em></h2></div></div>
<div class="s-rotator" data-rotator="6000" data-rotator-label="banner" data-reveal style="--i:2">
<div class="frame s-rotator__frame"><div class="s-rotator__stage">
${BANNERS.map(([f, alt], i) => `<figure class="s-rotator__slide" data-slide aria-roledescription="slide" aria-label="${escA(`${DAYS[i]}, ${i + 1} of ${BANNERS.length}`)}">${photo(ctx, 'cl/' + f, { alt, sizes: '(min-width: 1280px) 1100px, 94vw', cls: 's-rotator__img' })}</figure>`).join('\n')}
</div></div>
<div class="rotator__controls s-rotator__ctrls"><button class="rotator__btn rotator__btn--prev" type="button" data-rotator-prev aria-label="Previous banner">${ico('arrow')}</button><div data-rotator-dots></div><button class="rotator__btn rotator__btn--next" type="button" data-rotator-next aria-label="Next banner">${ico('arrow')}</button></div>
</div>
</div>` });
}
function renderSpecials(ctx) {
  const rec = ctx.content.specials;
  const p = '/specials/';
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Specials' }];
  const list = bundlesOf(ctx);
  const faqLine = (clientFaq(ctx, 'Do you offer discounts?') || {}).a_html || '';
  const lede = (plain(faqLine).match(/We do offer product bundles[^.]*\./) || [''])[0];
  const media = heroArt(gimg('g-feature-deli', { sizes: '(min-width: 1024px) 34vw, 84vw', eager: true, cls: 'frame__img' }));
  const main = `${hero(ctx, { kicker: 'Specials', h1Html: accent(plain(rec.h1)), lede: esc(lede), crumbs, cta: [{ href: '#s-bundles', label: 'See the bundles' }, { href: menu(ctx), label: 'Shop Menu' }], media, cls: 's-hero s-hero--specials' })}
${band({ tone: 'cream', z: 6, cls: 's-after-hero s-bundles-band', id: 's-bundles', clip: tex('g-tex-obsidian-vein', 'vein'), inner:`<div class="wrap">
<ul class="s-bundles" role="list">${list.map(bundleTile).join('\n')}</ul>
</div>` })}
${bannersBand(ctx, 4)}
${shopBand(ctx, { h2: 'Shop the <em class="accent">menu</em>', line: esc(ctx.site.ways.items[0].line) })}`;
  return out(ctx, { path: p, title: rec.title, description: rec.description, crumbs, bodyClass: 'page-specials', main });
}
function renderBundle(ctx, slug) {
  const rec = ctx.content['specials__' + slug];
  const p = rec.path || `/specials/${slug}/`;
  const all = sectionsOf(rec).flatMap((x) => x.blocks || []);
  const h2 = all.find((b) => typeOf(b) === 'h2');
  const notes = all.filter((b) => typeOf(b) === 'p' || typeOf(b) === 'text');
  const art = BUNDLE_ART[slug] || { gimg: 'g-feature-deli' };
  const shopUrl = art.menu ? menu(ctx, art.menu) : menu(ctx);
  const h1 = plain(rec.h1);
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Specials', href: '/specials/' }, { label: h1 }];
  const media = heroArt(gimg(art.gimg, { sizes: '(min-width: 1024px) 30vw, 72vw', eager: true, cls: 'frame__img' }));
  const others = bundlesOf(ctx).filter((b) => b.slug !== slug);
  const main = `${hero(ctx, { kicker: 'Cannabis Bundles', h1Html: esc(h1), crumbs, cta: [{ href: shopUrl, label: 'Shop Now' }, { href: '/specials/', label: 'All bundles' }], media, cls: 's-hero s-hero--bundle' })}
${band({ tone: 'cream', z: 6, cls: 's-after-hero s-offer', label: 's-offer-h', clip: clipOf(pool('copper', 's-pool--c'), leafArt('s-leafart--tl'), goldAccent('tl', { sizes: '(max-width: 720px) 100vw, 90vw' })), inner: `<div class="wrap wrap--narrow">
<div class="glass glass--strong s-offer__pane" data-spot data-reveal>
<p class="kicker s-offer__kick">The bundle</p>
${h2 ? `<h2 class="display s-offer__price" id="s-offer-h">${rw(h2.html)}</h2>` : ''}
${notes.map((n) => `<p class="s-offer__note">${rw(n.html)}</p>`).join('\n')}
<div class="btn-row s-offer__btns">${btn(shopUrl, 'Shop Now')}${btn('/specials/', 'All bundles', 'btn btn--ghost')}</div>
</div>
</div>` })}
${band({ tone: 'linen', z: 4, cls: 's-morebundles', label: 's-more-h', inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('More bundles')}<h2 class="display s-h2" id="s-more-h" data-reveal style="--i:1">Mix the <em class="accent">set</em></h2></div><a class="link-arrow s-head__all"${linkAttrs('/specials/')}>All bundles${ico('arrow')}</a></div>
<ul class="s-minibundles s-swipe" role="list">${others.map((b, i) => `<li class="s-minibundles__item"><a class="tile glass s-minibundle"${linkAttrs(liveHref(b.href))} data-spot data-reveal style="--i:${i}"><span class="s-minibundle__media" aria-hidden="true">${gimg((BUNDLE_ART[b.slug] || {}).gimg || 'g-feature-deli', { alt: '', sizes: '(min-width: 1024px) 240px, 60vw' })}</span><span class="s-minibundle__title">${esc(b.hText)}</span><span class="link-arrow s-minibundle__more">View${ico('arrow')}</span></a></li>`).join('')}</ul>
</div>` })}
${shopBand(ctx, { h2: 'Shop the <em class="accent">menu</em>', line: esc(ctx.site.ways.items[0].line), primary: btn(shopUrl, 'Shop Now', 'btn btn--copper') })}`;
  return out(ctx, { path: p, title: rec.title, description: rec.description, crumbs, bodyClass: 'page-bundle', main });
}

// ---------- /420-deals/ and /green-wednesday-deals/ (one template fed by the capture) ----------
const CAT_OF_LINK = [[/edibles/, 'g-cat-edibles'], [/vaporizers/, 'g-cat-vaporizers'], [/flower/, 'g-cat-flower'], [/pre-rolls/, 'g-cat-prerolls'], [/concentrates/, 'g-cat-concentrates'], [/featured/, 'g-feature-vip']];
const linkOnly = (b) => (typeOf(b) === 'p' || typeOf(b) === 'text') && /^\s*<a\b[^>]*>[^<]*<\/a>\s*$/i.test(b.html || '');
function renderEventDeals(ctx, slug, { heroImg, arts }) {
  const rec = ctx.content[slug];
  const p = rec.path || `/${slug}/`;
  const all = sectionsOf(rec).flatMap((x) => x.blocks || []);
  const h1i = all.findIndex((b) => typeOf(b) === 'h1');
  const h1 = plain(rec.h1 || (all[h1i] || {}).html);
  let rest = all.slice(h1i + 1);
  // the "Shop All" link right under the H1 is the hero button
  let heroLink = null;
  if (rest[0] && typeOf(rest[0]) === 'links') { heroLink = rest[0].items[0]; rest = rest.slice(1); }
  // segments: a heading (h1 after the first, h2) and its blocks
  const segs = [];
  for (const b of rest) {
    const t = typeOf(b);
    if (t === 'h1' || t === 'h2') segs.push({ head: b, body: [] });
    else if (segs.length) segs[segs.length - 1].body.push(b);
  }
  const offers = segs.filter((sg) => sg.body.some((b) => typeOf(b) === 'linkcard'));
  const shortcuts = segs.filter((sg) => !offers.includes(sg) && sg.body.filter((b) => typeOf(b) !== 'img').length === 1 && linkOnly(sg.body.find((b) => typeOf(b) !== 'img')));
  const editorial = segs.filter((sg) => !offers.includes(sg) && !shortcuts.includes(sg));
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Specials', href: '/specials/' }, { label: h1 }];
  const media = heroArt(gimg(heroImg, { sizes: '(min-width: 1024px) 30vw, 72vw', eager: true, cls: 'frame__img' }));
  const heroCtaList = heroLink ? [{ href: liveHref(heroLink.href), label: plain(heroLink.html) }, { href: '/specials/', label: 'Cannabis Bundles' }] : [{ href: '/specials/', label: 'Cannabis Bundles' }];
  // offers: the captured cards (h3 linked, line, "Order Now") as a swipe row of glass cards, then "Shop Specials"
  const offerBand = (sg, k) => {
    const cards = [];
    let cur = null;
    const tail = [];
    for (const b of sg.body) {
      const t = typeOf(b);
      if (t === 'linkcard') { cur = { href: b.href, h: '', line: '', more: null }; cards.push(cur); }
      else if (/^h[3-4]$/.test(t) && cur) cur.h = b.html;
      else if ((t === 'text' || t === 'p') && cur) cur.line = b.html;
      else if (t === 'links' && cur && !cur.more) cur.more = b.items[0];
      else if (t === 'links') tail.push(...b.items);
    }
    const id = `s-offers-h-${k}`;
    return band({ tone: 'cream', z: 8 - k, cls: `s-offers${k === 0 ? ' s-after-hero' : ''}`, label: id, clip: clipOf(pool('copper', 's-pool--c'), leafArt('s-leafart--br')), inner: `<div class="wrap">
<div class="s-head s-head--row"><div>${kicker('Bundles')}<h2 class="display s-h2" id="${id}" data-reveal style="--i:1">${rw(sg.head.html)}</h2></div>${tail.map((l) => `<a class="btn btn--ghost s-head__all"${linkAttrs(liveHref(l.href))}>${esc(plain(l.html))}${ico('arrow')}</a>`).join('')}</div>
<ul class="s-offers__row s-swipe" role="list">${cards.map((c, i) => `<li class="s-offers__item"><article class="tile glass glass--lift s-offer-card" data-spot data-reveal style="--i:${i % 4}">
<span class="s-offer-card__media" aria-hidden="true">${gimg((BUNDLE_ART[slugOfHref(c.href)] || {}).gimg || 'g-feature-deli', { alt: '', sizes: '(min-width: 1024px) 300px, 72vw' })}</span>
<h3 class="s-offer-card__title">${rw(c.h)}</h3>
<p class="s-offer-card__line">${rw(c.line)}</p>
${c.more ? `<a class="link-arrow s-offer-card__more"${linkAttrs(liveHref(c.more.href))}>${esc(plain(c.more.html))}${ico('arrow')}</a>` : ''}
</article></li>`).join('\n')}</ul>
</div>` });
  };
  const shortBand = shortcuts.length ? band({ tone: 'linen', z: 5, cls: 's-short', label: 's-short-h', clip: clipOf(pool('sage', 's-pool--tl')), inner: `<div class="wrap">
<h2 class="vh" id="s-short-h">${esc(h1)}</h2>
<ul class="s-short__grid s-short__grid--${shortcuts.length}" role="list">${shortcuts.map((sg, i) => {
    const b = sg.body.find((x) => typeOf(x) !== 'img');
    const href = ((b.html || '').match(/href="([^"]*)"/) || [])[1] || '';
    const art = (CAT_OF_LINK.find(([re]) => re.test(href)) || [null, 'g-feature-deli'])[1];
    return `<li class="s-short__item${i === 0 ? ' s-short__item--big' : ''}"><article class="tile tile--photo s-shortcut" data-reveal style="--i:${i % 3}">
<span class="s-shortcut__media" aria-hidden="true">${gimg(art, { alt: '', sizes: i === 0 ? '(min-width: 1024px) 46vw, 84vw' : '(min-width: 1024px) 23vw, 84vw' })}</span>
<div class="glass glass--dark s-shortcut__pane">
<h2 class="s-shortcut__title">${rw(sg.head.html)}</h2>
<p class="s-shortcut__link">${rw(b.html).replace('<a ', '<a class="link-arrow" ')}</p>
</div>
</article></li>`;
  }).join('\n')}</ul>
</div>` }) : '';
  const editBands = editorial.map((sg, i) => {
    const art = arts[i % arts.length];
    const id = `s-ed-h-${i}`;
    const body = sg.body.filter((b) => typeOf(b) !== 'img' && typeOf(b) !== 'svg');
    const btns = body.filter((b) => typeOf(b) === 'links').flatMap((b) => b.items);
    const text = body.filter((b) => typeOf(b) !== 'links');
    return band({ tone: i % 2 ? 'cream' : 'sage', z: 3 - Math.min(i, 1), cls: 's-ed', label: id, clip: clipOf(pool(i % 2 ? 'copper' : 'cream', i % 2 ? 's-pool--r' : 's-pool--top')), inner: `<div class="wrap s-split${i % 2 ? '' : ' s-split--flip'}">
<div class="s-split__text">
<h2 class="display s-h3" id="${id}" data-reveal>${rw(sg.head.html)}</h2>
<div class="prose s-prose" data-reveal style="--i:1">${text.map((b) => `<p>${rw(b.html)}</p>`).join('\n')}</div>
${btns.length ? `<div class="btn-row" data-reveal style="--i:2">${btns.map((l) => btn(liveHref(l.href), plain(l.html))).join('')}</div>` : ''}
</div>
<div class="s-split__art">${frame(gimg(art, { alt: '', sizes: '(min-width: 1024px) 38vw, 90vw', cls: 'frame__img' }), `s-split__frame${i === 0 ? ' frame--bleed' : ''}`, i % 2 ? '-0.04' : '0.05')}</div>
</div>` });
  }).join('\n');
  const main = `${hero(ctx, { kicker: 'Offers', h1Html: esc(h1), crumbs, cta: heroCtaList, media, cls: `s-hero s-hero--event s-hero--${slug}` })}
${offers.map(offerBand).join('\n')}
${shortBand}
${editBands}
${shopBand(ctx, { h2: 'Shop the <em class="accent">menu</em>', line: esc(ctx.site.ways.items[0].line) })}`;
  return out(ctx, { path: p, title: rec.title, description: rec.description, crumbs, bodyClass: `page-offers page-${slug}`, main });
}

// ---------- /loyalty-sign-up/ (the VIP Club) ----------
function renderLoyalty(ctx) {
  const s = ctx.site;
  const rec = ctx.content['loyalty-sign-up'];
  const p = rec.path || '/loyalty-sign-up/';
  const h1 = plain(rec.h1) || 'Loyalty Sign-Up';
  const crumbs = [{ label: 'Home', href: '/' }, { label: s.vip.title }];
  const faq = clientFaq(ctx, 'Do you offer discounts?');
  const media = heroArt(gimg('g-feature-vip', { sizes: '(min-width: 1024px) 34vw, 84vw', eager: true, cls: 'frame__img' }));
  const main = `${hero(ctx, { kicker: s.vip.title, h1Html: accent(h1), lede: esc(s.vip.line), crumbs, cta: [{ href: '#s-vip-form', label: s.vip.cta }], media, cls: 's-hero s-hero--vip' })}
${band({ tone: 'gold', z: 6, cls: 's-after-hero s-vip', label: 's-vip-h', clip: bandBg('g-tex-gold-leaf', { veil: 'gold' }), inner:`<div class="wrap s-vip__grid">
<div class="s-vip__text">
<span class="s-vip__mark" aria-hidden="true">${photo(ctx, 'cl/CL-Favicon.webp', { alt: '', sizes: '88px' })}</span>
${kicker(s.vip.title)}
<h2 class="display s-h2" id="s-vip-h" data-reveal style="--i:1">Join the VIP <em class="accent">Club</em></h2>
<p class="s-bigline" data-reveal style="--i:2">${esc(s.vip.line)}</p>
${faq ? `<aside class="s-vip__faq" data-reveal style="--i:3"><p class="kicker">From our FAQ</p><h3 class="s-vip__faqq">${esc(faq.q)}</h3><div class="s-vip__faqa">${faq.a_html}</div><a class="link-arrow"${linkAttrs('/faqs/')}>All FAQs${ico('arrow')}</a></aside>` : ''}
</div>
<div class="glass glass--strong s-vip__pane" id="s-vip-form" data-spot data-reveal style="--i:2">
<h3 class="s-vip__formh">${esc(s.vip.title)}</h3>
${demoForm({ id: 'vip-form', fields: ['Name', 'Email', 'Phone'], button: s.vip.cta, cls: 's-vip__form' })}
</div>
</div>` })}
${band({ tone: 'linen', z: 3, cls: 's-vipmore', label: 's-vipmore-h', inner: `<div class="wrap">
<div class="s-head">${kicker('While you are here')}<h2 class="display s-h2" id="s-vipmore-h" data-reveal style="--i:1">Offers and <em class="accent">events</em></h2></div>
<ul class="s-vipmore__grid" role="list">
${[['Cannabis Bundles', '/specials/', 'g-feature-deli'], ['Local Delivery', '/delivery/', 'g-feature-delivery'], ['Events', '/events/', 'g-feature-events']].map(([t, h, g], i) => `<li><a class="tile glass s-vipcard"${linkAttrs(h)} data-spot data-reveal style="--i:${i}"><span class="s-vipcard__media" aria-hidden="true">${gimg(g, { alt: '', sizes: '(min-width: 1024px) 30vw, 72vw' })}</span><span class="s-vipcard__title">${esc(t)}</span><span class="link-arrow s-vipcard__more">Visit${ico('arrow')}</span></a></li>`).join('\n')}
</ul>
</div>` })}`;
  return out(ctx, { path: p, title: rec.title, description: rec.description, crumbs, bodyClass: 'page-vip', main });
}

// ---------- render ----------
export async function render(ctx) {
  const pages = [];
  const safe = (name, fn) => { try { const r = fn(); if (r) pages.push(r); } catch (e) { throw new Error(`shop: ${name}: ${e.message}`); } };
  safe('delivery', () => renderDelivery(ctx));
  safe('shop', () => renderHub(ctx));
  for (const c of ctx.site.categories) safe('product ' + c.slug, () => renderProduct(ctx, c));
  if (ctx.content.specials) safe('specials', () => renderSpecials(ctx));
  for (const k of Object.keys(ctx.content).filter((x) => x.startsWith('specials__'))) safe(k, () => renderBundle(ctx, k.replace(/^specials__/, '')));
  if (ctx.content['420-deals']) safe('420-deals', () => renderEventDeals(ctx, '420-deals', { heroImg: 'g-cat-prerolls', arts: ['g-feature-events', 'g-cat-flower'] }));
  if (ctx.content['green-wednesday-deals']) safe('green-wednesday-deals', () => renderEventDeals(ctx, 'green-wednesday-deals', { heroImg: 'g-feature-deli', arts: ['g-cat-edibles', 'g-feature-events'] }));
  if (ctx.content['loyalty-sign-up']) safe('loyalty', () => renderLoyalty(ctx));
  return pages;
}
