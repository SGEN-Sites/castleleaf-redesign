// home.mjs - CastleLeaf home "/" (HOME lane, "Lantern Keep"; docs/BUILD-CONTRACT.md section 6, HOME).
//   1 hero: a tenebrist stage (pinned scroll-through from 1024 wide / 560 tall) with the arched building frame crossing into 2
//   2 How To Shop: the delivery + budtender bento (gold haze)      3 Cannabis Bundles: smoked glass price tiles on veined obsidian
//   4 Shop By Cannabis Category: the one dark band, a horizontal scroll-through + the live-menu shortcuts
//   5 Shop By Cannabis Effect      6 Craft Kitchen & Dispensary (editorial)      7 FAQ (D2a pairings)      8 events + journal
// Every captured word comes from pages/home.json (dash-normalised at load); the FAQ pairs come from pages/faqs.json (D2a);
// facts from ctx.site. New words are neutral glue only (kickers, labels, alt text). A captured block that cannot be found
// stops the build (fail closed).
import * as shell from './shell.mjs';
import { esc, escA, linkAttrs, gimg, photo, menu, rewriteLinks, liveHref, absUrl, hasGenerated, stripTags } from './util.mjs';

const ico = (n, c = '') => shell.icon(n, c);
const plain = (html) => stripTags(String(html ?? '')).replace(/\s+/g, ' ').trim();
const HERO_SIZES = '100vw';
// band textures (revision 1, generated, decorative): full-bleed grounds under a veil
const TEX_SIZES = '(max-width: 720px) 720px, 100vw';
// the frame is a tall 3:5 arch cut from a landscape photo, so the rendered image is about 2.4x the frame's width
const FRAME_SIZES = '(max-width: 720px) 150vw, (max-width: 1023.98px) 110vw, 64vw';

// ---------- captured copy: the home capture is one long list of blocks; read it by heading ----------
function reader(home) {
  const B = (home.sections || []).flatMap((s) => s.blocks || []);
  const need = (v, what) => { if (v == null || v === -1 || v === false) throw new Error('home.json: missing ' + what); return v; };
  const idx = (t, text, from = 0) => need(B.findIndex((b, i) => i >= from && b.t === t && plain(b.html) === text), `${t} "${text}"`);
  // blocks after a heading up to the next h2
  const after = (i) => { const out = []; for (let j = i + 1; j < B.length && B[j].t !== 'h2'; j++) out.push(B[j]); return out; };
  return { B, need, idx, after };
}
const linksIn = (b) => {
  if (!b) return [];
  if (b.t === 'links') return (b.items || []).map((x) => ({ href: x.href, html: x.html }));
  const out = [];
  String(b.html || '').replace(/<a\b[^>]*\shref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (m, q, h, inner) => { out.push({ href: h.replace(/&amp;/g, '&'), html: inner }); return m; });
  return out;
};

// Split a heading so ONE word is the italic accent, keeping the source's words and order exactly.
function accent(text, word) {
  const t = String(text);
  const i = t.indexOf(word);
  if (i === -1) return esc(t);
  return `${esc(t.slice(0, i))}<em class="accent">${esc(word)}</em>${esc(t.slice(i + word.length))}`;
}

