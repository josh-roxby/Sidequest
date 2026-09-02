# Side Quest: repo audit

Taken against `e4eef09` on 2 September 2026, with the app built and served in a
real browser at 390 x 844 and 1280 x 700. Every count in here was measured, not
estimated. The method for each is in the appendix so any of it can be re-run.

This is a working document. `TODO.md` carries the checklist; this carries the
reasoning, so a line in the checklist can be understood a month from now
without reconstructing the argument.

## How to read it

Findings are numbered by section and carry a severity.

- **Blocking.** Wrong now, on a screen a person can reach today.
- **Before live.** Fine on mock data, breaks or misleads the moment the
  Supabase switch is thrown.
- **Refinement.** Correct but not yet good.

Where a finding restates a rule the project already wrote down, the rule is
cited. Most of what follows is the codebase disagreeing with its own
documentation rather than with my taste.

---

## 1. The short version

Ten things, in the order I would do them.

1. **Nothing enforces the 44px touch minimum, and 55 controls break it.**
   `--hit-min: 44px` is defined in `globals.css`, described in the design
   system as "absolute minimum for any interactive element", and referenced by
   exactly zero lines of code. (X-01)
2. **The type scale is bypassed 73 times.** Its floor is 11px. There are 26
   hard-coded 9px sizes and 2 at 8px. (X-02)
3. **Fetch errors are invisible on 16 of 17 screens.** `useAsync` returns an
   `error`, and only the map reads it. On mock data nothing fails. On Supabase
   a failed read is a screen that skeletons forever. (X-03)
4. **Most screens have no empty state.** Four of seventeen use `EmptyState`.
   A new account has an empty everything. (X-04)
5. **23 of 41 plates are still missing, including both app icons**, so the PWA
   installs as the placeholder leaf. (M-01)
6. **The active walk is a demo, not a loop.** Arrival is a fixture flag; there
   is no position watch, no tile entry, no completion, no walk record written.
   (L-05)
7. **`useLiveLocation` exists and is wired to nothing.** The one piece that
   turns the walk from a mock into a walk. (D-04)
8. ~~Three components are dead~~ **Resolved.** `HomeLauncher`, `QuestCard` and
   `Chip` are deleted, along with `Quest.thumb` which only existed for
   `QuestCard`, and a pre-reface `data/types.ts` that had been sitting at the
   repo root with a competing `Quest` type while three live modules imported
   `LatLng` from it. (X-06)
9. **`TODO.md` describes a font stack and a route the repo no longer has.**
   The authoritative checklist is out of date in its "Done" section, which is
   the worst place for it to be wrong. (Z-01)
10. **No tests of any kind.** Not a criticism of the phase, but the audit
    should say so plainly: every check in this document was run by hand today
    and nothing will catch a regression tomorrow. (X-07)

What is genuinely in good shape, so it does not get touched by accident: the
shell and its one-button navigation, the frame geometry, the token system,
the data-layer seam, the canvas architecture, and the honesty rules in the
copy. Details in each section.

---

## 2. Cross-cutting

### X-01 Touch targets. Blocking.

55 distinct interactive elements render smaller than 44px in at least one
dimension, across 15 of 20 routes. The worst are the settings toggles at
45 x 26, the profile colour swatches at 30 x 30, and the map and walk chrome
buttons at 38 x 38 and 41 x 41.

`--hit-min: 44px` already exists and means exactly this. Nothing uses it.

The fix is not to inflate every control. It is to separate the *visual* size
from the *hit* size: a 26px-tall toggle can carry a 44px pressable area with a
pseudo-element or padding that does not affect layout. Do it once in the
primitives (`Button`, `Check`, `Tabs`, `Chip`, the map dock buttons) and most
of the 55 go away without a visual change.

Worst offenders, measured:

