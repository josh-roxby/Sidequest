# UX loops

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-08-31 |
| Status | Specification for the reface build |
| Related | [design-system.md](./design-system.md) · [reface-plan.md](./reface-plan.md) · [PRD.md](./PRD.md) |

Every screen and feature, specified as a loop: what it does, how it is
entered, every state it can be in, and every gesture it answers. Written so a
screen can be built without any further decisions.

Each entry follows the same shape.

- **Job.** The one thing the screen is for.
- **States.** Loading, empty, populated, error, offline. Every screen has all
  five specified even when one collapses to "cannot happen".
- **Gestures.** Tap, hold, drag, and what each does.
- **Motion.** What animates, from where, over how long.
- **Edges.** The cases that break naive implementations.

Shared rules first, because they apply everywhere and are not repeated.

---

## A. Shared behaviour

**A-1 Loading.** Never a spinner. A 16px square rotating 90 degrees per step,
four steps at 600ms. Content areas that are waiting show hairline skeleton
rectangles at the exact height of the content they will be replaced by, so
nothing reflows on arrival. A skeleton is shown only after 200ms of waiting,
because anything faster reads as a flicker.

**A-2 Errors.** Every error states what went wrong and what to do next, in
that order, in one or two sentences. Errors appear in place, inside the
surface that failed, never as a toast for anything the user must act on.
Toasts are only for confirmations.

**A-3 Confirmations.** A toast is a square surface at `--gutter` from the
left, right and top, holding one line of past-tense text. It sits for 2400ms,
never blocks, never carries a button except undo, and only one exists at a
time.

**A-4 Destructive actions.** Deleting a track, abandoning a walk and
deleting an account all confirm in a square frame with a rust pill. Nothing
destructive happens on a single tap anywhere in the app.

**A-5 Offline.** The app tells the user once, in a persistent 24px mono strip
below the top of the screen: `OFFLINE. YOUR WALK IS STILL RECORDING.` It does
not repeat, does not block, and disappears on reconnect without announcement.

**A-6 Press feedback.** Everything interactive scales to 0.97 over
`--dur-tap` on press. This is the only universal animation and it is what
makes the interface feel physical despite having no shadows.

**A-7 Frames.** Every frame opens by scaling from the thumb anchor, traps
focus, closes on Escape, on scrim tap, and on the dismiss control at the
anchor. See design-system B.

---

## B. Cold start

### B-1 Landing

**Job.** Explain the product in one screen and get to the map.

**States.** No loading state, the page is static. No empty state. No error
state. Offline renders identically because nothing is fetched.

**Gestures.** One pill: `Start walking`. One quiet square button:
`I have an account`.

**Motion.** On load, the hairline grid draws in over 600ms from top-left,
then the headline and pill fade up 8px over `--dur-frame`. Runs once per
session, skipped under reduced motion.

**Edges.** With auth disabled for development, the pill goes straight to the
map and the account button is not rendered. There is no half-state where a
sign-in button does nothing.

### B-2 Location priming

**Job.** Earn the location permission, and give an equally good path for
people who will not grant it.

This screen is the highest-risk moment in the whole product. A denied prompt
on mobile Safari is effectively unrecoverable.

**States.**

| State | Treatment |
|---|---|
| Initial | Plain explanation, two paths, no prompt fired |
| Requesting | Pill shows the loading mark, disabled, copy changes to `Waiting for your phone` |
| Granted, low accuracy | `Still getting a fix` with the live accuracy in mono, auto-advances when under 100m |
| Granted, good fix | Advances to the map without a confirmation screen |
| Denied | Replaces the pill with recovery steps for the detected platform, and promotes the map path to primary |
| Unavailable | Device has no geolocation. Only the map path is offered, with no apology |

**Gestures.** `Enable location` fires the browser prompt and nothing else on
the screen does. `Pick a place on the map instead` is a full-width outlined
pill directly beneath it, not a text link.

**Motion.** None beyond press feedback. This screen should feel like a form,
not a pitch.

**Edges.** The browser prompt is never fired on page load, on mount, or on
any navigation. Only the button fires it. If permission is already granted
from a previous session, the screen is skipped entirely and never shown
again. If accuracy never improves past 100m within 20 seconds, the copy
offers the map path without removing the waiting state.