// ---------- 1. hero ----------
function renderHero(ctx, r) {
  const { site } = ctx;
  const { B, idx, need } = r;
  const h1Text = need(plain(B.find((b) => b.t === 'h1')?.html) || ctx.content.home.h1, 'h1');
  const PLACE = 'Brighton MA';
  if (!h1Text.endsWith(PLACE)) throw new Error(`home.json h1 "${h1Text}" no longer ends in "${PLACE}"`);
  const lead = h1Text.slice(0, h1Text.length - PLACE.length).trim();
  const h2i = idx('h2', 'Craft Kitchen & Dispensary');
  const lede = need(B[h2i + 1] && B[h2i + 1].t === 'p' ? B[h2i + 1] : null, 'hero paragraph');
  const shopBlock = need(B[h2i + 2] && B[h2i + 2].t === 'links' ? B[h2i + 2] : null, 'hero Shop Menu link');
  const shopLabel = plain(shopBlock.items[0].html);
  const delivery = need(site.ways.items.find((w) => w.key === 'delivery'), 'site.ways delivery');

  const loop = ctx.images && ctx.images.media && ctx.images.media['hero-loop'];
  const pw = (loop && loop.w) || 1920;
  const ph = (loop && loop.h) || 1080;
  const still = loop && loop.poster
    ? `<img class="h-hero__still" src="${escA(loop.poster)}" alt="" width="${escA(pw)}" height="${escA(ph)}" fetchpriority="high" decoding="async">`
    : gimg('g-hero-lantern', { alt: '', eager: true, cls: 'h-hero__still', sizes: HERO_SIZES });
  const video = loop && loop.mp4
    ? `<video class="h-hero__loop" id="h-hero-loop" data-inview-play data-after-load muted loop playsinline preload="none" width="${escA(pw)}" height="${escA(ph)}" poster="${escA(loop.poster || '')}" aria-hidden="true" tabindex="-1">${loop.mp4Small ? `<source src="${escA(loop.mp4Small)}" type="video/mp4" media="(max-width: 720px)">` : ''}<source src="${escA(loop.mp4)}" type="video/mp4"></video>`
    : '';
  const toggle = video
    ? `<button class="video-toggle h-hero__toggle" type="button" data-video-toggle aria-controls="h-hero-loop" aria-pressed="false">${ico('pause')}${ico('play')}<span class="video-toggle__label">Pause motion</span></button>`
    : '';
  // today's hours: the seven days ride on the chip; a tiny script swaps the week summary for today's line
  const days = JSON.stringify(site.hours.days.map(([, t]) => t));

  return `<section class="h-hero" id="h-hero" aria-labelledby="h-h1" data-pin style="--pin-h:150vh"${video ? ' data-video-host' : ''}>
<div class="pin-stage h-stage" data-lantern>
<div class="band__clip h-hero__clip" aria-hidden="true">
<div class="h-hero__plate">${still}${video}</div>
<div class="h-hero__lantern"></div>
<div class="h-hero__shade"></div>
<div class="h-hero__day"></div>
<div class="h-hero__haze"></div>
</div>
<div class="wrap wrap--wide h-hero__inner">
<div class="h-hero__type">
<h1 class="h-hero__h1" id="h-h1"><span class="h-hero__lead">${esc(lead)}</span> <span class="h-hero__place"><em class="accent">Brighton</em> MA</span></h1>
<h2 class="h-hero__h2">${accent(plain(B[h2i].html), 'Craft')}</h2>
<p class="h-hero__lede">${rewriteLinks(lede.html)}</p>
<div class="btn-row h-hero__ctas">
<a class="btn btn--primary h-hero__shop"${linkAttrs(menu(ctx))}>${esc(shopLabel)}${ico('arrow')}</a>
<a class="btn btn--glass h-hero__deliv"${linkAttrs('/delivery/')}>${ico('truck')}${esc(delivery.title)}</a>
</div>
</div>
</div>
<div class="h-hero__frame-at">
<figure class="arch-frame h-hero__frame">
<span class="h-hero__frame-in">${photo(ctx, 'cl/CL-Image-Hero.webp', { alt: 'The CastleLeaf dispensary in Brighton: a white-painted brick building with a round tower and the CastleLeaf sign over the door', cls: 'h-hero__frame-img', eager: true, sizes: FRAME_SIZES })}</span>
</figure>
<a class="h-hero__chip glass"${linkAttrs('/stores/brighton-ma/')} data-h-days="${escA(days)}">
<span class="h-hero__chip-ico">${ico('clock')}</span>
<span class="h-hero__chip-txt"><span class="h-hero__chip-k" data-h-today-k>${esc(site.hours.label)}</span><span class="h-hero__chip-v" data-h-today-v>${esc(site.hours.text)}</span></span>
</a>
</div>
${toggle ? `<div class="h-hero__ctrl">${toggle}</div>` : ''}
</div>
</section>`;
}

