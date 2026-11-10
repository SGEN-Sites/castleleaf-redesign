# Media

What on this site is generated, what was enhanced, and how. Generated images are illustrative mood pictures: none of
them shows CastleLeaf's store, staff, customers or products, and no caption or alt text says so. Real people appear only
in the client's own team photos.

## Labels

- Every generated still carries the IPTC digital source type `trainedAlgorithmicMedia` as embedded XMP (JPEG APP1, PNG
  iTXt), and the WebP variants the build makes get the same XMP. Every generated `<img>` carries `data-ai="generated"`.
- The hero loop carries the same IPTC URI and a plain note in its MP4 container tags (`comment`, `description`); its poster
  carries the XMP.
- The four upscaled client photos carry the IPTC digital source type `algorithmicallyEnhanced` as XMP.

## Tools

| Use | Model (all through fal.ai) |
|---|---|
| Stills | FLUX 1.1 pro ultra (`fal-ai/flux-pro/v1.1-ultra`) |
| Cut-outs (transparent PNG) | BiRefNet v2 matting (`fal-ai/birefnet/v2`) |
| Hero loop | Kling v3 pro image-to-video (`fal-ai/kling-video/v3/pro/image-to-video`) |
| Photo upscales | Topaz upscale (`fal-ai/topaz/upscale/image`), High Fidelity V2 and Text Refine, face enhancement off |

## Hero loop

Made from the `g-hero-lantern` still: a locked-off camera where only the light in the beam breathes and the haze drifts.
The 10 second clip plays forward and then in reverse, so the 20 second loop has no seam. H.264, no audio, tagged bt709
(primaries, transfer and matrix), fast start. The page shows the poster first and starts the video only after load; it is
hidden under reduced motion and has a pause button.

| File | Size | Frame |
|---|---|---|
| `assets/media/hero-lantern.mp4` (desktop) | 3,151 KB | 1920x1072 |
| `assets/media/hero-lantern-phone.mp4` (phone, 9:16 crop that keeps the subject) | 1,460 KB | 720x1280 |
| `assets/media/hero-lantern-poster.webp` (poster, from the still) | 116 KB | 1920x1072 |

## Generated stills

All stills: FLUX 1.1 pro ultra. Cut-outs: FLUX 1.1 pro ultra on a plain studio ground, then BiRefNet v2. The category
series was generated at 3:4, cropped to 4:5 and given one warm grade with the hero (the darks lifted to charcoal brown,
fine grain). Cut-outs are trimmed to the subject with a small margin.

**Revision 1 (black and gold).** The site moved to CastleLeaf's black and gold, so 17 stills that were set in cream,
linen and sage were made again with the same subjects and the same text zones, now on black stone in warm golden light:
eight features (budtender, VIP, blog, first visit, law, card, kiosk, events) and nine of the twelve article pictures
(all but cannabinoids, deli and history). The first-visit picture became a close view of a door handle, and the butter
dish lost its sieve: the earlier tries showed lettering on a reflected sign or powder on the stone. Three images with a cool dusk or street tone (`g-feature-delivery`, `g-art-delivery`, `g-feature-firstvisit`)
had the saturation of their blue hues cut by up to 80%, brightness kept. `g-stage-gallery` was made again without its
arched niche.

