import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthDisabled, required } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const APP_PATHS = ["/home", "/map", "/quests", "/collection", "/history", "/tales",
                   "/outposts", "/about", "/settings", "/profile", "/friends",
                   "/activity"];
const AUTH_PATHS = ["/login", "/signup"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  // Auth-disabled mode: skip session refresh and all the redirect
  // logic, render every route as-is. Pages get DEMO_USER from
  // getCurrentUser. Useful for previewing UI without a Supabase
  // project wired up. See lib/env.ts for the flag.
  if (isAuthDisabled()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touch getUser() so Supabase rotates / refreshes the session cookies
  // on every navigation. Don't drop this call — without it auth state
  // can desync after the access token expires.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const path = url.pathname;
  const isAppPath  = startsWithAny(path, APP_PATHS);
  const isAuthPath = startsWithAny(path, AUTH_PATHS);

  // 1. Anonymous users can't reach app paths. The landing page at / is the
  //    public face and stays open to everyone.
  if (!user && isAppPath) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  // 2. Signed in and on an auth page: send them into the app.
  if (user && isAuthPath) {
    const redirect = url.clone();
    redirect.pathname = "/home";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