// ---------- 2. How To Shop: the delivery + budtender showcase ----------
function renderWays(ctx, r) {
  const { site } = ctx;
  const { B, idx, need } = r;
  const hi = idx('h2', 'How To Shop At Castle Leaf Dispensary');
  const intro = need(B[hi + 1] && B[hi + 1].t === 'p' ? B[hi + 1] : null, 'How To Shop line');
  const newTo = need(linksIn(B[hi + 2])[0], 'New To Cannabis? link');
  const w = Object.fromEntries(site.ways.items.map((x) => [x.key, x]));
  const resolve = (h) => (h === 'menu' ? menu(ctx) : h);
  const cta = (it, cls = 'btn--light') => `<a class="btn ${cls} btn--sm h-way__cta"${linkAttrs(resolve(it.href))}>${esc(it.cta)}${ico('arrow')}</a>`;
  const del = need(w.delivery, 'ways delivery');
  const bud = need(w.budtender, 'ways budtender');
  const onl = need(w.online, 'ways online');
  const kio = need(w.kiosk, 'ways kiosk');

  return `<section class="h-ways band band--linen" id="how-to-shop" aria-labelledby="h-ways-h">
<div class="band__clip h-ways__clip" aria-hidden="true">${gimg('g-tex-gold-haze', { alt: '', cls: 'band__bg h-ways__bg', sizes: TEX_SIZES })}<span class="h-ways__veil"></span></div>
<div class="wrap wrap--wide h-ways__wrap">
<header class="h-head h-ways__head">
<div>
<p class="kicker" data-reveal>Delivery, pick-up or in store</p>
<h2 class="h-head__h h-ways__h" id="h-ways-h" data-reveal="lines">${accent(plain(B[hi].html), 'Shop')}</h2>
</div>
<div class="h-head__side h-ways__side" data-reveal style="--i:1">
<p class="lede h-ways__line">${rewriteLinks(intro.html)}</p>
<a class="btn btn--ghost h-ways__new"${linkAttrs(liveHref(newTo.href))}>${esc(plain(newTo.html))}${ico('arrow')}</a>
</div>
</header>
<ul class="bento h-ways__grid" role="list">
<li class="tile tile--big tile--photo h-way h-way--delivery" data-reveal data-spot>
<span class="h-way__media">${gimg('g-feature-delivery', { alt: '', cls: 'h-way__img', sizes: '(max-width: 1023.98px) 92vw, 46vw' })}</span>
<div class="h-way__panel glass glass--dark">
<p class="kicker h-way__kicker">From our shop to your door</p>
<h3 class="h-way__title h-way__title--xl">${esc(del.title)}</h3>
<p class="h-way__line">${esc(del.line)}</p>
<p class="h-way__line h-way__line--2">${esc(site.delivery.orderLine)}</p>
${cta(del, 'btn--copper')}
</div>
</li>
<li class="tile tile--wide h-way h-way--budtender" data-reveal style="--i:1" data-spot>
<span class="h-way__media">${gimg('g-feature-budtender', { alt: '', cls: 'h-way__img', sizes: '(max-width: 720px) 92vw, (max-width: 1023.98px) 60vw, 28vw' })}</span>
<div class="h-way__panel glass glass--strong">
<p class="kicker h-way__kicker">${esc(site.budtenders.operatorClaim)}</p>
<h3 class="h-way__title">${esc(bud.title)}</h3>
<p class="h-way__line">${esc(bud.line)}</p>
${cta(bud, 'btn--primary')}
</div>
</li>
<li class="tile tile--pop glass h-way h-way--online" data-reveal style="--i:2" data-spot>
<span class="tile__pop h-way__pop" aria-hidden="true">${gimg('g-cut-jar', { alt: '', cls: 'cut h-way__pop-img', sizes: '(max-width: 720px) 40vw, 12vw' })}</span>
<span class="h-way__ico" aria-hidden="true">${ico('cart')}</span>
<h3 class="h-way__title">${esc(onl.title)}</h3>
<p class="h-way__line">${esc(onl.line)}</p>
${cta(onl, 'btn--ghost')}
</li>
<li class="tile h-way h-way--kiosk" data-reveal style="--i:3" data-spot>
<span class="h-way__media">${gimg('g-feature-kiosk', { alt: '', cls: 'h-way__img', sizes: '(max-width: 1023.98px) 92vw, 22vw' })}</span>
<div class="h-way__panel glass">
<span class="h-way__ico" aria-hidden="true">${ico('kiosk')}</span>
<h3 class="h-way__title">${esc(kio.title)}</h3>
<p class="h-way__line">${esc(kio.line)}</p>
${cta(kio, 'btn--ghost')}
</div>
</li>
</ul>
</div>
</section>`;
}

