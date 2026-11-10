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
fine grain), as was `g-feature-vip`. Cut-outs are trimmed to the subject with a small margin.

### Stages and halls

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-hero-lantern` | A dried cannabis flower under a clear glass cloche on a pale limestone plinth, lit by a single warm beam in a dark room | 2752x1536 | left 55% above the lower quarter: empty warm-dark wall with one soft diagonal patch of light, for light display type; the cloche stands right of centre (about 56 to 75% across) on a stone plinth (about 39 to 87% across, in the lower quarter); the far right falls off into shadow |
| `g-stage-gallery` | An empty arched niche in a dark plaster wall, lit by a single warm beam of light | 2752x1536 | left 40% and the whole top band: smooth warm-dark wall; the lit arched niche sits right of centre (about 58-78% across) |
| `g-hall-linen` | Decorative background (empty alt): pale linen and plaster in soft morning light | 2752x1536 | everywhere: high-key, low-contrast; the brightest light pool is upper right |
| `g-hall-sage` | Decorative background (empty alt): a pale room in sage-tinted morning light with soft light rays | 2752x1536 | everywhere: high-key pale sage; the light rays enter from the upper left |
| `g-arch-window` | A tall white arched window pouring soft morning light into an empty cream room | 2752x1536 | left 45%: smooth pale plaster wall in soft light; the arched window stands right of centre |

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
| `g-feature-delivery` | A plain sealed kraft paper bag on the stone steps of a brownstone stoop at dusk, lit by a warm porch light | 2496x1664 | left 40%: dusk-blue brick and shadow; the bag stands right of centre on the steps |
| `g-feature-budtender` | Two hands presenting a small glass jar of cannabis flower across a pale wood counter | 2496x1664 | left 35%: softly blurred warm shop background; the jar and hands sit centre-right |
| `g-feature-vip` | A glass display vitrine holding a dark green velvet tray, lit by a single warm beam in a dark room | 2496x1664 | left 40%: deep warm darkness; the vitrine glows right of centre |
| `g-feature-blog` | An open notebook with pressed green leaves beside a cup of tea on a linen tablecloth in window light | 2496x1664 | right 40%: pale linen tablecloth in window light |
| `g-feature-firstvisit` | An open glass door leading into a bright, calm, empty shop interior with a pale wood floor and cream walls | 2496x1664 | upper 35%: soft bright ceiling and cream wall |
| `g-feature-law` | A brass magnifying glass, a fountain pen and folded blank paper on natural linen in soft light | 2496x1664 | right 50%: blank cream paper |
| `g-feature-card` | A blank cream card and a fountain pen lying on natural linen in soft light | 2496x1664 | left 45%: plain linen cloth |
| `g-feature-deli` | A row of glass deli jars of cannabis flower on a counter under a single warm light | 2496x1664 | left 35% and the top band: warm darkness |
| `g-feature-kiosk` | A slim touch-screen kiosk with a softly glowing blank screen in a bright, minimal shop | 2496x1664 | left 45%: bright cream wall and pale floor |
| `g-feature-events` | Warm string lights over a wooden table with framed abstract art prints leaning on a cream wall | 2496x1664 | upper 35%: soft dark wall above the string lights |

### Article pool

| Id | What it shows | Pixels | Where text can sit |
|---|---|---|---|
| `g-art-strains` | Three cannabis flower buds of different colours in small stoneware dishes on pale stone | 2496x1664 | upper 30%: plain pale stone |
| `g-art-terpenes` | Citrus peel, lavender, black peppercorns, a pine sprig and a cannabis bud arranged on pale linen | 2496x1664 | right 35%: plain linen |
| `g-art-cannabinoids` | A macro view of frosty resin glands on a cannabis flower, glistening in warm light | 2496x1664 | left 35%: soft out-of-focus warm darkness |
| `g-art-label` | A small glass jar with a blank paper tag beside a brass magnifying glass on linen | 2496x1664 | left 40%: plain linen |
| `g-art-budtender` | Glass jars of cannabis flower and an open notepad on a pale wood counter in warm light | 2496x1664 | left 40%: blurred warm shop background |
| `g-art-deli` | An open glass jar of cannabis flower beside steel tongs on a pale counter in warm light | 2496x1664 | upper 30%: warm dark background |
| `g-art-delivery` | A plain kraft paper bag on a doormat in front of a dark green front door in morning light | 2496x1664 | upper 35%: dark green door panels |
| `g-art-decarb` | Broken-up dried cannabis flower on a parchment-lined baking tray on a pale kitchen counter | 2496x1664 | right 35%: plain cream counter |
| `g-art-butter` | A block of pale green butter in a glass dish beside a small spatula and a strainer bowl on a pale counter | 2496x1664 | left 35%: plain cream counter |
| `g-art-history` | A coil of natural hemp rope, dried stalks and a small lit clay oil lamp on a dark wooden table | 2496x1664 | upper 35%: warm darkness |
| `g-art-etiquette` | A small wooden table with a glass carafe of water, a glass and a small cup on a quiet porch at golden hour | 2496x1664 | upper 35%: soft green garden background |
| `g-art-edibles` | Squares of dark chocolate and sugar-dusted fruit jellies on a ceramic plate on linen | 2496x1664 | right 35%: plain linen |

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
