import { Settings } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { ShieldBadge } from "@/components/marks/ShieldBadge";
import { ScreenContainer } from "@/components/shell/ScreenContainer";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileScreen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Wanderer";

  return (
    <ScreenContainer>
      <div className="flex items-center justify-between py-4">
        <div>
          <Eyebrow>Profile</Eyebrow>
          <h1 className="font-display text-[26px] font-semibold text-text-primary">
            Your trail
          </h1>
        </div>
        <button
          type="button"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop"
        >
          <Settings size={17} strokeWidth={1.8} className="text-text-secondary" />
        </button>
      </div>

      <Card variant="lg" hero>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage to-primary-light text-lg font-semibold text-white shadow-pop">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-semibold leading-tight text-text-primary">
              {displayName}
            </h2>
            <p className="text-[13px] text-text-secondary">Wanderer · Level 7</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <ProgressBar value={0.62} label="Level progress" />
          <p className="text-[11px] text-text-secondary">620 / 1,000 XP to Level 8</p>
        </div>
      </Card>

      <div className="mt-6 flex items-end justify-between">
        <Eyebrow>Badges</Eyebrow>
        <p className="text-[11px] text-text-secondary">0 / 32 collected</p>
      </div>
      <Card variant="soft" className="mt-2">
        <div className="grid grid-cols-3 gap-3 place-items-center">
          {(["leaf", "compass", "flower", "tree", "star", "door"] as const).map(
            (motif) => (
              <ShieldBadge key={motif} motif={motif} tone="sage" locked />
            ),
          )}
        </div>
      </Card>

      <Eyebrow className="mt-6">Lifetime Stats</Eyebrow>
      <Card variant="soft" className="mt-2 divide-y divide-border">
        {[
          { label: "Quests completed", value: "0" },
          { label: "Distance walked", value: "0 km" },
          { label: "XP earned", value: "0" },
          { label: "Discoveries logged", value: "0" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <p className="text-[13px] text-text-secondary">{row.label}</p>
            <p className="font-display text-[16px] font-semibold text-text-primary">
              {row.value}
            </p>
          </div>
        ))}
      </Card>

      <form action="/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="w-full rounded-2xl border border-border bg-[rgba(255,255,255,0.7)] px-5 py-3 text-sm font-medium text-text-primary"
        >
          Sign out
        </button>
      </form>
    </ScreenContainer>
  );
}
