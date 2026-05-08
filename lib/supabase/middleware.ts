import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_PATHS = ["/home", "/map", "/quests", "/journal", "/profile"];
const AUTH_PATHS = ["/login", "/signup"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
  const isWelcome  = path.startsWith("/welcome");

  // 1. Anonymous users can't reach app paths or /welcome.
  if (!user && (isAppPath || isWelcome)) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user) {
    const onboarded = Boolean(user.user_metadata?.onboarding_completed);

    // 2. Signed-in but not onboarded → must finish /welcome before
    //    anything else (other than the auth callbacks and /welcome
    //    itself).
    if (!onboarded && isAppPath) {
      const redirect = url.clone();
      redirect.pathname = "/welcome";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    // 3. Signed-in and already onboarded should never see /welcome
    //    or /login or /signup.
    if (onboarded && (isWelcome || isAuthPath)) {
      const redirect = url.clone();
      redirect.pathname = "/home";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    // 4. Signed-in but not onboarded should bounce out of /login or
    //    /signup into /welcome (post-signup case).
    if (!onboarded && isAuthPath) {
      const redirect = url.clone();
      redirect.pathname = "/welcome";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }
  }

  return supabaseResponse;
}
