/** Mobile: full bleed. Desktop ≥768px: a 400px column on paper with a hairline
 *  border, so the mobile design can be reviewed at a desk without pretending
 *  to be a responsive web app. No phone silhouette, no drop shadow — this is
 *  a viewport guide, not a device mockup. */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper md:flex md:justify-center md:py-8">
      <div className="relative mx-auto min-h-dvh w-full bg-paper md:min-h-0 md:h-[820px] md:w-[400px] md:overflow-hidden md:border md:border-ink">
        {children}
      </div>
    </div>
  );
}
