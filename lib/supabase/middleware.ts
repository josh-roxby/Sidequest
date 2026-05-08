import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Route protection: gate /quest behind auth.
  const url = request.nextUrl;
  const isProtected = url.pathname.startsWith("/quest");
  const isAuthPage  = url.pathname.startsWith("/login") || url.pathname.startsWith("/signup");

  if (!user && isProtected) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage) {
    const redirect = url.clone();
    redirect.pathname = "/quest";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
