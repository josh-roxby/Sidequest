import { createClient } from "@/lib/supabase/server";

export default async function QuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware redirects anonymous users; this is just a belt-and-braces
  // assert for the type narrowing below.
  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--mute)]">
          // SIDE QUEST
        </p>
        <h1 className="text-2xl font-bold">Quest map</h1>
        <p className="text-sm text-[color:var(--mute)]">
          Map UI lands once the design infra arrives. See <code>TODO.md</code>{" "}
          for the punch list.
        </p>
      </header>

      <section className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm">
        Signed in as <span className="font-mono">{user.email}</span>.
      </section>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-md border border-[color:var(--line)] px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