// ---------- 3. Cannabis Bundles ----------
function renderBundles(ctx, r) {
  const { B, idx, need } = r;
  const hi = idx('h2', 'Cannabis Bundles');
  const list = [];
  let all = null;
  for (let j = hi + 1; j < B.length && B[j].t !== 'h2'; j++) {
    const b = B[j];
    if (b.t === 'h3') { const a = linksIn(b)[0]; list.push({ title: plain(b.html), href: a ? a.href : '' }); continue; }
    const cur = list[list.length - 1];
    if (b.t === 'text' && cur && !cur.line) { cur.line = plain(b.html); continue; }
    if (b.t === 'links') {
      const a = b.items[0];
      if (/specials\/?$/.test(a.href)) all = a; else if (cur && !cur.cta) cur.cta = { label: plain(a.html), href: a.href };
    }
  }
  need(list.length === 6 ? list : null, 'six bundles');
  need(all, 'Shop All Offers link');
  const tile = (bd, i) => {
    const pop = /tincture/i.test(bd.title);
    const wide = /bulk flower/i.test(bd.title);
    return `<li class="tile glass h-bd${pop ? ' tile--pop h-bd--pop' : ''}${wide ? ' tile--wide h-bd--wide' : ''}" data-reveal style="--i:${i}" data-spot>
${pop ? `<span class="tile__pop h-bd__pop" aria-hidden="true">${gimg('g-cut-tincture', { alt: '', cls: 'cut h-bd__pop-img', sizes: '(max-width: 720px) 30vw, 12vw' })}</span>` : ''}
<h3 class="h-bd__title"><a class="h-bd__link"${linkAttrs(liveHref(bd.href))}>${esc(bd.title)}</a></h3>
<p class="h-bd__line">${esc(bd.line || '')}</p>
<span class="h-bd__cta link-arrow" aria-hidden="true">${esc(bd.cta ? bd.cta.label : '')}${ico('arrow')}</span>
</li>`;
  };
  // the captured order, with the bulk-flower mix (the Flower Deli's own bundle) leading as the wide tile
  const order = [...list].sort((a, b) => (/bulk flower/i.test(b.title) ? 1 : 0) - (/bulk flower/i.test(a.title) ? 1 : 0));
  return `<section class="h-bundles band band--cream" id="bundles" aria-labelledby="h-bd-h">
<div class="band__clip h-bundles__clip" aria-hidden="true">${gimg('g-tex-obsidian-vein', { alt: '', cls: 'band__bg h-bundles__bg', sizes: TEX_SIZES })}<span class="h-bundles__veil"></span><span class="h-bundles__pool"></span>${gimg('g-tex-gold-stroke', { alt: '', cls: 'h-bundles__stroke', sizes: '(max-width: 720px) 1px, 44vw' })}</div>
<div class="wrap wrap--wide h-bundles__wrap">
<header class="h-bundles__head">
<div>
<p class="kicker" data-reveal>Offers</p>
<h2 class="h-bundles__h" id="h-bd-h" data-reveal="lines">${accent(plain(B[hi].html), 'Bundles')}</h2>
</div>
<a class="btn btn--primary h-bundles__all" data-reveal style="--i:1"${linkAttrs(liveHref(all.href))}>${esc(plain(all.html))}${ico('arrow')}</a>
</header>
<ul class="bento h-bundles__grid" role="list">
${order.map(tile).join('\n')}
</ul>
</div>
</section>`;
}

