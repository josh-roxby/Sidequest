# Side Quest design system

| | |
|---|---|
| Version | 2.0 |
| Date | 2026-08-31 |
| Status | Locked. 1.2 replaces both nav forms with a single button, adds the canvas map and the hex tiling, and sets the interaction hygiene rules. |
| Supersedes | The cream / sage / lavender token set in `app/globals.css` |
| Related | [reface-plan.md](./reface-plan.md) · [ux-loops.md](./ux-loops.md) · [PRD.md](./PRD.md) |

The direction is **field survey**: an ordnance notebook rather than a
lifestyle app. Paper ground, ink rules, hairline grid, mono numerals. The map
is the only place colour is allowed to do much, and the interface chrome
stays out of its way.

Three rules carry the identity. Everything else is detail.

1. **Three radii exist.** 6px on controls, 10px on surfaces, full round on
   identity and map objects. Nothing else.
2. **Every number is mono.** Prose is Archivo, data is JetBrains Mono.
3. **Eight pixels, everywhere.** One gutter value from every screen edge,
   for every floating surface.

---

## A. Tokens

### A-1 Colour

```css
:root {
  /* ground */
  --paper:      #F4F2EC;   /* page background */
  --surface:    #FBFAF6;   /* cards, frames, tiles */
  --surface-2:  #EDEAE1;   /* recessed wells, disabled fills */

  /* ink */
  --ink:        #16181A;   /* body text, borders, rules */
  --stone:      #6E6F69;   /* secondary text */
  --mute:       #8A8B85;   /* tertiary labels only, see A-1-1 */
  --rule:       #D6D2C6;   /* hairlines, grid, dividers */

  /* action */
  --field:      #2E4034;   /* every primary action */
  --field-ink:  #FBFAF6;   /* text on field */
  --field-soft: #E3E8E2;   /* active nav wash, selected rows */

  /* accent */
  --rust:       #A8563B;   /* unlocks, new territory, destructive */
  --rust-soft:  #F2E2DB;

  /* map */
  --map-paper:  #EFEDE5;
  --map-fog:    #C9C6BC;   /* unexplored overlay */
  --map-water:  #CFD8D6;
  --map-green:  #DEE4D7;
  --map-trail:  #2E4034;
}
```

**A-1-1 Contrast rules.** `stone` measures about 4.5:1 on paper, so it is
cleared for secondary body text. `mute` measures about 3.1:1, so it is
restricted to labels at 11px weight 600 or larger and never carries a
sentence. `field` and `rust` both clear AA on paper and both clear AA with
`surface` reversed out of them.

**A-1-2 Accent discipline.** `rust` means one of three things: you unlocked
something, you revealed new territory, or this action cannot be undone. It is
never used to make a screen livelier. If a screen looks flat without rust,
the fix is hierarchy, not accent.

**A-1-3 Single theme.** The palette is light only. A dark variant is a v1.5
question, and it is not a simple inversion: the fog overlay and the revealed
territory both read differently on a dark ground and would need their own
treatment.

### A-2 Type

Archivo for everything written. JetBrains Mono for everything counted. Both
load from `next/font/google`, both are variable, and both are already in the
Google Fonts catalogue so there is no licence question.

| Role | Face | Size / line | Weight | Tracking |
|---|---|---|---|---|
| `display` | Archivo | 28 / 32 | 600 | -0.02em |
| `h1` | Archivo | 22 / 28 | 600 | -0.015em |
| `h2` | Archivo | 17 / 22 | 600 | -0.01em |
| `body` | Archivo | 15 / 22 | 400 | 0 |
| `small` | Archivo | 13 / 18 | 400 | 0 |
| `label` | Archivo | 11 / 12 | 600 | 0.08em, uppercase |
| `data` | JetBrains Mono | 13 / 16 | 500 | 0.02em, tabular |
| `data-lg` | JetBrains Mono | 20 / 24 | 500 | 0.01em, tabular |
| `data-xl` | JetBrains Mono | 28 / 32 | 500 | 0 |

**A-2-1 The mono rule.** Distances, durations, tile counts, townland counts,
coordinates, XP, percentages, dates, times, elevations and any figure in a
stat row are set in JetBrains Mono with `font-variant-numeric: tabular-nums`.
Placenames, quest titles, tales and interface copy are Archivo. A sentence
that contains a number keeps the number in mono inline, which is the point:
the numbers should look measured.

**A-2-2 Irish text.** Placenames carry an Irish form, so the type stack has
to render fadas correctly at every weight. Archivo covers Latin Extended-A.
Irish forms are set in `body` italic, and the English gloss follows in
`small`.

### A-3 Shape

```css
--r-sm:   6px;     /* buttons, nav tiles, inputs, chips, checkboxes */
--r-md:   10px;    /* cards, frames, panels, callouts */
--r-full: 999px;   /* avatars, tabs, status chips, map markers */
```

There are no other radii. Not 2px, not 4px, not 16px.