| Screen | Control | Size |
|---|---|---|
| Settings | six toggles | 45 x 26 |
| Profile edit | four colour swatches | 30 x 30 |
| Quest detail | Add to a collection | 36 x 20 |
| Map, walk | compass, recentre | 38 x 38 |
| Map | six dock buttons | 41 x 41 |
| Walk | end walk, write a note | 41 x 41 |
| Quests | shape chips | 51 to 117 x 25 |
| Tabs everywhere | tab buttons | 32 tall |
| Back buttons | seven screens | 39 x 40 |

### X-02 The type scale is bypassed. Refinement.

`globals.css` defines six text classes and two data sizes. The smallest is
`.t-label` at 11px. Source carries 26 instances of `text-[9px]` or
`fontSize: 9`, 2 at 8px and 45 at 10px, spread across 17 files.

9px uppercase mono on paper is at the edge of legible on a phone in daylight,
which is the actual context for a walking app. Either the scale gains a
sanctioned `--t-micro` at 10px and the strays are pulled onto it, or the floor
holds at 11px and the overrides go. Right now the scale is decoration.

### X-03 Failed reads are invisible. Before live.

`hooks/use-async.ts` returns `{ data, loading, error }`. Across the seventeen
app screens, `error` is read once, on the map. Everywhere else a rejected
promise leaves `loading` false and `data` null, which renders as an empty
screen with no explanation and no retry.

This costs nothing today because `mockSource` only rejects when
`NEXT_PUBLIC_MOCK_FAIL` is set. It is a guaranteed bug the day the Supabase
implementation stops throwing "not wired" and starts throwing network errors.

The primitive already exists: `StatusStrip`. It needs to be standard in the
screen scaffold rather than optional.

### X-04 Empty states are the exception. Before live.

`EmptyState` appears on four screens: friends, outposts, tales, badges. The
others assume rows. A first walk on a real account has no history, no badges,
no collectibles, no notes, no friends, no tales and no territory, so nearly
every screen renders its zero state on day one and most of them render it as
blank space.

### X-05 Loading states are inconsistent. Refinement.

Eleven screens show a skeleton. Six do not, including `/badges`, `/settings`,
`/history` and `/quests`, which are thin wrappers whose panels handle their
own loading, and `/about`, which is static. Worth confirming each is
deliberate rather than missed. The walk screen has no loading state at all and
renders its chrome against an empty map until the quest resolves.

### X-06 Dead and premature code. Refinement.

Never imported anywhere:

| Module | Lines | Verdict |
|---|---|---|
| ~~`components/domain/HomeLauncher.tsx`~~ | 36 | Deleted. |
| ~~`components/domain/QuestCard.tsx`~~ | 47 | Deleted. `Quest.thumb` went with it. |
| ~~`components/primitives/Chip.tsx`~~ | 21 | Deleted. |
| ~~`data/types.ts`~~ | 66 | Deleted. Pre-reface, competing `Quest` type, and the source of `LatLng` for three live modules. `LatLng` now lives in `lib/data/types.ts`. |
| `hooks/use-live-location.ts` | 50 | Waiting, and now correctly typed. This is the walk loop's missing half. |
| `lib/routing.ts` | 91 | Waiting. Route generation, not yet called. |
| `lib/auth.ts` | 36 | Waiting on the auth switch. |
| `lib/supabase/client.ts` | 9 | Waiting on the auth switch. |

The four remaining are deliberate rather than rot: two are load-bearing for the
next phase and two wait on the auth switch.

### X-07 No tests. Before live.

There is no test runner, no test, and no CI step beyond lint, type-check and
build. Everything in this audit was verified by driving a browser today. The
things most worth pinning down first are not React component tests: they are
`lib/map/hex.ts` (pure functions, exact arithmetic, cheap to test and
catastrophic to get wrong), `lib/walking.ts` (duration estimates people will
plan around) and `lib/geo.ts`.

### X-08 What is clean. No action.

Measured across 20 routes: no horizontal overflow anywhere, no console errors
or warnings, no image without an `alt`, one radius outside the three-token
system (a 2px span on the landing page), and every route exactly one viewport
tall with nothing clipped. Frames sit at exactly 8px on left, right and
bottom, hold 1:1.28, trap focus starting on Close, and dismiss on Escape.

