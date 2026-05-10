import type { User } from "@supabase/supabase-js";
import { DEMO_USER, isAuthDisabled } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Loose user shape for pages: covers both real Supabase users and the
 *  in-memory DEMO_USER stub used while auth is disabled. Pages should
 *  read through this rather than the full Supabase `User` interface so
 *  they work in either mode. */
export type AppUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    display_name?: string;
    onboarding_completed?: boolean;
    [key: string]: unknown;
  };
};

/** Single entry point for "who is the current user". Returns the demo
 *  user when `NEXT_PUBLIC_AUTH_DISABLED` is on, the real Supabase user
 *  otherwise, or `null` if no session.
 *
 *  Centralising this means pages don't each have to duplicate the
 *  `if (isAuthDisabled())` branch, and we don't accidentally call
 *  Supabase APIs in disabled mode (which would crash if the env vars
 *  aren't set). */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isAuthDisabled()) {
    return DEMO_USER;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user as User | null;
}
