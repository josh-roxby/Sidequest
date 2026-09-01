# Reface and recode plan

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-08-31 |
| Status | Active |
| Goal | A clean front end MVP that runs on mock data, with no database dependency |
| Related | [design-system.md](./design-system.md) · [ux-loops.md](./ux-loops.md) · [PRD.md](./PRD.md) |

The product direction is settled in the PRD. This plan covers the front end
only: strip the previous visual layer, rebuild against the field survey
system, and get to something runnable and tappable without touching Supabase.

## Working constraints for this phase

| | |
|---|---|
| **Auth** | Off. No route requires a session. The screens exist and are styled but nothing redirects. |
| **Database** | Not touched. No migration is applied, no function is deployed, no table is created. |
| **Migrations** | Written and committed to `supabase/migrations/`, ready to apply when approved. Applying them is a task in `TODO.md`, not part of this phase. |
| **Supabase client code** | May exist and may be imported. It is never the active data source. |
| **Data** | A mock layer returns the exact shapes the real queries will return. Screens consume a single interface and cannot tell the difference. |
| **Map** | A placeholder surface built to the real tokens. No MapLibre, no tile build, no vendor. |

The reason for the mock layer rather than hardcoded values in screens: the
previous build put fabricated data directly into four screens, which made the
app look finished while being wired to nothing. A mock layer behind the same
interface as the real one is honest about what is connected, and the switch
to live data becomes one environment variable rather than a rewrite.

---

## A. Foundation

**A-1 Strip**

- A-1-1 Delete `components/shell/StatusBar.tsx`, a fake iOS status bar that renders beneath the real one.
- A-1-2 Delete `hooks/use-project-storage.ts`, unused, and superseded by IndexedDB for territory.
- A-1-3 Remove `leaflet`, `react-leaflet`, `@types/leaflet` and `styles/map.css`.
- A-1-4 Remove the fabricated values from `/home`, `/map`, `/quests` and `/profile`.
- A-1-5 Remove the four references to `SideQuestDesign.md`, a file that is cited by the codebase and does not exist in it. This document and `design-system.md` replace it.
- A-1-6 Retire the word "run" from code and copy. The entity is `walks` and it never appears in the interface.

**A-2 Tokens**

- A-2-1 Replace the `:root` block in `app/globals.css` with the field survey palette from `design-system.md` section A-1.
- A-2-2 Rebuild the `@theme inline` bridge so every token is reachable as a Tailwind utility.
- A-2-3 Add the two radius tokens and no others.
- A-2-4 Add the gutter constant, the spacing scale, the size scale and the motion tokens.
- A-2-5 Extend the reduced motion guard to cover frame scaling and the fog reveal.

**A-3 Type**

- A-3-1 Replace Fraunces and Plus Jakarta Sans with Archivo and JetBrains Mono via `next/font/google`.
- A-3-2 Add utility classes for the nine roles in `design-system.md` section A-2.
- A-3-3 Set `font-variant-numeric: tabular-nums` on the mono role by default.

**Exit condition.** The app builds, every screen renders in the new palette,
and no screen shows a number that is not mono.

---

## B. Primitives

Built in dependency order. Each one is complete, with every state from
`ux-loops.md` section A, before the next begins.

- B-1-1 `Action`, the pill. Solid field, solid rust, outlined. The only round component in the codebase.
- B-1-2 `Button`, square. Solid ink, outlined, quiet.
- B-1-3 `Tile`, square, 56px, with default, active, pressed, holding, badged and disabled states.
- B-1-4 `Field`, text input, square, rust focus outline.
- B-1-5 `Chip`, square, for filters and category tags.
- B-1-6 `Stat`, mono value over uppercase key, in divided rows of three.
- B-1-7 `Rule`, the 1px divider, in hairline and structural weights.
- B-1-8 `Mark`, category glyphs on a 16px grid with square caps.
- B-1-9 `Loading`, the rotating square. `Empty`, the crossed square.
- B-1-10 `Skeleton`, hairline rectangles with the 200ms delay built in.

**Exit condition.** A single reference route renders every primitive in every
state, and `rounded-full` appears in exactly one file.

---

## C. Shell

**C-1 The thumb block**

- C-1-1 Build the 2 by 2 block, 56px tiles, 2px ink gap, anchored 8px from the bottom-right.
- C-1-2 Tap to navigate, with the active tile filling field.
- C-1-3 Press and hold at 400ms, with the rust ring drawing over the hold duration.
- C-1-4 The shortcut fan, opening above the block, dismissing on outside tap.
- C-1-5 Haptic on hold threshold where the device supports it.
- C-1-6 First run hint, dismissed permanently after the first successful hold.
- C-1-7 The left-handed mirror setting.