**A-3-1 What each step means.** The two small steps separate *controls* from
*surfaces*, so a button never reads as a card and a card never reads as a
button. Full round is reserved for two things and they are related: identity
(avatars, rank chips, the active tab) and map objects (markers, the position
dot). Everything a person is, and everything a place is, is round. Everything
the interface is, is not.

**A-3-2 Enforcement.** Radius is set from a token, never from a Tailwind
radius utility. A `rounded-lg` or `rounded-xl` in a diff is a defect, because
it is a fourth value nobody agreed to.

**A-3-3 Note on the previous rule.** Version 1.0 allowed only 0 and 999px,
with the pill as the sole round element so that shape carried the meaning
"this is the action". That was replaced by the visual direction of
2026-08-31. The action pill is still full round and still one per screen, so
it keeps most of its signalling power, but it now shares roundness with
avatars and map markers rather than owning it outright.

### A-4 Spacing

Base unit 4, but the working scale is 8.

```css
--gutter: 8px;   /* the signature: every floating surface, every screen edge */
--s-1:  4px;   --s-2:  8px;   --s-3: 12px;   --s-4: 16px;
--s-5: 20px;   --s-6: 24px;   --s-8: 32px;   --s-12: 48px;
```

`--gutter` is not a spacing step, it is a constant. Frames, the thumb block,
map controls and toast surfaces all sit exactly 8px from the screen edge.
Nothing floating uses any other inset. Internal padding inside a frame is
`--s-4` on the sides and `--s-5` for reading surfaces.

### A-5 Motion

```css
--dur-tap:    90ms;    /* press feedback */
--dur-state: 180ms;    /* toggles, selection, hover */
--dur-frame: 240ms;    /* frame open and close */
--dur-reveal:600ms;    /* fog reveal, progress fills, unlock */
--ease:      cubic-bezier(0.2, 0, 0, 1);
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);
```

**A-5-1 Frames scale from the thumb corner.** A frame opens with
`transform-origin: bottom right`, scaling from 0.92 to 1 with opacity 0 to 1
over `--dur-frame`. It does not slide up from the bottom edge. This is the
single motion decision that most separates the app from a drawer pattern, and
it visually ties every frame to the thumb block it was opened from.

**A-5-2 Reduced motion.** The global guard already in `app/globals.css` stays
and is extended to cover the frame animation and the fog reveal. Under
reduced motion, frames cross-fade in place and the fog reveal applies
instantly.

### A-6 Sizes

```css
--tile:       56px;    /* thumb block tile, also the minimum touch target */
--tile-gap:    2px;    /* the visible grid line between tiles */
--block:     114px;    /* 56 + 2 + 56 */
--action-h:   48px;    /* primary pill height */
--btn-h:      40px;    /* square button height */
--hit-min:    44px;    /* absolute minimum for any interactive element */
```

---

## B. The square frame

The frame replaces every bottom sheet, drawer, dialog and modal in the app.

### B-1 Geometry

A frame is inset `--gutter` from the left, right and bottom edges of the
viewport, and its height is derived from its width by a fixed ratio. On a
393px viewport that means a 377px square sitting 8px off the bottom.

| Name | Ratio | Used for |
|---|---|---|
| `square` | 1:1 | Everything. Tier picker, confirmations, point popovers, filters, settings groups. |
| `tall` | 1:1.28 | Reading surfaces only: the tale reader and the quest preview. |

There is no full-screen sheet and no third size. If content does not fit, it
scrolls inside the frame. The constraint is the design.

### B-2 Anatomy

```
┌─────────────────────────────────┐
│ LABEL                           │  header: label, title, no close button
│ Title                           │
├─────────────────────────────────┤  1px rule
│                                 │
│ body, scrolls                   │
│                                 │
├─────────────────────────────────┤  1px rule
│ [ primary pill ]         [ × ]  │  footer: action + dismiss at the anchor
└─────────────────────────────────┘
```

The dismiss control is a 56px square flush to the bottom-right corner of the
frame. Because the frame itself is inset 8px, that square lands at exactly
`right: 8px; bottom: 8px`, which is precisely where the thumb block's
bottom-right tile sat before the frame opened. The thumb does not move. See
B-4.

### B-3 Scrim

`rgba(22, 24, 26, 0.32)` over the full viewport, fading in over
`--dur-frame`. Tapping the scrim dismisses. The map stays visible behind it,
which matters: a user opening a tier picker should still see where they are.

### B-4 The thumb anchor never moves

A fixed 56px region at `right: 8px; bottom: 8px` always contains something the
thumb can hit, and what it contains changes with context.

| Context | What sits at the anchor |
|---|---|
| Map, idle | The active nav tile |
| Frame open | The frame's dismiss control |
| Quest running | End walk |
| Loading | A disabled tile with the loading mark |

The thumb learns one position and keeps it for the life of the app. This is
the mechanic worth protecting: if a future screen wants to put something else
down there, it goes somewhere else instead.

---

## C. Navigation

One button. Everything else is behind a tap or a hold.

### C-1 The button

