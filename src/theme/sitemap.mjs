// sitemap.mjs - PAGES lane: /site-map/ (every rendered page, grouped by section; runs last so ctx.pages is complete) and
// /404.html (a calm night stage on glossy obsidian with the lantern, links home and to the menu).
import { esc, escA, linkAttrs, gimg, menu, stripTags } from './util.mjs';
import { page, pageHero, icon, markHtml, bandBg } from './shell.mjs';

const GROUPS = [
  { key: 'visit', label: 'Visit CastleLeaf', test: (p) => /^\/(about|contact|directions|faqs|reviews|book-a-budtender|stores)\//.test(p) || p === '/' },
  { key: 'shop', label: 'Shop', test: (p) => /^\/(shop|products|specials|420-deals|green-wednesday-deals|delivery|loyalty-sign-up)\//.test(p) },
  { key: 'learn', label: 'Learn', test: (p) => /^\/(blog|dispensary-guide|massachusetts-cannabis-laws|getting-a-medical-card)\//.test(p) },
  { key: 'events', label: 'Events', test: (p) => /^\/(events|event)\//.test(p) },
  { key: 'company', label: 'Company and legal', test: (p) => /^\/(jobs|advertising-with-us|accessibility|privacy-policy|terms-of-use|site-map)\//.test(p) },
  { key: 'towns', label: 'Neighbouring towns', test: (p) => /^\/recreational\//.test(p) },
];
const labelOf = (html, p) => {
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html || '');
  const t = /<title>([\s\S]*?)<\/title>/i.exec(html || '');
  const s = stripTags((h1 ? h1[1] : t ? t[1] : p).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return s || p;
};

function siteMap(ctx) {
  const entries = [...(ctx.pages || new Map()).values()].filter((x) => x && x.path && !/\.html$/.test(x.path));
  entries.push({ path: '/site-map/', html: '<h1>Site Map</h1>' });
  const groups = GROUPS.map((g) => ({ ...g, items: [] }));
  const other = { key: 'other', label: 'More', items: [] };
  for (const e of entries) {
    const g = groups.find((x) => x.test(e.path)) || other;
    g.items.push({ path: e.path, label: e.path === '/' ? 'Home' : labelOf(e.html, e.path) });
  }
  if (other.items.length) groups.push(other);
  for (const g of groups) g.items.sort((a, b) => (a.path.split('/').length - b.path.split('/').length) || a.label.localeCompare(b.label));
  const main = `${pageHero({
    ctx, kicker: 'Every page', h1Html: 'Site <em class="accent">Map</em>',
    lede: `All ${entries.length} pages of the CastleLeaf site, grouped by section.`,
    crumbs: [['/', 'Home'], ['/site-map/', 'Site Map']],
    cta: [{ label: 'Shop Menu', href: 'menu' }, { label: 'Contact', href: '/contact/', ghost: true }],
  })}
<section class="band band--linen p-sitemap" aria-label="All pages">
<div class="wrap">
<div class="p-sitemap__grid">
${groups.filter((g) => g.items.length).map((g, i) => `<section class="glass glass--strong p-sitemap__group${g.key === 'towns' ? ' p-sitemap__group--towns' : ''}" aria-labelledby="sm-${g.key}" data-reveal style="--i:${i % 3}">
<h2 class="p-sitemap__h" id="sm-${g.key}"><span>${esc(g.label)}</span><span class="p-sitemap__n">${g.items.length}</span></h2>
<ul class="p-sitemap__list" role="list">${g.items.map((x) => `<li><a${linkAttrs(x.path)}>${esc(x.label)}</a></li>`).join('')}</ul>
</section>`).join('\n')}
</div>
</div>
</section>`;
  return { path: '/site-map/', html: page({ ctx, path: '/site-map/', title: 'Site Map | CastleLeaf', description: 'Every page of the CastleLeaf site, grouped by section.', crumbs: [['/', 'Home'], ['/site-map/', 'Site Map']], heroCrumbs: true, bodyClass: 'p-page p-sitemap-page', main }) };
}

function notFound(ctx) {
  const main = `<section class="band band--night p-404" data-lantern aria-labelledby="p-404-h">
${bandBg('g-tex-obsidian', { cls: 'p-tex p-tex--obsidian', veil: 'obsidian', eager: true })}
<div class="wrap p-404__inner">
<span class="p-404__mark">${markHtml(ctx, { alt: '', eager: true, sizes: '96px' })}</span>
<p class="kicker">Error 404</p>
<h1 class="display p-404__h" id="p-404-h">This room is <em class="accent">empty</em></h1>
<p class="lede p-404__lede">The page you are looking for has moved or does not exist. The lantern is still lit at the front door.</p>
<p class="btn-row p-404__cta"><a class="btn"${linkAttrs('/')}>Back home${icon('arrow')}</a><a class="btn btn--ghost"${linkAttrs(menu(ctx))}>Shop Menu${icon('ext')}</a><a class="btn btn--ghost"${linkAttrs('/site-map/')}>Site Map${icon('arrow')}</a></p>
</div>
</section>`;
  return { path: '/404.html', html: page({ ctx, path: '/404.html', title: 'Page Not Found | CastleLeaf', description: 'This page could not be found on the CastleLeaf site.', canonical: (ctx.site.origin || '') + '/404.html', bodyClass: 'p-page p-404-page', main }) };
}

export async function render(ctx) {
  const outp = [];
  try { outp.push(siteMap(ctx)); } catch (e) { console.warn('sitemap: site map failed: ' + (e && e.message)); }
  try { outp.push(notFound(ctx)); } catch (e) { console.warn('sitemap: 404 failed: ' + (e && e.message)); }
  return outp;
}