### Stages

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-hero-lantern` | A dried cannabis flower under a clear glass cloche on a pale limestone plinth, lit by a single warm beam in a dark room | 2752x1536 | left 55% above the lower quarter: empty warm-dark wall with one soft diagonal patch of light, for light display type; the cloche stands right of centre (about 56 to 75% across) on a stone plinth (about 39 to 87% across, in the lower quarter); the far right falls off into shadow |
| `g-stage-gallery` | An empty rectangular niche in a polished black stone wall, lit from above by a warm golden beam | 2752x1536 | left 38% and right 34%: polished black marble; the gold-lit niche is centred (about 39 to 64% across) |

Taken out of the site in revision 1: `g-hall-linen`, `g-hall-sage` (pale linen and sage halls) and `g-arch-window` (an
arched window in a cream room). Nothing used them after the black and gold change.

### Textures (revision 1: black and gold)

Generated in revision 1 for CastleLeaf's black and gold, after the client's own deal art (black stone, metallic gold paint).
All FLUX 1.1 pro ultra, decorative (empty alt), labelled like every other generated still. The gold paint pieces are on
pure black so the page can blend them in with `mix-blend-mode: screen`.

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-tex-obsidian` | Glossy liquid black obsidian with flowing ripples and fine gold flecks | 2752x1536 | under a dark veil only (busy texture); calmest at the centre and left |
| `g-tex-obsidian-vein` | Polished black stone crossed by thin veins of metallic gold | 2752x1536 | the large black fields between the veins |
| `g-tex-gold-stroke` | One broad diagonal brush stroke of metallic gold paint on pure black | 2752x1536 | anywhere off the stroke (it runs from the lower left to the upper right) |
| `g-tex-gold-ribbon` | Two long ribbons of metallic gold paint along the bottom edge of a pure black field | 3136x1344 | the upper two thirds (pure black) |
| `g-tex-gold-leaf` | Crinkled gold leaf filling the frame | 2752x1536 | everywhere, with dark text |
| `g-tex-gold-haze` | Soft golden haze and fine gold dust drifting across black | 2752x1536 | the lower half (calm black); the glow sits upper left |

### Category series

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-cat-flower` | A dried cannabis flower bud on a pale stone ledge in a single warm beam of light | 1792x2240 | upper 45%: warm darkness above the subject (title over the dark top or the dark foot under a scrim) |
| `g-cat-prerolls` | Three unlit pre-rolls of unbleached paper beside a lit candle on a pale stone ledge in a warm beam of light | 1792x2240 | upper 45%: warm darkness above the subject |
| `g-cat-vaporizers` | A slim unbranded vaporizer pen and a small cartridge of golden oil on a pale stone ledge in a single warm beam of light | 1792x2240 | upper 40%: warm darkness above the subject |
| `g-cat-edibles` | Sugar-dusted fruit jellies on a small patterned dish beside a lit candle on a pale stone ledge in warm light | 1792x2240 | upper 45%: warm darkness above the subject |
| `g-cat-concentrates` | A glossy piece of amber resin in a small glass dish beside a slim steel tool, on a pale stone ledge in warm light | 1792x2240 | upper 45%: warm darkness above the subject |
| `g-cat-topicals` | A small frosted glass jar of pale balm with its lid set beside it, on a pale stone ledge in warm light | 1792x2240 | upper 45%: warm darkness above the subject |
| `g-cat-tinctures` | A small amber glass dropper bottle on a pale stone ledge in a single warm beam of light | 1792x2240 | upper 40%: warm darkness above the subject |
| `g-cat-accessories` | A brass herb grinder and a small corked glass jar beside a lit candle on a pale stone ledge in a warm beam of light | 1792x2240 | upper 45%: warm darkness above the subject |

### Features

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-feature-delivery` | A plain sealed kraft paper bag on the stone steps of a brownstone stoop at dusk, lit by a warm porch light | 2496x1664 | left 40%: dark brick and shadow; the bag stands right of centre on the steps |
| `g-feature-budtender` | Two hands presenting a small glass jar of cannabis flower across a black stone counter | 2496x1664 | left 35%: softly blurred dark shelves with small gold lights; the jar and hands sit centre-right |
| `g-feature-vip` | A glass display vitrine holding a black velvet tray, lit by a single golden beam in a dark room | 2496x1664 | left 40%: deep black; the vitrine glows right of centre |
| `g-feature-blog` | An open notebook with pressed leaves beside a black cup of tea on a polished black stone table in warm lamp light | 2496x1664 | right 40%: plain polished black stone |
| `g-feature-firstvisit` | A brass handle on an open dark glass door, with a warm gold-lit boutique softly blurred behind | 2496x1664 | left 40%: calm dark glass |
| `g-feature-law` | A brass magnifying glass, a fountain pen and folded blank paper on polished black stone in warm light | 2496x1664 | right 40%: plain polished black stone |
| `g-feature-card` | A blank ivory card and a fountain pen lying on polished black stone in warm light | 2496x1664 | left 45%: plain polished black stone |
| `g-feature-deli` | A row of glass deli jars of cannabis flower on a counter under a single warm light | 2496x1664 | left 35% and the top band: warm darkness |
| `g-feature-kiosk` | A slim touch-screen kiosk with a softly glowing blank gold screen in a dark, minimal boutique | 2496x1664 | left 45%: dark matte wall and black stone floor |
| `g-feature-events` | Golden string lights over a dark wooden table with framed black and gold abstract prints leaning on a black wall | 2496x1664 | upper 35%: dark wall above the string lights |

