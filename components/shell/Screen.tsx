/** Page body. The bottom padding clears the thumb block (114px + gutter)
 *  plus breathing room, so content is never trapped underneath it. */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + var(--s-4))",
        paddingBottom: "calc(var(--block) + var(--s-8) + env(safe-area-inset-bottom))",
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
