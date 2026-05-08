"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { cn } from "@/lib/cn";
import { welcomeSteps } from "./welcome-steps";

interface WelcomeCarouselProps {
  /** Server action that marks onboarding complete and redirects. */
  finish: () => Promise<void>;
}

export function WelcomeCarousel({ finish }: WelcomeCarouselProps) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const lastIndex = welcomeSteps.length - 1;
  const stepRef = useRef<HTMLDivElement | null>(null);

  const go = useCallback(
    (n: number) => setIndex(Math.max(0, Math.min(lastIndex, n))),
    [lastIndex],
  );

  const next = useCallback(() => {
    if (index < lastIndex) {
      go(index + 1);
    } else {
      startTransition(async () => {
        await finish();
      });
    }
  }, [index, lastIndex, go, finish]);

  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const skip = () => {
    startTransition(async () => {
      await finish();
    });
  };

  const step = welcomeSteps[index];

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0 || pending}
          aria-label="Previous step"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-opacity",
            index === 0 && "pointer-events-none opacity-0",
          )}
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className="text-[12px] font-medium text-text-muted underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>

      <div ref={stepRef} className="flex flex-1 flex-col px-5 pb-8 pt-6">
        <div
          key={step.id}
          className="motion-safe:animate-[fade-in_350ms_var(--ease-screen)]"
        >
          {step.visual}
          <div className="mt-8 space-y-2">
            <Eyebrow>{step.eyebrow}</Eyebrow>
            <h1 className="font-display text-[30px] font-semibold leading-tight text-text-primary">
              {step.title}
            </h1>
            <p
              className="text-[15px] leading-relaxed text-text-secondary"
              dangerouslySetInnerHTML={{ __html: step.body }}
            />
          </div>
        </div>

        <div className="mt-auto space-y-5 pt-8">
          <div
            className="flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Onboarding step"
          >
            {welcomeSteps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-label={`Go to step ${i + 1}`}
                aria-selected={i === index}
                onClick={() => go(i)}
                disabled={pending}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={next}
            disabled={pending}
            trailingIcon={
              index < lastIndex ? <ChevronRight size={18} strokeWidth={2} /> : null
            }
          >
            {index < lastIndex ? "Continue" : "Start exploring"}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