---

## C. Map

### C-1 The map screen

**Job.** Be the home screen. Show where you are, what you have revealed, and
what is near you.

**States.**

| State | Treatment |
|---|---|
| Loading | Paper ground with the grid drawn, no fog, no pins. The territory overlay fades in when the tile set hydrates. |
| Empty | A first-run user has no revealed territory, so the whole country is fogged except a small cleared square at their location. This is the intended first impression and needs no empty copy. |
| Populated | Fog, revealed territory, discovered points, quest starts within reach. |
| Error | Tiles failed to load. The grid and the fog still render from local state, with a mono strip: `MAP TILES UNAVAILABLE. TERRITORY IS STILL YOURS.` |
| Offline | Cached tiles render. Uncached areas show paper and grid, not grey. No error is shown, because offline is expected. |

**Gestures.**

| Gesture | Result |
|---|---|
| Drag | Pan. Bounded to the country. |
| Pinch | Zoom. Bounded between country view and street view. |
| Tap a point | Point popover in a square frame. |
| Tap empty map | Dismisses any open popover. Does nothing else. Never drops a pin. |
| Hold empty map, 400ms | Drops a start pin, with the rust ring drawing during the hold. |
| Tap the active Map tile | Recentres on the user with a 400ms ease. |
| Hold the Map tile | Fan: Recentre, Layers, Drop a pin. |

**Motion.** Panning is native. The fog overlay redraws on `moveend`, never
during the drag. Recentring eases over 400ms. New territory revealed during a
walk erases into the fog buffer at the user's position with a soft square
brush, once per fix, never a full redraw.

**Edges.** The country boundary is a hard camera stop, not a rubber band. A
user who drags to the edge feels it stop and that is correct: the country
lock is a product feature, not a limitation to hide. Pins are never dropped
by a single tap, because a mis-tap while panning would be constant.

### C-2 Territory readout

**Job.** Make progress legible without a screen of its own.

Sits at the top-left of the map, 8px from both edges, as a square surface
with two mono lines: the county, then `1,284 TILES · 14 TOWNLANDS`.

**States.** Zero state reads `0 TILES · 0 TOWNLANDS` and is shown, not
hidden. Seeing zero is the motivation.

**Gestures.** Tap opens the territory frame. No hold.

**Motion.** When a walk ends and new tiles land, the number counts up over
`--dur-reveal` and the surface border flashes rust once. The only place in
the app a number animates.

---

## D. Getting a quest

### D-1 Tier picker

**Job.** Take the one input that matters, how long you have, and nothing
else.

**States.**

| State | Treatment |
|---|---|
| Loading | Not applicable, the four tiers are static |
| Populated | Four rows: Trot 15 MIN, Stroll 45 MIN, Sidequest 1H 30, Adventure 3H 00 |
| Partial | A tier with no quests within reach is shown disabled, with the reason in mono: `NOTHING WITHIN REACH` |
| Error | Cannot reach the corpus. All four disabled, with a retry square button |
| Offline | Cached quests only. Uncached tiers disabled with `NEEDS A CONNECTION` |

**Gestures.** Tap a row to select, which fills it `--field-soft` and darkens
its border to `--ink`. The pill at the foot updates its label to the chosen
tier: `Find a stroll`. Tapping the pill searches.

**Motion.** Row selection is a 180ms border and fill transition. No
animation on the pill label change, it swaps instantly, because a text
crossfade at that size reads as a glitch.

**Edges.** The last chosen tier is remembered and preselected. A user who
opens the picker and immediately taps the pill gets what they had last time,
which is the common case.

### D-2 Quest preview

**Job.** Give enough to commit or reroll, honestly.

Opens in a `tall` frame, the only screen besides the tale reader that gets
one.

**States.**

| State | Treatment |
|---|---|
| Loading | Skeleton at the exact height of the stat row and the description, 200ms delay before showing |
| Populated | Tier label, quest title, three-stat row, the route drawn on a small map, the anchor point with its category, and the honesty block |
| Empty | No quest found for this tier here. Copy names the reason and offers the next tier up, which is almost always populated |
| Error | Retry square button in place, with the failure named |
| Offline | Cached quests preview fully. The route map falls back to a hairline trace on paper |