A single 56px square anchored `--gutter` from the bottom-right, on every
screen, carrying a surveyed-sheet glyph: a rectangle ruled into nine with the
centre cell pinned. It is the only fixed chrome in the app, which is what lets
the map be the whole screen.

### C-2 Tap: the drawer

Release before **300ms** and it is a tap. Opens a square drawer, the same `Frame` every other modal surface uses, so it
inherits the scrim, the focus trap, Escape, and the dismiss control at the
anchor. Tap the button to open, tap the same square to close. The thumb does
not travel.

Contents are a bento rather than a flat grid. The two destinations reached for
in every session get double-height tiles; the other six sit beneath as a 3×2.

**C-2-1 Nothing in the drawer scrolls.** The rows divide whatever height the
square gives them rather than carrying fixed heights, so the grid holds its
proportions on a small phone instead of overflowing. A drawer that scrolls has
stopped being a map of the app and become a list.

**C-2-4 Home lives in the header.** Home is the shell the eight tiles sit on
rather than a peer of them, so it is not one of the tiles. It takes the
header's spare corner as a small square, at a size that cannot compete with
the grid below.

**C-2-3 The footer carries the activity ticker, and it is a link.** The strip
left of the dismiss control would otherwise sit empty, so it runs the ten most
recent community events and taps through to the full feed. Scrolling text
belongs in one place: it was tried along the foot of Home and removed, because
a home screen with a ticker on it reads as a dashboard. The track holds its items twice
and translates by exactly -50%, which makes the reset frame pixel-identical to
the start frame. That is the whole trick: there is no jump to hide because the
two frames are the same. Duration scales with item count, so adding an update
slows the strip rather than speeding everything past.

**C-2-2 The blurb sits on the tile.** Each small tile carries its own one-line
explanation. An earlier pass put a question mark on every tile opening a
tooltip, which made the user dismiss a control before doing the thing they
opened the drawer for. When the answer fits on the tile, it belongs on it.

```
┌───────────────────────────────┐
│ GO TO                         │
│ Side Quest                    │
├───────────────────────────────┤
│ ┌───────────┐ ┌─────────────┐ │
│ │    MAP    │ │   QUESTS    │ │
│ └───────────┘ └─────────────┘ │
│ ┌──────┐ ┌──────┐ ┌────────┐  │
│ │ BADG │ │ HIST │ │ TALES  │  │
│ └──────┘ └──────┘ └────────┘  │
│ ┌──────┐ ┌──────┐ ┌────────┐  │
│ │ OUTP │ │ ABOUT│ │ SETTGS │  │
│ └──────┘ └──────┘ └────────┘  │
├───────────────────────────────┤
│                          [ × ]│
└───────────────────────────────┘
```

### C-3 Hold and drag: the shortcut

Reach **300ms** without releasing and three tiles fan onto the lattice around
the button, forming a 2×2 with the button at bottom-right. Keep the thumb
down, drag toward the one you want, release.

Ambiguity between tap and hold is no longer a risk at any threshold, because
the tap runs off the native click rather than off pointerup (C-3-4). That
frees the number to be tuned purely on feel, and 300ms is about as short as a
hold can be while still reading as deliberate rather than as a slow tap.

| Position | Destination |
|---|---|
| Up and left | Map |
| Directly up | Quests |
| Directly left | Badges |
| Released on the button, or under the dead zone | Cancel |

Positions are fixed forever. That is the whole value: after a week the
gesture is muscle memory and you stop looking at the screen to change
section.

**C-3-1 Drag to select, not tap the fanned tile.** The point is that it
completes in one continuous gesture without lifting the thumb. Selection is by
nearest tile centre with a 22px dead zone, not by angle wedges, because wedges
misfire near their boundaries.

**C-3-2 The hold ring is the affordance.** A rust hairline draws inside the
button over the hold duration, so a half-press shows something starting and
the gesture teaches itself. A light haptic fires when the fan opens and again
each time the aim crosses to a different tile.

**C-3-3 Nothing is hold-only.** All three shortcuts are in the drawer. The
gesture is an accelerator, never the only route.

**C-3-4 Tap runs off click, hold runs off pointer events.** The two paths use
different event streams on purpose.

The hold needs pointerdown, pointermove and pointerup, because it has to time
the press and track the drag. The tap does not: it uses the native `click`,
which is the one gesture signal every browser agrees on. Click survives the
small travel a thumb always has, fires after pointer capture releases, and
cannot be confused by a touch that started slightly off-centre. A completed
hold sets a flag that swallows the click it also produces.

Driving the tap off pointerup instead is what made a thumb tap unreliable.

**C-3-5 A frame opened mid-gesture has a second trap.** Whichever event opens
it, the frame can mount while the browser is still inside the gesture, and the
trailing click then lands on whatever now sits under the finger, which is the
scrim. A scrim that dismisses on click would swallow that and close the frame
in the frame it opened.

The scrim therefore dismisses on a full press-release cycle that BEGAN on the
scrim, never on click. The opening gesture's pointerdown happened on the
trigger, before the scrim existed, so it can never satisfy that condition.

