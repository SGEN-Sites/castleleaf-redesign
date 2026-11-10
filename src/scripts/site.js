/* site.js - CastleLeaf "LANTERN KEEP" behaviour (FOUNDATION). No dependencies, defer-safe. Contract D6: no quoted string literal here
   starts with a slash; URLs come from HTML attributes. Every word is visible without this file. Everything that moves is off under
   prefers-reduced-motion. One rAF scheduler for every scroll-driven hook; transforms and opacity only; passive listeners; off-screen skipped.

   Hooks: [data-reveal] ("" | "lines" | "wipe" | "arch"), [data-depth="0.15"], [data-scale-scroll="1.12"], [data-pin] (+ .pin-stage, sets --p),
   [data-pin="track"] + [data-track] (sets --track-x), [data-tilt="4"], [data-spot], [data-lantern], [data-marquee], [data-rotator="6000"],
   [data-filter-group], [data-video-toggle], [data-count], [data-hours] (today's row), [data-today-pick], [data-demo-form], [data-age-gate],
   [data-mega], [data-nav], [data-to-top], [data-footer-light], the header (hide on scroll down, show on scroll up). No [data-float]. */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  var coarse = mq('(hover: none), (pointer: coarse)').matches;
  var desktopMq = mq('(min-width: 1024px)');
  var pinMq = mq('(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); };
  var $ = function (sel, el) { return (el || doc).querySelector(sel); };
  var hasIO = 'IntersectionObserver' in window;
  var onMq = function (m, fn) { if (m.addEventListener) m.addEventListener('change', fn); else if (m.addListener) m.addListener(fn); };
  var vh = function () { return window.innerHeight || root.clientHeight; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var now = function () { return window.performance ? performance.now() : Date.now(); };
  root.classList.add('js');
  if (saveData) root.classList.add('save-data');
  /* WebKit only applies :active to a tapped element when a touch listener exists: the press states in mobile.css need this no-op */
  doc.addEventListener('touchstart', function () {}, { passive: true });

  var focusables = function (el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])', el).filter(function (x) {
      return !x.hidden && x.offsetParent !== null && window.getComputedStyle(x).visibility !== 'hidden';
    });
  };
  var trapTab = function (box, e) {
    var f = focusables(box);
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && (doc.activeElement === a || !box.contains(doc.activeElement))) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && (doc.activeElement === z || !box.contains(doc.activeElement))) { e.preventDefault(); a.focus(); }
  };
  /* after the 21+ gate closes or Back to top: focus moves to <main>, with no visible ring (D8; no skip link on this site) */
  var focusMain = function () {
    var m = doc.getElementById('main');
    if (!m) return;
    m.setAttribute('tabindex', '-1');
    m.focus({ preventScroll: true });
    m.addEventListener('blur', function () { m.removeAttribute('tabindex'); }, { once: true });
  };

  /* ---------------- 21+ gate (D7): hidden in the HTML, so it never blocks the page without JS. Yes remembers cl-age-ok = 1. ---------------- */
  var gate = $('[data-age-gate]');
  if (gate) {
    var KEY = gate.getAttribute('data-age-key') || 'cl-age-ok';
    var ok = false;
    try { ok = window.localStorage.getItem(KEY) === '1' || window.sessionStorage.getItem(KEY) === '1'; } catch (err) { ok = false; }
    if (ok) {
      root.classList.remove('gate-pending');
    } else {
      var site = $('.site');
      var yes = $('[data-age-yes]', gate);
      var no = $('[data-age-no]', gate);
      var refusal = $('[data-age-refusal]', gate);
      gate.hidden = false;
      root.classList.add('gate-open');
      root.classList.remove('gate-pending');
      if (site && 'inert' in site) site.inert = true;
      setTimeout(function () { if (yes) yes.focus(); }, 40);
      if (yes) yes.addEventListener('click', function () {
        try { window.localStorage.setItem(KEY, '1'); } catch (err) { try { window.sessionStorage.setItem(KEY, '1'); } catch (e2) { /* private mode: the gate just closes */ } }
        gate.hidden = true;
        root.classList.remove('gate-open');
        if (site && 'inert' in site) site.inert = false;
        focusMain();
      });
      if (no) no.addEventListener('click', function () { if (refusal) refusal.hidden = false; });
      gate.addEventListener('keydown', function (e) { if (e.key === 'Tab') trapTab(gate, e); });
      doc.addEventListener('focusin', function (e) { if (!gate.hidden && !gate.contains(e.target) && yes) yes.focus(); });
    }
  }

  /* ---------------- header + back to top ---------------- */
  var header = $('[data-header]');
  $$('[data-to-top]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      focusMain();
    });
  });

  /* ---------------- mega panels: one settle timer reconciles the open panel with the item under the pointer. Open after 80 ms when nothing is
     open; with one open, switch after 150 ms and close after 350 ms, both held while the pointer is heading into the panel (inside the triangle
     from where it LEFT the open item to the panel's top corners, moved in the last 180 ms). Card art loads on first intent (data-src). ---------------- */
  var megas = $$('[data-mega]');
  var openItem = null;
  var underItem = null;
  var settleT = 0;
  var px = 0, py = 0, lastMove = 0, leftX = 0, leftY = 0, leftOpen = null;
  function trigOf(item) { return $('[data-mega-trigger]', item); }
  function panelOf(item) { return $('[data-mega-panel]', item); }
  function primeArt(item) {
    if (item.getAttribute('data-primed')) return;
    item.setAttribute('data-primed', '1');
    $$('img[data-src]', item).forEach(function (im) {
      im.addEventListener('load', function () { im.classList.add('is-loaded'); }, { once: true });
      im.setAttribute('src', im.getAttribute('data-src'));
      im.removeAttribute('data-src');
    });
  }
  function setOpen(item, open, cut) {
    var btn = trigOf(item);
    if (open) {
      primeArt(item);
      if (openItem && openItem !== item) setOpen(openItem, false, true);
      openItem = item;
    } else if (openItem === item) {
      openItem = null;
    }
    if (cut) { item.classList.add('is-cut'); window.setTimeout(function () { item.classList.remove('is-cut'); }, 40); }
    item.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (header) header.classList.toggle('has-open-panel', !!openItem && desktopMq.matches);
  }
  function closeAll() { megas.forEach(function (m) { if (m.classList.contains('is-open')) setOpen(m, false); }); }
  function inTriangle(x, y, ax, ay, bx, by, cx, cy) {
    var d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
    var d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
    var d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
    return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)));
  }
  function heading() {
    if (!openItem || leftOpen !== openItem || now() - lastMove > 180) return false;
    var r = panelOf(openItem).getBoundingClientRect();
    return inTriangle(px, py, leftX, leftY - 2, r.left - 40, r.top + 2, r.right + 40, r.top + 2);
  }
  function reconcile() {
    if (!desktopMq.matches || underItem === openItem) return;
    if (openItem && heading()) { settleT = setTimeout(reconcile, 50); return; }
    if (underItem) setOpen(underItem, true);
    else if (openItem) setOpen(openItem, false);
  }
  function settle() {
    clearTimeout(settleT);
    settleT = setTimeout(reconcile, openItem ? (underItem ? 150 : 350) : 80);
  }
  doc.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; lastMove = now(); } }, { passive: true });
  megas.forEach(function (item) {
    var btn = trigOf(item);
    if (!btn) return;
    btn.addEventListener('click', function () {
      clearTimeout(settleT);
      setOpen(item, !item.classList.contains('is-open'));
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      setOpen(item, true);
      var f = focusables(panelOf(item));
      if (f.length) f[0].focus();
    });
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !desktopMq.matches) return;
      primeArt(item);
      underItem = item;
      settle();
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !desktopMq.matches) return;
      if (openItem === item) { leftOpen = item; leftX = e.clientX; leftY = e.clientY; }
      if (underItem === item) underItem = null;
      settle();
    });
    item.addEventListener('focusout', function (e) {
      if (!desktopMq.matches) return;
      if (e.relatedTarget && item.contains(e.relatedTarget)) return;
      setTimeout(function () { if (!item.contains(doc.activeElement) && underItem !== item && item.classList.contains('is-open')) setOpen(item, false); }, 0);
    });
  });
  doc.addEventListener('click', function (e) {
    if (!openItem || openItem.contains(e.target)) return;
    if (desktopMq.matches) closeAll();
  });

  /* ---------------- drawer (below 1024px), with a focus loop while open ---------------- */
  var nav = $('[data-nav]');
  var toggle = $('[data-nav-toggle]');
  var scrim = $('[data-nav-scrim]');
  var closeBtn = $('[data-nav-close]');
  var drawerShutAt = -9999;
  function setDrawer(open, returnFocus) {
    if (!nav || !toggle) return;
    if (!open && root.classList.contains('nav-open')) drawerShutAt = now();
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (scrim) scrim.hidden = !open;
    if (open) {
      if (header) { header.classList.remove('is-hidden'); barHidden = false; }
      setTimeout(function () { var f = closeBtn || focusables(nav)[0]; if (f) f.focus(); }, 60);
    } else {
      closeAll();
      if (returnFocus) toggle.focus();
    }
  }
  if (toggle) toggle.addEventListener('click', function () { setDrawer(!root.classList.contains('nav-open')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false, true); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false, true); });
  if (nav) {
    nav.addEventListener('keydown', function (e) { if (e.key === 'Tab' && root.classList.contains('nav-open')) trapTab(nav, e); });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a && root.classList.contains('nav-open')) setDrawer(false);
    });
  }
  /* focus across the drawer breakpoint: the browser can blur a control it hides before the change event fires, so remember for 500 ms */
  var lostFocus = null, lostAt = -9999;
  doc.addEventListener('focusout', function (e) { if (!e.relatedTarget) { lostFocus = e.target; lostAt = now(); } }, true);
  onMq(desktopMq, function () {
    var active = doc.activeElement;
    var had = (active && active !== doc.body) ? active : (now() - lostAt < 500 ? lostFocus : null);
    setDrawer(false);
    closeAll();
    underItem = null;
    if (had && (had.offsetParent === null || window.getComputedStyle(had).visibility === 'hidden')) {
      var t = desktopMq.matches ? $('.mainbar__logo') : toggle;
      if (t) t.focus();
    }
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (gate && !gate.hidden) return;
    if (openItem) {
      var btn = trigOf(openItem);
      setOpen(openItem, false);
      if (btn && btn.offsetParent !== null) btn.focus();
      return;
    }
    if (root.classList.contains('nav-open')) setDrawer(false, true);
  });

  /* ---------------- reveals: [data-reveal] "", "lines", "wipe", "arch"; fail-safe at 2.5 s (motion.css also un-hides by itself at 5 s) ---------------- */
  function splitLines(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = doc.createDocumentFragment();
    var words = [];
    var addWord = function (child) {
      var w = doc.createElement('span');
      w.style.display = 'inline-block';
      if (typeof child === 'string') w.textContent = child; else w.appendChild(child);
      frag.appendChild(w);
      words.push(w);
    };
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(doc.createTextNode(' ')); else addWord(part);
        });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') frag.appendChild(n.cloneNode(false)); else addWord(n);
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    var lines = [], top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 3) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    });
    el.textContent = '';
    lines.forEach(function (ws, i) {
      var line = doc.createElement('span'); line.className = 'line';
      var inner = doc.createElement('span'); inner.className = 'line__in';
      inner.style.setProperty('--l', i);
      ws.forEach(function (w, k) { if (k) inner.appendChild(doc.createTextNode(' ')); inner.appendChild(w); });
      line.appendChild(inner);
      el.appendChild(line);
    });
    var i0 = parseFloat(window.getComputedStyle(el).getPropertyValue('--i')) || 0;
    window.setTimeout(function () {
      el.textContent = '';
      nodes.forEach(function (n) { el.appendChild(n); });
    }, 1150 + (lines.length * 110) + (i0 * 90));
  }
  function reveal(el) {
    if (el.classList.contains('is-in')) return;
    if (!reduce && el.getAttribute('data-reveal') === 'lines') { try { splitLines(el); } catch (err) { /* the heading simply fades in */ } }
    el.classList.add('is-in');
  }
  var reveals = $$('[data-reveal]');
  var ioAlive = false;
  if (reduce || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    root.classList.add('reveal-all');
  } else if (reveals.length) {
    var ioReveal = new IntersectionObserver(function (entries) {
      ioAlive = true;
      entries.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); ioReveal.unobserve(en.target); } });
    }, { rootMargin: '0px 0px 3% 0px', threshold: 0 });
    reveals.forEach(function (el) { ioReveal.observe(el); });
    setTimeout(function () {
      root.classList.add('reveal-all');
      if (!ioAlive) reveals.forEach(function (el) { el.classList.add('is-in'); });
    }, 2500);
  } else {
    root.classList.add('reveal-all');
  }

  /* ---------------- the scroll scheduler: every scroll-driven hook in one rAF. Read first, write after. ---------------- */
  var live = [];
  function rec(el, type) { var r = { el: el, type: type, on: !hasIO, val: 0 }; live.push(r); return r; }
  if (!reduce) {
    if (!coarse) $$('[data-depth]').forEach(function (el) { var r = rec(el, 'depth'); r.d = parseFloat(el.getAttribute('data-depth')) || 0; });
    $$('[data-scale-scroll]').forEach(function (el) { var r = rec(el, 'scale'); r.from = parseFloat(el.getAttribute('data-scale-scroll')) || 1.12; });
  }
  var pins = $$('[data-pin]').map(function (el) {
    var r = rec(el, 'pin');
    r.track = el.getAttribute('data-pin') === 'track' ? $('[data-track]', el) : null;
    r.stage = $('.pin-stage', el) || el;
    r.max = 0;
    return r;
  });
  function layoutPins() {
    var active = pinMq.matches && !reduce;
    root.classList.toggle('pin-on', active);
    pins.forEach(function (r) {
      var el = r.el;
      el.classList.toggle('is-pinned', active);
      if (!active) {
        el.style.removeProperty('--p');
        el.style.removeProperty('--track-x');
        if (r.track) el.style.removeProperty('height');
        r.max = 0;
        return;
      }
      if (r.track) {
        r.max = Math.max(0, r.track.scrollWidth - r.stage.clientWidth);
        el.style.height = Math.round(vh() + r.max) + 'px';
      }
    });
  }

  /* ---------------- [data-lantern]: the warm light (--lx / --ly in %) follows a fine pointer slowly and drifts with scroll otherwise.
     The element that carries [data-lantern] must declare the gradient itself (components.css .band--night / .band--navy, shell.css footer). ---------------- */
  var lanterns = reduce ? [] : $$('[data-lantern]').map(function (el) {
    var cs = window.getComputedStyle(el);
    var bx = parseFloat(el.getAttribute('data-lx') || cs.getPropertyValue('--lx')) || 68;
    var by = parseFloat(el.getAttribute('data-ly') || cs.getPropertyValue('--ly')) || 42;
    var r = rec(el, 'lantern');
    r.bx = bx; r.by = by; r.x = bx; r.y = by; r.tx = bx; r.ty = by; r.drift = 0; r.hover = false;
    if (finePointer) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        r.tx = clamp(((e.clientX - b.left) / b.width) * 100, 6, 94);
        r.ty = clamp(((e.clientY - b.top) / b.height) * 100, 6, 94);
        r.hover = true;
        easeLanterns();
      }, { passive: true });
      el.addEventListener('pointerleave', function () { r.hover = false; r.tx = r.bx; r.ty = r.by + r.drift; easeLanterns(); });
    }
    return r;
  });
  var lanternRaf = 0;
  function lanternStep() {
    lanternRaf = 0;
    var moving = false;
    lanterns.forEach(function (r) {
      if (!r.on) return;
      var tx = r.hover ? r.tx : r.bx, ty = r.hover ? r.ty : r.by + r.drift;
      r.x += (tx - r.x) * 0.06;
      r.y += (ty - r.y) * 0.06;
      if (Math.abs(tx - r.x) > 0.05 || Math.abs(ty - r.y) > 0.05) moving = true; else { r.x = tx; r.y = ty; }
      r.el.style.setProperty('--lx', r.x.toFixed(2) + '%');
      r.el.style.setProperty('--ly', r.y.toFixed(2) + '%');
    });
    if (moving) lanternRaf = window.requestAnimationFrame(lanternStep);
  }
  function easeLanterns() { if (!lanternRaf && lanterns.length) lanternRaf = window.requestAnimationFrame(lanternStep); }

  /* the bar slides up while the reader scrolls down (after 160px) and comes back on any scroll up, near the top, while a panel or the drawer
     is open or just closing, and while keyboard focus is in it */
  var lastY = 0, runY = 0, barHidden = false;
  var kbFocusIn = function (el) {
    var a = doc.activeElement;
    if (!a || !el.contains(a)) return false;
    try { return a.matches(':focus-visible'); } catch (err) { return true; }
  };
  function barState(y) {
    var dy = y - lastY;
    lastY = y;
    if (y < 160 || openItem || root.classList.contains('nav-open') || now() - drawerShutAt < 650 || kbFocusIn(header)) { runY = 0; return false; }
    if (dy === 0) return barHidden;
    runY = (dy > 0) === (runY > 0) ? runY + dy : dy;
    if (runY > 10) return true;
    if (runY < -4) return false;
    return barHidden;
  }
  if (header) header.addEventListener('focusin', function () {
    if (barHidden && kbFocusIn(header)) {
      var was = lastY, holdT = 0;
      var hold = function () {
        window.removeEventListener('scroll', hold);
        clearTimeout(holdT);
        var y = window.scrollY || window.pageYOffset || 0;
        if (Math.abs(y - was) > 1) { lastY = was; window.scrollTo(0, was); }
        root.style.removeProperty('scroll-behavior');
      };
      root.style.scrollBehavior = 'auto';
      window.addEventListener('scroll', hold, { passive: true });
      holdT = setTimeout(function () { window.removeEventListener('scroll', hold); root.style.removeProperty('scroll-behavior'); }, 400);
      header.classList.add('is-snap');
      header.classList.remove('is-hidden');
      barHidden = false;
      runY = 0;
      window.requestAnimationFrame(function () { header.classList.remove('is-snap'); });
    }
    queue();
  });
  var frameQueued = false;
  function frame() {
    frameQueued = false;
    var h = vh();
    var y = window.scrollY || window.pageYOffset || 0;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      var hide = barState(y);
      if (hide !== barHidden) { barHidden = hide; header.classList.toggle('is-hidden', hide); }
    }
    var pinOn = root.classList.contains('pin-on');
    var i, r, b, c, lanternMoved = false;
    for (i = 0; i < live.length; i++) { /* read */
      r = live[i];
      if (!r.on && r.type !== 'pin') continue;
      switch (r.type) {
        case 'depth':
          b = r.el.getBoundingClientRect();
          c = (b.top - r.val) + b.height / 2 - h / 2;
          r.next = clamp(-c * r.d, -140, 140);
          break;
        case 'scale':
          b = (r.el.parentElement || r.el).getBoundingClientRect();
          r.next = r.from - (r.from - 1) * clamp((h - b.top) / (h + b.height), 0, 1);
          break;
        case 'pin':
          if (!pinOn || !r.on) { r.next = null; break; }
          b = r.el.getBoundingClientRect();
          r.next = clamp(-b.top / Math.max(1, b.height - h), 0, 1);
          break;
        case 'lantern':
          b = r.el.getBoundingClientRect();
          r.next = null;
          r.drift = clamp(((h / 2 - (b.top + b.height / 2)) / (h + b.height)) * 30, -14, 14);
          lanternMoved = true;
          break;
      }
    }
    for (i = 0; i < live.length; i++) { /* write */
      r = live[i];
      if (r.next === undefined || r.next === null) continue;
      if (r.next === r.val && r.type !== 'pin') continue;
      switch (r.type) {
        case 'depth': r.el.style.setProperty('--py', r.next.toFixed(1) + 'px'); break;
        case 'scale': r.el.style.setProperty('--ss', r.next.toFixed(4)); break;
        case 'pin':
          r.el.style.setProperty('--p', r.next.toFixed(4));
          if (r.track) r.el.style.setProperty('--track-x', (-r.next * r.max).toFixed(1) + 'px');
          break;
      }
      r.val = r.next;
      r.next = undefined;
    }
    if (lanternMoved) easeLanterns();
  }
  function queue() { if (!frameQueued) { frameQueued = true; window.requestAnimationFrame(frame); } }
  if (hasIO && live.length) {
    var byEl = new Map();
    live.forEach(function (r) { if (!byEl.has(r.el)) byEl.set(r.el, []); byEl.get(r.el).push(r); });
    var ioLive = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        (byEl.get(en.target) || []).forEach(function (r) {
          r.on = en.isIntersecting;
          if (r.type === 'depth') r.el.classList.toggle('is-moving', r.on);
        });
      });
      queue();
    }, { rootMargin: '30% 0px 30% 0px' });
    byEl.forEach(function (v, el) { ioLive.observe(el); });
  }
  layoutPins();
  onMq(pinMq, function () { layoutPins(); queue(); });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { layoutPins(); queue(); }, { passive: true });
  window.addEventListener('load', function () { layoutPins(); queue(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { layoutPins(); queue(); });
  queue();
  /* a keyboard user tabbing along a pinned track: scroll the page so the focused card is in view */
  pins.forEach(function (r) {
    if (!r.track) return;
    r.track.addEventListener('focusin', function (e) {
      if (!root.classList.contains('pin-on') || !r.max) return;
      var kids = Array.prototype.slice.call(r.track.children);
      var item = kids.filter(function (k) { return k.contains(e.target); })[0];
      if (!item) return;
      var x = clamp(item.offsetLeft - (r.stage.clientWidth - item.offsetWidth) / 2, 0, r.max);
      var top = r.el.getBoundingClientRect().top + (window.scrollY || 0);
      window.scrollTo({ top: top + (x / r.max) * (r.el.offsetHeight - vh()), behavior: 'auto' });
    });
  });

  /* ---------------- [data-tilt="4"]: pointer tilt on fine pointers (max 4deg) ---------------- */
  if (!reduce && finePointer) {
    $$('[data-tilt]').forEach(function (el) {
      var max = Math.min(4, parseFloat(el.getAttribute('data-tilt')) || 4);
      var raf = 0, tx = 0, ty = 0;
      var paint = function () {
        raf = 0;
        el.style.setProperty('--ry', (tx * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-ty * max * 2).toFixed(2) + 'deg');
      };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        if (!raf) raf = window.requestAnimationFrame(paint);
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------- [data-spot]: the rim light brightens toward the cursor: an injected .spot layer; --sx / --sy on the host ---------------- */
  if (!reduce && finePointer) {
    $$('[data-spot]').forEach(function (el) {
      var layer = doc.createElement('span');
      layer.className = 'spot';
      layer.setAttribute('aria-hidden', 'true');
      if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.insertBefore(layer, el.firstChild);
      var raf = 0, sx = 0, sy = 0;
      var paint = function () { raf = 0; el.style.setProperty('--sx', sx.toFixed(1) + '%'); el.style.setProperty('--sy', sy.toFixed(1) + '%'); };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        sx = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
        sy = clamp(((e.clientY - r.top) / r.height) * 100, 0, 100);
        el.classList.add('is-spotting');
        if (!raf) raf = window.requestAnimationFrame(paint);
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-spotting'); });
    });
  }

  /* ---------------- [data-marquee]: two copies in a track; pause on hover, focus, off screen ---------------- */
  $$('[data-marquee]').forEach(function (m) {
    if (m.classList.contains('is-marquee') || reduce) return;
    m.classList.add('marquee');
    var track = doc.createElement('div');
    track.className = 'marquee__track';
    var group = doc.createElement('div');
    group.className = 'marquee__group';
    while (m.firstChild) group.appendChild(m.firstChild);
    track.appendChild(group);
    m.appendChild(track);
    var guard = 0;
    while (group.scrollWidth && group.scrollWidth < m.clientWidth && guard++ < 6) {
      Array.prototype.slice.call(group.children).forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); group.appendChild(k); });
    }
    var copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    $$('a, button, input, select, textarea, [tabindex]', copy).forEach(function (x) { x.setAttribute('tabindex', '-1'); });
    $$('[id]', copy).forEach(function (x) { x.removeAttribute('id'); });
    track.appendChild(copy);
    m.classList.add('is-marquee');
    if (hasIO) new IntersectionObserver(function (en) { en.forEach(function (x) { m.classList.toggle('is-paused', !x.isIntersecting); }); }).observe(m);
  });

  /* ---------------- footer wordmark light: paused off screen (motion.css runs it; still under reduced motion) ---------------- */
  $$('[data-footer-light]').forEach(function (fm) {
    if (!hasIO) return;
    fm.classList.add('is-paused');
    new IntersectionObserver(function (en) { en.forEach(function (x) { fm.classList.toggle('is-paused', !x.isIntersecting); }); }).observe(fm);
  });

  /* ---------------- [data-rotator="6000"]: [data-slide] children rotate; prev, next and dots are real buttons ([data-rotator-prev]
     [data-rotator-next] [data-rotator-dots] inside the rotator, created when absent); pauses on hover and focus and off screen ---------------- */
  var arrowSvg = '<svg class="icon icon--arrow" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 12h15"/><path d="m13.5 6 6 6-6 6"/></svg>';
  $$('[data-rotator]').forEach(function (rot, rIndex) {
    var slides = $$('[data-slide]', rot);
    if (slides.length < 2) return;
    slides[0].parentNode.classList.add('rotator__stage');
    var label = rot.getAttribute('data-rotator-label') || rot.getAttribute('aria-label') || 'slide';
    var delay = parseInt(rot.getAttribute('data-rotator'), 10) || 6000;
    var prev = $('[data-rotator-prev]', rot);
    var next = $('[data-rotator-next]', rot);
    var dotsBox = $('[data-rotator-dots]', rot);
    if (!prev || !next || !dotsBox) {
      var bar = doc.createElement('div');
      bar.className = 'rotator__controls';
      if (!prev) { prev = doc.createElement('button'); prev.className = 'rotator__btn rotator__btn--prev'; prev.innerHTML = arrowSvg + '<span class="vh">Previous</span>'; bar.appendChild(prev); }
      if (!dotsBox) { dotsBox = doc.createElement('div'); bar.appendChild(dotsBox); }
      if (!next) { next = doc.createElement('button'); next.className = 'rotator__btn rotator__btn--next'; next.innerHTML = arrowSvg + '<span class="vh">Next</span>'; bar.appendChild(next); }
      rot.appendChild(bar);
    }
    [prev, next].forEach(function (b) { if (b.tagName === 'BUTTON' && !b.getAttribute('type')) b.setAttribute('type', 'button'); });
    dotsBox.classList.add('rotator__dots');
    var cur = 0, timer = 0, paused = false, offscreen = false, dots = [];
    slides.forEach(function (s, i) {
      if (!s.id) s.id = 'rot' + rIndex + '-s' + i;
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'rotator__dot';
      b.setAttribute('aria-controls', s.id);
      b.setAttribute('aria-label', 'Show ' + label + ' ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { show(i); restart(); });
      dotsBox.appendChild(b);
      dots.push(b);
    });
    function show(i) {
      var n = slides.length;
      cur = ((i % n) + n) % n;
      slides.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if ('inert' in s) s.inert = !on;
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    }
    function restart() {
      clearInterval(timer);
      if (reduce || paused || offscreen) return;
      timer = setInterval(function () { if (!doc.hidden) show(cur + 1); }, delay);
    }
    prev.addEventListener('click', function () { show(cur - 1); restart(); });
    next.addEventListener('click', function () { show(cur + 1); restart(); });
    rot.addEventListener('pointerenter', function () { paused = true; clearInterval(timer); });
    rot.addEventListener('pointerleave', function () { if (!rot.contains(doc.activeElement)) { paused = false; restart(); } });
    rot.addEventListener('focusin', function () { paused = true; clearInterval(timer); });
    rot.addEventListener('focusout', function (e) { if (!e.relatedTarget || !rot.contains(e.relatedTarget)) { paused = false; restart(); } });
    if (hasIO) new IntersectionObserver(function (en) { en.forEach(function (x) { offscreen = !x.isIntersecting; if (offscreen) clearInterval(timer); else restart(); }); }).observe(rot);
    rot.classList.add('is-rotator');
    show(0);
    restart();
  });

  /* ---------------- [data-filter-group]: chip filters over [data-filter-item][data-tags="a b"]. Scope = closest [data-filter-scope], else the page.
     Chips are buttons with data-filter="<tag>" or "all" (aria-pressed). data-filter-multi on the group allows many. [data-filter-count] (data-one,
     data-many words), [data-filter-empty] shows when none match, [data-more] (data-limit) reveals the next items. ---------------- */
  var scopes = [];
  $$('[data-filter-group], [data-more]').forEach(function (g) {
    var scope = (g.closest && g.closest('[data-filter-scope]')) || doc.body;
    if (scopes.indexOf(scope) < 0) scopes.push(scope);
  });
  scopes.forEach(function (scope) {
    var groups = $$('[data-filter-group]', scope);
    var itemsF = $$('[data-filter-item]', scope);
    var more = $('[data-more]', scope);
    var countEl = $$('[data-filter-count]', scope);
    var empty = $('[data-filter-empty]', scope);
    var limit = parseInt(scope.getAttribute('data-limit') || (more && more.getAttribute('data-limit')) || '0', 10) || 0;
    var shown = limit;
    var sel = groups.map(function () { return []; });
    var tagsOf = function (el) { return (el.getAttribute('data-tags') || '').toLowerCase().split(/[\s,]+/).filter(Boolean); };
    function apply() {
      var match = itemsF.filter(function (el) {
        var tg = tagsOf(el);
        return sel.every(function (s) { return !s.length || s.some(function (v) { return tg.indexOf(v) >= 0; }); });
      });
      itemsF.forEach(function (el) { el.classList.toggle('is-filtered-out', match.indexOf(el) < 0); el.classList.remove('is-over'); });
      if (limit) match.forEach(function (el, i) { if (i >= shown) el.classList.add('is-over'); });
      countEl.forEach(function (c) {
        var n = match.length;
        c.textContent = n + ' ' + (n === 1 ? (c.getAttribute('data-one') || 'item') : (c.getAttribute('data-many') || 'items'));
      });
      if (empty) empty.hidden = match.length > 0;
      if (more) more.hidden = !limit || match.length <= shown;
    }
    groups.forEach(function (g, gi) {
      var multi = g.hasAttribute('data-filter-multi');
      var chips = $$('[data-filter]', g);
      chips.forEach(function (c) {
        if (c.tagName === 'BUTTON' && !c.getAttribute('type')) c.setAttribute('type', 'button');
        if (!c.hasAttribute('aria-pressed')) c.setAttribute('aria-pressed', c.getAttribute('data-filter') === 'all' ? 'true' : 'false');
        c.addEventListener('click', function () {
          var v = (c.getAttribute('data-filter') || '').toLowerCase();
          if (v === 'all' || !v) sel[gi] = [];
          else if (multi) { var i = sel[gi].indexOf(v); if (i >= 0) sel[gi].splice(i, 1); else sel[gi].push(v); }
          else sel[gi] = sel[gi][0] === v ? [] : [v];
          chips.forEach(function (x) {
            var xv = (x.getAttribute('data-filter') || '').toLowerCase();
            x.setAttribute('aria-pressed', (xv === 'all' ? !sel[gi].length : sel[gi].indexOf(xv) >= 0) ? 'true' : 'false');
          });
          shown = limit;
          apply();
        });
      });
    });
    if (more) more.addEventListener('click', function () { shown += limit || itemsF.length; apply(); });
    apply();
  });

  /* ---------------- videos: hero loops play only on screen, never under reduced motion or Save-Data. data-after-load starts (and so downloads) only
     after window load; data-src on the video or its <source> is attached then; data-src-small replaces it below 720px wide. The still under the
     video shows until .is-playing. [data-video-toggle] pauses the video named by aria-controls, else every video in its host. ---------------- */
  var allVids = $$('video[data-inview-play], video[autoplay], video[data-after-load]');
  var playV = function (v) { if (v.hasAttribute('data-user-paused')) return; var p = v.play && v.play(); if (p && p.catch) p.catch(function () {}); };
  if (reduce || saveData) {
    allVids.forEach(function (v) { v.removeAttribute('autoplay'); if (v.pause) v.pause(); });
  } else {
    var ioVid = hasIO ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) playV(en.target); else en.target.pause(); });
    }, { threshold: 0.1 }) : null;
    var startV = function (v) {
      var small = (window.innerWidth || 1280) < 720;
      $$('source[data-src]', v).forEach(function (s) { s.setAttribute('src', (small && s.getAttribute('data-src-small')) || s.getAttribute('data-src')); s.removeAttribute('data-src'); });
      if (v.hasAttribute('data-src')) { v.setAttribute('src', (small && v.getAttribute('data-src-small')) || v.getAttribute('data-src')); v.removeAttribute('data-src'); }
      if (v.load && v.hasAttribute('data-after-load')) v.load();
      v.muted = true;
      v.addEventListener('playing', function () { v.classList.add('is-playing'); });
      if (ioVid) ioVid.observe(v); else playV(v);
    };
    allVids.forEach(function (v) {
      v.muted = true;
      if (v.hasAttribute('data-after-load') && doc.readyState !== 'complete') window.addEventListener('load', function () { startV(v); });
      else startV(v);
    });
  }
  function hostOf(el) { return el.closest ? el.closest('[data-video-host], .band, section') : null; }
  function bindToggle(b, vids) {
    var label = $('.video-toggle__label', b);
    var tPause = b.getAttribute('data-label-pause') || 'Pause motion';
    var tPlay = b.getAttribute('data-label-play') || 'Play motion';
    if (b.tagName === 'BUTTON' && !b.getAttribute('type')) b.setAttribute('type', 'button');
    var set = function (paused) {
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (label) label.textContent = paused ? tPlay : tPause;
      else b.setAttribute('aria-label', paused ? tPlay : tPause);
    };
    b.addEventListener('click', function () {
      var pausedNow = b.getAttribute('aria-pressed') !== 'true';
      vids.forEach(function (v) {
        if (pausedNow) { v.setAttribute('data-user-paused', ''); v.pause(); }
        else { v.removeAttribute('data-user-paused'); playV(v); }
      });
      set(pausedNow);
    });
    set(false);
  }
  $$('[data-video-toggle]').forEach(function (b) {
    var id = b.getAttribute('aria-controls');
    var v = id ? doc.getElementById(id) : null;
    var host = hostOf(b);
    var vids = v ? [v] : (host ? $$('video', host) : []);
    if (vids.length) bindToggle(b, vids);
    if (reduce || saveData) b.hidden = true;
  });

  /* ---------------- [data-count]: a numeral counts up once when it enters, then shows its exact original text ---------------- */
  var counts = $$('[data-count]');
  if (!reduce && hasIO && counts.length) {
    var runCount = function (el) {
      var txt = el.textContent;
      var m = txt.match(/\d[\d,]*(\.\d+)?/);
      if (!m) return;
      var raw = m[0];
      var target = parseFloat(raw.replace(/,/g, ''));
      if (!isFinite(target) || target <= 0) return;
      var dec = m[1] ? m[1].length - 1 : 0;
      var comma = raw.indexOf(',') >= 0;
      var pre = txt.slice(0, m.index), post = txt.slice(m.index + raw.length);
      var dur = parseFloat(el.getAttribute('data-count-dur')) || 1400;
      var t0 = now();
      el.style.fontVariantNumeric = 'tabular-nums';
      var step = function () {
        var k = clamp((now() - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - k, 3);
        var v = (target * e).toFixed(dec);
        if (comma) v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.textContent = pre + v + post;
        if (k < 1) window.requestAnimationFrame(step); else { el.textContent = txt; el.style.removeProperty('font-variant-numeric'); }
      };
      step();
    };
    var ioCount = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (!x.isIntersecting) return; ioCount.unobserve(x.target); runCount(x.target); });
    }, { threshold: 0.5 });
    counts.forEach(function (el) { ioCount.observe(el); });
  }

  /* ---------------- today's hours: [data-hours] rows (dt = the day's name) get .is-today; [data-today-pick] shows only its child whose
     data-dayname matches today (all of them stay visible without JS) ---------------- */
  var dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var today = dayNames[new Date().getDay()];
  $$('[data-hours] .hours__row').forEach(function (row) {
    var dt = $('dt', row);
    if (dt && dt.textContent.trim().slice(0, 3).toLowerCase() === today) row.classList.add('is-today');
  });
  $$('[data-today-pick]').forEach(function (box) {
    var hit = false;
    $$('[data-dayname]', box).forEach(function (c) {
      var on = (c.getAttribute('data-dayname') || '').trim().slice(0, 3).toLowerCase() === today;
      c.classList.toggle('is-today', on);
      if (on) hit = true;
    });
    if (hit) box.classList.add('has-today');
  });

  /* ---------------- [data-faq]: one open answer at a time inside a group marked data-faq="single" ---------------- */
  $$('[data-faq="single"]').forEach(function (g) {
    var ds = $$('details', g);
    ds.forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) ds.forEach(function (o) { if (o !== d) o.open = false; }); }); });
  });

  /* ---------------- demo forms (D9): never post; show the form's one honest line ---------------- */
  $$('[data-demo-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('[data-demo-note]', f);
      if (note) note.hidden = false;
    });
  });

  window.clReady = true;
})();