**The honesty block** is not optional and not collapsible. It lists surface,
gates and stiles, any stretch of road without a pavement, and whether the
estimated finish is after sunset. If none apply it reads `MADE PATHS
THROUGHOUT`. Suppressing it to make a quest look better is the one thing that
would break trust irrecoverably.

**Gestures.** Solid pill `Begin`. Outlined pill `Reroll` beneath it. Square
buttons in a row for `Save` and `Share`. Tapping the small map opens the
route full-bleed behind the frame rather than navigating away.

**Motion.** Reroll fades the frame body to 40% for the fetch, then the new
content fades in. The frame itself does not move, resize or re-animate,
because a frame that re-opens on every reroll makes rerolling feel expensive.

**Edges.** Reroll must feel free. Target under 200ms perceived, which the
pre-built corpus makes achievable since it is a local query. If reroll ever
exceeds 600ms the loading mark appears, and if that happens often the corpus
in that area is too thin and should be logged as such.

---

## E. Walking

### E-1 Active walk

**Job.** Show distance, time and the next objective. Nothing else.

**States.**

| State | Treatment |
|---|---|
| Starting | Brief state while the first fix lands. Copy: `Getting your position` |
| Walking | Live stats, trail drawing behind the user, next objective named |
| No fix | Stats hold their last value with the mono strip `NO GPS. HOLDING LAST POSITION.` Nothing resets to zero |
| Paused | Stats freeze, the trail dims to 40%, the anchor becomes Resume |
| Backgrounded and returned | Gap-fill runs, and if it filled anything the toast reads `Filled 240m while you were away` |
| Offline | No treatment. A walk is designed to run with no connection and says nothing about it |

**Gestures.** The thumb anchor holds `End walk` for the duration of the
walk, replacing the nav tile. Nav is still reachable by tapping any other
tile in the block, so a user can check their journal mid-walk without ending
anything. Hold the anchor for the fan: Pause, Skip objective, Abandon.

**Motion.** The trail draws behind the user continuously. The distance
counter updates every fix, not every frame, so it ticks rather than blurs.
Fog erases at the position on each fix.

**Edges.** `End walk` never ends on a single tap. It opens a square frame:
`End here? You have covered 1.8 of 2.8 km.` with a rust pill. Abandoning
keeps every tile already revealed, and the confirmation says so, because
users assume they will lose progress and will not abandon rather than risk
it.

### E-2 Objective completion

**Job.** Make arriving feel like something without requiring the phone.

**States.** Pending, approaching within 100m, dwelling, complete, and failed
verification.

**Gestures.** None. Completion is automatic on 40m proximity for 15
continuous seconds. There is no `I found it` button, because requiring a tap
means requiring the user to be looking at the phone at the moment of arrival.

**Motion.** On completion the objective square fills from hollow to solid
over `--dur-reveal`, a light haptic fires, and a toast names the point. If
the point has a tale, the toast carries a `Read` square button and holds for
4000ms instead of 2400ms.

**Edges.** Verification is re-checked server side, and a client completion
that the server rejects does not visibly un-complete. It stays complete for
the user and the walk is flagged internally. Reversing a reward in front of
someone standing at a ringfort is worse than a rare uncounted visit.

### E-3 Walk complete

**Job.** Report what changed, in the order that matters.

Opens in a `square` frame automatically on the final objective or on
`End walk`.

**Order is fixed:** new territory first, then the points visited, then
distance and time, then any unlocks. Territory leads because it is the thing
that is permanently different about the map.

**States.** Complete, partial, and abandoned each get their own copy.
Abandoned still reports revealed territory and does not use the word failed.

**Motion.** The tile count counts up over `--dur-reveal`. Unlocks arrive one
at a time at 300ms intervals, each a square badge scaling from 0.9. If there
are more than three unlocks they collapse to a count.

**Edges.** If the sync fails, the frame still shows the numbers from local
state and a mono line reads `SAVING WHEN YOU RECONNECT`. The user never waits
on the network to see their result.

