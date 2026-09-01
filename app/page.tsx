import Link from "next/link";
import { Action } from "@/components/primitives/Action";
import { Data, Label } from "@/components/primitives/Text";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function Landing() {
  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + var(--s-8))",
                 paddingBottom: "calc(env(safe-area-inset-bottom) + var(--s-8))" }}>
        <Label>Ireland · Co. Clare</Label>
        <h1 className="t-display mt-3 text-ink">
          Pick how long you have.
        </h1>
        <p className="t-body mt-3 max-w-[34ch] text-stone">
          Get a walking loop anchored to a ringfort, a holy well, a mill, a
          lough shore. Every café and pub on the map is independent. Every
          place can tell you what its name means.
        </p>

        <div className="mt-8 flex flex-col gap-px border border-rule bg-rule">
          {[
            ["Trot", "15 MIN"], ["Stroll", "45 MIN"],
            ["Sidequest", "1H 30"], ["Adventure", "3H 00"],
          ].map(([label, dur]) => (
            <div key={label} className="flex items-center justify-between bg-surface px-3 py-2.5">
              <span className="t-small font-semibold text-ink">{label}</span>
              <Data className="text-stone">{dur}</Data>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Link href="/start" className="block"><Action>Start walking</Action></Link>
          <p className="t-data text-center text-[10px] uppercase text-mute">
            No account needed to look around
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
