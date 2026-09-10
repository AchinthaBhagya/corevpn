import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Clock, Server, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISPS, type Isp, formatLKR } from "@/lib/plans";

export const Route = createFileRoute("/v2ray")({
  component: V2RayPage,
  head: () => ({
    meta: [
      { title: "V2Ray Plans for Dialog, SLT, Hutch, Mobitel & Airtel — coreVPN" },
      { name: "description", content: "Fast, secure V2Ray / VLESS plans in Sri Lanka. Pick your ISP and package — 100 GB, 200 GB or unlimited from LKR 200 per month." },
      { property: "og:title", content: "V2Ray Plans — coreVPN" },
      { property: "og:description", content: "Fast, secure V2Ray / VLESS plans for every Sri Lankan ISP, from LKR 200 per month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Offer = {
  name: string;
  server: string;
  validity: string;
  price: number;
  badge?: string;
  features: string[];
};

const OFFERS: Record<Isp, Offer[]> = {
  Dialog: [
    { name: "DIALOG ZOOM (724 / 4G)", server: "SG SERVER", validity: "1 Month", price: 200, features: ["No speed limit", "Works with 724 Zoom", "Unlimited device login", "Prepaid & postpaid"] },
    { name: "DIALOG SOCIAL MEDIA", server: "SG SERVER", validity: "1 Month", price: 300, badge: "Popular", features: ["200 GB data", "Social bundle friendly", "Low ping routing", "Unlimited device login"] },
    { name: "DIALOG UNLIMITED", server: "SG SERVER (LK IP)", validity: "1 Month", price: 500, features: ["Unlimited data", "Best for live streamers", "Priority support", "Fastest node pool"] },
  ],
  Hutch: [
    { name: "HUTCH ZOOM (724)", server: "SG SERVER", validity: "1 Month", price: 200, features: ["No speed limit", "Works with 724 Zoom", "Unlimited device login", "Stable night speeds"] },
    { name: "HUTCH SOCIAL MEDIA", server: "SG SERVER", validity: "1 Month", price: 300, badge: "Popular", features: ["200 GB data", "Social bundle friendly", "Low ping routing", "Unlimited device login"] },
    { name: "HUTCH UNLIMITED", server: "SG SERVER (LK IP)", validity: "1 Month", price: 500, features: ["Unlimited data", "Best for live streamers", "Priority support", "Fastest node pool"] },
  ],
  Mobitel: [
    { name: "MOBITEL ZOOM (724)", server: "SG SERVER", validity: "1 Month", price: 200, features: ["No speed limit", "Works with 724 Zoom", "Unlimited device login", "Prepaid & postpaid"] },
    { name: "MOBITEL SOCIAL MEDIA", server: "SG SERVER", validity: "1 Month", price: 300, badge: "Popular", features: ["200 GB data", "Social bundle friendly", "Low ping routing", "Unlimited device login"] },
    { name: "MOBITEL UNLIMITED", server: "SG SERVER (LK IP)", validity: "1 Month", price: 500, features: ["Unlimited data", "Best for live streamers", "Priority support", "Fastest node pool"] },
  ],
  SLT: [
    { name: "SLT ZOOM (Fibre, 4G, ADSL)", server: "SG SERVER", validity: "1 Month", price: 200, features: ["No speed limit", "Fibre / 4G / ADSL", "Unlimited device login", "Works with Zoom packages"] },
    { name: "SLT NETFLIX (Fibre, 4G)", server: "SG SERVER", validity: "1 Month", price: 300, badge: "Popular", features: ["200 GB data", "Streaming optimised", "Unlimited device login", "Low ping routing"] },
    { name: "SLT UNLIMITED (LK IP)", server: "SG SERVER (LK IP)", validity: "1 Month", price: 500, features: ["Unlimited data", "Best for live streamers", "Priority support", "Sri Lankan IP"] },
  ],
  Airtel: [
    { name: "AIRTEL ZOOM (724)", server: "SG SERVER", validity: "1 Month", price: 200, features: ["No speed limit", "Works with 724 Zoom", "Unlimited device login", "Prepaid friendly"] },
    { name: "AIRTEL SOCIAL MEDIA", server: "SG SERVER", validity: "1 Month", price: 300, badge: "Popular", features: ["200 GB data", "Social bundle friendly", "Low ping routing", "Unlimited device login"] },
    { name: "AIRTEL UNLIMITED", server: "SG SERVER (LK IP)", validity: "1 Month", price: 500, features: ["Unlimited data", "Best for live streamers", "Priority support", "Fastest node pool"] },
  ],
};

function V2RayPage() {
  const [isp, setIsp] = useState<Isp>("Dialog");

  return (
    <div className="overflow-x-hidden">
      <section className="relative isolate overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px] animate-glow-pulse" aria-hidden />
        <div className="container relative mx-auto px-4 py-20 text-center md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-success" />
            All servers operational
          </div>
          <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-tight md:text-6xl">
            V2Ray <span className="text-neon">Services</span>
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Fast, secure and reliable V2Ray / VLESS plans for every Sri Lankan network.
          </p>
          <Button variant="outline" size="lg" className="mt-8" asChild>
            <Link to="/info">New to V2Ray? Learn how it works <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ISP switcher */}
      <div className="container mx-auto px-4">
        <div className="mx-auto -mt-6 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-full border border-border/70 bg-card/80 p-1.5 backdrop-blur">
          {ISPS.map((i) => (
            <button
              key={i}
              onClick={() => setIsp(i)}
              className={`rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all ${
                isp === i
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {OFFERS[isp].map((o, idx) => (
            <div
              key={o.name}
              className="neon-card animate-rise flex flex-col overflow-hidden"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="relative h-28 bg-gradient-primary/10">
                <div className="absolute inset-0 bg-gradient-primary opacity-25" />
                <div className="absolute inset-0 bg-grid opacity-40" />
                <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-xl border border-border/70 bg-background/80 backdrop-blur">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute right-4 top-5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{isp}</div>
                    <h3 className="mt-1 font-display text-sm font-bold uppercase tracking-wide">{o.name}</h3>
                  </div>
                  {o.badge && (
                    <span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warning-foreground">
                      {o.badge}
                    </span>
                  )}
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground"><Server className="h-4 w-4" />Server</dt>
                    <dd className="font-medium">{o.server}</dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />Validity</dt>
                    <dd className="font-medium">{o.validity}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="inline-flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" />P2P / Torrent</dt>
                    <dd className="font-medium text-warning">Restricted</dd>
                  </div>
                </dl>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-end justify-between border-t border-dashed border-border/60 pt-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">From</div>
                    <div className="font-display text-2xl font-black">{formatLKR(o.price)}</div>
                  </div>
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow" asChild>
                    <Link to="/plans">Buy Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 pb-24">
        <div className="neon-card p-8 md:p-12">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">coreVPN · Android &amp; Windows</div>
          <h2 className="mt-3 font-display text-3xl font-black uppercase md:text-4xl">
            How your <span className="text-gradient">config</span> reaches you
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Pick your plan", b: "Choose your ISP and SIM package, then activate. Your config is reserved instantly." },
              { n: "02", t: "Pay & send slip", b: "Bank transfer, then send the slip on WhatsApp or upload it in your dashboard." },
              { n: "03", t: "Get 30 days", b: "Once we confirm the payment, your config stays active for a full 30 days." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/60 bg-background/40 p-6">
                <div className="font-display text-3xl font-black text-gradient">{s.n}</div>
                <h3 className="mt-3 font-display text-base font-bold uppercase tracking-wide">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow" asChild>
              <Link to="/plans">Activate a plan</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/setup">Setup guide</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
