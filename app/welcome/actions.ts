"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Marks the user's onboarding as complete and routes them into the app.
 *  Stores the flag in `auth.users.user_metadata` so middleware can read
 *  it cheaply from the JWT without an extra DB round-trip. */
export async function completeOnboarding() {
  const supabase = await createClient();
  await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });
  redirect("/home");
}
