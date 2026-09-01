import Link from "next/link";
import { Action } from "@/components/primitives/Action";
import { Mark, type MarkName } from "@/components/primitives/Marks";
import { Data, Label } from "@/components/primitives/Text";
import { TopoBackdrop } from "@/components/domain/TopoBackdrop";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

const TIERS: { mark: MarkName; label: string; time: string }[] = [
  { mark: "trot", label: "Trot", time: "15 MIN" },
  { mark: "stroll", label: "Stroll", time: "45 MIN" },
  { mark: "sidequest", label: "Sidequest", time: "1H 30" },
  { mark: "adventure", label: "Adventure", time: "3H 00" },
];

const DRAWS: { mark: MarkName; title: string; line: string }[] = [
  { mark: "badge", title: "Collect", line: "Ringforts, holy wells, mills. Sets that fill." },
  { mark: "tale", title: "Learn", line: "What the name means. Who built it. Sourced." },
  { mark: "map", title: "Uncover", line: "Fog clears as you walk. Townland by townland." },
  { mark: "table", title: "Local only", line: "Every cafe and pub here is somebody's own." },
];

export default function Landing() {
  return (
    <PhoneFrame>
      <div className="relative min-h-dvh overflow-hidden">
        <TopoBackdrop />

        <div
          className="relative flex min-h-dvh flex-col px-4"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
            paddingBottom: "calc(env(safe-area-inset-bottom) + var(--s-6))",
          }}
        >
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center bg-field"
                style={{ borderRadius: "2px 22px 2px 22px", transform: "rotate(-45deg)" }} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
                Side Quest
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href="/login"
                className="border border-rule bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-stone"
                style={{ borderRadius: "var(--r-full)" }}>
                Sign in
              </Link>
              <Link href="/signup"
                className="border border-field bg-field px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-field-ink"
                style={{ borderRadius: "var(--r-full)" }}>
                Create account
              </Link>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-8">
            <Label>Ireland · Co. Clare and counting</Label>
            <h1 className="t-display mt-3 text-ink">
              Got an hour?<br />Go somewhere<br />you have not been.
            </h1>
            <p className="t-body mt-4 max-w-[32ch] text-stone">
              Tell it how long you have. It builds you a walk from where you are
              standing, around something worth knowing about.
            </p>

            <div className="mt-6 grid grid-cols-4 gap-1.5">
              {TIERS.map((t) => (
                <div key={t.label}
                  className="flex flex-col items-center gap-1 border border-rule bg-surface px-1 py-2.5 text-stone"
                  style={{ borderRadius: "var(--r-sm)" }}>
                  <Mark name={t.mark} size={16} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.05em] text-ink">
                    {t.label}
                  </span>
                  <Data className="text-[9px]">{t.time}</Data>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {DRAWS.map((d) => (
                <div key={d.title} className="border border-rule bg-surface p-3"
                  style={{ borderRadius: "var(--r-md)" }}>
                  <span className="flex h-8 w-8 items-center justify-center border border-field bg-field-soft text-field"
                    style={{ borderRadius: "var(--r-full)" }}>
                    <Mark name={d.mark} size={16} />
                  </span>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink">
                    {d.title}
                  </p>
                  <p className="t-small mt-0.5 leading-snug text-stone">{d.line}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/signup" className="block"><Action>Create an account</Action></Link>
            <Link href="/home" className="block">
              <Action tone="outline">Have a look around first</Action>
            </Link>
            <p className="t-data mt-1 text-center text-[10px] uppercase text-mute">
              Free. No chains. No streaks.
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