### C-4 States

| State | Treatment |
|---|---|
| Default | `--surface` fill, `--ink` border and glyph |
| Pressing | Rust ring drawing inside |
| Fan open | `--field` fill, screen dimmed to 18% |
| Aimed tile | `--field` fill, scaled to 1.06 |
| Drawer open | Replaced by the frame's dismiss on the same square |

### C-5 Left-handed use

The button and the fan mirror to the bottom-left from a setting, and the
lattice mirrors with them: up-right Map, up Quests, right Badges. A control
that only works for right-handed users is a defect, so this is v1.

---

## D. Primitives

Component names and the shape rules that apply to each.

| Component | Shape | Notes |
|---|---|---|
| `Action` | Pill, `--r-action` | The only round thing. Full width, 48px, one per screen. Variants: solid field, solid rust, outlined. |
| `Button` | Square | 40px, uppercase label at 12px 600. Variants: solid ink, outlined ink, quiet. Never full width. |
| `Tile` | Square | 56px. Used by the thumb block and by any grid of equal choices. |
| `Frame` | Square | See B. Props: `ratio`, `label`, `title`, `onDismiss`. |
| `Field` | Square | Text inputs. 1px `--ink` border, no fill, focus outlines in rust. |
| `Chip` | Square | Filters and category tags. 28px, 11px label. |
| `Stat` | Square well | Mono value, uppercase key beneath. Always in a divided row of three. |
| `Rule` | 1px | `--rule` by default, `--ink` for structural divisions. |
| `Mark` | Square | Category glyphs. All drawn on a 16px grid with a 1.6 stroke. |

### D-1 Icon rules

All glyphs are drawn on a 16 by 16 grid with a 1.6px stroke, square caps and
square joins. No rounded line caps anywhere, because a rounded cap in this
system reads as a mistake. Lucide is kept for genuinely generic glyphs, with
`strokeWidth={1.6}` and `strokeLinecap="square"` set globally, and custom
marks are drawn for anything category-specific.

### D-2 Empty and loading marks

Loading is a 16px square that rotates 90 degrees per step, four steps, 600ms
each, never a spinner. Empty states use a hairline square outline with a
diagonal rule through it. Both read as survey notation rather than as generic
app furniture.

---

## E. Map

A canvas, not a DOM tree. The tile layer is hundreds of hexes that redraw on
every camera change: as elements that is a layout thrash, as one canvas it is
a single paint. It is also the shape MapLibre expects to occupy later, so the
chrome around it survives the swap.

### E-1 Camera

Pan with one finger, pinch to zoom, twist to rotate. Zoom clamps to 0.25–4.
The point under the fingers stays pinned while zooming and turning, which is
the difference between a map that feels attached to your hand and one that
slides around under it.

**E-1-1 Recentre.** A round target button under the compass eases position and
zoom back to the walker together over 520ms. Moving one without the other
lands you looking at the right place from the wrong height.

**E-1-2 North reset.** A round compass button sits `--gutter` from the top
right, its needle showing current bearing. Tapping it eases back to north over
320ms. Under reduced motion it snaps, because a slow spin of the entire map is
disorienting rather than pleasant.

**E-1-3 The canvas owns its gestures.** `touch-action: none` on the canvas and
`overscroll-behavior: none` on the document, so the browser never competes
with a drag by scrolling the page or zooming the document underneath.

### E-2 Quality

Backing store sized at `devicePixelRatio` capped at 2. Beyond 2 the extra
pixels cost real frame time on a phone and nobody can see them. Resize is
observed rather than polled, and every camera change coalesces into one
`requestAnimationFrame`.

### E-3 Tiling

Pointy-top hexagons in axial coordinates, rounded in cube space so the seams
never gap. Base circumradius 90m.

**E-3-1 Resolution follows zoom, then stops.** The camera runs from 0.0008 to
4, which is enough to hold the whole island on a phone and still see a field
boundary. Across that range a fixed hex size is either a solid mat of hairlines
or four tiles filling the screen, so the drawn size steps by powers of two to
keep an on-screen hex around 64px.

Subdivision stops at **level 5**. Past that the hexes are so large that they
stop describing territory and start being a second, competing map. Instead the
layer fades across the last two levels: hairlines go first and fastest, fill
lingers. Fully zoomed out you see the island and the colour of what you have
walked, with no lattice over the country.

The order matters. At a distance the colour of walked ground is the useful
signal and the grid lines are pure noise, so the noise leaves first.

**E-3-2 A coarse tile is only clear when most of its ground is.** A single
revealed field must not clear a forty kilometre tile. Each coarse hex is
sampled at its centre and six points around it, and reads as revealed only on
a majority. Seven samples rather than walking every child, which at the
coarsest level would be seven to the ninth, so zooming out stays smooth.

