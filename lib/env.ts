/** Read a required env var, throwing a clear error if it's missing.
 *
 *  Why a helper instead of `process.env.X!`: the non-null assertion
 *  hides the failure mode — if the var is unset, you get an opaque
 *  TypeError from the consumer (e.g. Supabase's `createClient` rejecting
 *  an undefined URL) instead of a message that names the missing var.
 *  In Vercel that lands as a 500 with no useful log entry.
 *
 *  This helper turns missing env into a single line in the runtime log
 *  pointing at exactly which var is unset and where to set it. Cheap
 *  ergonomics win.
 *
 *  Read at call time, not at module load, so a misconfigured deploy
 *  still serves routes that don't use Supabase (like /api/healthz). */
export function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. ` +
        `Set it in .env.local for local dev, and on Vercel ` +
        `(Project → Settings → Environment Variables → Production) for prod.`,
    );
  }
  return value;
}
