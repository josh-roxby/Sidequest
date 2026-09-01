# Side Quest design system

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-08-31 |
| Status | Locked for the reface pass |
| Supersedes | The cream / sage / lavender token set in `app/globals.css` |
| Related | [reface-plan.md](./reface-plan.md) · [ux-loops.md](./ux-loops.md) · [PRD.md](./PRD.md) |

The direction is **field survey**: an ordnance notebook rather than a
lifestyle app. Paper ground, ink rules, hairline grid, mono numerals. The map
is the only place colour is allowed to do much, and the interface chrome
stays out of its way.

Three rules carry the identity. Everything else is detail.

1. **Two radii exist.** Zero on everything, and a full pill on the primary
   action button alone.
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
--r-0:      0px;      /* everything */
--r-action: 999px;    /* full-width primary action button only */
```

There are no other radii. Not 2px, not 4px, not 12px. Nav tiles, cards,
frames, inputs, chips, badges, map controls, avatars and modals are all
square.

**A-3-1 Why the pill is semantic.** In an interface with no other curves, a
fully rounded pill is impossible to miss. That makes shape carry meaning:
round means *this is the action on this screen*. One per screen, always full
width, always at the foot of a frame or a page.

**A-3-2 Enforcement.** The only radius values permitted in the codebase are
`rounded-none` and `rounded-full`, and `rounded-full` may only appear inside
`components/primitives/Action.tsx`. This is a one line grep in review.

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

## C. The thumb block

### C-1 Geometry

A 2 by 2 grid of 56px tiles with a 2px gap, giving a 114px square anchored
`--gutter` from the bottom-right. It does not span the screen width, so it
does not read as a tab bar, and it leaves the entire left side of the map
unobstructed.

```
                    ┌────┬────┐
                    │ ▣  │ ◈  │   Map      Quests
                    ├────┼────┤
                    │ ◇  │ ▤  │   Journal  You
                    └────┴────┘
                              └── 8px from both edges
```

The 2px gap is `--ink`, not transparent, so the block reads as one ruled
object rather than four floating buttons.

### C-2 Destinations

| Tile | Destination | Hold shortcuts |
|---|---|---|
| Map | The map, the home screen | Recentre, Layers, Drop a pin |
| Quests | Tier picker and quests near you | Change tier, Rerolls, Saved |
| Journal | History and tales read | Tales read, Search, Collections |
| You | Territory, progression, settings | Territory, Badges, Settings |

### C-3 Interaction

| Gesture | Result |
|---|---|
| Tap | Navigate. Active tile fills `--field`, glyph and label reverse to `--field-ink`. |
| Press and hold, 400ms | A rust hairline ring draws inside the tile over the hold duration, then the shortcut fan opens above the block and a light haptic fires. |
| Release on a fan item | Fires that shortcut. |
| Release off the fan, or tap elsewhere | Cancels, fan closes, no navigation. |
| Tap the active tile | Scrolls that section to top, or recentres the map. |

**C-3-1 The hold ring is the affordance.** The ring drawing over 400ms is
what teaches the gesture: a user who half-presses sees something start to
happen and tries again properly. No tooltip needed after the first run.

**C-3-2 First run.** On the first visit to the map, the hint text sits to the
left of the block in mono at 10px: `TAP TO SWITCH / HOLD FOR MORE`. It fades
out permanently after the first successful hold, or after three sessions.

### C-4 States

| State | Treatment |
|---|---|
| Default | `--surface` fill, `--stone` glyph and label |
| Active | `--field` fill, `--field-ink` glyph and label |
| Pressed | Scale 0.97 over `--dur-tap` |
| Holding | Rust ring drawing inside the tile |
| Badged | A 6px rust square in the tile's top-right corner, no number |
| Disabled | `--surface-2` fill, `--mute` glyph, no press response |

Badges are squares, never dots, and never carry a count. A count invites
inbox behaviour, which is the opposite of the product.

### C-5 Left-handed use

The block mirrors to the bottom-left from a setting. When mirrored, frames
keep their dismiss control at the mirrored anchor and the fan opens above the
block as normal. This is a v1 setting, not a v1.5 one: a nav that only works
for right-handed users is a defect.

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

## E. Map surface

Held deliberately simple for this pass. The real MapLibre style comes with
the tile build, and the placeholder is built to the same tokens so the
chrome does not need reworking when it lands.

| Layer | Token | Treatment |
|---|---|---|
| Ground | `--map-paper` | Flat |
| Grid | `--ink` at 5.5% | 28px squares, 1px, always visible |
| Green | `--map-green` | Flat fill, no outline |
| Water | `--map-water` | Flat fill, no outline |
| Fog | `--map-fog` at 62% | Hard-edged rectangles in the placeholder, H3 hexes in the real build |
| Trail, out leg | `--map-trail` | 2px solid |
| Trail, return leg | `--map-trail` | 2px dashed, 4/4 |
| Position | `--rust` | 9px square, no pulse |
| Objective, pending | `--ink` | 9px hollow square |
| Objective, done | `--field` | 9px filled square |

Positions and objectives are squares, not pins. A teardrop pin is the single
most generic element in mobile mapping and dropping it is most of what makes
this map look like ours.

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
