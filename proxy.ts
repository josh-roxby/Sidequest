import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 renamed the `middleware.ts` file convention to `proxy.ts`,
// and the exported function from `middleware` to `proxy`. The old
// names still work in 16.x but are deprecated. See
// https://nextjs.org/docs/messages/middleware-to-proxy
//
// The internal helper at `lib/supabase/middleware.ts` keeps its name —
// that's just a Supabase-side label and not a Next file convention.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next internals, static assets, and `/api/*`. API routes
    // handle their own auth and don't need the session-refresh /
    // redirect logic; this also keeps `/api/healthz` reachable when
    // Supabase env wiring is broken.
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
