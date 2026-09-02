/** Page body. The bottom padding clears the thumb block (114px + gutter)
 *  plus breathing room, so content is never trapped underneath it. */
export function Screen({
  children,
  docked = false,
}: {
  children: React.ReactNode;
  /** Set when the screen carries a <ThumbAction>, so content clears the docked
   *  bar as well as the nav button. */
  docked?: boolean;
}) {
  return (
    <div
      className="no-bar h-full overflow-y-auto overscroll-contain px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
        paddingBottom: docked
          ? "calc(var(--tile) + var(--s-8) + env(safe-area-inset-bottom))"
          : "calc(var(--tile) + var(--s-6) + env(safe-area-inset-bottom))",
      }}
    >
      {children}
    </div>
  );
}

export function ScreenHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <header className="pb-4">
      <p className="t-label text-stone">{label}</p>
      <h1 className="t-h1 mt-1.5 text-ink">{title}</h1>
      {sub ? <p className="t-small mt-1.5 text-stone">{sub}</p> : null}
    </header>
  );
}
