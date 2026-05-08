import { Search } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { ScreenContainer } from "@/components/shell/ScreenContainer";

export default function JournalScreen() {
  return (
    <ScreenContainer>
      <div className="flex items-end justify-between py-4">
        <div>
          <Eyebrow>Journal</Eyebrow>
          <h1 className="font-display text-[26px] font-semibold text-text-primary">
            A book of your wanders
          </h1>
        </div>
        <button
          type="button"
          aria-label="Search journal"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-pop"
        >
          <Search size={17} strokeWidth={1.8} className="text-text-secondary" />
        </button>
      </div>

      <Card variant="soft">
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-2">
            <p className="font-display text-[18px] font-semibold text-text-primary">0</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Discoveries
            </p>
          </div>
          <div className="px-2">
            <p className="font-display text-[18px] font-semibold text-text-primary">0</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Walks
            </p>
          </div>
          <div className="px-2">
            <p className="font-display text-[18px] font-semibold text-text-primary">0.0</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Kilometres
            </p>
          </div>
        </div>
      </Card>

      <Card variant="soft" className="mt-4">
        <p className="text-[13px] text-text-secondary">
          Discovery grid lands here once journal entries exist. See{" "}
          <code className="font-mono">TODO.md</code>.
        </p>
      </Card>
    </ScreenContainer>
  );
}