---

## F. Points and tales

### F-1 Point popover

**Job.** Answer "what is that" in one tap.

**States.** Loading with a skeleton, populated, and a reported state for
points a user has flagged. No empty state, because a popover only opens on a
point that exists.

**Gestures.** Tap the point on the map. Inside: a `Read the tale` square
button if lore exists, `Report` in the fan behind a hold on the header.

**Motion.** Standard frame open from the anchor.

**Edges.** A point with no tale does not show a disabled Read button, it
shows nothing. Disabled controls that are usually absent teach nothing.

### F-2 Tale reader

**Job.** Tell the story of a place, with its sources visible.

Opens in a `tall` frame.

**States.** Loading with skeleton paragraphs, populated, and a state for
points that only have a placename tale, which is the most common case and
must not read as thin. A placename tale is two lines: the Irish form and the
meaning, set large, and that is a complete tale.

**Gestures.** Scroll. Tap a source name to open it externally. Hold on a
paragraph to copy it.

**Motion.** None. Reading surfaces do not animate.

**Edges.** Attribution is always visible, never behind a disclosure. Sources
under a share-alike or non-commercial licence render as an outbound link with
the licence named, never as embedded body text. This is enforced at the data
layer, and the reader simply renders what it is given.

---

## G. Journal

**Job.** Everywhere you have been, findable.

**States.**

| State | Treatment |
|---|---|
| Loading | Six skeleton rows at row height |
| Empty | Hairline square with a diagonal rule, and one line: `Nothing walked yet.` A pill beneath: `Find a trot`. The empty state offers the shortest tier, because the barrier is time |
| Populated | Reverse chronological rows: date in mono, quest title, tier chip, distance in mono |
| Error | Retry in place |
| Offline | Cached history renders. A mono strip notes that recent walks may be missing |

**Gestures.** Tap a row for the walk detail. Hold a row for the fan: Share,
Save to collection, Delete track. Deleting the track is destructive and
confirms in a frame.

**Motion.** Rows do not stagger in. A staggered list is the most overused
animation in mobile and it delays reading.

**Edges.** Deleting a track deletes only the recorded path, never the walk
record or the territory. The confirmation frame says exactly that, because
users reasonably assume delete means delete everything.

---

## H. You

**Job.** Territory, categories, tiers and badges in one place.

**States.** Loading, populated, and a first-run state where every number is
zero and every category shows its honest denominator. Showing `0 of 47
ringforts` on day one is the hook, so the zero state is designed, not
tolerated.

**Gestures.** Tap a category for its frame, listing which points you have
reached and roughly where the rest are. Hold a badge for how it was earned.

**Motion.** Progress bars fill over `--dur-reveal` on first view per session
only, never on every render.

**Edges.** Denominators are country and county scoped and must be honest. If
the dataset does not know how many ringforts are in a county, the category
shows a count without a denominator rather than a made-up one.

---

## I. Collections

**Job.** Curate quests into a set worth sharing.

**States.** Loading, empty with a create prompt, populated, and a viewing
state for someone else's public collection where the actions differ.

**Gestures.** Tap to open, hold to reorder with a drag. Reordering uses hold
then drag, never a separate edit mode.

**Motion.** The dragged row lifts by scaling to 1.02 with a 1px ink border,
no shadow. Other rows shift over `--dur-state`.

**Edges.** Walking someone else's collection creates your own walks against
their quests and never modifies theirs. Per-viewer completion reads `3 of 8`
and is computed for the viewer, not the owner.

---

## J. Auth

Disabled by default during this build phase. The screens exist, are styled,
and are reachable directly, but no route requires them and no redirect fires.

**States.** Idle, submitting, error with the failure named in plain language,
and success. Supabase error codes are mapped to human sentences and never
shown raw.

**Edges.** When auth is switched on, the only change is a flag. No screen
changes and no route changes, because the middleware already handles the
redirect matrix.

---

## K. Admin

Deferred. Specified in PRD section 8.14. The one rule that matters before any
of it is built: `is_admin` is a database column, enforced in middleware, in
every server action, and in row level security. Never in user metadata, which
the user can write.
