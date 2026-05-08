import { redirect } from "next/navigation";
import { WelcomeCarousel } from "@/components/onboarding/WelcomeCarousel";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.onboarding_completed) redirect("/home");

  return (
    <PhoneFrame>
      <WelcomeCarousel finish={completeOnboarding} />
    </PhoneFrame>
  );
}
