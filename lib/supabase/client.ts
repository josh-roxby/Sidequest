import { createBrowserClient } from "@supabase/ssr";
import { required } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
