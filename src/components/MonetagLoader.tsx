import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

// Routes that handle credentials, session tokens, or copyable VPN config
// strings. Third-party ad scripts must NEVER load on these pages.
const BLOCKED_PREFIXES = ["/auth", "/configs", "/admin", "/profile", "/setup"];

const IFRAME_ID = "monetag-sandbox";

// The ad script runs inside a sandboxed, cross-origin iframe. `allow-scripts`
// without `allow-same-origin` gives it an opaque origin, so it cannot read the
// parent DOM, localStorage/sessionStorage (session tokens), cookies, or the
// clipboard.
const SANDBOX_HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>(function(s){s.dataset.zone='10980744';s.src='https://al5sm.com/tag.min.js';})(document.body.appendChild(document.createElement('script')))<\/script>
</body></html>`;

export function MonetagLoader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const existing = document.getElementById(IFRAME_ID);
    const onSensitive = BLOCKED_PREFIXES.some((p) => pathname.startsWith(p));

    if (onSensitive) {
      // Tear the ad frame down entirely when entering a sensitive page.
      existing?.remove();
      return;
    }

    if (existing) return;

    const frame = document.createElement("iframe");
    frame.id = IFRAME_ID;
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("title", "advertisement");
    frame.style.cssText =
      "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;";
    frame.srcdoc = SANDBOX_HTML;
    document.body.appendChild(frame);
  }, [pathname]);

  return null;
}
