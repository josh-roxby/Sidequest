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

/** Auth-disabled mode: when `NEXT_PUBLIC_AUTH_DISABLED` is truthy, the
 *  proxy skips session refresh / route protection, and `getCurrentUser`
 *  returns a demo user. Lets the UI render end-to-end without a Supabase
 *  project wired up — useful for design/preview environments. Off by
 *  default; production behaviour is unchanged unless you opt in. */
export function isAuthDisabled(): boolean {
  const v = process.env.NEXT_PUBLIC_AUTH_DISABLED;
  return v === "1" || v === "true";
}

/** Stand-in user returned from `getCurrentUser` while auth is disabled.
 *  Shape matches the bits of `@supabase/supabase-js` `User` we actually
 *  read in pages — id, email, user_metadata. Onboarding pre-completed so
 *  /home renders instead of being kicked back to /welcome. */
export const DEMO_USER = {
  id: "demo-user",
  email: "wanderer@example.com",
  user_metadata: {
    display_name: "Demo Wanderer",
    onboarding_completed: true,
  },
} as const;

export type DemoUser = typeof DEMO_USER;