**E-3-3 The island is a placeholder.** About thirty points traced by eye, so
zooming out reads as Ireland rather than as an empty grid. It is never used
for anything that needs to be true and it is replaced wholesale by the real
coastline when the basemap lands. The camera clamps to its extent. This is a stand-in for H3 with the same
properties that matter: one neighbour distance, tiles without gaps, counts
as an integer. The fog and territory UI built against it does not change when
H3 lands behind it.

| Tile state | Treatment |
|---|---|
| Unexplored | `--map-fog` at 72%, hairline `--rule` edge |
| Revealed | Paper showing through, hairline edge |
| Green | `--map-green` fill |
| Holds a quest | 2px `--rust` edge over the fill |

Quest availability is drawn as territory rather than as a pin floating above
it, which is the point of having a tiling at all.

### E-4 Markers

**E-4-0 Layers fade, they do not blink.** Toggling a layer eases its opacity
rather than adding or removing markers, and the tween is driven from inside
the draw loop rather than from React. A layer change never causes a render, so
the canvas never clears mid-transition.

**E-4-1 Canvas markers carry the same glyphs as the buttons that filter them.**
A separate drawing language for the canvas means learning the legend twice, so
a note on the map is the note icon in a ring, a community point is the three
person icon in a ring, and an app point is the diamond in a ring.

| Marker | Treatment |
|---|---|
| You | `--rust` disc, 7px, `--surface` ring |
| Point | `--surface` disc, `--field` ring, diamond glyph |
| Note | `--surface` disc, `--ink` ring, note glyph |
| Community point | `--surface` disc, `--rust` ring, three person glyph |
| Objective, pending | Hollow `--ink` square |
| Objective, done | Filled `--field` square |
| Trail, out leg | 3px solid `--map-trail` |
| Trail, return leg | 3px dashed |

Markers counter-rotate and counter-scale, so they stay upright and the same
size however the map is turned or zoomed. No teardrop pins anywhere: that is
the single most generic element in mobile mapping and dropping it is most of
what makes this map read as ours.

---

## F. Writing

Interface copy is plain, second person, and never coy. The product knows
things about places, so the voice is a knowledgeable local, not a guide.

- Actions say what happens: `Begin`, `End walk`, `Reroll`, `Save to collection`.
- Confirmations report in the past tense: `Saved`, `Walk ended`.
- Errors say what went wrong and what to do: `No fix yet. Step outside or pick a place on the map.`
- Never apologise, never use exclamation marks, never call a walk a journey.
- Distances are metric by default with an imperial setting, and always mono.
- Durations are written `45 MIN` and `1H 30`, never `1.5 hours`.
- Placenames carry the Irish form and the meaning where Logainm has one.

---

## G. Accessibility

- Minimum touch target 44px. Thumb block tiles are 56px, which clears it.
- Focus is a 2px rust outline with a -2px offset, visible on every
  interactive element, never removed.
- The hold gesture always has a tap equivalent. Nothing is reachable only by
  holding.
- Frames trap focus, restore it to the trigger on dismiss, and close on
  Escape.
- Reduced motion removes the frame scale, the hold ring animation and the fog
  reveal, keeping the state changes instant.
- Colour is never the only signal. Objective completion changes the square
  from hollow to filled as well as changing colour.
- The map has a text alternative: every screen with a map has the same
  information available as a list.


---

## H. Illustration

The interface is flat and typographic. The illustration layer is the opposite
and that contrast is the point: hand-drawn naturalist engraving, ink line on
paper, no fills and no colour. It reads as the plates in a field guide, which
is exactly the reference the rest of the system is built on.

### H-1 Where illustration appears

| Slot | Ratio | Subject |
|---|---|---|
| Home plate | 4:3 | The surveyor figure in landscape. The one character moment in the app. |
| Quest hero | 16:9 | The place or the task, drawn as a study |
| Quest thumbnail | 1:1, 72px | The object of the quest: a stone, a plant, a ruin |
| Category mark | 1:1, 48px | One specimen per category, used on progression |
| Badge | 1:1, 64px | The unlock, drawn as a specimen tag |

### H-2 Rules

- **Ink on paper only.** No fill colour, no wash, no gradient. `--ink` line on
  `--surface`. The illustration never introduces a colour the token set does
  not have.
- **Line weight matches the interface.** Hairlines at the same optical weight
  as `--rule`, so a plate sits beside a divider without fighting it.
- **Drawn, not rendered.** Cross-hatching and stipple for tone, never soft
  shading. The reference is a nineteenth century survey plate, not a
  contemporary illustration style.
- **Every slot holds its own space before the asset exists.** A bordered box
  at the exact ratio with a mono placeholder label, so the layout never shifts
  when artwork lands.
- **The figure is used sparingly.** Home, onboarding, and the position marker
  on the map. It is a signature, not a mascot, and it should not appear on
  every screen.

### H-3 Production

Assets are commissioned or generated, then reviewed and published through the
admin media console (PRD section 8.14), which is why that console exists.
Nothing is drawn into a component as inline SVG path data: illustration lives
in `/public/plates/` and is referenced by key, so the whole layer can be
replaced without touching a component.

---

## I. Patterns

