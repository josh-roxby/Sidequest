import Link from "next/link";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CompassMark } from "@/components/marks/CompassMark";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col px-6 py-10">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <CompassMark size={56} />
            <Eyebrow>Begin a journey</Eyebrow>
            <h1 className="font-display text-[28px] font-semibold text-text-primary">
              Create an account
            </h1>
          </div>

          {params.sent ? (
            <Card variant="lg" hero>
              <p className="text-[14px] text-text-primary">
                Check your inbox for a confirmation link, then sign in.
              </p>
            </Card>
          ) : (
            <Card variant="lg" hero>
              <form action={signup} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-[13px]">
                  <span className="text-text-secondary">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="rounded-2xl border border-border bg-card px-3 py-3 text-[14px] text-text-primary outline-none focus:border-primary-light"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[13px]">
                  <span className="text-text-secondary">Password</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="rounded-2xl border border-border bg-card px-3 py-3 text-[14px] text-text-primary outline-none focus:border-primary-light"
                  />
                </label>
                {params.error ? (
                  <p className="text-[12px] text-[color:#B85542]">{params.error}</p>
                ) : null}
                <Button type="submit" variant="primary" fullWidth className="mt-1">
                  Create account
                </Button>
              </form>
            </Card>
          )}

          <p className="mt-6 text-center text-[13px] text-text-secondary">
            Already have one?{" "}
            <Link href="/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
