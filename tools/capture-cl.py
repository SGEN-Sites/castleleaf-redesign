# capture-cl.py - turn each captured CastleLeaf page (audit/raw/*.html, untouched; URL map audit/raw/_index.json) into ordered
# section/block JSON for the redesign: src/content/pages/<slug>.json (slug = URL path, '/' -> '__', home = 'home').
# Content region = <main> when the template has one, else everything between the Elementor header and footer. Every visible word of <main> is carried; markup, classes and
# platform runtime are not. Head metadata (title, description, canonical, og, JSON-LD) is carried as captured.
#   python -I tools/html-to-blocks.py <project-dir>
import sys, os, re, json, html
from html.parser import HTMLParser

ROOT = sys.argv[1]
RAW = os.path.join(ROOT, 'audit', 'raw')
OUT = os.path.join(ROOT, 'src', 'content', 'pages')
os.makedirs(OUT, exist_ok=True)
CAPTURED = '2026-11-10'

VOID = {'img', 'br', 'hr', 'source', 'input', 'meta', 'link', 'wbr', 'area', 'col', 'embed', 'track', 'param'}
INLINE = {'a', 'strong', 'em', 'b', 'i', 'br', 'code', 'small', 'time', 'abbr', 'sup', 'sub', 'span', 'mark', 'u', 's', 'q', 'cite', 'kbd', 'var'}
KEEP_ATTR = {'a': ['href', 'target', 'rel', 'aria-label'], 'time': ['datetime'], 'abbr': ['title']}
BLOCKISH = {'p', 'div', 'section', 'article', 'ul', 'ol', 'dl', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'figure', 'blockquote', 'details', 'table', 'iframe', 'video', 'picture', 'header', 'footer', 'nav', 'aside', 'svgph', 'button'}


class Node:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.children = tag, dict(attrs), []


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root', [])
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].children.append(n)
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)

    def handle_comment(self, data):
        pass


def esc(s):
    return html.escape(s, quote=False)


def inline_html(n):
    out = []
    for c in n.children:
        if isinstance(c, str):
            out.append(esc(c))
            continue
        if c.tag == 'br':
            out.append('<br>')
            continue
        if c.tag == 'svgph':
            continue
        inner = inline_html(c)
        if c.tag in ('span', 'div', 'p', 'label', 'li') or c.tag not in INLINE:
            out.append(inner)
            continue
        attrs = ''.join(' %s="%s"' % (k, html.escape(c.attrs[k] or '')) for k in KEEP_ATTR.get(c.tag, []) if k in c.attrs)
        out.append('<%s%s>%s</%s>' % (c.tag, attrs, inner, c.tag))
    return ''.join(out)


def text_of(n):
    if isinstance(n, str):
        return n
    return ''.join(text_of(c) for c in n.children)


def has_block_child(n):
    for c in n.children:
        if isinstance(c, Node) and (c.tag in BLOCKISH or (c.tag not in INLINE and has_block_child(c))):
            return True
    return False


def clean(s):
    return re.sub(r'\s+', ' ', s).strip()


def img_block(n):
    b = {'t': 'img', 'src': n.attrs.get('src', ''), 'alt': n.attrs.get('alt', '')}
    for k in ('width', 'height'):
        if n.attrs.get(k):
            b[k] = n.attrs[k]
    return b


