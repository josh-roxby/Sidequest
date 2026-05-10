/** Blue current-position dot with a soft halo, used on the illustrated
 *  map. Positioned absolutely by the parent. Static for now; once real
 *  GPS is wired the position is driven by useLiveLocation. */
export function LiveDot() {
  return (
    <span className="relative inline-flex h-3.5 w-3.5">
      <span className="absolute inset-0 -m-2 rounded-full bg-[#4faaff]/30" />
      <span className="absolute inset-0 -m-1 rounded-full bg-[#4faaff]/40" />
      <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-[2px] border-white bg-[#4faaff] shadow-[0_0_10px_rgba(79,170,255,0.7)]" />
    </span>
  );
}
