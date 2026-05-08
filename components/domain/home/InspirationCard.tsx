import { Card } from "@/components/primitives/Card";
import { Eyebrow } from "@/components/primitives/Eyebrow";

interface InspirationCardProps {
  quote: string;
  attribution?: string;
}

/** "Today's Inspiration" card. Italic Fraunces quote with a small
 *  lavender flower glyph as the visual anchor. See design doc §5.1. */
export function InspirationCard({ quote, attribution }: InspirationCardProps) {
  return (
    <Card variant="soft">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender-soft">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="2" fill="var(--gold-deep)" />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="12"
                cy="6"
                rx="2.4"
                ry="3.6"
                fill="var(--lavender-deep)"
                transform={`rotate(${a} 12 12)`}
              />
            ))}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow className="mb-1.5">Today&apos;s Inspiration</Eyebrow>
          <p className="font-display text-[15px] italic leading-snug text-text-primary">
            “{quote}”
          </p>
          {attribution ? (
            <p className="mt-1 text-[11px] text-text-muted">— {attribution}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