Composites that recur, specified once so they are built once.

### I-1 Rank header

Avatar (round, initials until an image exists), name, rank in mono, and two
count chips: one `--field`, one `--rust`. Sits at the top of Home only.

### I-2 Quest card

Square thumbnail on the left, title in uppercase, one line of description,
progress as mono `5 / 8`. A rust corner ribbon marks the active or starred
quest. The whole card is the tap target.

### I-3 Locked callout

Dashed `--rust` border on `--rust-soft`, with a `+` mark, a mono title and an
optional hint line. Used for content that is timed or not yet reached.
Distinct from an error: nothing is wrong, there is simply something to wait
for or somewhere to go.

### I-4 Objective checklist

Square checkboxes at 16px, `--r-sm`, filling `--field` when complete, with a
hairline divider between rows and an optional mono value on the right for
counted objectives.

### I-4 Quest shape

Every quest is one of two shapes and it always says which, as a chip.

| Shape | Meaning |
|---|---|
| Loop | Ends where it began. No ground walked twice. |
| There and back | Out along one path, back down the same one. |

`distanceM` is the full walked distance for both, both legs of a line
included, so a line and a loop carrying the same number take the same time.

Duration is never a flat 5 km/h. It runs from a comfortable 4.7 km/h on made
paths, reduced for unpaved and rough ground, plus a minute for every ten
metres of climb, plus a few minutes standing at each point. An app that
ignores surface and ascent keeps promising forty five minutes and taking an
hour.

### I-5 Carousel

Used for tales, which are three to five cards read one at a time, and for the
home shelf.

**I-5-1 One ratio, one fixed-height row.** Every home card is **3:2**
landscape, which at the row height puts about 1.2 cards on screen: one to read
and enough of the next to know the row moves. The
row has a fixed height per breakpoint, 196px and 232px, and each card is
`height: 100%` with `width: auto` off its `aspect-ratio`, so the browser
derives every width.

**I-5-2 The left edge stays on the gutter.** The track bleeds to the right
only, using a negative right margin. Bleeding both edges is what pushed the
first card flush against the screen.

Mixed ratios were tried and abandoned. On a shelf they read as a jumble
rather than a rhythm, and more practically the odd shapes left no reliable
room for a title plus two lines, so copy clipped. One shape means the text
box below the media is the same size on every card. Media takes the top 54%,
text the rest, and titles clamp rather than push anything off the bottom.

The height is fixed rather than flexible on purpose. Sized off a flexible
row, a portrait card swells on a tall phone and shrinks on a short one, which
makes the same card feel like a different component between devices. A known
height means a card is the same size everywhere and the leftover space goes
somewhere it can be used.

**I-5-2 Snap start, not centre.** Cards align to the page's left gutter, so
the row reads as a shelf rather than as a slideshow.

Built on native scroll snap rather than a transform track. Scroll snap gives
real momentum, respects the platform's own overscroll feel, and keeps every
card in the accessibility tree and reachable by keyboard, none of which a
transform track with hidden slides does. Arrows scroll the same container, so
position has one source of truth.

Below the track: a previous arrow, progress dots where the active dot widens
rather than changes colour alone, a mono `n / total`, and a next arrow.
Arrow keys work.

### I-6 Tooltips

Custom, never the native `title` attribute: that needs a hover no phone has,
and it renders in OS chrome we cannot style.

Tap to open, tap anywhere else or press Escape to close. Ink ground, surface
text, `--r-sm`, scaling in from the edge it is anchored to over
`--dur-state`.

A tooltip is always an explanation and never the only route to information.
Anything a person must read in order to use a control belongs in the
control's own label. Placement is corner-anchored rather than centred, so a tooltip on a control
near a screen edge grows inward instead of off the side. The default is
bottom-left, which is right for the header chips: they sit top-right, so the
panel drops down and back into the page.

They are used on the two count chips in the rank header, where the number
alone cannot say what a leaf or a star is, and on the shape chips. They are deliberately not used in
the nav drawer: see C-2-2.

### I-6a Point drawer

Full bleed plate, then the name, then one line of what it is, then the tale,
then tags.

The tale reads **inline as a snippet**, never behind a button. One more tap to
reach three sentences is a tax rather than a feature. It is still gated on
arrival: an unvisited point shows its one line and a note that the story opens
when you get there, which keeps the reward for going intact without hiding
what the place actually is.

### I-7 Locked territory

On the map, unreached ground that is gated rather than merely unexplored gets
a dashed `--rust` outline over diagonal hatching, with a round lock marker at
its centre. Ordinary unexplored ground is flat `--map-fog` with no outline.
The distinction matters: one is somewhere you have not been, the other is
somewhere you cannot go yet.


---

## J. Interaction hygiene

Rules that stop the app feeling like a web page.

- **Chrome is not text.** Buttons, labels, nav glyphs, headings, data and the
  canvas all carry `user-select: none` and `-webkit-touch-callout: none`. A
  long press on a title should do what the app says it does, never raise a
  selection handle or an iOS callout.
