/** A 9:41 mock with signal/wifi/battery glyphs at 12px. Replace with
 *  native status in the PWA / native shell (see design doc §3.2). */
export function StatusBar() {
  return (
    <div className="flex h-11 items-center justify-between px-6 text-[12px] font-semibold text-text-primary">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal */}
        <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
          <rect x="0"  y="6" width="2.5" height="4" rx="0.5" fill="currentColor" />
          <rect x="4"  y="4" width="2.5" height="6" rx="0.5" fill="currentColor" />
          <rect x="8"  y="2" width="2.5" height="8" rx="0.5" fill="currentColor" />
          <rect x="12" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" />
        </svg>
        {/* Wi-Fi */}
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
          <path d="M7 9 L8 7.5 C7.5 7 6.5 7 6 7.5 Z" fill="currentColor" />
          <path d="M3 5 C5 3 9 3 11 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M1 3 C4 0 10 0 13 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <svg width="24" height="11" viewBox="0 0 24 11" aria-hidden="true">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2"   y="2"   width="16" height="7"  rx="1.5" fill="currentColor" />
          <rect x="21"  y="3.5" width="2"  height="4"  rx="1"   fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
