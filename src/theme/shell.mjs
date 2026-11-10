// shell.mjs - the page chrome (FOUNDATION, "LANTERN KEEP"): <head>, the sage promo strip, the floating glass main bar (logo,
// nav with mega panels holding image cards, Shop Menu), the drawer below 1024px, the night footer with its lantern pool and the
// giant CASTLELEAF wordmark crossed by a band of light, the 21+ gate, pageHero(), blocks(), bandBg().
//
// API (every lane):
//   page({ ctx, path, title, description, canonical, og, jsonld, bodyClass, main, crumbs, heroCrumbs, scripts, preload })
//     main     the INNER html of <main id="main">. The promo strip is in flow; the glass bar FLOATS over the top of main, so the
//              first band of a page runs under the bar: keep its text clear with padding-top: var(--hero-top). pageHero() does it.
//     crumbs   [{ label, href }, ...] or [[href, label], ...]; last = current page. Printed in a slim bar under the header unless
//              heroCrumbs is true or main already holds a .crumbs. A BreadcrumbList JSON-LD is added from crumbs.
//     og       { title, description, type, image, url }; image defaults to the client's CL-OG.png.
//     jsonld   object or array. A Store block is added on "/" only.
//     preload  [{ href, as, type, media, imagesrcset, imagesizes, fetchpriority }] for the first-screen image.
//   pageHero({ ctx, kicker, h1Html, lede, crumbs, cta, media, tone, cls, id, attrs })
//     tone     'linen' (default) | 'cream' | 'sage' | 'night' (a tenebrist stage with the lantern; counts as the page's dark band)
//     cta      html string, or { label, href } / [{ label, href, ghost, cls }, ...]: href 'menu' and 'directions' are understood
//     media    an object -> an arched frame on the right that crosses the hero's bottom edge:
//                { gimg: 'g-feature-delivery', alt } or { photo: 'cl/CL-Team.webp', alt } (+ pos: 'center 30%', chip: '<html>')
//              or an html string, placed as is in .page-hero__media (bring your own .arch-frame).
//              The next band gets --overhang of extra top padding by itself.
//   blocks(list, ctx)      captured blocks (key t) and new blocks (key type) -> designed components in a <div class="prose">
//   bandBg(id, { pos, cls, alt, opacity, eager, sizes, leaf, veil }) -> <div class="band__clip"> with a generated ground
//   icon(name, cls), crumbsHtml(crumbs), logoHtml(ctx, opts), markHtml(ctx, opts), hoursHtml(ctx, cls), specTable(rows, cls),
//   stars(n), CSS_ORDER.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { esc, escA, attrs, href, linkAttrs, absUrl, gimg, img, imgUrl, photo, hasGenerated, menu, rewriteLinks, liveHref } from './util.mjs';

export const CSS_ORDER = ['fonts', 'tokens', 'base', 'components', 'motion', 'shell', 'home', 'shop', 'learn', 'pages', 'mobile', 'fix'];

const ICONS = {
  ext: '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/>',
  chev: '<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>',
  menu: '<path d="M4 7.5h16"/><path d="M8 12h12"/><path d="M4 16.5h16"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  pin: '<path d="M19 10c0 5.6-7 11-7 11s-7-5.4-7-11a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  arrow: '<path d="M4.5 12h15"/><path d="m13.5 6 6 6-6 6"/>',
  tag: '<path d="M12.6 2.8H4.8a2 2 0 0 0-2 2v7.8l8.6 8.6a2.2 2.2 0 0 0 3.1 0l6.7-6.7a2.2 2.2 0 0 0 0-3.1Z"/><circle cx="8" cy="8" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  phone: '<path d="M5 3.5h3.6l1.8 4.6-2.4 1.6a11 11 0 0 0 6.3 6.3l1.6-2.4 4.6 1.8V19a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  up: '<path d="M12 19.5v-15"/><path d="m6 10.5 6-6 6 6"/>',
  star: '<path d="m12 3.2 2.7 5.5 6 .9-4.35 4.25 1.03 6L12 17l-5.38 2.85 1.03-6L3.3 9.6l6-.9Z"/>',
  leaf: '<path d="M5 20c0-8.5 5.5-14 15-15-.6 9.5-6.4 15-15 15Z"/><path d="m5 20 8.5-8.5"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.8"/>',
  facebook: '<path d="M14.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.9v3h2.6V21"/>',
  sparkle: '<path d="M12 3.5c.6 4.2 2.3 6 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.5 5.9-2.3 6.5-6.5Z"/>',
  gift: '<rect x="3.5" y="8.5" width="17" height="12" rx="1.5"/><path d="M12 8.5v12M3.5 12.5h17"/><path d="M12 8.5c-2-4-6.5-4-6-1.5.3 1.5 3.5 1.5 6 1.5Zm0 0c2-4 6.5-4 6-1.5-.3 1.5-3.5 1.5-6 1.5Z"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  cart: '<path d="M3 4h2.2l2.3 11h10.3L20 7.5H6.4"/><circle cx="9.2" cy="19" r="1.4"/><circle cx="16.6" cy="19" r="1.4"/>',
  quote: '<path d="M9.5 7.5C6.6 8.4 5 10.6 5 13.6V17h4.6v-4.4H7.2c.1-1.8 1-3 2.8-3.6Z"/><path d="M18.5 7.5c-2.9.9-4.5 3.1-4.5 6.1V17h4.6v-4.4h-2.4c.1-1.8 1-3 2.8-3.6Z"/>',
  truck: '<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3.2v2.8h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chat: '<path d="M4 5.5h16v10H9.5L5 19.5v-4H4z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/>',
  kiosk: '<rect x="6" y="2.5" width="12" height="13" rx="1.6"/><path d="M9 6.5h6M9 9.5h4"/><path d="M12 15.5v4M8 21.5h8"/>',
  crown: '<path d="M4.5 18h15"/><path d="M5 15.5 3.8 7.5l4.6 3.6L12 4.8l3.6 6.3 4.6-3.6-1.2 8z"/><circle cx="12" cy="13" r="0.9"/>',
  play: '<path d="M8 5.5v13l10-6.5Z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
};
export function icon(name, cls = '') {
  return `<svg class="icon icon--${escA(name)}${cls ? ' ' + escA(cls) : ''}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.sparkle}</svg>`;
}

