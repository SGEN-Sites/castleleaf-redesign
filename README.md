# CastleLeaf redesign (pitch)

A redesign concept for CastleLeaf, the adult-use cannabis dispensary and craft kitchen at 100 Leo M Birmingham Pkwy,
Brighton, MA. It is a static site with no runtime dependencies: the pages are generated from JSON content by a small
Node.js build, and the preview is served from GitHub Pages with `noindex` on every page.

- **Content:** CastleLeaf's own pages, carried word for word, plus new guide and journal pages written for this concept.
- **Design:** "Lantern Keep" in CastleLeaf's black and gold, see [docs/DESIGN.md](docs/DESIGN.md).
- **Media:** CastleLeaf's own photographs plus AI-generated mood imagery and one AI-generated video loop, all labelled,
  listed in [docs/MEDIA.md](docs/MEDIA.md).
- **Shop buttons** open CastleLeaf's live online menu. Forms on the preview are demos and send nothing.

## Build

```
node src/build.mjs            # writes dist/
node tools/serve.mjs --root dist --port 8080 --not-found 404.html
```

Node 18 or newer and `cwebp` on the PATH (for the WebP image variants).
