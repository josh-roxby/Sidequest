"use client";
import { useEffect } from "react";

/** Registers the service worker after load, so it never competes with the
 *  first paint. Failure is silent by design: the app works perfectly without
 *  one, and a registration error is not something a walker can act on. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
