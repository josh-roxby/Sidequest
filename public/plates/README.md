# Plates

Every image the app renders lives here. Nothing else in the codebase holds
artwork.

## Dropping artwork in

Name the file after its key and put it in this folder. That is the whole
process: no import, no registration, no code change.

    public/plates/quest-dysert.png   ->  the Dysert Round hero, everywhere it appears

`png`, `webp`, `jpg` and `svg` all work, tried in that order, so an export does
not need renaming on the way in. A key with no file shows its slot's
placeholder at the right ratio, which means the folder can fill up a plate at a
time without a broken screen in between.

## What the keys are

`docs/media-manifest.json` is the register: every key the app asks for, with
its ratio, pixel size, priority and the brief for what it shows.

    npm run media

prints what has landed, what is still waiting, and anything sitting in here
that no slot references.

## The app icon

`app-mark` becomes the icon and the favicon the moment it lands, and
`app-mark-maskable` is picked up by the web manifest for Android. Until then
both fall back to a leaf drawn in CSS.

## Where the wiring lives

`lib/media.ts` owns the folder path and the extension list. `Plate` in
`components/primitives/Plate.tsx` is the slot every screen uses.
`lib/media.server.ts` is the same lookup for the icon and manifest routes,
which run on the server and can just look at the disk.