def to_blocks(n, svgs):
    out = []
    pending_links = []

    def flush():
        if pending_links:
            out.append({'t': 'links', 'items': list(pending_links)})
            pending_links.clear()

    for c in n.children:
        if isinstance(c, str):
            if c.strip():
                flush()
                out.append({'t': 'text', 'html': esc(clean(c))})
            continue
        t = c.tag
        if t == 'a' and not has_block_child(c):
            item = {'href': c.attrs.get('href', ''), 'html': clean(inline_html(c))}
            for k in ('target', 'rel', 'aria-label'):
                if c.attrs.get(k):
                    item[k] = c.attrs[k]
            imgs = [x for x in c.children if isinstance(x, Node) and x.tag == 'img']
            if imgs:
                item['img'] = img_block(imgs[0])
            pending_links.append(item)
            continue
        flush()
        if re.fullmatch(r'h[1-6]', t):
            out.append({'t': t, 'html': clean(inline_html(c)), **({'id': c.attrs['id']} if c.attrs.get('id') else {})})
        elif t == 'p':
            if has_block_child(c):
                out.extend(to_blocks(c, svgs))
            else:
                h = clean(inline_html(c))
                if h:
                    out.append({'t': 'p', 'html': h})
        elif t in ('ul', 'ol'):
            items = []
            for li in c.children:
                if isinstance(li, Node) and li.tag == 'li':
                    if has_block_child(li):
                        items.append({'blocks': to_blocks(li, svgs)})
                    else:
                        items.append(clean(inline_html(li)))
            out.append({'t': t, 'items': items})
        elif t == 'dl':
            items, cur = [], None
            for d in c.children:
                if not isinstance(d, Node):
                    continue
                if d.tag == 'div':
                    for dd in d.children:
                        if isinstance(dd, Node) and dd.tag == 'dt':
                            cur = {'dt': clean(inline_html(dd)), 'dd': []}
                            items.append(cur)
                        elif isinstance(dd, Node) and dd.tag == 'dd' and cur is not None:
                            cur['dd'].append(clean(inline_html(dd)))
                elif d.tag == 'dt':
                    cur = {'dt': clean(inline_html(d)), 'dd': []}
                    items.append(cur)
                elif d.tag == 'dd' and cur is not None:
                    cur['dd'].append(clean(inline_html(d)))
            out.append({'t': 'dl', 'items': items})
        elif t == 'blockquote':
            out.append({'t': 'quote', 'html': clean(inline_html(c))} if not has_block_child(c) else {'t': 'quote', 'blocks': to_blocks(c, svgs)})
        elif t == 'img':
            out.append(img_block(c))
        elif t == 'picture':
            imgs = [x for x in c.children if isinstance(x, Node) and x.tag == 'img']
            if imgs:
                out.append(img_block(imgs[0]))
        elif t == 'figure':
            cap = [x for x in c.children if isinstance(x, Node) and x.tag == 'figcaption']
            body = Node('div', [])
            body.children = [x for x in c.children if not (isinstance(x, Node) and x.tag == 'figcaption')]
            b = {'t': 'figure', 'blocks': to_blocks(body, svgs)}
            if cap:
                b['caption'] = clean(inline_html(cap[0]))
            out.append(b)
        elif t == 'iframe':
            out.append({'t': 'embed', 'src': c.attrs.get('src', ''), 'title': c.attrs.get('title', '')})
        elif t == 'video':
            srcs = [{'src': s.attrs.get('src', ''), 'media': s.attrs.get('media', ''), 'type': s.attrs.get('type', '')} for s in c.children if isinstance(s, Node) and s.tag == 'source']
            out.append({'t': 'video', 'sources': srcs, 'poster': c.attrs.get('poster', '')})
        elif t == 'details':
            summ = [x for x in c.children if isinstance(x, Node) and x.tag == 'summary']
            body = Node('div', [])
            body.children = [x for x in c.children if not (isinstance(x, Node) and x.tag == 'summary')]
            out.append({'t': 'details', 'summary': clean(inline_html(summ[0])) if summ else '', 'blocks': to_blocks(body, svgs)})
        elif t == 'article':
            out.append({'t': 'card', 'blocks': to_blocks(c, svgs)})
        elif t == 'a':  # anchor wrapping blocks: a link card
            b = {'t': 'linkcard', 'href': c.attrs.get('href', ''), 'blocks': to_blocks(c, svgs)}
            for k in ('target', 'rel', 'aria-label'):
                if c.attrs.get(k):
                    b[k] = c.attrs[k]
            out.append(b)
        elif t == 'svgph':
            out.append({'t': 'svg', 'raw': svgs[int(c.attrs['data-i'])]})
        elif t == 'table':
            out.append({'t': 'table', 'html': re.sub(r'\s(class|style)="[^"]*"', '', svgs_restore(c))})
        elif t == 'button':
            txt = clean(text_of(c))
            if txt:
                out.append({'t': 'button', 'html': esc(txt), 'aria-label': c.attrs.get('aria-label', '')})
        elif t in ('script', 'style', 'noscript', 'template', 'form', 'input', 'select', 'textarea', 'source'):
            continue
        elif t == 'nav':
            out.append({'t': 'nav', 'label': c.attrs.get('aria-label', ''), 'blocks': to_blocks(c, svgs)})
        elif t in INLINE and not has_block_child(c):
            h = clean(inline_html(Node('x', []) if False else wrap(c)))
            if h:
                out.append({'t': 'text', 'html': h})
        else:  # div, section, header, aside, span with blocks ...
            inner = to_blocks(c, svgs)
            cards = [b for b in inner if b['t'] in ('card', 'linkcard', 'figure', 'details')]
            if c.attrs.get('aria-hidden') == 'true':
                inner = [{'t': 'hidden', 'blocks': inner}]
                out.extend(inner)
            elif len(cards) >= 2 and len(cards) >= len(inner) - 1:
                out.append({'t': 'grid', 'blocks': inner})
            else:
                out.extend(inner)
    flush()
    return out


