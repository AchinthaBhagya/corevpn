import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Zap, Lock, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "coreVPN — Free VLESS Configs" },
      { name: "description", content: "Free VLESS VPN configurations for Sri Lankan ISPs. Dialog, Hutch, Mobitel, SLT, Airtel." },
    ],
  }),
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              All configs online — 100% free
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tighter md:text-7xl">
              Free <span className="text-gradient">VLESS</span> configs<br />for everyone.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Premium-grade VPN configurations tuned for Dialog, Hutch, Mobitel, SLT and Airtel.
              Unlock 724 Zoom &amp; social media packages — no payment, no limits.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Link to="/configs">Get Configs <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/setup">How to setup</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Blazing fast", body: "Hand-picked low-latency servers tuned for Sri Lankan ISP packages." },
            { icon: Lock, title: "Encrypted", body: "VLESS over TLS keeps your traffic private. No logs, no tracking." },
            { icon: Globe, title: "ISP-aware", body: "Separate configs for Dialog, Hutch, Mobitel, SLT and Airtel packages." },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Paid plan strip */}
      <section className="container mx-auto px-4 pb-24">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-warning-foreground">Premium</div>
              <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">Upgrade to coreVPN <span className="text-gradient">Pro</span></h2>
              <p className="mt-3 text-muted-foreground">
                Unlimited config downloads, priority new releases, exclusive premium-only configs and early access to beta tools.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {["Unlimited daily configs","Premium-only ultra-fast servers","Priority support","Early access to new packages"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
              <div className="text-sm text-muted-foreground">Single payment</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">LKR 990</span>
                <span className="text-muted-foreground">/ lifetime</span>
              </div>
              <Button size="lg" className="mt-6 w-full bg-gradient-primary text-primary-foreground shadow-glow" asChild>
                <Link to="/profile">Get Paid Plan</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Contact admin via Profile page to activate Premium.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
