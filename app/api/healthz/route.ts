import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Cheap "is the deploy alive and wired up" probe. Doesn't touch
 *  Supabase or any user data — it just reports whether the env vars
 *  the app needs are present, plus the build SHA when Vercel exposes
 *  one. Useful for diagnosing prod deploys ("is the env wiring the
 *  problem, or something else?") without leaking values.
 *
 *  Public on purpose: no secrets in the response, and the proxy lets
 *  /api/* through without auth gating. */
export function GET() {
  const env = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  const ok = env.hasSupabaseUrl && env.hasSupabaseAnonKey;

  return NextResponse.json(
    {
      ok,
      service: "side-quest",
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: env,
    },
    { status: ok ? 200 : 503 },
  );
}