---

## 3. Screens

Seventeen app routes plus three public ones. Status is my read of how close
each is to being finished, not how much code it contains.

### Public

**`/` landing.** Solid. Parallax topography, tier grid, paired sign-in and
create-account calls to action. One 2px radius outlier (S-01). Four 9px labels.

**`/login`, `/signup`.** Functional against Supabase, unreachable in this
phase because auth is off. Both have an unlabelled input, so a screen reader
announces "edit text" with no name (S-02, blocking for accessibility). Inputs
are 41px tall, under the minimum.

### The shell

**Navigation.** The strongest thing in the repo. One 56px button, tap for the
bento drawer, hold and drag for the three-tile shortcut, tap on native `click`
and hold on pointer events so the two never fight. Keyboard focusable, correct
`aria-haspopup` and `aria-expanded`. The teaching hint moved above the button
this session, having previously sat over the opposite bottom corner.

Remaining: the drawer's own tiles are below the touch minimum in one
dimension, and there is no visible focus path through the fanned tiles for
keyboard users, who can reach the button but not the shortcut (S-03).

### Home

Rebuilt and close to right. Rank header, "Ready to adventure" card with the
tier row, the carousel, the four-button grid, the territory line, the docked
"Begin a stroll".

- Five 9px eyebrows (X-02).
- Two header stat buttons at 60 x 26 and 52 x 26 (X-01).
- The carousel has no keyboard affordance and no visible scroll cue; it is
  discoverable only by swiping (S-04).
- The country band from design system section H now exists as `CountryBand`,
  running one layer at 46px along the foot of the screen and taking whatever
  height Home has left. It has no parallax until `hills-near` is redrawn
  (M-05).

### Quests

The tier picker and shape chips work well and the "start now" default is
right. Four tabs: start, history, community, custom.

- The chips are 25px tall (X-01).
- The history and custom tabs are thin; custom has no validation and no
  persistence (S-06).
- Community grid is good and now fully illustrated.

### Quest detail

Hero, title, tier, shape, flavour, objectives, honesty list, encounters,
save, add to a collection.

- "Add to a collection" is 36 x 20, the smallest control in the app (X-01).
- The hero now collapses when there is no artwork, so the page reads as
  finished either way.
- No error state, no empty state for a missing quest beyond one line of prose.

### Walk

Reworked this session and much better, but it is still a diorama.

Done: the map takes the screen, the briefing opens once and is media-free, the
waypoint rail is type-first, unreached waypoints are dimmed and inert, only a
waypoint you have stood in opens, notes carry the note glyph, end-walk and
notes sit beside the nav rather than replacing it.

Outstanding:

- **The loop does not close (L-05, blocking for the product, not the build).**
  `reached` is a fixture boolean. Nothing watches position, nothing tests tile
  entry, nothing completes a walk, nothing writes a record. Ending a walk
  routes to `/history` and drops everything.
- Progress is derived from `Math.max` over reached objectives, so it moves in
  jumps between waypoints rather than with the walker.
- No loading state; the chrome renders over an empty map first.
- The briefing frame's body scrolls with no cue that there is more below the
  fold (S-07).
- The waypoint rail scrolls under the nav button. The padding reserves room at
  the end of the scroll, so it can be cleared, but the overlap is visible at
  rest.
- "Read the tale" is hard-coded to `t-1` regardless of which point is open
  (S-08, blocking: it shows the wrong tale).

### Map

The most technically ambitious screen and structurally sound. Canvas engine,
pan, pinch-zoom, twist-rotate, hex tiling at five levels with majority-reveal
roll-up, trail, quest tiles, markers with real glyphs, layer toggles that fade
rather than blink, compass, recentre, add-note and add-community-point.

- Six dock buttons at 41 x 41 and two chrome buttons at 38 x 38 (X-01).
- Dock tile counts are not computed from the camera: `total` is the literal
  `4200` and the badge list is a hard-coded array in the page (S-09).