- **CTAs lay out horizontally.** An action's children are `inline-flex` with a
  gap, so an icon and its label sit on one line. Left as inline text they land
  on different baselines and wrap onto two.
- **One marker per state.** A corner ribbon and a status label are the same
  statement; using both puts two things in the same corner. Pick one.
- **Prose is text.** Tale bodies, place descriptions and the About page opt
  back in with `.selectable`, because those are the things a person might
  reasonably want to quote.
- **No scrollbars.** Every scrolling surface carries `.no-bar`. A scrollbar is
  chrome nobody designed; content running to the edge is the signal.
- **No tap highlight.** `-webkit-tap-highlight-color: transparent` globally;
  press feedback is the 0.97 scale, which we control.
- **No rubber band.** `overscroll-behavior: none` on the document, so a pull
  inside the map never drags the page behind it.
- **Gestures are exclusive.** Anything that owns a drag carries
  `touch-action: none` via `.gesture`. The browser never competes.
- **No context menu on controls.** `onContextMenu` is prevented on the nav
  button and the canvas, since a long press there is a real gesture.


---

## K1. The countryside band

The strip along the foot of Home. Two layers travelling at different speeds,
which is what makes it read as distance rather than as a picture sliding.

Each layer holds its artwork twice and translates by exactly -50%, the same
trick as the marquee, so the loop has no seam. That is also why the artwork
itself has to tile: its right edge butts against its left edge every cycle.

**Artwork specification**

| File | Size | Notes |
|---|---|---|
| `public/plates/hills-far.png` | 1620 × 540 | Seamless left to right, transparent, simpler and lighter |
| `public/plates/hills-near.png` | 1620 × 540 | Seamless left to right, transparent, more detail |

Ratio 3:1. Rendered around 180px tall, so 540 stays crisp at 3× DPR. No sky:
the paper shows through, so the band survives a palette change. Until the
files exist the component draws its own ridge lines, so the layout is never
waiting on art.

The band takes whatever height Home has left and collapses to nothing on a
short screen rather than pushing the grid off the bottom.

---

## K. Installing

The app is a PWA and is meant to live on a home screen.

| Piece | Where |
|---|---|
| Manifest | `app/manifest.ts`. Standalone, portrait, paper background and theme, `start_url` `/home` |
| Icon | `app/icon.tsx`, 512px PNG rendered at build time |
| iOS icon | `app/apple-icon.tsx`, 180px. iOS ignores the manifest and reads this |
| Service worker | `public/sw.js`, registered after load by `ServiceWorker` |

**K-1 The mark is a placeholder.** A leaf in `--field` on `--paper`, drawn as
a rotated square with two opposite corners rounded. Drawn in CSS rather than
as an emoji or a path because the icon is rendered by Satori at build time,
where neither an emoji font nor complex path data is guaranteed. It is a
stand-in until the plate set lands.

**K-2 `start_url` is `/home`, not `/`.** Once the app is on a home screen the
landing page has already done its job, and opening to a pitch every time is a
small insult.

**K-3 The service worker is minimal on purpose.** Network first with a cache
fallback, so a stale shell can never mask a deploy, and Next's build output is
never cached by URL since it is already immutable and content-hashed. Android
wants a fetch handler before it will offer to install, and that is most of what
it is for today. The offline story that matters, holding an active walk's
route and tales through a loss of signal, belongs with the walk flow.


---

## M. The walk

The map takes the screen and the quest sits over it.

**M-1 Points unlock by arrival.** A point along the route shows a name, a
distance in, and one line until the walker has been inside its tile. The
detail is the reward for going, not something to read on the sofa instead of
going. The locked card is dashed; the reached card is solid `--field`.

**M-1-1 A brief before you set off.** Arriving on the walk opens one frame
listing what you might run into, gathered at generation from the points the
route passes. Vague on purpose: it sets expectations without spoiling the
walk. A food stop is always framed as a maybe, because opening hours are the
one thing the dataset genuinely cannot promise.

**M-2 End walk sits beside the nav button, not on it.** The rest of the app
stays reachable mid-walk, because checking your badges should not mean ending
your walk. Ending always confirms in a frame, and that frame says the tiles
already uncovered are kept, because people assume otherwise and will not end
early rather than risk it.

**M-2-1 Notes pin where you press.** A note button sits under End walk. The
pin is dropped at submission rather than when the keyboard opens, because
people write for a minute after they have stopped, and the pin should mark
where they stopped rather than where they finished typing.

Notes surface twice afterwards: on the walk's own record, next to the badges
and tales it earned, and as a text-only run on the profile. No map on the
profile tab on purpose. Read as a run of sentences they become a diary of
walks rather than a list of pins.

**M-3 Planning is shown, not hidden.** Generating a quest takes over the
screen for the duration of the work: the route draws itself stage by stage,
anchor then route then check, which is the honest shape of what is happening.
The fetch and the animation run together and the result is held until the
animation finishes, so the takeover is a floor rather than a fake delay. When
real routing lands it simply stays up until the work is done.

