import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--mute)]">
          // CREATE ACCOUNT
        </p>
        <h1 className="text-2xl font-bold">Get walking.</h1>
      </header>

      {params.sent ? (
        <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-sm">
          Check your inbox for a confirmation link, then sign in.
        </div>
      ) : (
        <form action={signup} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--mute)]">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--mute)]">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2"
            />
          </label>
          {params.error ? (
            <p className="text-xs text-[color:var(--warn)]">{params.error}</p>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-bold text-[color:var(--accent-on)]"
          >
            Create account
          </button>
        </form>
      )}

      <p className="text-center text-sm text-[color:var(--mute)]">
        Already have one?{" "}
        <Link href="/login" className="text-[color:var(--accent)]">
          Sign in
        </Link>
      </p>
    </main>
  );
}
