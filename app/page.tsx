import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--mute)]">
          // SIDE QUEST
        </p>
        <h1 className="font-[family-name:var(--f-display)] text-3xl font-black">
          Walk somewhere new.
        </h1>
        <p className="text-sm text-[color:var(--mute)]">
          Drop a pin, pick a radius, get a random target inside it. Walk a loop
          and complete a small task on the way.
        </p>
      </header>

      <nav className="flex flex-col gap-2">
        {user ? (
          <Link
            href="/quest"
            className="rounded-md border border-[color:var(--line)] bg-[color:var(--accent)] px-4 py-2 text-center text-sm font-bold text-[color:var(--accent-on)]"
          >
            Open quest map
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md border border-[color:var(--line)] bg-[color:var(--accent)] px-4 py-2 text-center text-sm font-bold text-[color:var(--accent-on)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-[color:var(--line)] px-4 py-2 text-center text-sm"
            >
              Create an account
            </Link>
          </>
        )}
      </nav>
    </main>
  );
}