// ---------- small helpers ----------
const res = (ctx, h) => (h === 'menu' ? menu(ctx) : h === 'directions' ? ctx.site.directions : h);
const isExt = (u) => /^https?:/i.test(String(u));
const pathOf = (h) => href(String(h || '')).split('#')[0].split('?')[0];
const isCur = (h, p) => !!h && !isExt(h) && !/^(mailto|tel):/i.test(h) && !String(h).includes('#') && pathOf(h) === p;
const cur = (h, p) => (isCur(h, p) ? ' aria-current="page"' : '');
const extIco = (u) => (isExt(u) ? icon('ext', 'icon--ext') : '');
const idOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// crumbs: [{ label, href }] or [[href, label]]; the last one is the current page. The "/" separators are drawn by CSS.
const crumbParts = (c) => (Array.isArray(c) ? { href: c[0], label: c[1] } : c || {});
export function crumbsHtml(crumbs = []) {
  if (!crumbs || !crumbs.length) return '';
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((raw, i) => {
    const c = crumbParts(raw);
    return `<li>${i < crumbs.length - 1 && c.href ? `<a${linkAttrs(c.href)}>${esc(c.label)}</a>` : `<span aria-current="page">${esc(c.label)}</span>`}</li>`;
  }).join('')}</ol></nav>`;
}

// ---------- logo + crown mark (the client's files, never redrawn) ----------
// logoHtml(ctx, { link = true, eager = false, cls = '', current = false, sizes, invert = false }): the wordmark + crown (dark, for light
// grounds). invert: true adds .logo--invert (cream, for dark grounds). link: false gives a <span class="logo"> for your own link.
export function logoHtml(ctx, { link = true, eager = false, cls = '', current = false, sizes = '220px', invert = false } = {}) {
  const name = (ctx.site && ctx.site.name) || 'CastleLeaf';
  const im = img({ src: '/assets/photos/cl/CL-Logo.webp', alt: link ? '' : name }, { cls: 'logo__img', eager, sizes });
  const c = `logo${invert ? ' logo--invert' : ''}${cls ? ' ' + cls : ''}`;
  if (!link) return `<span class="${escA(c)}">${im}</span>`;
  return `<a class="${escA(c)}"${linkAttrs('/')} aria-label="${escA(name)} home"${current ? ' aria-current="page"' : ''}>${im}</a>`;
}
// markHtml(ctx, { cls, alt, eager, sizes }): the crown in its cream shield (CL-Favicon.webp)
export function markHtml(ctx, { cls = '', alt = '', eager = false, sizes = '120px' } = {}) {
  return img({ src: '/assets/photos/cl/CL-Favicon.webp', alt }, { cls: `mark${cls ? ' ' + cls : ''}`, eager, sizes });
}

// ---------- hours + spec tables ----------
// hoursHtml(ctx, cls): the seven days from site.hours.days as a <dl class="hours">; today's row gets .is-today from site.js.
export function hoursHtml(ctx, cls = '') {
  const h = ctx.site.hours || {};
  return `<dl class="hours${cls ? ' ' + escA(cls) : ''}" data-hours>${(h.days || []).map(([d, t], i) => `<div class="hours__row" data-day="${i}"><dt>${esc(d)}</dt><dd>${esc(t)}</dd></div>`).join('')}</dl>`;
}
// rows = [[key, valueHtml], ...]: the value is trusted html
export function specTable(rows = [], cls = '') {
  return `<dl class="spec${cls ? ' ' + escA(cls) : ''}">${(rows || []).map(([k, v]) => `<div class="spec__row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}
export function stars(n = 5) {
  const k = Math.max(0, Math.min(5, Number(n) || 5));
  return `<span class="stars" role="img" aria-label="${escA(`${k} out of 5 stars`)}" style="--n:${k}"></span>`;
}

// ---------- band grounds ----------
// bandBg(id, opts) -> <div class="band__clip" aria-hidden="true"> holding a generated ground as a real <img class="band__bg">.
//   opts: pos (object-position), cls, alt, opacity, eager, sizes, leaf ('tr' | 'tl' | 'br' | 'bl': the client's leaf pattern faintly
//   in that corner), veil ('linen' | 'cream' | 'night': a wash over the image so text stays calm). A missing id leaves the band on
//   its token colour and pools (no placeholder slot in a background). id may be '' for pools/leaf only.
export function bandBg(id, { pos = '', cls = '', alt = '', opacity = '', eager = false, sizes = '(max-width: 720px) 720px, 100vw', leaf = '', veil = '' } = {}) {
  const style = [pos ? `object-position:${pos}` : '', opacity !== '' ? `opacity:${opacity}` : ''].filter(Boolean).join(';');
  const pic = id && hasGenerated(id) ? gimg(id, { alt, cls: `band__bg${cls ? ' ' + cls : ''}`, sizes, eager, attrs: style ? { style } : {} }) : '';
  const lf = leaf ? `<span class="band__leaf band__leaf--${escA(leaf)}"></span>` : '';
  const vl = veil ? `<span class="band__veil band__veil--${escA(veil)}"></span>` : '';
  return `<div class="band__clip" aria-hidden="true">${pic}${vl}${lf}</div>`;
}

// ---------- mega panel images load on first intent: a single data-src per image (no srcset), see site.js primeArt ----------
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function deferImg(html, sizeUrl) {
  if (!/^<img/.test(html)) return html; // a missing generated id: the .img-slot placeholder
  return html
    .replace(/\s(srcset|sizes|loading|fetchpriority)="[^"]*"/g, '')
    .replace(/\ssrc="([^"]*)"/, (m, u) => ` src="${BLANK}" data-src="${escA(sizeUrl || u)}"`);
}
const genCard = (id) => (id ? deferImg(gimg(id, { alt: '', cls: 'mega__img' }), hasGenerated(id) ? imgUrl(id, 640) : '') : '');
const photoCard = (ctx, file) => deferImg(photo(ctx, file, { alt: '', cls: 'mega__img' }));

function megaFeature(ctx, f, p) {
  const h = res(ctx, f.href);
  return `<a class="mega__feature"${linkAttrs(h)}${cur(h, p)}>
<span class="mega__feature-media">${genCard(f.gimg)}</span><span class="mega__feature-light" aria-hidden="true"></span>
<span class="mega__feature-body"><span class="mega__feature-t">${esc(f.title)}</span>${f.line ? `<span class="mega__feature-l">${esc(f.line)}</span>` : ''}<span class="mega__go" aria-hidden="true">${icon('arrow')}</span></span>
</a>`;
}
function megaStore(ctx, st) {
  const s = ctx.site;
  return `<div class="mega__store">
<a class="mega__store-media"${linkAttrs(st.href)} aria-label="${escA(st.title)}">${photoCard(ctx, st.photo)}</a>
<div class="mega__store-body">
<a class="mega__store-t"${linkAttrs(st.href)}>${esc(st.title)}</a>
<ul class="mega__store-facts">
<li>${icon('pin')}<a${linkAttrs(s.directions)}>${esc(s.address.full)}</a></li>
<li>${icon('clock')}<span>${esc(s.hours.text)}</span></li>
<li>${icon('phone')}<a${linkAttrs(s.phoneHref)}>${esc(s.phone)}</a></li>
</ul>
</div>
</div>`;
}
function megaGroup(ctx, g, p) {
  const gh = g.href ? res(ctx, g.href) : '';
  const head = gh ? `<a class="mega__h mega__h--link"${linkAttrs(gh)}${cur(gh, p)}>${esc(g.title)}${icon('arrow')}</a>` : `<p class="mega__h">${esc(g.title)}</p>`;
  if (g.kind === 'cards') {
    const n = (g.links || []).length;
    return `<div class="mega__group mega__group--cards mega__group--n${n}">${head}
<ul class="mega__cards">${(g.links || []).map((l, k) => {
      const h = res(ctx, l.href);
      return `<li><a class="mega__card"${linkAttrs(h)}${cur(h, p)} style="--i:${k}"><span class="mega__card-media">${genCard(l.gimg)}<span class="mega__card-light" aria-hidden="true"></span></span><span class="mega__card-t">${esc(l.label)}${icon('arrow')}</span></a></li>`;
    }).join('')}</ul></div>`;
  }
  return `<div class="mega__group mega__group--links">${head}
${g.note ? `<p class="mega__note">${esc(g.note)}</p>` : ''}
<ul class="mega__links">${(g.links || []).map((l) => {
    const h = res(ctx, l.href);
    return `<li><a class="mega__link"${linkAttrs(h)}${cur(h, p)}><span>${esc(l.label)}</span>${l.external || isExt(h) ? icon('ext', 'icon--ext') : icon('arrow', 'icon--go')}</a></li>`;
  }).join('')}</ul></div>`;
}
function megaHtml(ctx, it, p) {
  const m = it.mega;
  const groups = m.groups || [];
  const cards = groups.filter((g) => g.kind === 'cards');
  const links = groups.filter((g) => g.kind !== 'cards');
  const lead = m.store ? megaStore(ctx, m.store) : m.feature ? megaFeature(ctx, m.feature, p) : '';
  const kind = m.store ? 'store' : cards.some((g) => (g.links || []).length > 4) ? 'wide' : cards.length ? 'guides' : 'duo';
  return `<div class="mega mega--${kind}" id="mega-${idOf(it.label)}" data-mega-panel>
<div class="mega__panel">
${lead ? `<div class="mega__lead">${lead}</div>` : ''}
${cards.map((g) => megaGroup(ctx, g, p)).join('\n')}
${links.length ? `<div class="mega__col">${links.map((g) => megaGroup(ctx, g, p)).join('\n')}</div>` : ''}
</div>
</div>`;
}
function navHtml(ctx, p) {
  const s = ctx.site;
  const ia = ctx.ia;
  const items = (ia.nav || []).map((it) => {
    const h = res(ctx, it.href);
    if (!it.mega) return `<li class="nav__item"><div class="nav__row"><a class="nav__link"${linkAttrs(h)}${cur(h, p)}>${esc(it.label)}${it.external || isExt(h) ? icon('ext', 'icon--ext') : ''}</a></div></li>`;
    const id = 'mega-' + idOf(it.label);
    return `<li class="nav__item has-mega${isCur(h, p) ? ' is-current' : ''}" data-mega>
<div class="nav__row"><a class="nav__link"${linkAttrs(h)}${cur(h, p)}>${esc(it.label)}</a><button class="nav__more" type="button" aria-expanded="false" aria-controls="${id}" data-mega-trigger>${icon('chev')}<span class="vh">${esc(it.label)} menu</span></button></div>
${megaHtml(ctx, it, p)}
</li>`;
  }).join('\n');
  const pr = ia.promo || {};
  return `<nav class="nav" id="site-nav" aria-label="Main" data-nav>
<div class="nav__drawer-head">${logoHtml(ctx, { cls: 'nav__logo', sizes: '170px' })}<button class="nav__close" type="button" data-nav-close>${icon('close')}<span class="vh">Close menu</span></button></div>
<ul class="nav__list">
${items}
</ul>
<div class="nav__drawer-foot">
<a class="btn nav__cta"${linkAttrs(res(ctx, ia.cta.href))}>${esc(ia.cta.label)}${icon('ext')}</a>
<ul class="nav__quick">
${pr.link ? `<li>${icon('truck')}<a${linkAttrs(pr.link.href)}${cur(pr.link.href, p)}>${esc(ctx.site.delivery && ctx.site.delivery.title ? ctx.site.delivery.title : pr.link.label)}</a></li>` : ''}
${pr.pickup ? `<li>${icon('pin')}<a${linkAttrs(pr.pickup.href)}${cur(pr.pickup.href, p)}>${esc(pr.pickup.label)} ${esc(pr.pickup.store)}</a></li>` : ''}
<li>${icon('clock')}<span>${esc(s.hours.text)}</span></li>
<li>${icon('phone')}<a${linkAttrs(s.phoneHref)}>${esc(s.phone)}</a></li>
${(pr.links || []).map((l) => `<li>${icon('arrow')}<a${linkAttrs(l.href)}${cur(l.href, p)}>${esc(l.label)}</a></li>`).join('')}
</ul>
</div>
</nav>`;
}

function promoHtml(ctx, p) {
  const pr = ctx.ia.promo || {};
  return `<div class="promo" data-promo>
<div class="promo__inner">
<p class="promo__offer">${icon('truck', 'promo__ico')}<span class="promo__text">${esc(pr.text)}</span>${pr.link ? `<a class="promo__link"${linkAttrs(pr.link.href)}${cur(pr.link.href, p)}>${esc(pr.link.label)}${icon('arrow')}</a>` : ''}</p>
<ul class="promo__facts">
${pr.pickup ? `<li><a class="promo__link promo__link--plain"${linkAttrs(pr.pickup.href)}${cur(pr.pickup.href, p)}>${icon('pin')}<span>${esc(pr.pickup.label)} <strong>${esc(pr.pickup.store)}</strong></span></a></li>` : ''}
${pr.hours ? `<li class="promo__hours">${icon('clock')}<span>${esc(pr.hours)}</span></li>` : ''}
${(pr.links || []).map((l) => `<li><a class="promo__link promo__link--plain"${linkAttrs(l.href)}${cur(l.href, p)}>${esc(l.label)}</a></li>`).join('')}
</ul>
</div>
</div>`;
}

function headerHtml(ctx, p) {
  const ia = ctx.ia;
  const c = res(ctx, ia.cta.href);
  return `${promoHtml(ctx, p)}
<header class="site-header" data-header>
<div class="mainbar">
${logoHtml(ctx, { eager: true, current: p === '/', cls: 'mainbar__logo', sizes: '(max-width: 720px) 150px, 210px' })}
${navHtml(ctx, p)}
<div class="header-tools">
<a class="btn btn--sm header-cta"${linkAttrs(c)}>${esc(ia.cta.label)}${icon('ext')}</a>
<button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" data-nav-toggle>${icon('menu')}<span class="nav-toggle__t">Menu</span><span class="vh"> open</span></button>
</div>
</div>
</header>
<div class="nav-scrim" data-nav-scrim hidden></div>`;
}

// ---------- footer: night ground with a lantern pool, the giant wordmark with its light ----------
function footerHtml(ctx, p) {
  const s = ctx.site;
  const f = ctx.ia.footer || {};
  const vip = s.vip || {};
  const col = (c) => `<div class="footer__col"><h2 class="footer__h">${esc(c.title)}</h2><ul class="footer__links">${(c.links || []).map((l) => { const h = res(ctx, l.href); return `<li><a${linkAttrs(h)}${cur(h, p)}>${esc(l.label)}${extIco(h)}</a></li>`; }).join('')}</ul></div>`;
  return `<footer class="site-footer" data-lantern>
<div class="site-footer__clip" aria-hidden="true"><span class="site-footer__lantern"></span></div>
<div class="wrap wrap--wide footer__inner">
<div class="footer__vip glass glass--dark" data-spot>
<div class="footer__vip-text">${icon('crown', 'footer__vip-ico')}<p><strong class="footer__vip-t">${esc(vip.title || 'VIP Club')}</strong> <span>${esc(vip.line || '')}</span></p></div>
<a class="btn btn--copper"${linkAttrs('/loyalty-sign-up/')}${cur('/loyalty-sign-up/', p)}>${esc(vip.cta || 'Join Now')}${icon('arrow')}</a>
</div>
<div class="footer__top">
<div class="footer__brand">${logoHtml(ctx, { cls: 'footer__logo', invert: true, sizes: '220px' })}<p class="footer__tag">${esc(s.aboutName || s.tagline || '')}</p></div>
<nav class="footer__cols" aria-label="Footer">
${(f.columns || []).map(col).join('\n')}
</nav>
<div class="footer__col footer__visit">
<h2 class="footer__h">Visit</h2>
<address class="footer__addr">
<a${linkAttrs(s.directions)}>${icon('pin')}<span>${esc(s.address.street)}<br>${esc(`${s.address.city}, ${s.address.state} ${s.address.zip}`)}</span></a>
<a${linkAttrs(s.phoneHref)}>${icon('phone')}<span>${esc(s.phone)}</span></a>
<a${linkAttrs('mailto:' + s.email)}>${icon('mail')}<span>${esc(s.email)}</span></a>
</address>
${hoursHtml(ctx, 'footer__hours')}
<h2 class="footer__h footer__h--follow">${esc(f.follow || 'Follow')}</h2>
<ul class="footer__social">
<li><a${linkAttrs(s.social.facebook)}>${icon('facebook')}<span>Facebook</span></a></li>
<li><a${linkAttrs(s.social.instagram)}>${icon('instagram')}<span>Instagram</span></a></li>
</ul>
</div>
</div>
</div>
<div class="footer__mark" data-footer-light aria-hidden="true"><span class="footer__word">CASTLELEAF</span></div>
<div class="wrap wrap--wide footer__bottom">
<p class="footer__legalline">${esc(s.legalLine)}</p>
<p class="footer__copy">${esc(s.copyright)}</p>
<p class="footer__legal">${(f.legal || []).map((l) => `<a${linkAttrs(l.href)}${cur(l.href, p)}>${esc(l.label)}</a>`).join('<span class="footer__sep" aria-hidden="true"> | </span>')}</p>
<a class="footer__totop" href="#top" data-to-top>Back to top${icon('up')}</a>
</div>
</footer>`;
}

// ---------- 21+ gate (D7): words from site.json; hidden in the HTML, so it never blocks without JS ----------
function gateHtml(ctx) {
  const g = ctx.site.ageGate || {};
  return `<div class="age-gate" data-age-gate data-age-key="cl-age-ok" hidden>
<div class="age-gate__dialog glass glass--strong" role="dialog" aria-modal="true" aria-labelledby="age-gate-t" aria-describedby="age-gate-q">
<div class="age-gate__mark">${markHtml(ctx, { cls: 'age-gate__crown', sizes: '120px' })}</div>
<h2 class="age-gate__t" id="age-gate-t">${esc(g.title || '')}</h2>
<p class="age-gate__q" id="age-gate-q">${esc(g.question || '')}</p>
<div class="btn-row age-gate__actions"><button class="btn" type="button" data-age-yes>${esc(g.yes || 'Yes')}</button><button class="btn btn--ghost" type="button" data-age-no>${esc(g.no || 'No')}</button></div>
<p class="age-gate__no" data-age-refusal role="alert" hidden>${esc(g.denied || '')}</p>
</div>
</div>`;
}

// ---------- inner page hero (contract section 6) ----------
function ctaHtml(ctx, cta, dark) {
  if (!cta) return '';
  if (typeof cta === 'string') return cta;
  return [].concat(cta).filter(Boolean).map((c, i) => {
    if (typeof c === 'string') return c;
    const h = res(ctx, c.href);
    const cls = c.cls || (c.ghost || i > 0 ? (dark ? 'btn btn--light' : 'btn btn--ghost') : 'btn');
    return `<a class="${escA(cls)}"${linkAttrs(h)}>${esc(c.label)}${isExt(h) ? icon('ext') : icon('arrow')}</a>`;
  }).join('');
}
function heroMedia(ctx, media) {
  if (!media) return '';
  if (typeof media === 'string') return media;
  const o = { alt: media.alt ?? '', cls: 'frame__img', eager: media.eager !== false, sizes: '(min-width: 1024px) 34vw, (min-width: 720px) 44vw, 78vw', attrs: media.pos ? { style: `object-position:${media.pos}` } : {} };
  const pic = media.gimg ? gimg(media.gimg, o) : media.photo ? photo(ctx, media.photo, o) : media.html || '';
  return `<figure class="arch-frame page-hero__frame" data-reveal="arch">${pic}</figure>${media.chip ? `<div class="page-hero__chip glass">${media.chip}</div>` : ''}`;
}
export function pageHero({ ctx, kicker = '', h1Html = '', lede = '', crumbs = [], cta = null, media = '', tone = 'linen', cls = '', id = '', attrs: at = {} }) {
  const t = ['linen', 'cream', 'sage', 'night'].includes(tone) ? tone : 'linen';
  const dark = t === 'night';
  const c = ctaHtml(ctx, cta, dark);
  const m = heroMedia(ctx, media);
  return `<section class="page-hero band band--${t}${dark ? ' band--haze-bottom' : ''}${m ? ' page-hero--media' : ''}${cls ? ' ' + escA(cls) : ''}"${id ? ` id="${escA(id)}"` : ''}${dark ? ' data-lantern' : ''}${attrs(at)}>
${bandBg(dark ? 'g-stage-gallery' : '', { leaf: dark ? '' : 'tl', veil: dark ? 'night' : '', eager: true })}
<div class="wrap page-hero__inner">
<div class="page-hero__text">
${crumbsHtml(crumbs)}
${kicker ? `<p class="kicker" data-reveal>${esc(kicker)}</p>` : ''}
<h1 class="display page-hero__h1" data-reveal style="--i:1">${h1Html}</h1>
${lede ? `<p class="lede page-hero__lede" data-reveal style="--i:2">${lede}</p>` : ''}
${c ? `<div class="btn-row page-hero__cta" data-reveal style="--i:3">${c}</div>` : ''}
</div>
${m ? `<div class="page-hero__media" data-depth="-0.06">${m}</div>` : ''}
</div>
</section>`;
}

// ---------- content blocks -> designed components ----------
// Captured blocks (key t: h1..h6 p text ul ol links linkcard grid figure details img svg nav quote dl table button embed video card
// hidden) and new blocks (key type: p h2 h3 h4 ul ol callout steps faq quote img). A captured h1 renders as h2 (the hero owns the h1);
// captured img (lazy placeholders), svg (icons), hidden and breadcrumb nav blocks are skipped (pageHero prints the crumbs).
const stepItem = (it, i) => {
  const title = typeof it === 'string' ? '' : it.title || it.heading || '';
  const raw = typeof it === 'string' ? it : it.html || it.text || '';
  const text = (typeof it !== 'string' && it.html) || /<[a-z]/i.test(raw) ? rewriteLinks(raw) : esc(raw);
  return `<li class="step" data-reveal style="--i:${i}"><span class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${title ? `<h3 class="step__title">${esc(title)}</h3>` : ''}${text ? `<div class="step__text">${text}</div>` : ''}</li>`;
};
const hasAnchor = (h) => /<a\s/i.test(h);
function renderBlocks(list, ctx, depth) {
  const out = [];
  for (const b of list || []) {
    if (!b || typeof b !== 'object') continue;
    const cap = b.t != null;
    const t = cap ? b.t : b.type;
    const inner = (x) => (x == null ? '' : rewriteLinks(x));
    switch (t) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const lvl = t === 'h1' ? 'h2' : t;
        const body = b.html != null ? inner(b.html) : esc(b.text);
        if (!body.trim()) break;
        out.push(`<${lvl} class="prose__${lvl}"${b.id ? ` id="${escA(b.id)}"` : ''}>${body}</${lvl}>`);
        break;
      }
      case 'p': case 'text': {
        const body = b.html != null ? inner(b.html) : esc(b.text);
        if (body.trim()) out.push(`<p>${body}</p>`);
        break;
      }
      case 'ul': case 'ol':
        out.push(`<${t}>${(b.items || []).map((x) => `<li>${typeof x === 'string' ? inner(x) : x && x.blocks ? renderBlocks(x.blocks, ctx, depth + 1) : inner(x && (x.html ?? esc(x.text)))}</li>`).join('')}</${t}>`);
        break;
      case 'links': {
        const items = (b.items || []).filter((x) => x && x.href != null);
        if (items.length) out.push(`<p class="prose__links">${items.map((x) => `<a class="link-arrow"${linkAttrs(liveHref(x.href))}>${x.html}${icon(isExt(liveHref(x.href)) ? 'ext' : 'arrow')}</a>`).join(' ')}</p>`);
        break;
      }
      case 'linkcard': {
        const body = renderBlocks(b.blocks, ctx, depth + 1);
        if (!body.trim()) break;
        const h = liveHref(b.href || '');
        out.push(h && !hasAnchor(body) ? `<a class="prose__card"${linkAttrs(h)}>${body}</a>` : `<div class="prose__card">${body}</div>`);
        break;
      }
      case 'card': case 'figure': {
        const body = renderBlocks(b.blocks, ctx, depth + 1);
        if (body.trim()) out.push(`<div class="prose__card">${body}</div>`);
        break;
      }
      case 'grid': {
        const body = renderBlocks(b.blocks, ctx, depth + 1);
        if (body.trim()) out.push(`<div class="prose__grid">${body}</div>`);
        break;
      }
      case 'details': {
        const body = renderBlocks(b.blocks, ctx, depth + 1) || inner(b.html);
        out.push(`<div class="faq prose__faq" data-faq><details><summary>${b.summary != null ? inner(b.summary) : ''}${icon('plus', 'faq__ico')}</summary><div class="faq__a">${body}</div></details></div>`);
        break;
      }
      case 'faq':
        out.push(`<div class="faq prose__faq" data-faq>${(b.items || []).map((x) => `<details><summary>${esc(x.q)}${icon('plus', 'faq__ico')}</summary><div class="faq__a">${inner(x.a_html ?? esc(x.a))}</div></details>`).join('')}</div>`);
        break;
      case 'quote':
        out.push(`<blockquote class="prose__quote">${b.html != null ? inner(b.html) : b.blocks ? renderBlocks(b.blocks, ctx, depth + 1) : esc(b.text)}</blockquote>`);
        break;
      case 'callout':
        out.push(`<aside class="callout">${b.html != null ? inner(b.html) : esc(b.text)}</aside>`);
        break;
      case 'steps':
        out.push(`<ol class="steps">${(b.items || []).map(stepItem).join('')}</ol>`);
        break;
      case 'dl': {
        const rows = (b.items || b.rows || []).map((x) => (Array.isArray(x) ? x : [x.dt ?? x.term ?? x.label ?? '', x.dd ?? x.html ?? x.value ?? '']));
        if (rows.length) out.push(`<dl class="spec prose__spec">${rows.map(([k, v]) => `<div class="spec__row"><dt>${inner(k)}</dt><dd>${inner(v)}</dd></div>`).join('')}</dl>`);
        else if (b.html) out.push(`<div>${inner(b.html)}</div>`);
        break;
      }
      case 'table': {
        if (b.html) { out.push(`<div class="prose__table">${inner(b.html)}</div>`); break; }
        const rows = b.rows || b.items || [];
        if (rows.length) out.push(`<div class="prose__table"><table>${rows.map((r, i) => `<tr>${[].concat(r).map((c) => (i === 0 && b.head !== false ? `<th>${inner(c)}</th>` : `<td>${inner(c)}</td>`)).join('')}</tr>`).join('')}</table></div>`);
        break;
      }
      case 'button': {
        const label = b.html != null ? inner(b.html) : esc(b.text);
        if (!label.trim()) break;
        out.push(b.href ? `<p><a class="btn btn--ghost"${linkAttrs(liveHref(b.href))}>${label}</a></p>` : `<p class="prose__label"><span class="tag">${label}</span></p>`);
        break;
      }
      case 'embed': {
        const src = String(b.src || '');
        if (!/^https?:/i.test(src)) break;
        out.push(`<figure class="frame prose__embed"><iframe src="${escA(src)}" title="${escA(b.title || 'Embedded content')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><figcaption><a${linkAttrs(src)}>${esc(b.title || 'Open in a new tab')}</a></figcaption></figure>`);
        break;
      }
      case 'video': {
        const src = String(b.src || '');
        if (!src) break;
        out.push(`<figure class="frame prose__video"><video controls preload="none" playsinline src="${escA(src)}"${b.poster ? ` poster="${escA(b.poster)}"` : ''}></video></figure>`);
        break;
      }
      case 'img': {
        if (cap) break; // captured images are lazy-load placeholders: pages place the client's photos by id (D5)
        const o = { alt: b.alt ?? '', cls: 'frame__img', sizes: '(min-width: 1024px) 680px, 92vw' };
        const pic = b.gimg ? gimg(b.gimg, o) : b.photo ? photo(ctx, b.photo, o) : '';
        if (pic) out.push(`<figure class="frame prose__figure">${pic}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`);
        break;
      }
      case 'svg': case 'hidden': break;
      case 'nav': {
        if (/crumb/i.test(String(b.label || ''))) break; // the hero prints the breadcrumb
        const body = renderBlocks(b.blocks, ctx, depth + 1);
        if (body.trim()) out.push(`<nav class="prose__nav"${b.label ? ` aria-label="${escA(b.label)}"` : ''}>${body}</nav>`);
        break;
      }
      default:
        if (b.blocks) out.push(renderBlocks(b.blocks, ctx, depth + 1));
        else if (b.html) out.push(`<div>${inner(b.html)}</div>`);
    }
  }
  return out.filter(Boolean).join('\n');
}
export function blocks(list = [], ctx) {
  return `<div class="prose">\n${renderBlocks(list, ctx, 0)}\n</div>`;
}