// ---------- 4. Shop By Cannabis Category (the one dark band) + the live-menu shortcuts ----------
const SHORTCUTS = ['Featured Cannabis Products', 'Favorite Marijuana Flower', 'Dispensary Budtender’s Picks', 'Popular Cannabis Vapes', 'Tasty Weed Edibles', 'Recommended For You'];
function renderCategories(ctx, r) {
  const { site } = ctx;
  const { B, idx, need, after } = r;
  const hi = idx('h2', 'Shop By Cannabis Category');
  const grid = need(B.slice(hi + 1).find((b) => b.t === 'grid'), 'category grid');
  const capt = (grid.blocks || []).map((lc) => ({ title: plain((lc.blocks || []).find((x) => x.t === 'h3')?.html), more: plain((lc.blocks || []).find((x) => x.t === 'text')?.html) }));
  const cards = site.categories.map((c, i) => {
    const cap = need(capt.find((x) => x.title === c.label), 'captured category ' + c.label);
    return `<li class="h-cat" style="--i:${i}">
<a class="cat-card h-cat__card"${linkAttrs('/products/' + c.slug + '/')} data-tilt>
<span class="cat-card__media h-cat__media">${gimg(c.gimg, { alt: '', cls: 'h-cat__img', sizes: '(max-width: 720px) 66vw, 22vw' })}<span class="h-cat__glow" aria-hidden="true"></span></span>
<span class="h-cat__chip" aria-hidden="true">${photo(ctx, c.photo, { alt: '', cls: 'h-cat__thumb', sizes: '56px' })}</span>
<span class="h-cat__label"><span class="cat-card__title h-cat__title">${esc(cap.title)}</span><span class="cat-card__cta h-cat__cta">${esc(cap.more)}${ico('arrow')}</span></span>
</a>
</li>`;
  }).join('\n');

  // shortcuts: each captured heading with its captured link(s); a link printed twice in a row (desktop + phone copies of
  // the same button on the live page) is shown once
  const shorts = SHORTCUTS.map((h, i) => {
    const at = B.findIndex((b) => b.t === 'h2' && plain(b.html).replace(/'/g, '’') === h.replace(/'/g, '’'));
    need(at === -1 ? null : at, 'shortcut ' + h);
    const seen = new Set();
    const links = after(at).filter((b) => b.t === 'p' || b.t === 'links').flatMap(linksIn).filter((l) => { const k = l.href + '|' + plain(l.html); if (seen.has(k)) return false; seen.add(k); return true; });
    // a captured heading with no link of its own points at the live menu, labelled with the site's own CTA words
    const list = links.length ? links : [{ href: menu(ctx), html: esc(ctx.ia.cta.label), live: true }];
    return `<li class="h-short glass glass--dark" data-reveal style="--i:${i}" data-spot>
<h2 class="h-short__h">${esc(plain(B[at].html))}</h2>
<p class="h-short__links">${list.map((l) => `<a class="h-short__a"${linkAttrs(l.live ? l.href : liveHref(l.href))}>${esc(plain(l.html))}${ico('arrow')}</a>`).join(' ')}</p>
</li>`;
  }).join('\n');

  return `<section class="h-cats band band--night" id="categories" aria-labelledby="h-cats-h">
<div class="band__clip" aria-hidden="true"><span class="h-cats__seam h-cats__seam--top"></span><span class="h-cats__seam h-cats__seam--bottom"></span></div>
<div class="h-cats__pin" data-pin="track">
<div class="pin-stage h-cats__stage" data-lantern>
<div class="band__clip h-cats__clip" aria-hidden="true"><span class="h-cats__lantern"></span><span class="h-cats__grain"></span></div>
<div class="wrap wrap--wide h-cats__head">
<p class="kicker h-cats__kicker" data-reveal>Explore the shop</p>
<h2 class="h-cats__h" id="h-cats-h" data-reveal="lines">${accent(plain(B[hi].html), 'Category')}</h2>
</div>
<div class="h-cats__rail">
<ul class="h-cats__track" data-track role="list">
${cards}
</ul>
</div>
</div>
</div>
<div class="wrap wrap--wide h-cats__more">
<p class="kicker h-cats__kicker h-cats__kicker--more">On the live menu</p>
<ul class="h-shorts" role="list">
${shorts}
</ul>
</div>
</section>`;
}

