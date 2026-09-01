/** Every image the app renders comes out of one folder.
 *
 *  Drop a file named `<key>.png` into `public/plates/` and the slot holding
 *  that key picks it up on the next load. Nothing else changes: components and
 *  fixtures carry keys, and this module is the only place that knows where the
 *  files sit or what they are called on disk. Swapping the whole art direction
 *  is a folder swap, and moving the folder is one line here.
 *
 *  `docs/media-manifest.json` is the register of every key the app asks for.
 *  `npm run media` prints which of them have landed. */

/** The one folder. Public URL path, so it is `public/plates` on disk. */
export const MEDIA_DIR = "/plates";

/** Tried in order against a key. Extensions are a delivery detail, not
 *  something a component should have an opinion about, so a WebP export routes
 *  exactly as readily as a PNG and neither has to be renamed on the way in. */
export const MEDIA_EXTS = ["png", "webp", "jpg", "svg"] as const;

/** Nth candidate URL for a key, or null once the list is spent. A key with no
 *  file anywhere falls through to the slot's own placeholder rather than a
 *  broken image, which is what makes a half filled folder safe to ship. */
export function mediaSrc(key: string, attempt = 0): string | null {
  const ext = MEDIA_EXTS[attempt];
  return ext ? `${MEDIA_DIR}/${key}.${ext}` : null;
}

/** The app mark, used for the icon and favicon routes. Named here rather than
 *  in `app/icon.tsx` so the folder stays the single answer to "where does the
 *  artwork live". */
export const APP_MARK = "app-mark";