- A point is unlocked by a fixture flag, not by position (same root as L-05).
- The canvas does less work per frame after this session's changes, but see
  P-01 for what I could and could not measure.

### Badges

Two tabs: Earned, which leads, and Kinds. Badge devices render as full plates.
Kinds gave the eight category plates a home and is the first consumer of
`getCategories()`, which had sat on the read interface with no screen calling
it. Progress there is still fixture data.

The Collected tab was removed. It held a per-point trinket alongside the badge
it counted toward, which is two currencies for the same act of arriving
somewhere, and nobody could say what a collectible was for that a badge was
not.

- Tab buttons 32px tall (X-01).
- No empty state on Earned when the account is new (X-04).
- Badge progress is fixture data.
- **X-09.** Removing Collected left `getCollectibles()` on the read interface
  with no consumer, the same shape of gap `getCategories()` was in. Either the
  collectible concept comes back somewhere or the method, its fixtures and its
  four plates come out. Two of those plates are drawn and now sit in the folder
  rendering nothing.

### History, history detail

Clean list, good detail screen with stats, notes and tales for the walk.

- No empty state for an account with no walks (X-04).
- Back button 39 x 40 (X-01).
- Nothing writes history yet (L-05).

### Tales, tale detail

The carousel is the best-executed component in the app: native scroll snap,
keyboard arrows, every card in the accessibility tree, per-card sourcing.

- Five controls at 39 to 96 x 40 (X-01).
- Share is properly built: `navigator.share` with a clipboard fallback and a
  copied state. No action.
- Licence handling is correct: `linkOnly` sources render as an outbound link.
  This is the one place the licence audit is actually enforced in code, and it
  should be pointed at from the data pipeline docs.

### About

Friendly, well written, five full-width plates, tier grid with icons.

- Longest screen in the app at 3102px of content, now scrolling inside the
  shell rather than the document.
- All five plates are still missing artwork, so the page currently shows five
  empty frames. This is the one screen where `collapse` was deliberately not
  used, because the plates are part of the layout. Revisit if the artwork is
  not coming (M-02).

### Settings

Comprehensive: units, handedness, haptics, keep-awake, community points,
reduce motion, default tier, activity ticker, export, terms, privacy.

- Six toggles at 45 x 26, the largest single cluster of undersized controls
  (X-01).
- Export produces a file from fixtures; it will need to mean something real
  before it is offered on a live account (S-11).
- Terms and privacy copy is written and, as flagged before, needs review by
  someone qualified (S-12).

### Profile, profile edit

Three-tab profile with referral tile; edit screen with handle, colour, privacy.

- Four 30 x 30 swatches and an unlabelled input (X-01, S-02).
- Nothing persists. `save()` sets a flag and navigates, so the screen
  reports "Saved" and discards every field (S-13).

### Friends, friend, shared quest, activity, outposts

Friends has the cleanest tab-slide implementation and three empty states. A row
now opens `/friends/[id]`, a deliberately thin profile: who they are, what you
have walked together, and the quests of theirs you can take. No feed, no last
seen, no location. A shared quest opens `/friends/quests/[id]`, a preview
carrying the route's shape on a map, its length, what it will cost at your
pace, and one way in.

Activity is a simple feed and now shares its glyph map with the drawer ticker
through `lib/activity.ts`, so an update cannot change icon between the two.
Outposts has add-by-link and use-current-location, and correctly only calls
geolocation from a press.

- **S-15.** The shared quest preview borrows a real quest's path to draw its
  route, because a `FriendQuest` carries no path of its own. The shape shown is
  therefore illustrative. Either the type gains a path or the preview should
  stop drawing one.
- **S-16. Resolved.** "Try this quest", and "Set active" on a quest, now run
  through the loading takeover to the walk. `StartGate` checks the walker is
  within 400m of the quest's start first and otherwise offers walking
  directions that open the platform's own maps app. Starting anyway is always
  available, because a fix under trees is routinely out by fifty metres.
