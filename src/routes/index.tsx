import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap, Lock, Globe, ArrowRight, CheckCircle2, ShieldCheck, Wifi, Server, Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISPS } from "@/lib/plans";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "coreVPN — Free & Premium VLESS Configs for Sri Lanka" },
      { name: "description", content: "Free VLESS configs plus premium monthly plans for Dialog, Hutch, Mobitel, SLT and Airtel. Unlock 724 Zoom and social media packages." },
      { property: "og:title", content: "coreVPN — Free & Premium VLESS Configs" },
      { property: "og:description", content: "Fast, secure VLESS configs tuned for every Sri Lankan ISP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TICKER = [
  "100% WORKING CONFIGS",
  "INSTANT DELIVERY",
  "ALL SRI LANKAN ISPS",
  "NO SPEED LIMIT",
  "24/7 SUPPORT",
  "99.9% UPTIME",
  "SECURE TLS TUNNEL",
];

function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div
          className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/25 blur-[120px] animate-glow-pulse"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-primary-glow/20 blur-[130px] animate-glow-pulse"
          aria-hidden
        />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Sri Lanka's free VLESS config hub
              </div>

              <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Everything VLESS.
                <br />
                <span className="text-neon">One Trusted Core.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
                Free configs and premium monthly plans tuned for Dialog, Hutch, Mobitel, SLT and
                Airtel — unlock 724 Zoom and social media packages with a secure, fast tunnel.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
                  <Link to="/configs">Get Free Configs <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/v2ray">View V2Ray Plans</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Genuine configs</span>
                <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Secure checkout</span>
                <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />24/7 support</span>
              </div>
            </div>

            {/* Floating ISP orbit */}
            <div className="relative hidden h-[420px] lg:block">
              <div className="absolute inset-8 rounded-full border border-border/60" />
              <div className="absolute inset-20 rounded-full border border-border/40" />
              <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-gradient-primary shadow-glow">
                <Wifi className="h-12 w-12 text-primary-foreground" />
              </div>
              {ISPS.map((isp, i) => {
                const angle = (i / ISPS.length) * Math.PI * 2 - Math.PI / 2;
                const r = 168;
                return (
                  <div
                    key={isp}
                    className="absolute animate-float rounded-2xl border border-border/70 bg-card/80 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider backdrop-blur"
                    style={{
                      left: `calc(50% + ${Math.cos(angle) * r}px)`,
                      top: `calc(50% + ${Math.sin(angle) * r}px)`,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    {isp}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Neon ticker */}
      <div className="relative border-y border-border/60 bg-card/40 py-3">
        <div className="marquee-track gap-8">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex shrink-0 items-center gap-8 font-display text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {t}
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-center font-display text-3xl font-black uppercase tracking-tight md:text-4xl">
          Everything you need. <span className="text-gradient">In one place.</span>
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Blazing fast", body: "Hand-picked low-latency servers tuned for Sri Lankan ISP packages." },
            { icon: Lock, title: "Encrypted", body: "VLESS over TLS keeps your traffic private. No logs, no tracking." },
            { icon: Globe, title: "ISP-aware", body: "Separate configs for Dialog, Hutch, Mobitel, SLT and Airtel packages." },
          ].map((f) => (
            <div key={f.title} className="neon-card group p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary shadow-glow">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-wide">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service cards */}
      <section className="container mx-auto px-4 pb-4">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: Server, title: "V2Ray Services", sub: "Ultra-fast, reliable secure connections", to: "/v2ray", cta: "View plans" },
            { icon: Wifi, title: "Free Configs", sub: "Fresh VLESS links for every ISP", to: "/configs", cta: "Browse free" },
            { icon: ShieldCheck, title: "Setup Guides", sub: "Step-by-step for v2rayNG, NekoBox & more", to: "/setup", cta: "Learn setup" },
            { icon: Gauge, title: "Premium Plans", sub: "100 GB / 200 GB / Unlimited monthly", to: "/plans", cta: "Get premium" },
          ].map((c) => (
            <div key={c.title} className="neon-card overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <c.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-wide">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
              <Button variant="outline" size="sm" className="mt-6" asChild>
                <Link to={c.to}>{c.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Paid plan strip */}
      <section className="container mx-auto px-4 py-20">
        <div className="neon-card overflow-hidden p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-warning-foreground">Premium</div>
              <h2 className="mt-4 font-display text-3xl font-black uppercase md:text-4xl">Upgrade to coreVPN <span className="text-gradient">Pro</span></h2>
              <p className="mt-3 text-muted-foreground">
                Unlimited config downloads, priority new releases, exclusive premium-only configs and early access to beta tools.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Unlimited daily configs", "Premium-only ultra-fast servers", "Priority support", "Early access to new packages"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">From</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-5xl font-black">LKR 200</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <Button size="lg" className="mt-6 w-full bg-gradient-primary text-primary-foreground shadow-glow" asChild>
                <Link to="/plans">Get Paid Plan</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Basic 100 GB · Standard 200 GB · Premium unlimited — start now, pay within your deadline.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
