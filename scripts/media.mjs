/** Reports which media keys have artwork and which are still waiting.
 *
 *  The manifest in docs/ is the register of everything the app asks for; the
 *  folder is what has actually arrived. Run `npm run media` after dropping
 *  files in to see the two line up. */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIR = join(ROOT, "public", "plates");
const MANIFEST = join(ROOT, "docs", "media-manifest.json");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => !f.startsWith(".")) : [];

/** Extension is a delivery detail, so a key matches whatever it arrived as.
 *  Must stay in step with MEDIA_EXTS in lib/media.ts. */
const EXTS = ["png", "webp", "jpg", "svg"];
const byKey = new Map();
for (const f of files) {
  const dot = f.lastIndexOf(".");
  if (dot > 0 && EXTS.includes(f.slice(dot + 1).toLowerCase())) byKey.set(f.slice(0, dot), f);
}

const rows = manifest.assets.map((a) => ({ ...a, file: byKey.get(a.key) }));
const here = rows.filter((r) => r.file);
const missing = rows.filter((r) => !r.file);
const stray = [...byKey.entries()]
  .filter(([key]) => !rows.some((r) => r.key === key))
  .map(([, file]) => file);

const pad = Math.max(...rows.map((r) => r.key.length));
const line = (r, mark) => `  ${mark} ${r.key.padEnd(pad)}  ${r.ratio.padEnd(5)} p${r.priority}`;

console.log(`\n${here.length} of ${rows.length} plates in public/plates\n`);
if (missing.length) {
  console.log("Waiting on artwork");
  for (const r of [...missing].sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key))) {
    console.log(line(r, "·"));
  }
  console.log("");
}
if (here.length) {
  console.log("Landed");
  for (const r of here) console.log(line(r, "✓"));
  console.log("");
}
if (stray.length) {
  console.log("In the folder but not in the manifest, so nothing renders them");
  for (const f of stray) console.log(`  ? ${f}`);
  console.log("");
}