- Outposts stores to local state only (S-13).
- Friend requests and challenges are not wired to anything.

---

## 4. UI elements

**Primitives.** `Action`, `Button`, `Card`, `Tabs`, `Field`, `Chip`, `Stat`,
`Marks`, `States`, `Plate`, `Text`, `ShapeChip`, `Check`.

- `Chip` is dead (X-06).
- `Action` is the only sanctioned `rounded-full`, correctly documented and
  correctly used once. The rule holds.
- `Marks` is a well-drawn 34-glyph set on a consistent 16px grid with square
  caps. No issues found.
- `Plate` gained `collapse` and `sizes` this session and now serves through
  `next/image`. It is the right shape.
- `Tabs`, `Check` and `Chip`-alikes are where the touch-target fix should
  land (X-01).

**Shell.** `NavButton`, `NavDrawer`, `NavSwitch`, `Frame`, `ThumbAction`,
`RankHeader`, `Screen`, `PhoneFrame`.

- `Screen` became the scroll container this session. It is now the right place
  to standardise error and empty handling (X-03, X-04).
- `Frame` is correct against its spec on every measure I could take.

**Map.** `MapCanvas` (544 lines), `MapDock`.

- `MapCanvas` is doing a lot in one file, 544 lines. It is coherent, but the
  draw pass, the gesture handling and the hit testing are three separable
  concerns and it will not get smaller when MapLibre arrives (S-14).

**Domain.** Fourteen components. `HomeLauncher` and `QuestCard` are dead.

---

## 5. UX loops

Mapped against `docs/ux-loops.md`.

| Loop | Spec | Built | Gap |
|---|---|---|---|
| A. Shared behaviour | A | Yes | Focus order through the nav shortcut (S-03) |
| B-1 Landing | B-1 | Yes | None material |
| B-2 Location priming | B-2 | Partial | Only outposts asks. No priming loop before a walk (L-02) |
| C-1 Map screen | C-1 | Yes | Tile counts are placeholders (S-09) |
| C-2 Territory readout | C-2 | Partial | Numbers are fixtures, not derived from revealed tiles |
| D-1 Tier picker | D-1 | Yes | None material |
| D-2 Quest preview | D-2 | Yes | Honesty list and encounters both good |
| E-1 Active walk | E-1 | Shell only | No position, no arrival, no progress (L-05) |
| E-2 Objective completion | E-2 | No | Nothing detects reaching a point |
| E-3 Walk complete | E-3 | No | No summary, no record, no rewards |
| F-1 Point popover | F-1 | Yes | Media now optional, reads well without |
| F-2 Tale reader | F-2 | Yes | None material |
| G. Journal | G | Partial | Reads fixtures; nothing writes |
| H. You | H | Partial | Edit does not persist (S-13). Friend profiles now exist |
| I. Collections | I | Partial | Browse works, creating does not. Taking a friend's quest is a preview only (S-16) |
| J. Auth | J | Built, off | Deliberate for this phase |
| K. Admin | K | No | Review queue and media console both deferred |

The pattern is clear and worth saying out loud: **everything that reads is
built, and almost nothing that writes is.** That is the correct order for a
reface on mock data, and it is also the entire remaining risk.

---

## 6. Performance and platform

### P-01 Canvas work per frame. Refinement, partly unverified.

Reduced this session: the palette is read once rather than ten times per draw,
a two-finger gesture no longer pushes the raw bearing into React state on
every frame, the wheel handler takes one rect read instead of four, and a
resize observer tick reporting an unchanged box no longer reassigns
`canvas.width`, which clears the canvas whether or not the value changed.

Honest caveat: I could not reproduce the flicker in a desktop harness, and a
60-step drag showed zero forced style recalculations both before and after, so
the `getComputedStyle` change is a real reduction in work but not a
demonstrated fix. The likeliest actual cause of what you saw is the viewport
one, V-01, since that resized the canvas for real. If it still glitches on the
phone after this, the next thing to instrument is marker hit-testing and the
per-frame hex set construction, neither of which is memoised across frames.