// ---------- head ----------
function ogImage(ctx, og) {
  const u = og.image || '/assets/photos/cl/CL-OG.png';
  return /^https?:/i.test(u) ? u : (ctx.site.origin || '') + u;
}
const to24 = (t) => {
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return '';
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};
function storeLd(ctx) {
  const s = ctx.site;
  const a = s.address || {};
  const days = ((s.hours && s.hours.days) || []).map(([d, t]) => {
    const [o, c] = String(t).split(/\s+to\s+/i);
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: d, opens: to24(o), closes: to24(c) };
  }).filter((x) => x.opens && x.closes);
  return {
    '@context': 'https://schema.org', '@type': 'Store', name: s.longName || s.name, url: s.origin + '/',
    telephone: String(s.phoneHref || '').replace(/^tel:/, ''), email: s.email, image: s.origin + '/assets/photos/cl/CL-Image-Hero.webp',
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.state, postalCode: a.zip, addressCountry: 'US' },
    openingHoursSpecification: days, hasMap: s.directions, sameAs: [s.social.facebook, s.social.instagram].filter(Boolean),
  };
}
const BRAND_DIR = path.join(ROOT, 'assets/brand');
const brandFile = (f) => fs.existsSync(path.join(BRAND_DIR, f));

export function page({ ctx, path: p, title, description, canonical, og = {}, jsonld = [], bodyClass = '', main = '', crumbs = [], heroCrumbs = false, scripts = [], preload = [] }) {
  og = og || {};
  const can = canonical || absUrl(ctx, p);
  const css = (ctx.cssFiles || []).map((f) => `<link rel="stylesheet" href="/assets/css/${escA(f)}.css">`).join('\n');
  const lds = [].concat(jsonld || []).filter(Boolean);
  const types = lds.map((o) => o['@type']);
  if (crumbs && crumbs.length > 1 && !types.includes('BreadcrumbList')) {
    lds.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((raw, i) => { const c = crumbParts(raw); return { '@type': 'ListItem', position: i + 1, name: c.label, item: absUrl(ctx, c.href || p) }; }) });
  }
  if (p === '/' && !types.some((x) => /Store|LocalBusiness/.test(String(x)))) lds.push(storeLd(ctx));
  const ld = lds.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const pre = [].concat(preload || []).filter(Boolean).map((x) => `<link rel="preload"${attrs(x)}>`).join('\n');
  const jsList = [...new Set([...(ctx.jsFiles || []), ...(scripts || [])])].filter((f) => !ctx.jsFiles || ctx.jsFiles.includes(f));
  jsList.sort((a, b) => (a === 'site.js' ? -1 : b === 'site.js' ? 1 : 0));
  const printCrumbs = crumbs && crumbs.length && !heroCrumbs && !/class="crumbs"/.test(main);
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${escA(description)}">
<link rel="canonical" href="${escA(can)}">
<meta property="og:site_name" content="${escA(ctx.site.name)}">
<meta property="og:title" content="${escA(og.title || title)}">
<meta property="og:description" content="${escA(og.description || description)}">
<meta property="og:url" content="${escA(og.url || can)}">
<meta property="og:type" content="${escA(og.type || 'website')}">
<meta property="og:image" content="${escA(ogImage(ctx, og))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#456445">
${brandFile('favicon-32.png') ? '<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">' : ''}
${brandFile('favicon-48.png') ? '<link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png">' : ''}
${brandFile('favicon.ico') ? '<link rel="alternate icon" href="/favicon.ico" sizes="any">' : ''}
${brandFile('apple-touch-icon.png') ? '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' : ''}
<link rel="preload" href="/assets/fonts/fraunces-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/figtree-normal-latin.woff2" as="font" type="font/woff2" crossorigin>
${pre}
${css}
<script>(function(d){var r=d.documentElement;r.classList.add('js');var ok=false;try{ok=localStorage.getItem('cl-age-ok')==='1'}catch(e){}if(!ok){r.classList.add('gate-pending');setTimeout(function(){if(!window.clReady)r.classList.remove('gate-pending')},4000)}})(document);</script>
${ld}
</head>
<body id="top"${attrs({ class: bodyClass })}>
<div class="site">
${headerHtml(ctx, p)}
${printCrumbs ? `<div class="crumbs-bar"><div class="wrap wrap--wide">${crumbsHtml(crumbs)}</div></div>` : ''}
<main id="main">
${main}
</main>
${footerHtml(ctx, p)}
</div>
${gateHtml(ctx)}
${jsList.map((f) => `<script src="/assets/js/${escA(f)}" defer></script>`).join('\n')}
</body>
</html>`;
}
