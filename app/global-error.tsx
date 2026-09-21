"use client";
import { useEffect } from "react";

/** The last catch. This one replaces the whole document, layout included, so
 *  it cannot use anything from the app shell and has to carry its own markup.
 *  Inline styles rather than tokens for the same reason: if the failure was in
 *  the stylesheet, a class name here is a second blank screen. */
export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[app]", error); }, [error]);

  return (
    <html lang="en-IE">
      <body style={{
        margin: 0, minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
        textAlign: "center", background: "#f2f0ea", color: "#1a1a17",
        fontFamily: "system-ui, sans-serif",
      }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Side Quest stopped</h1>
        <p style={{ margin: 0, maxWidth: "36ch", lineHeight: 1.5, color: "#5b574e" }}>
          Something went wrong. The ground you have walked is saved on this
          device and is not affected.
        </p>
        <button type="button" onClick={reset} style={{
          border: "1px solid #1a1a17", background: "#1a1a17", color: "#f2f0ea",
          borderRadius: 6, padding: "10px 18px", font: "inherit",
        }}>
          Try again
        </button>
      </body>
    </html>
  );
}