// ---------- 5. Shop By Cannabis Effect ----------
function renderEffects(ctx, r) {
  const { site } = ctx;
  const { B, idx, need } = r;
  const hi = idx('h2', 'Shop By Cannabis Effect');
  const grid = need(B.slice(hi + 1).find((b) => b.t === 'grid'), 'effect grid');
  const capt = (grid.blocks || []).map((lc) => ({ title: plain((lc.blocks || []).find((x) => x.t === 'h3')?.html), more: plain((lc.blocks || []).find((x) => x.t === 'text')?.html) }));
  const explore = (ctx.ia.nav || []).find((n) => n.mega && (n.mega.groups || []).some((g) => /effect/i.test(g.title)));
  const note = explore ? (explore.mega.groups.find((g) => /effect/i.test(g.title)) || {}).note : '';
  const tiles = site.menu.effects.map((e, i) => {
    const cap = need(capt.find((x) => x.title === e.label), 'captured effect ' + e.label);
    return `<li class="tile h-fx${i === 0 ? ' tile--arch' : ''}" data-reveal style="--i:${i}">
<a class="h-fx__card"${linkAttrs(e.url)}>
<span class="h-fx__media">${e.gimg ? gimg(e.gimg, { alt: '', cls: 'h-fx__img', sizes: '(max-width: 720px) 44vw, 220px' }) : photo(ctx, e.photo, { alt: '', cls: 'h-fx__img', sizes: '(max-width: 720px) 44vw, 220px' })}</span>
<span class="h-fx__label"><span class="h-fx__title">${esc(cap.title)}</span><span class="h-fx__more">${esc(cap.more)}${ico('arrow')}</span></span>
</a>
</li>`;
  }).join('\n');
  return `<section class="h-fxs band band--sage" id="effects" aria-labelledby="h-fx-h">
<div class="band__clip h-fxs__clip" aria-hidden="true">${gimg('g-tex-obsidian', { alt: '', cls: 'band__bg h-fxs__bg', sizes: TEX_SIZES })}<span class="h-fxs__veil"></span></div>
<div class="wrap wrap--wide h-fxs__wrap">
<header class="h-fxs__head">
<h2 class="h-fxs__h" id="h-fx-h" data-reveal="lines">${accent(plain(B[hi].html), 'Effect')}</h2>
${note ? `<p class="h-fxs__note" data-reveal style="--i:1">${esc(note)}</p>` : ''}
</header>
<ul class="bento h-fxs__grid" role="list">
${tiles}
</ul>
</div>
</section>`;
}

