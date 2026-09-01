import { existsSync } from "node:fs";
import { join } from "node:path";
import { MEDIA_DIR, MEDIA_EXTS } from "./media";

/** Server side view of the media folder.
 *
 *  The browser resolves a key by trying URLs and letting the misses fail
 *  quietly. Anything that runs on the server can do better than that and just
 *  look, which is what lets the icon routes and the web manifest change the
 *  moment a file lands in the folder rather than on a code edit. */
export const MEDIA_ROOT = join(process.cwd(), "public", "plates");

const MIME: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
};

/** The file backing a key, or null when nothing has been dropped in yet. */
export function mediaFile(key: string): { path: string; url: string; type: string } | null {
  for (const ext of MEDIA_EXTS) {
    const path = join(MEDIA_ROOT, `${key}.${ext}`);
    if (existsSync(path)) return { path, url: `${MEDIA_DIR}/${key}.${ext}`, type: MIME[ext] };
  }
  return null;
}
