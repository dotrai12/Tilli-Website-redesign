# Tilli Deck Design System

The visual system behind Tilli's 2026 school-facing decks — extracted verbatim from the source deck, not reconstructed from memory.

## What Tilli is

Tilli Kids Inc. is a research-backed programme for foundational cognitive and social-emotional skills in children aged 3–10, incubated at the **Stanford Graduate School of Education** and scaled with **UNICEF Innovation** funding. It sells into schools and NGOs across Sri Lanka, India, Jordan and beyond. The core promise, repeated everywhere: **"Developmentally on Track by 10" — in 20 minutes a week.**

The product has four parts, and the deck is structured around them:

- **Measure** — a 360° assessment of 12 foundational skills, 3× a year, from three angles (teacher observation, parent report, direct-from-child tasks). Eleven named assessments, including an Emotion Matching Task, Complex Situation Task, EFFORT executive-function reports, SDQ, Hearts & Flowers, Memory Game, ReAL and IDELA.
- **Analyze** — dashboards and child profiles built from ~579 data points per child per year.
- **Intervene** — a 36-week play-based curriculum (Feelings Time workbooks, Teacher's Guidebooks, SEL Teaching Kit) plus **Ask-Tilli**, a WhatsApp AI teaching assistant.
- **Prove** — impact data, pilots, and a Research–Practice Partnership with Stanford.

Contact in every deck: `kavindya@tillikids.com`.

## Source of truth

| Source | Detail |
|---|---|
| Canva deck | **"[2026] Master Deck _ Make a Copy _Tilli x [ORGANIZATION]"** — design id `DAHOHDcAURo`, 53 pages, 16:9. Shared with the assistant as `https://canva.link/gojqkusd6bnqq62` (short links can't be resolved by the assistant — the deck was located by title in the connected Canva account). Edit URL: `https://www.canva.com/d/IPyfd6czvyX4Nmq` |
| Extraction method | Deck exported to PPTX + per-page PNG. Colours, type sizes, spacing and layer geometry read from the OOXML; every logo, icon, illustration and product cover in `assets/` is a file lifted out of that package. |
| Working copies | Page renders and the layer-by-layer digest are kept in `_src/` (`_src/pages/p01–53.png`, `_src/slides-digest.md`, `_src/theme1.xml`). |

No codebase or Figma file was provided; the web/app UI kits in this system are therefore **not** included (see Gaps).

---

## CONTENT FUNDAMENTALS

**Voice: quietly authoritative, plain, and never salesy.** The deck's own line — *"We work quietly, inside schools"* — is the tone in one sentence. Claims are always attached to a number, an institution or a named person.

- **Second person, about the reader's school.** "What it asks of your teachers", "Pick the depth you want", "Leaders like you already chose Tilli". First person plural only for Tilli itself: "We ask for a little. Teachers get back a lot." Never "I".
- **Short declaratives, often two beats: problem then turn.** *"Every school measures academics. Almost none measure what makes academics possible."* / *"Effort in, relief out."* / *"You're not buying a product. You're joining a Stanford research partnership."*
- **Numbers do the persuading.** `80%`, `12`, `4,000+`, `12,510`, `579`, `95%`, `2 sections → 15 branches`. Figures keep their real formatting — comma thousands, `+`, `%`, `₹` — and are never rounded for looks.
- **Objections answered in the copy, not hidden.** A whole slide is titled "The honest workload", another "What it asks of your teachers", with the sub-line *"Two rhythms, not one — and neither adds a period."*
- **Casing:** sentence case for headlines and body. Uppercase is reserved for section words (`MEASURE`, `ANALYZE`, `INTERVENE`, `THE GAP`, `LET'S TALK IMPACT`) and tiny label strips. Never all-caps a full sentence except on a divider slide.
- **Punctuation habits:** em dashes and colons carry the rhythm; `→` for progression; `·` as the separator in award strips; italics for straplines and quotes.
- **Emoji: none.** Not in the deck, not in this system. Icons are the coloured-circle glyph set; unicode is used only for `→`, `·`, `×` and `°`.
- **Quotes are short and real** — 15 words or fewer, attributed with name, role and school: *"Every morning the children ask their teachers: are we doing a Tilli activity today?" — Mr. Upali Gunasekara, Principal, Polymath International School.*
- **Words to keep exact:** Ask-Tilli (hyphenated), Feelings Time, Teacher's Guidebook, 360° assessment, foundational skills, Research–Practice Partnership (RPP), Learning Cabinet, HundrED.

---

## VISUAL FOUNDATIONS

**The whole system is: white paper, one thin four-colour rail, black-ish Montserrat, and colour used only where it means something.** It reads like a research group that learned to design, not like an ed-tech brochure.

### Colour
Four brand colours — green `#56C02B`, pink `#E866B0`/magenta `#E91E8C`, cyan `#26BDE2`, yellow `#FCC30B` — plus orange `#F99B1C` for the hand-drawn brush and a fifth accent. Cyan owns navigation and section titles; magenta owns headline stats; green owns affirmation (ticks, eyebrows, "already working"); yellow owns time/cadence; orange owns human warmth and testimonials. **Never a gradient.** Backgrounds are white, or a single flat accent on a divider slide, or a pale wash (`#FFF6A8`, `#D9F5FF`, `#F1FFEC`, `#FFF6FB`, `#FFDCF0`) behind a card. Body text is warm grey `#545454`, headlines near-black `#141414`, card titles `#474747`, stat labels cool grey `#5B6170`. Two background colours per deck maximum.

### Type
**Montserrat only** (Light 300 → Heavy 900), with **Fredoka Semi-Bold** as a rare playful accent on child-facing material. Cover title 185px Bold at −0.06em tracking; divider statements 96px Extra-Bold; slide headlines 73px Bold; section words 54px Bold uppercase; stat numerals 68px Bold coloured; body 27–31px Medium; captions 21–25px. Italic Montserrat carries every strapline. One accented phrase per headline — no rainbow sentences.

### Backgrounds, texture, imagery
White, full-stop, broken by: flat colour divider panels with 40px radius; pale washes behind cards; and **real photography** — training rooms, teachers at laptops, children holding emotion cards. Photos are warm, unfiltered, slightly noisy real-world captures in rounded frames (16–24px); no duotones, no grain overlays, no stock. Illustration is the flat vector Tilli character (girl in a yellow headband and blue dungarees), plus a brain, a heart, a star, gold sparkles, and the **orange brush stroke** — the one hand-made mark, always bleeding off a slide edge.

### Cards, borders, shadows
The signature card is **white, 2px solid accent border, 24px radius, no shadow**, with an 84px accent circle holding a white glyph, a 36px bold title and grey body. Dense feature grids drop to a 1px `#ECEEF2` hairline with a whisper of shadow (`0 2px 10px rgba(20,20,20,.06)`). Tinted stat slabs have no border at all. Phone mockups get a 4px cyan (Ask-Tilli) or black (product) shell. There is no elevation system beyond those two levels; depth is not part of the language.

### Layout
1920×1080 fixed canvas. A 19px rail down the left edge (long green band, then 64px pink, cyan, yellow) — 43px and four equal quarters on the cover. Content starts at x=120, y=55. Rows of 3–4 equal cards with 28–40px gaps; one idea per row; generous white space at the bottom rather than a filled slide. Detail slides switch to a 500px cyan side panel + white content column. The rail and the bottom award/footnote line are the only fixed elements.

### Motion, hover, press
The source is print-still — no animation exists in it. For screens built from this system: 200ms `cubic-bezier(.2,.7,.3,1)`; cards lift `translateY(-4px)` on hover; buttons and pills press to `scale(.98)`; solid accents darken on hover, tints deepen one step. No bounces, no parallax, no scroll-jacking. Stat numerals may count up once on entry.

### Transparency, blur, radii
No blur anywhere, no glassmorphism, no protection gradients. Where type sits on a photo it sits in a solid capsule or beside the photo, never over it. Radii: 8 small · 16 tinted slab · 24 standard card · 40 divider panel · pill for labels.

---

## ICONOGRAPHY

- **One system, one treatment:** a flat white glyph inside a solid accent circle. Nothing else. The glyphs are the deck's own files, copied into `assets/icons/` as white PNGs with transparency: graduation-cap, globe, rosette, book, family, robot, clipboard-check, chart-up, clock, calendar, feather, smiley, heart, people, people-group, target, sparkle.
- **No icon font, no CDN set** (no Lucide/Heroicons/Font Awesome) is present in or implied by the source, and none was substituted. If a needed glyph is missing, use a `Pill` label or a photograph instead of importing a foreign icon set.
- **Vector twins exist but were left behind:** the PPTX also carries SVG duplicates of the decorative marks (numbers, ticks, quote marks). The PNGs are what the deck actually renders, so those are what ships here.
- **Larger marks are illustrations, not icons** — green tick, blue check circle, gold rosette, cyan arrow circle, quote marks in green/pink/cyan, and the donut rings; all in `assets/illustrations/`.
- **Emoji are never used.** Unicode is limited to `→ · × °`.
- **Numerals as graphics:** step numbers are set in type (`01`, `02`) or in a thin green outlined circle — the deck's black filled number badges were one-off page furniture and are not part of the system.

---

## Index

| File / folder | What's in it |
|---|---|
| `styles.css` | The single entry point consumers link. `@import`s only. |
| `tokens/fonts.css` | `@font-face` for Montserrat + Fredoka (variable woff2, latin + latin-ext, in `assets/fonts/`). |
| `tokens/colors.css` | Palette + semantic aliases (`--tl-*`). |
| `tokens/typography.css` | Font stacks, weights, deck and UI size scales, leading, tracking. |
| `tokens/layout.css` | Spacing, radii, borders, shadows, slide geometry, motion. |
| `tokens/base.css` | Body type defaults and link colours. |
| `assets/logos/` | tilli wordmark, Stanford GSE, Stanford University, UNICEF Innovation, Stanford Accelerator for Learning, Stanford HAI. |
| `assets/icons/` | The 17 white glyphs used in accent circles. |
| `assets/illustrations/` | Tilli character (waving, sitting), brush stroke, brain, heart, star, sparkles, quote marks, ticks, rosette, donuts, teaching kit. |
| `assets/products/` | Feelings Time workbooks, My First Feelings Book, Teacher's Guidebooks L1–L5 + Kindergarten. |
| `assets/photos/` | Real classroom / training photography, Stanford campus. |
| `assets/fonts/` | Montserrat + Fredoka woff2. |
| `guidelines/` | 21 specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab. |
| `slides/` | 11 sample slide layouts, one file per slide type. |
| `components/` | The reusable primitives, below. |
| `_src/` | Extraction working files: page renders, layer digest, theme XML. Not shipped to consumers. |
| `SKILL.md` | Agent Skills front-matter so this folder works as a Claude Code skill. |

### Components

Mount from `window.TilliDeckDesignSystem_4928e3` after loading `_ds_bundle.js`. Set `window.TILLI_ASSETS` to the relative path of `assets/` before the bundle loads if your page isn't at the project root.

**`components/slide/` — slide shells and type parts**
`SlideFrame` · `Rail` · `CoverSlide` · `SkillTags` · `DividerSlide` · `AssessmentPanel` · `PanelSection` · `Eyebrow` · `SlideTitle` · `Accent` · `SectionLabel` · `LogoLockup` · `PartnerLogos` · `Brush`

**`components/data/` — proof and figures**
`StatChip` · `StatBlock` · `DonutStat` · `DataTable` · `AwardStrip`

**`components/content/` — cards, labels, lists**
`OutlineCard` · `PlainCard` · `IconCircle` · `Pill` · `CheckList` · `CheckItem` · `StepCard` · `NumberedStep` · `QuoteCard` · `StoryBlock` · `PriceCard` · `HighlightText`

**`components/media/`**
`PhotoFrame` · `PhoneFrame`

Each component has a sibling `.d.ts` (props contract) and `.prompt.md` (when to use it, usage example, variants).

### Intentional additions

- **`DonutStat`** — the deck renders its three impact rings as flat images at fixed percentages. Reimplemented with `conic-gradient` so any value works; visually identical.
- **`Brush`** — not a "component" in the source, just a repeatedly placed asset. Wrapped so the corner/rotation conventions travel with it.
- **`PlainCard`** — the hairline-border card that appears on the six-up feature grid; separated from `OutlineCard` because the two never mix in one row.

### Gaps / deliberately not built

- **No web or app UI kit.** No codebase, repo or Figma file was supplied, and recreating tillikids.com or the Tilli app from deck screenshots would be invention. Provide the repo or a Figma link and these become the next step.
- **The Year 1 → Year 3 curved timeline** (deck p.45), the DNA/12-skills diagram (p.12) and the three-systems arrow diagram (p.13) are bespoke Canva illustrations, not systematised layouts. Use them as flat exports rather than rebuilding them.
- **Fonts are the Google Fonts originals** (Montserrat variable, Fredoka variable) — the same families the deck embeds, so this is a like-for-like match, not a substitution. Canva's embedded `.fntdata` binaries were not unpacked.