### V-01 Viewport stability. Fixed this session.

The shell measured itself in `dvh`, which tracks browser chrome, so every
surface resized when the URL bar collapsed. Three nested `min-h-dvh` and a
scrolling document compounded it. The shell is now one `--app-h` tall, `svh`
where supported because `svh` does not move, with screens scrolling inside it.
Verified: all 20 routes exactly 100dvh, nothing clipped, long screens still
reach their last line, desktop review column unaffected.

### P-02 Image weight. Mostly fixed, watch it.

The 19 masters that have landed are 54MB. Serving through `next/image` takes
the Dysert hero from 5,121kB to 398kB over the wire and the collectibles to
under 100kB. At device pixel ratio 3 a home screen still pulls about 836kB of
artwork. Worth a second look once all 41 have landed (M-03).

### P-03 Offline. Before live.

The service worker is network-first and deliberately skips `/_next/`, which
now includes every optimised plate. A walking app that loses signal will lose
its artwork. The service worker's own comment says the offline story arrives
with the walk flow, which is the right call, but it should be an explicit item
rather than a comment (L-06).

### P-04 No performance budget. Refinement.

Nothing measures bundle size or route weight over time. Cheap to add to CI
alongside the existing lint and type-check.

---

## 7. Accessibility

### A-01 Unlabelled inputs. Blocking.

Three inputs across `/login`, `/signup` and `/profile/edit` have no
accessible name.

### A-02 Touch targets. Blocking.

See X-01. This is an accessibility finding as much as a design one.

### A-03 What is right. No action.

Focus is trapped in frames and starts on Close. Escape dismisses. The nav
button carries `aria-haspopup` and `aria-expanded`. Every image has an `alt`.
Disabled waypoints announce "not reached yet". Reduced motion is honoured
globally through a stamped attribute and respected individually by the compass
and recentre animations. No console errors on any route.

### A-04 Not yet checked. Open.

Colour contrast has not been measured anywhere. `--mute` on `--surface` at 9px
is the combination I would check first. Screen-reader flow through the map
canvas has not been assessed at all; a canvas with no accessible fallback is
currently invisible to assistive technology (L-07).

---

## 8. Data and the live switch

The seam is good. Screens import `lib/data`, which picks an implementation
from `NEXT_PUBLIC_DATA_MODE` and defaults to mock. Verified: no screen imports
Supabase. Twenty-two methods on the read interface, all present in both
implementations, with the Supabase one throwing "not wired" by design.

What has to be true before the switch:

- **D-01** Every screen renders `error` (X-03).
- **D-02** Every screen renders an empty state (X-04).
- **D-03** `useAsync` is replaced. Its own comment says so: no caching, no
  refetching, no invalidation, fetch-on-mount only. Fine for mock, wrong for a
  walk that runs for three hours.
- **D-04** `useLiveLocation` is wired into the walk. It already guards
  non-finite coordinates, which is a real iOS bug and should stay.
- **D-05** Writes exist. Notes, community points, profile edits and outposts
  all currently write to local state and are lost on navigation.
- **D-06** The six migrations are applied, in order, after approval. They are
  written and unapplied by design.
- **D-07** `plate` needs a column if artwork keys are to come from rows rather
  than fixtures.

---

## 9. Media

**M-01. Resolved for the icon, 12 plates outstanding.** 39 of 51 have landed.
`app-mark` arrived and the icon, favicon and Apple touch icon all serve it,
downscaled at the route. Still missing: `quest-cloonanaha`, all five `poi-*`,
`tale-cahercalla`, two `collectible-*` and three `community-*`.
`npm run media` prints the live list.

