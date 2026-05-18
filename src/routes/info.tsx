import { createFileRoute } from "@tanstack/react-router";
import { Shield, Network, Lock, Zap } from "lucide-react";

export const Route = createFileRoute("/info")({
  component: Info,
  head: () => ({ meta: [{ title: "Info — coreVPN" }, { name: "description", content: "Learn what VLESS is and how coreVPN works." }] }),
});

function Info() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <div className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">Information</div>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">What is this technology?</h1>
        <p className="mt-4 text-lg text-muted-foreground">A quick guide to VLESS, V2Ray and how coreVPN delivers free configs.</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          { icon: Network, title: "What is VLESS?", body: "VLESS is a modern, lightweight proxy protocol from the V2Ray/XRay ecosystem. It carries your internet traffic through an encrypted tunnel, hiding your real IP and bypassing ISP throttling or restrictions." },
          { icon: Shield, title: "Why use VPN configs?", body: "Sri Lankan mobile packages like 724 Zoom or social media bundles only allow specific traffic. VLESS configs make all your traffic look like permitted traffic, so you can use the full internet on a cheap package." },
          { icon: Lock, title: "Is it safe?", body: "Yes. VLESS uses TLS encryption end-to-end. coreVPN does not log your browsing activity. We only log when you sign in and which configs you download — purely for service health." },
          { icon: Zap, title: "How fast is it?", body: "Speed depends on your ISP and the server you pick. Each ISP has dedicated configs in our library tuned for low latency over that carrier's network." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary">
              <c.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border/60 bg-gradient-hero p-8">
        <h2 className="font-display text-2xl font-bold">Supported apps</h2>
        <p className="mt-2 text-sm text-muted-foreground">VLESS configs from coreVPN work in any modern V2Ray-compatible client.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["v2rayNG (Android)","NekoBox (Android)","Streisand (iOS)","V2Box (iOS)","Hiddify (Desktop)","Nekoray (Desktop)","Clash Meta","sing-box"].map((a) => (
            <div key={a} className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-center text-sm font-medium">{a}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
