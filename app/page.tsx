import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CompassMark } from "@/components/marks/CompassMark";
import { Landscape } from "@/components/illustrations/Landscape";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { getCurrentUser } from "@/lib/auth";
import { isAuthDisabled } from "@/lib/env";

export default async function LandingPage() {
  const user = await getCurrentUser();
  // Only auto-redirect signed-in real users. In auth-disabled preview
  // mode we want the landing page to actually render so it can be
  // reviewed.
  if (user && !isAuthDisabled()) {
    redirect(user.user_metadata?.onboarding_completed ? "/home" : "/welcome");
  }

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col">
        <div className="relative h-[42dvh] w-full overflow-hidden">
          <Landscape className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
        </div>

        <div className="flex flex-1 flex-col px-6 pb-10 pt-4">
          <div className="flex items-center gap-3">
            <CompassMark size={48} />
            <div>
              <Eyebrow>Side Quest</Eyebrow>
              <p className="font-display text-[22px] font-semibold leading-tight text-text-primary">
                Every walk holds a story.
              </p>
            </div>
          </div>

          <p className="mt-5 text-[14px] leading-relaxed text-text-secondary">
            A peaceful walking companion. Drop a pin, take a wander, and turn
            ordinary streets into a quiet adventure.
          </p>

          <div className="mt-auto space-y-2 pt-8">
            <Link href={isAuthDisabled() ? "/home" : "/signup"} className="block">
              <Button variant="primary" fullWidth>
                {isAuthDisabled() ? "Open the app (preview)" : "Begin a journey"}
              </Button>
            </Link>
            {isAuthDisabled() ? null : (
              <Link href="/login" className="block">
                <Button variant="secondary" fullWidth>
                  I already have an account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
