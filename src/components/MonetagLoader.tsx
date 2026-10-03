import { useEffect } from "react";

const IFRAME_ID = "monetag-sandbox";

// The ad scripts run inside a sandboxed, cross-origin iframe. `allow-scripts`
// without `allow-same-origin` gives them an opaque origin, so they cannot read
// the parent DOM, localStorage/sessionStorage (session tokens), cookies, or
// the clipboard — even on pages that hold credentials or config strings.
const SANDBOX_HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>(function(s){s.dataset.zone='10980744';s.src='https://al5sm.com/tag.min.js';})(document.body.appendChild(document.createElement('script')))<\/script>
<script>(function(s){s.dataset.zone='10693574';s.src='https://al5sm.com/tag.min.js';})(document.body.appendChild(document.createElement('script')))<\/script>
<script src="https://5gvci.com/act/files/tag.min.js?z=10693586" data-cfasync="false" async><\/script>
<script src="https://5gvci.com/act/files/tag.min.js?z=10693577" data-cfasync="false" async><\/script>
</body></html>`;

export function MonetagLoader() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (document.getElementById(IFRAME_ID)) return;

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
