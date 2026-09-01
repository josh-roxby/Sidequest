import Link from "next/link";
import { Action } from "@/components/primitives/Action";
import { Field } from "@/components/primitives/Field";
import { Label } from "@/components/primitives/Text";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <PhoneFrame>
      <form action={signup} className="flex min-h-dvh flex-col px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + var(--s-8))",
                 paddingBottom: "calc(env(safe-area-inset-bottom) + var(--s-8))" }}>
        <Label>Ireland</Label>
        <h1 className="t-h1 mt-2.5 text-ink">Create an account</h1>

        <div className="mt-6 flex flex-col gap-4">
          {/* The schema trigger already reads display_name from user metadata;
              this is the field it was waiting for. */}
          <Field label="Name" name="display_name" required autoComplete="name" />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required minLength={8}
            autoComplete="new-password" hint="At least 8 characters" error={params.error} />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Action type="submit">Create account</Action>
          <p className="t-small text-center text-stone">
            Already have one? <Link href="/login" className="font-semibold text-ink underline">Sign in</Link>
          </p>
        </div>
      </form>
    </PhoneFrame>
  );
}