// ---------- 6. Craft Kitchen & Dispensary ----------
function renderKitchen(ctx, r) {
  const { B, idx, need } = r;
  const first = idx('h2', 'Craft Kitchen & Dispensary');
  const hi = idx('h2', 'Craft Kitchen & Dispensary', first + 1);
  const ps = [];
  for (let j = hi + 1; j < B.length && B[j].t === 'p'; j++) ps.push(B[j]);
  need(ps.length === 4 ? ps : null, 'four Craft Kitchen paragraphs');
  // the first paragraph ends on the client's own line; it is set as designed type (same words, same order)
  const QUOTE = 'It’s high time you feel at home!';
  const p0 = plain(ps[0].html);
  const qAt = p0.replace(/'/g, '’').lastIndexOf(QUOTE);
  const p0lead = qAt > 0 ? p0.slice(0, qAt).trim() : p0;
  const p0quote = qAt > 0 ? p0.slice(qAt).trim() : '';
  return `<section class="h-ck band band--cream" id="craft-kitchen" aria-labelledby="h-ck-h">
<div class="band__clip h-ck__clip" aria-hidden="true"><span class="h-ck__pool"></span><span class="h-ck__leaf"></span></div>
<div class="wrap wrap--wide h-ck__grid">
<div class="h-ck__media">
<figure class="frame h-ck__f1" data-depth="0.06">${photo(ctx, 'cl/CL-Image-SEO.webp', { alt: 'Inside CastleLeaf: copper shelves labelled Vapes, Concentrates and Edibles above the glass counter', cls: 'frame__img h-ck__img1', sizes: '(max-width: 1023.98px) 84vw, 36vw' })}</figure>
<figure class="frame frame--bleed h-ck__f2" data-depth="-0.05">${photo(ctx, 'cl/CL-Image-HowToShop.webp', { alt: 'The glass doors of CastleLeaf open onto the bright shop floor', cls: 'frame__img h-ck__img2', sizes: '(max-width: 1023.98px) 70vw, 28vw' })}</figure>
</div>
<div class="h-ck__copy">
<p class="kicker" data-reveal>${esc(ctx.site.address.neighbourhood)}</p>
<h2 class="h-ck__h" id="h-ck-h" data-reveal="lines">${accent(plain(B[hi].html), 'Kitchen')}</h2>
<p class="h-ck__p h-ck__p--lead" data-reveal>${esc(p0lead)}</p>
${p0quote ? `<p class="h-ck__quote" data-reveal><span class="h-ck__goldleaf" aria-hidden="true">${gimg('g-tex-gold-leaf', { alt: '', sizes: '(max-width: 720px) 92vw, 40vw' })}</span><span class="h-ck__qmark" aria-hidden="true">${ico('crown')}</span>${esc(p0quote)}</p>` : ''}
${ps.slice(1).map((p, i) => `<p class="h-ck__p" data-reveal style="--i:${i}">${rewriteLinks(p.html)}</p>`).join('\n')}
</div>
</div>
</section>`;
}

// ---------- 7. FAQ (D2a: the FAQ page's own question/answer pairs) ----------
const FAQ_Q = ['How can I buy it?', 'What do I need to know about being an Adult-Use (recreational) customer?', 'I am from out of state. Can I make a purchase at CastleLeaf?'];
function renderFaq(ctx, r) {
  const { B, need } = r;
  const faqs = need(ctx.content.faqs, 'pages/faqs.json');
  const det = (faqs.sections || []).flatMap((s) => s.blocks || []).flatMap((b) => (b.t === 'grid' ? b.blocks || [] : [b])).filter((b) => b.t === 'details');
  const items = FAQ_Q.map((q, i) => {
    const d = need(det.find((x) => plain(x.summary) === q), 'faqs.json question ' + q);
    return `<details class="h-faq__item" data-faq data-reveal style="--i:${i}"${i === 0 ? ' open' : ''}>
<summary class="h-faq__q"><span>${esc(plain(d.summary))}</span><span class="faq__ico" aria-hidden="true">${ico('plus')}</span></summary>
<div class="faq__a">${shell.blocks(d.blocks, ctx)}</div>
</details>`;
  }).join('\n');
  const learnAt = B.findIndex((b) => b.t === 'links' && plain(b.items && b.items[0] && b.items[0].html) === 'Learn More');
  const learn = need(learnAt === -1 ? null : B[learnAt].items[0], 'Learn More link');
  return `<section class="h-faq band band--linen" id="faq" aria-labelledby="h-faq-h">
<div class="band__clip h-faq__clip" aria-hidden="true"><span class="h-faq__pool"></span></div>
<div class="wrap h-faq__grid">
<header class="h-faq__head">
<p class="kicker" data-reveal>FAQs</p>
<h2 class="h-faq__h" id="h-faq-h" data-reveal="lines">Good to <em class="accent">know</em></h2>
<p class="btn-row" data-reveal style="--i:1"><a class="btn btn--ghost"${linkAttrs(liveHref(learn.href))}>${esc(plain(learn.html))}${ico('arrow')}</a> <a class="link-arrow"${linkAttrs('/faqs/')}>All FAQs${ico('arrow')}</a></p>
</header>
<div class="faq h-faq__list">
${items}
</div>
</div>
</section>`;
}

// ---------- 8. events + the journal ----------
function renderEvents(ctx, r) {
  const { B, idx, need } = r;
  const hi = idx('h2', 'CastleLeaf Upcoming Events');
  const none = need(B[hi + 1] && B[hi + 1].t === 'h3' ? B[hi + 1] : null, 'There is no Event');
  const all = need(linksIn(B[hi + 2])[0], 'View All Events link');
  const posts = [...(ctx.posts || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (a.order ?? 99) - (b.order ?? 99)).slice(0, 3);
  const cards = posts.map((p, i) => {
    const id = p.image || p.gimg;
    const media = id && (hasGenerated(id) || process.env.ALLOW_MISSING_GEN === '1') ? gimg(id, { alt: '', sizes: '(max-width: 720px) 86vw, 30vw' }) : '';
    const cat = p.category || (p.categories && p.categories[0] && (p.categories[0].name || p.categories[0])) || '';
    const meta = [cat, p.readTime].filter(Boolean).map((x) => esc(typeof x === 'string' ? x : x.label || '')).join(' <span aria-hidden="true">/</span> ');
    return `<li class="h-j__item" data-reveal style="--i:${i}"><a class="acard h-j__card"${linkAttrs(p.path || '/blog/' + p.slug + '/')}>
<span class="acard__media">${media}</span>
${meta ? `<span class="acard__meta">${meta}</span>` : ''}
<span class="acard__title">${esc(p.h1 || p.title)}</span>
<span class="acard__more">Read the article${ico('arrow')}</span>
</a></li>`;
  }).join('\n');
  return `<section class="h-ev band band--sage" id="events" aria-labelledby="h-ev-h">
<div class="wrap wrap--wide h-ev__wrap">
<div class="h-ev__slim glass" data-reveal data-spot>
<span class="h-ev__media">${gimg('g-feature-events', { alt: '', cls: 'h-ev__img', sizes: '(max-width: 1023.98px) 92vw, 34vw' })}</span>
<div class="h-ev__copy">
<p class="kicker">Events</p>
<h2 class="h-ev__h" id="h-ev-h">${accent(plain(B[hi].html), 'Events')}</h2>
<h3 class="h-ev__none">${esc(plain(none.html))}</h3>
<a class="btn btn--primary btn--sm"${linkAttrs(liveHref(all.href))}>${esc(plain(all.html))}${ico('arrow')}</a>
</div>
</div>
<header class="h-j__head">
<div><p class="kicker" data-reveal>Journal</p><h2 class="h-j__h" data-reveal="lines">From the <em class="accent">blog</em></h2></div>
<a class="link-arrow" data-reveal${linkAttrs('/blog/')}>All articles${ico('arrow')}</a>
</header>
${cards ? `<ul class="h-j__list" role="list">
${cards}
</ul>` : ''}
</div>
</section>`;
}

// ---------- page ----------
function preloadFor(ctx) {
  const loop = ctx.images && ctx.images.media && ctx.images.media['hero-loop'];
  if (loop && loop.poster) return [{ href: loop.poster, as: 'image', fetchpriority: 'high' }];
  if (!hasGenerated('g-hero-lantern')) return [];
  const m = gimg('g-hero-lantern', { alt: '', sizes: HERO_SIZES }).match(/srcset="([^"]+)"/);
  return m ? [{ as: 'image', imagesrcset: m[1], imagesizes: HERO_SIZES, fetchpriority: 'high' }] : [];
}

// today's hours on the hero chip (no JS: the week summary stays)
const TODAY = `<script>(function(){var c=document.querySelector('[data-h-days]');if(!c)return;try{var d=JSON.parse(c.getAttribute('data-h-days'));var t=d[new Date().getDay()];if(!t)return;c.querySelector('[data-h-today-k]').textContent='Today';c.querySelector('[data-h-today-v]').textContent=t;}catch(e){}})();</script>`;

export async function render(ctx) {
  const home = ctx.content.home;
  if (!home) throw new Error('src/content/pages/home.json not loaded');
  const r = reader(home);
  const main = [
    renderHero(ctx, r),
    renderWays(ctx, r),
    renderBundles(ctx, r),
    renderCategories(ctx, r),
    renderEffects(ctx, r),
    renderKitchen(ctx, r),
    renderFaq(ctx, r),
    renderEvents(ctx, r),
  ].join('\n');
  const html = shell.page({
    ctx,
    path: '/',
    title: home.title,
    description: home.description,
    canonical: absUrl(ctx, '/'),
    og: { title: home.title, description: home.description, type: 'website' },
    bodyClass: 'h-page',
    main: main + TODAY,
    crumbs: [],
    preload: preloadFor(ctx),
  });
  return [{ path: '/', html }];
}
