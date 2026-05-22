import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

// Routes that handle credentials, session tokens, or copyable VPN config
// strings. Third-party ad scripts must NEVER load on these pages.
const BLOCKED_PREFIXES = ["/auth", "/configs", "/admin", "/profile", "/setup"];

export function MonetagLoader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onSensitive = BLOCKED_PREFIXES.some((p) => pathname.startsWith(p));
    if (onSensitive) return;

    if (document.querySelector('script[data-monetag="1"]')) return;

    const s = document.createElement("script");
    s.dataset.monetag = "1";
    s.dataset.zone = "10980744";
    s.src = "https://al5sm.com/tag.min.js";
    s.async = true;
    document.body.appendChild(s);
  }, [pathname]);

  return null;
}