def wrap(c):
    n = Node('x', [])
    n.children = [c]
    return n


def svgs_restore(n):
    return inline_html(wrap(n))


def head_meta(h):
    m = {}
    t = re.search(r'<title>([\s\S]*?)</title>', h)
    m['title'] = html.unescape(t.group(1)).strip() if t else ''
    for name, key in (('description', 'description'),):
        x = re.search(r'<meta\s+name="%s"\s+content="([^"]*)"' % name, h)
        m[key] = html.unescape(x.group(1)) if x else ''
    x = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', h)
    m['canonical'] = x.group(1) if x else ''
    og = {}
    for k, v in re.findall(r'<meta\s+property="(og:[a-z_:]+)"\s+content="([^"]*)"', h):
        og[k] = html.unescape(v)
    m['og'] = og
    m['jsonld'] = [json.loads(s) for s in re.findall(r'<script type="application/ld\+json"[^>]*>([\s\S]*?)</script>', h) if s.strip()]
    return m



RUNTIME = [  # platform runtime and chrome that is not page content (shop-plugin overlays, age gate, sticky promo)
    'One moment', 'Please wait while we handle your return from the store.', 'Your bag is saved.', 'Return to menu', 'Secret Link',
]

def region(h):
    mm = re.search(r'<main[\s\S]*?</main>', h)
    if mm:
        return mm.group(0)
    a = re.search(r'<header data-elementor-type="header"[\s\S]*?</header>', h)
    b = re.search(r'<footer data-elementor-type="footer"', h)
    start = a.end() if a else 0
    end = b.start() if b else len(h)
    return '<main>' + h[start:end] + '</main>'

idx = json.load(open(os.path.join(RAW, '_index.json'), encoding='utf-8'))
summary = []
for url, rec in idx.items():
    f = rec.get('file')
    if not f:
        continue
    h = open(os.path.join(RAW, f), encoding='utf-8', errors='strict').read()
    meta = head_meta(h)
    main = region(h)
    main = re.sub(r'(?is)<(script|style|noscript|template)\b[^>]*>.*?</\1>', ' ', main)
    # Joint Commerce bag/return overlay and the age gate are runtime, not content
    main = re.sub(r'(?is)<div[^>]*class="[^"]*(?:age-gate|jc-return|joint-return)[^"]*"[\s\S]*?</div>\s*</div>', ' ', main)
    svgs = []

    def keep_svg(m):
        svgs.append(m.group(0))
        return '<svgph data-i="%d"></svgph>' % (len(svgs) - 1)
    main = re.sub(r'<svg[\s\S]*?</svg>', keep_svg, main)
    p = P()
    p.feed(main)
    mains = [c for c in p.root.children if isinstance(c, Node) and c.tag == 'main']
    mainnode = mains[0] if mains else p.root
    blocks = to_blocks(mainnode, svgs)

    def drop_runtime(bs):
        out = []
        for b in bs:
            txt = re.sub(r'<[^>]+>', '', b.get('html', '')) if isinstance(b, dict) else ''
            if isinstance(b, dict) and b.get('t') in ('text', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6') and html.unescape(txt).strip() in RUNTIME:
                continue
            if isinstance(b, dict) and 'blocks' in b:
                b = dict(b, blocks=drop_runtime(b['blocks']))
            out.append(b)
        return out
    blocks = drop_runtime(blocks)
    path = re.sub(r'^https?://[^/]+', '', url) or '/'
    slug = path.strip('/').replace('/', '__') or 'home'
    slug = re.sub(r'[^A-Za-z0-9_\-]', '', slug)
    h1 = ''
    def find_h1(bs):
        for b in bs:
            if b.get('t') == 'h1':
                return re.sub(r'<[^>]+>', '', b['html'])
            if 'blocks' in b:
                r = find_h1(b['blocks'])
                if r:
                    return r
        return ''
    h1 = html.unescape(find_h1(blocks))
    doc = {'slug': slug, 'path': path, 'source': url, 'captured': CAPTURED, **meta, 'h1': h1, 'sections': [{'id': '', 'blocks': blocks}]}
    with open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8') as o:
        json.dump(doc, o, ensure_ascii=False, indent=1)
    words = len(re.findall(r"[A-Za-z0-9$']+", html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<svgph[^>]*></svgph>', '', main)))))
    summary.append((slug, len(blocks), words, h1[:50]))
for s in sorted(summary):
    print('%-70s blocks %3d words %5d  h1=%s' % s)
print('pages', len(summary))
