import { readFileSync } from "node:fs";
import { APP_MARK } from "@/lib/media";
import { mediaFile } from "@/lib/media.server";

/** The Android adaptive icon, derived from the app mark rather than drawn
 *  separately.
 *
 *  Android crops a maskable icon to a circle or a squircle and guarantees only
 *  the centre 60% survives, so the mark is scaled into that safe zone and the
 *  rest is flat paper. Deriving it means the launcher icon can never drift away
 *  from the favicon, and a separate maskable plate cannot be drawn to the wrong
 *  brief without anyone noticing. docs/design-system.md §H. */
const SIZE = 512;
/** How much of the icon the mark's own square is scaled to occupy.
 *
 *  Android guarantees only the centre 60% of a maskable icon survives the
 *  crop. The mark is drawn with its own margin: its ink runs 57% wide and 87%
 *  tall of its square, so placing the square at 67% lands the ink inside the
 *  centre 58% on its longest side, with a little room over the guarantee. */
const SAFE = 0.67;
/** Fallback ground, used only if the mark has no opaque corner to sample. */
const PAPER = { r: 0xf4, g: 0xf2, b: 0xec };

export const dynamic = "force-static";

/** A sampled ground is only usable if it is actually light. A mark drawn on
 *  transparency samples as black, and a black icon ground is never intended. */
const st = (c: { r: number; g: number; b: number }) => (c.r + c.g + c.b) / 3 > 200;

export async function GET() {
  const file = mediaFile(APP_MARK);
  if (!file) return new Response("No app mark", { status: 404 });

  const sharp = (await import("sharp")).default;
  const inner = Math.round(SIZE * SAFE);
  const raw = readFileSync(file.path);

  // The ground is sampled from the mark's own corner rather than taken from the
  // paper token. The plates are drawn on their own near-white, a shade off
  // ours, and compositing one onto the other leaves a pale square floating
  // inside the icon. Sampling means the two grounds are the same colour by
  // construction, whatever the next mark is drawn on.
  const corner = await sharp(raw).extract({ left: 0, top: 0, width: 8, height: 8 })
    .stats().then((st) => ({
      r: Math.round(st.channels[0].mean),
      g: Math.round(st.channels[1].mean),
      b: Math.round(st.channels[2].mean),
    })).catch(() => PAPER);
  const ground = st(corner) ? corner : PAPER;

  // Not trimmed. The plates carry faint texture right to their edges, so trim
  // finds no uniform border to remove at any threshold and the mark's own
  // margin is accounted for in SAFE instead.
  const mark = await sharp(raw)
    .resize(inner, inner, { fit: "contain", background: { ...ground, alpha: 0 } })
    .toBuffer();

  const out = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { ...ground, alpha: 1 } },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
