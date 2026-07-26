import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AdblockGuard() {
  const [blocked, setBlocked] = useState(false);
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    let cancelled = false;
    // Admins are exempt from the adblock wall
    if (loading || isAdmin) {
      setBlocked(false);
      return;
    }

    const check = async () => {
      let detected = false;

      // Method 1: bait element with adblock-targeted classes
      const bait = document.createElement("div");
      bait.className =
        "adsbox ad-banner ad-placement adsbygoogle ad-unit advertisement";
      bait.style.cssText =
        "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;";
      bait.innerHTML = "&nbsp;";
      document.body.appendChild(bait);

      await new Promise((r) => setTimeout(r, 120));

      const style = window.getComputedStyle(bait);
      if (
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0 ||
        style.display === "none" ||
        style.visibility === "hidden"
      ) {
        detected = true;
      }
      bait.remove();

      // Method 2: try fetching a known ad script URL
      if (!detected) {
        try {
          await fetch(
            "https://al5sm.com/tag.min.js?_=" + Date.now(),
            { method: "HEAD", mode: "no-cors", cache: "no-store" },
          );
        } catch {
          detected = true;
        }
      }

      // Method 3: monetag script presence
      if (!detected) {
        const monetagLoaded = !!document.querySelector(
          'script[src*="al5sm.com"]',
        );
        if (!monetagLoaded) detected = true;
      }

      if (!cancelled) setBlocked(detected);
    };

    // delay so monetag script gets a chance to load first
    const t = setTimeout(check, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="font-display text-2xl font-bold">Ad Blocker Detected</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          coreVPN is free thanks to ads. Please disable your ad blocker (or
          whitelist this site) and reload the page to continue.
        </p>
        <ol className="mt-5 space-y-2 text-left text-sm text-muted-foreground">
          <li>1. Click your ad blocker icon in the browser toolbar.</li>
          <li>2. Disable it for this site / add to whitelist.</li>
          <li>3. Reload the page.</li>
        </ol>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          I disabled it — Reload
        </button>
      </div>
    </div>
  );
}
