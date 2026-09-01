import Link from "next/link";
import { Action } from "@/components/primitives/Action";
import { Field } from "@/components/primitives/Field";
import { Label } from "@/components/primitives/Text";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { login } from "./actions";

/** Styled, reachable directly, and required by nothing. Auth is off for this
 *  phase, so no route redirects here. Switching it on is one env var and no
 *  screen changes. docs/ux-loops.md §J. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <PhoneFrame>
      <form action={login} className="flex min-h-dvh flex-col px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + var(--s-8))",
                 paddingBottom: "calc(env(safe-area-inset-bottom) + var(--s-8))" }}>
        <Label>Welcome back</Label>
        <h1 className="t-h1 mt-2.5 text-ink">Sign in</h1>

        <input type="hidden" name="next" value={params.next ?? "/map"} />
        <div className="mt-6 flex flex-col gap-4">
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required minLength={8}
            autoComplete="current-password" error={params.error} />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Action type="submit">Sign in</Action>
          <p className="t-small text-center text-stone">
            New here? <Link href="/signup" className="font-semibold text-ink underline">Create an account</Link>
          </p>
        </div>
      </form>
    </PhoneFrame>
  );
}
