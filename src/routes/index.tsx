import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Zap, Lock, Globe, ArrowRight, CheckCircle2, ShieldCheck, Wifi, Server, Gauge,
  Activity, Signal, CircleCheck, Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISPS } from "@/lib/plans";
import { IspLogo } from "@/components/IspLogo";

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

function Home() {
  return (
    <div className="overflow-x-hidden bg-gradient-hero">
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Network operational</span>
          <span className="hidden items-center gap-2 sm:inline-flex"><Activity className="h-4 w-4 text-primary" /> Sri Lanka optimized VLESS</span>
        </div>

        <div className="grid auto-rows-min gap-4 lg:grid-cols-12">
          <div className="glass-panel animate-rise p-7 md:p-10 lg:col-span-7 lg:row-span-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure tunnel ready
            </div>
            <h1 className="mt-7 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
              Everything VLESS.<br /><span className="text-neon">One trusted core.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Free configs and premium monthly plans tuned for Dialog, Hutch, Mobitel, SLT and Airtel — built for fast, secure access.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
                <Link to="/configs">Get Free Configs <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild><Link to="/v2ray">Explore V2Ray Plans</Link></Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-border/50 pt-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-success" />Genuine configs</span>
              <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />Secure access</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />24/7 support</span>
            </div>
          </div>

          <div className="glass-panel p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">ISP network</p><h2 className="mt-1 text-xl font-bold">Five carriers. One core.</h2></div>
              <Signal className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
              {ISPS.map((isp) => <IspLogo key={isp} isp={isp} className="h-14 w-full border border-border/60" imgClassName="max-h-8 max-w-[4.5rem]" />)}
            </div>
          </div>

          <div className="glass-panel grid grid-cols-2 divide-x divide-border/60 p-6 lg:col-span-5">
            <div><p className="text-3xl font-bold text-foreground">99.9%</p><p className="mt-1 text-xs text-muted-foreground">Service uptime</p></div>
            <div className="pl-6"><p className="text-3xl font-bold text-foreground">TLS</p><p className="mt-1 text-xs text-muted-foreground">Secure tunnel</p></div>
          </div>

          {[
            { icon: Zap, title: "Blazing fast", body: "Low-latency servers tuned for Sri Lankan ISP packages.", span: "lg:col-span-4" },
            { icon: Lock, title: "Encrypted", body: "VLESS over TLS keeps your traffic private and protected.", span: "lg:col-span-4" },
            { icon: Globe, title: "ISP-aware", body: "Dedicated choices for every supported local carrier.", span: "lg:col-span-4" },
          ].map((feature) => (
            <div key={feature.title} className={`glass-panel bento-lift group p-6 ${feature.span}`}>
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary"><feature.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </div>
          ))}

          {[
            { icon: Server, title: "V2Ray Services", sub: "Reliable secure connections", to: "/v2ray", cta: "View plans" },
            { icon: Wifi, title: "Free Configs", sub: "Fresh links for every ISP", to: "/configs", cta: "Browse free" },
            { icon: ShieldCheck, title: "Setup Guides", sub: "Simple step-by-step help", to: "/setup", cta: "Learn setup" },
            { icon: Gauge, title: "Premium Plans", sub: "100 GB to unlimited", to: "/plans", cta: "Get premium" },
          ].map((service) => (
            <div key={service.title} className="glass-panel bento-lift flex min-h-52 flex-col p-6 md:col-span-1 lg:col-span-3">
              <service.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-7 text-lg font-bold">{service.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{service.sub}</p>
              <Button variant="ghost" size="sm" className="mt-auto w-fit px-0 text-primary hover:bg-transparent" asChild>
                <Link to={service.to}>{service.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 pt-4">
        <div className="glass-panel grid gap-8 overflow-hidden p-7 md:grid-cols-[1.35fr_0.65fr] md:p-10">
          <div>
            <span className="text-xs font-bold uppercase text-primary">coreVPN Premium</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">More data. Priority access.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">Choose 100 GB, 200 GB or unlimited access and receive your config after payment approval.</p>
            <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
              {["Dedicated premium config", "30-day access", "Priority support", "All supported ISPs"].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{item}</li>)}
            </ul>
          </div>
          <div className="border-t border-border/60 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <p className="text-xs text-muted-foreground">Plans from</p>
            <p className="mt-2 font-display text-4xl font-extrabold">LKR 200</p>
            <p className="text-sm text-muted-foreground">per month</p>
            <Button size="lg" className="mt-6 w-full bg-gradient-primary text-primary-foreground shadow-glow" asChild><Link to="/plans">Choose a Plan</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