**C-2 The frame**

- C-2-1 Build `Frame` with the square and tall ratios, the 8px gutter on three sides, and the scale-from-anchor open.
- C-2-2 Scrim, dismiss on tap.
- C-2-3 Focus trap, Escape to close, focus restored to the trigger.
- C-2-4 The dismiss control at the thumb anchor.
- C-2-5 Body scroll inside the frame, with the header and footer fixed.

**C-3 The anchor contract**

- C-3-1 A single component owns the 56px region at the bottom-right and swaps its contents by context: nav tile, frame dismiss, end walk, disabled loading.
- C-3-2 Nothing else in the app may render into that region.

**Exit condition.** Navigation works, frames open and close correctly, and
the thumb anchor holds something useful in every context.

---

## D. Data layer

- D-1-1 Define the read interface in `lib/data/`: the functions the screens call, typed against the PRD section 10 shapes.
- D-1-2 Implement `lib/data/mock/` with plausible Irish content: real townlands, real categories, real tier distances. No lorem, no placeholder names.
- D-1-3 Implement `lib/data/supabase/` against the same interface. Written, exported, and not selected.
- D-1-4 Select the implementation from `NEXT_PUBLIC_DATA_MODE`, defaulting to mock.
- D-1-5 Add artificial latency to the mock layer, configurable, defaulting to 180ms, so loading and skeleton states are visible during development rather than theoretical.
- D-1-6 Add a mock failure switch so error states can be exercised without breaking anything.
- D-1-7 Write the migrations to `supabase/migrations/`, numbered and ordered, covering the PRD section 10 schema. Do not apply them.

**Exit condition.** Every screen reads through `lib/data`, no screen imports
Supabase directly, and every state in `ux-loops.md` can be triggered by a
switch.

---

## E. Screens

Built in the order a new user meets them, so the cold start path is
continuously testable end to end.

- E-1-1 Landing.
- E-1-2 Location priming, including the denied and low accuracy states, which are the ones that actually matter.
- E-1-3 Map, with the placeholder surface, the territory readout and the fog overlay.
- E-1-4 Tier picker.
- E-1-5 Quest preview, including the honesty block.
- E-1-6 Active walk.
- E-1-7 Walk complete.
- E-1-8 Point popover and tale reader.
- E-1-9 Journal and walk detail.
- E-1-10 You: territory, categories, tiers, badges.
- E-1-11 Collections.
- E-1-12 Auth screens, styled, unreachable by redirect.

**Exit condition.** The whole loop from landing to walk complete runs on mock
data on a phone.

---

## F. Polish

Run once every screen exists, because polishing a screen that is about to
change is wasted.

- F-1-1 Every empty state, against `ux-loops.md`.
- F-1-2 Every loading and skeleton state, with the 200ms delay verified.
- F-1-3 Every error state, with copy that names the fix.
- F-1-4 Offline behaviour on every screen.
- F-1-5 Hold gestures on every surface that specifies one, each with a tap equivalent.
- F-1-6 Motion pass: frame origin, fog reveal, count ups, no list staggering.
- F-1-7 Accessibility pass: touch targets, focus outlines, focus trapping, reduced motion, colour independence.
- F-1-8 Copy pass against `design-system.md` section F.

**Exit condition.** No screen has an unspecified state.

---

## G. Live data

Gated. Nothing in this section starts without explicit approval.

- G-1-1 Review the migrations.
- G-1-2 Apply them to a Supabase project.
- G-1-3 Switch `NEXT_PUBLIC_DATA_MODE` to live in a preview environment only.
- G-1-4 Enable auth and verify the redirect matrix.
- G-1-5 Seed a small real dataset from the pilot region.

---

## Sequencing

A through C are strictly ordered and each blocks the next. D can run in
parallel with C. E depends on all of A through D. F depends on E. G depends
on approval and on nothing else in this plan.

The critical path is A, B, C, E, F.

## What this phase deliberately does not do

No MapLibre and no tile build. No routing. No POI ingestion. No fog of war
persistence. No progression rules engine. No live data of any kind. Those are
PRD phases v0.5 and v0.75 and they are tracked separately in `TODO.md`.

The output of this phase is a front end that looks and feels right, runs on
its own, and can be pointed at real data later without being rewritten.