### Article pool

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-art-strains` | Three cannabis flower buds of different colours in small black dishes on polished black stone | 2496x1664 | upper 30%: plain dark stone |
| `g-art-terpenes` | Citrus peel, lavender, black peppercorns, a pine sprig and a cannabis bud arranged on black slate | 2496x1664 | right 35%: plain black slate |
| `g-art-cannabinoids` | A macro view of frosty resin glands on a cannabis flower, glistening in warm light | 2496x1664 | left 35%: soft out-of-focus warm darkness |
| `g-art-label` | A small glass jar with a blank paper tag beside a brass magnifying glass on black stone | 2496x1664 | left 40%: plain black stone |
| `g-art-budtender` | Glass jars of cannabis flower and an open notepad on a black stone counter in warm light | 2496x1664 | left 40%: blurred dark shelves with small gold lights |
| `g-art-deli` | An open glass jar of cannabis flower beside steel tongs on a pale counter in warm light | 2496x1664 | upper 30%: warm dark background |
| `g-art-delivery` | A plain kraft paper bag on a doormat in front of a glossy black front door with brass hardware, lit by a porch lamp | 2496x1664 | upper 35%: black door panels |
| `g-art-decarb` | Broken-up dried cannabis flower on a parchment-lined baking tray on a black stone counter | 2496x1664 | right 35%: plain black counter |
| `g-art-butter` | A block of pale green butter in a glass dish beside a brass butter knife on black marble | 2496x1664 | left 35%: bare black marble |
| `g-art-history` | A coil of natural hemp rope, dried stalks and a small lit clay oil lamp on a dark wooden table | 2496x1664 | upper 35%: warm darkness |
| `g-art-etiquette` | A small black table with a glass carafe of water, glasses and a small dish on a quiet terrace at dusk by lantern light | 2496x1664 | upper 35%: soft dark garden background |
| `g-art-edibles` | Squares of dark chocolate and sugar-dusted fruit jellies on a black plate on polished black stone | 2496x1664 | right 35%: plain black stone |

### Cut-outs

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-cut-jar` | A glass apothecary jar of cannabis flower | 1039x1925 | transparent around the subject |
| `g-cut-tincture` | An amber glass dropper bottle | 715x1824 | transparent around the subject |
| `g-cut-preroll` | One cone-shaped pre-roll of unbleached paper with a twisted tip, standing upright | 368x1798 | transparent around the subject |
| `g-cut-leaf` | A fresh green cannabis fan leaf | 1432x2271 | transparent around the subject |

## Upscaled client photos

Saved under the same file names in `assets/photos/cl/`; the originals are kept out of the site. Topaz upscale, 3x, face
enhancement off. On `CL-Image-Hero.webp` the CASTLELEAF sign area comes from a second Topaz pass of the same photo
(Text Refine), blended into the High Fidelity V2 result, so the sign reads exactly as on the building.

| File | Was | Now | Model |
|---|---|---|---|
| `CL-Image-Hero.webp` | 810x570 | 2430x1710 | High Fidelity V2, sign area Text Refine |
| `CL-Image-SEO.webp` | 680x540 | 2040x1620 | Text Refine |
| `CL-Image-HowToShop.webp` | 580x320 | 1740x960 | Text Refine |
| `CL-Image-Events.webp` | 680x585 | 2040x1755 | High Fidelity V2 |

Not upscaled: the two team photos (`CL-Team.webp`, `Team-Photo-1.jpg`), because an upscaler can alter faces.