---

## N. Map controls

Square buttons bottom left, clear of the nav button, each opening a panel
above it. One panel at a time.

| Button | Answers |
|---|---|
| Tiles | How much of what you are looking at you have walked, as revealed over total in view |
| Badges | Which badges the ground in front of you could move |
| Points | Everything in view, found and locked, tapping through to the point |
| Layers | What is drawn: fog, trail, points, quest tiles |

Every one answers a question about the ground currently on screen, which is
why they are panels over the map rather than links away from it. The tile
count moves as you pan, so it reads as a survey of what is in front of you
rather than a lifetime total.

---

## L. Screens that do not scroll

Home and the Start tab of Quests fit the viewport exactly.

The pattern is the same in both: a header and a control block take the height
they need, and one flexible region takes the rest. On Home that region is the
card shelf, whose mixed-ratio cards size themselves from it. On Start it is the
plate, which runs full bleed with the controls sitting over its foot rather
than beneath it.

Both reserve `--tile` plus two gutters of bottom padding, so the last row of
content is never underneath the nav button.

A home screen you have to scroll has stopped being a place to start from.


---

## N1. Settings

Settings live in `lib/settings.ts` and are read through `useSyncExternalStore`,
so a change lands in every component at once and survives navigation. An
earlier version held them in component state, which is exactly why
left-handed appeared to work and then forgot itself the moment you moved
screen.

The snapshot is cached rather than parsed per read: `useSyncExternalStore`
compares with `Object.is`, and returning fresh JSON each time hands it a new
object every render and spins.

Every setting has to actually do something. A switch that stores a preference
nothing reads is worse than no switch, because it teaches people the controls
are decorative.

| Setting | Reaches |
|---|---|
| Left-handed | Nav button, its shortcut lattice, docked actions |
| Haptics | Hold threshold and aim changes |
| Reduce motion | A document attribute, alongside the OS query rather than replacing it |
| Community points | The map layer, above the dock toggle |
| Activity ticker | The drawer footer |
| Units, usual length, keep awake | Their own surfaces |

**N1-1 Handedness is one switch, not a sweep.** Anything in the thumb corner
reads `useHanded()` and picks its side from that. The shortcut lattice mirrors
on x with it, so the gesture keeps its shape either way: up and away, up, and
away.

---

## O. Docked actions

A screen's primary action can sit in the strip beside the nav button, fixed to
the foot of the viewport.

That strip is the screen width minus one 56px square and on most screens it is
empty. Putting the main action there means it is always within the thumb's
reach without scrolling to find it, and it never fights the nav button because
it stops exactly where the button starts.

Used by: add an outpost, start a quest, save a custom quest, add a friend.

`Screen` takes a `docked` prop that adds the matching bottom padding, so the
last row of content is never underneath the bar. A scrolling region on a
docked screen must carry `min-h-0` and own its overflow, or it grows past the
viewport and runs under the nav instead of stopping at the foot of the screen.

---

## P. The map as a notebook

With no quest running, the map is a personal record rather than a tool: every
tile you have walked, every point you have found, and every note you wrote
where you wrote it.

Notes are their own layer, their own dock panel, and their own marker: a page
with the corner turned. Distinct in silhouette from the point circle and the
outpost flag, which is the only thing that matters at 12px on a busy map.

---

## Q. Community

**Q-1 The feed is a flat list.** No cards, no avatars, no detail pages behind
each row, first names only. Its job is to make the place feel inhabited, and
the moment a feed grows affordances it starts asking to be worked through
rather than glanced at.

**Q-2 Every event is one line.** Long ones ellipsise rather than wrap, because
a ragged column stops reading as a pulse. The same lines feed the drawer
ticker, which is why the constraint has to hold at both sizes.

**Q-3 Nothing locational is ever published.** An event says what someone did,
never where they are. The feed carries badges, quests, tales and joins, and no
coordinate ever reaches it.

**Q-3a A fixed child cannot escape a stacking context.** The add drawers are
rendered by the page at the top level, not inside the dock. A container with a
z-index opens a stacking context, and a fixed child of it stays inside that
context however high its own z-index goes. Mounting the frames inside the
dock's wrapper is what put them underneath the nav.

**Q-4 Anyone can add a point, nobody can publish one.** A community point is a
claim about a real place on other people's maps, so it goes to review before it
appears for anyone else. Your own pending points stay visible to you, marked as
waiting.

This is not moderation as a backstop, it is the default. A map of real places
that anyone can write on stops being a map worth trusting, and that trust is
the only thing this dataset has that a search engine does not.

Notes are the opposite and are kept deliberately separate: a note is yours,
nobody else ever sees it, and it saves immediately. Collapsing the two into one
add flow would blur the difference, and the difference is the reason the second
one is worth anything.

**Q-5 Friends are not a social network.** No feed of theirs to scroll, no
follower count, no way to see where anyone is. What a friend gives you is a
route worth stealing and a reason to go this week. Challenges are between the
two of you and nothing is scored, published or ranked.
