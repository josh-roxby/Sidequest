import { redirect } from "next/navigation";
import { WelcomeCarousel } from "@/components/onboarding/WelcomeCarousel";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { getCurrentUser } from "@/lib/auth";
import { isAuthDisabled } from "@/lib/env";
import { completeOnboarding } from "./actions";

export default async function WelcomePage() {
  const user = await getCurrentUser();

  // In auth-disabled preview mode the carousel is just a viewable
  // screen — no redirects either way.
  if (!isAuthDisabled()) {
    if (!user) redirect("/login");
    if (user.user_metadata?.onboarding_completed) redirect("/home");
  }

  return (
    <PhoneFrame>
      <WelcomeCarousel finish={completeOnboarding} />
    </PhoneFrame>
  );
}
