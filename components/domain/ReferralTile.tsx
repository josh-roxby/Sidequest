"use client";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Data, Label } from "@/components/primitives/Text";

/** Share tile. The code is a placeholder until accounts are real.
 *
 *  Copy uses a hidden input and select plus execCommand as the fallback,
 *  because navigator.clipboard is unavailable on a plain-HTTP origin and in
 *  some in-app browsers, which is exactly where a shared link gets opened. */
export function ReferralTile({ code = "SQ-CLARE-8412" }: { code?: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  const link = `https://sidequest.ie/join/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("input");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      el.remove();
    }
    setState("copied");
    setTimeout(() => setState("idle"), 2000);
  }

  async function share() {
    if (!navigator.share) { copy(); return; }
    try {
      await navigator.share({
        title: "Side Quest",
        text: "Walks around Ireland worth taking. No chains, real places.",
        url: link,
      });
    } catch { /* dismissed */ }
  }

  return (
    <div
      className="border border-dashed border-field p-3.5"
      style={{ borderRadius: "var(--r-md)", background: "var(--field-soft)" }}
    >
      <Label style={{ color: "var(--field)" }}>Bring someone with you</Label>
      <p className="t-small mt-1.5 text-ink">
        They get their first Adventure unlocked. You get a badge when they finish it.
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <Data className="flex-1 truncate text-ink">{code}</Data>
        <Button onClick={copy}>{state === "copied" ? "Copied" : "Copy"}</Button>
        <Button tone="solid" onClick={share}>Share</Button>
      </div>
    </div>
  );
}