**M-05. `hills-near` cannot be used as drawn. Needs redrawing.** The brief
asked for near ground, hedgerows and a gate, tiling horizontally, transparent
above and below. What arrived is a stag portrait against alpine peaks with a
full sky, filling the frame edge to edge. It does not tile: its left and right
edges differ by 108 alpha units per pixel against 10 for `hills-far`, so it
would jump visibly twice a minute in a looping band. It is held out of
`CountryBand`'s layer list with a comment rather than shipped, so the band runs
on one layer and no parallax until it is redrawn. `hills-far` is correct and is
in use.

**M-06. `app-mark-maskable` cannot be used as drawn, and is no longer needed.**
It is a full landscape scene with a stag, so Android's circular crop would
frame the animal's midsection, and it does not match the oak leaf that is the
actual mark. `/maskable-icon` now derives the Android icon from `app-mark`
instead: the mark's ink runs 57% wide and 87% tall of its square, so the square
is placed at 67% and the ink lands 29% from centre against Android's 30%
guarantee, measured. The ground is sampled from the mark's own corner rather
than taken from the paper token, because the plates are drawn on a near-white
a shade off ours. Deriving it means the launcher icon can never drift from the
favicon, so the maskable plate can be dropped from the brief entirely.

**M-07. Icon weight.** The mark is a 1.2MB engraving and a favicon is fetched
on every cold load, so the icon routes downscale with sharp: 512px at 306kB,
Apple touch at 33kB, maskable at 138kB.

**M-02.** The about page is the one screen that will look unfinished until its
artwork arrives, because its plates are structural rather than decorative.

**M-03.** Revisit total page weight once the set is complete (P-02).

**M-04.** `quest-thumb-cloonanaha.png` is in the folder with nothing to render
it, because `QuestCard` is dead (X-06).

---

## 10. Documentation accuracy

**Z-01. Blocking for trust.** `TODO.md`'s "Done" section claims Fraunces and
Plus Jakarta Sans, which were replaced by Archivo and JetBrains Mono, and
lists a `/welcome` route that no longer exists. A stale done-list is worse
than no done-list.

**Z-02.** `docs/design-system.md` section H still specifies the hills band as
though a component draws it. This session added a note that it is specified
and not built, which is a patch rather than a decision (S-05).

**Z-03.** `docs/ux-loops.md` is accurate as a specification and is now
materially ahead of the implementation in sections E and K. That is fine, but
the table in section 5 above should be kept current or the gap will be
rediscovered every time.

**Z-04.** `CLAUDE.md` is accurate and was updated this session for the media
folder.

---

## Appendix: how this was verified

Built with `npm run build` and served with `npm start`, driven with Chromium
at 390 x 844 (device pixel ratio 2 and 3) and 1280 x 700.

- **Viewport.** `document.documentElement.scrollHeight` against
  `window.innerHeight` on 20 routes, plus a walk of every element to find any
  whose bottom edge fell past the fold.
- **Touch targets.** `getBoundingClientRect` on every `button`, `a[href]`,
  `[role=button]`, `input`, `textarea` and `select` on 20 routes.
- **Radii.** Computed `border-top-left-radius` on every element with height,
  checked against the three tokens plus a pill allowance.
- **Type.** Computed `font-size` on every leaf element with text.
- **Accessible names.** `aria-label` or text content on every control; `alt`
  presence on every image.
- **Console.** Errors, warnings and page errors captured across 20 routes,
  excluding expected 404s for missing plates.
- **Frames.** Rect against the viewport, focus order after one Tab, Escape
  behaviour, inner scroll height.
- **Canvas.** Chrome DevTools Protocol `Performance.getMetrics` around a
  60-step drag, before and after the change; `canvas.width` assignments
  counted by patching the prototype accessor.
- **Image weight.** `content-length` on every `/_next/image` and `/plates/`
  response per route.
- **Dead code.** Every `from "..."` specifier in the repo resolved against the
  file tree, relative and aliased.
- **Data layer.** The `DataSource` interface parsed and each method looked for
  in both implementations.

What was not verified: colour contrast, screen-reader flow, behaviour on real
iOS or Android, anything requiring a live Supabase project, and any code path
behind auth.
