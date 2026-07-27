import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Crown, Clock, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DEFAULT_GRACE_DAYS, MAX_GRACE_DAYS, formatLKR, planDataLabel,
  subscriptionStatus, daysLeft, type Plan,
} from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "Monthly Plans & Pricing — coreVPN" },
      { name: "description", content: "coreVPN monthly plans: Basic 100 GB LKR 200, Standard 200 GB LKR 300, Premium unlimited LKR 500. Start now and pay within a few days." },
      { property: "og:title", content: "Monthly Plans & Pricing — coreVPN" },
      { property: "og:description", content: "Pick a coreVPN monthly plan — start using configs first and pay within your chosen deadline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const perks: Record<string, string[]> = {
  basic: ["100 GB monthly data", "All ISP configs", "Standard servers"],
  standard: ["200 GB monthly data", "All ISP configs", "Faster servers", "Priority updates"],
  premium: ["Unlimited data", "All premium configs", "Ultra-fast servers", "Priority support"],
};

function PlansPage() {
  const { user, subscription, hasPlanAccess, refresh, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [days, setDays] = useState(DEFAULT_GRACE_DAYS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data, error }) => {
      if (error) toast.error(error.message);
      setPlans((data ?? []) as Plan[]);
    });
  }, []);

  const start = async () => {
    if (!user || !selected) return;
    const d = Math.min(Math.max(1, days), MAX_GRACE_DAYS);
    const payBy = new Date(Date.now() + d * 86_400_000);
    const periodEnd = new Date(Date.now() + 30 * 86_400_000);
    setBusy(true);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_tier: selected.tier,
      price_lkr: selected.price_lkr,
      pay_by_date: payBy.toISOString(),
      period_end: periodEnd.toISOString(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    void supabase.from("access_logs").insert({
      user_id: user.id,
      action: "plan_started",
      config_label: `${selected.name} • ${formatLKR(selected.price_lkr)} • pay by ${payBy.toLocaleDateString()}`,
    });
    toast.success(`${selected.name} activated — please pay before ${payBy.toLocaleDateString()}`);
    setSelected(null);
    await refresh();
    navigate({ to: "/configs" });
  };

  const status = subscriptionStatus(subscription);

  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Crown className="h-3.5 w-3.5 text-warning-foreground" />Monthly plans
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Pick your plan</h1>
        <p className="mt-3 text-muted-foreground">
          Start using configs today — pay within your chosen deadline. If payment isn't received by that date,
          your configs are disconnected automatically.
        </p>
      </div>

      {subscription && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your subscription</div>
              <div className="mt-1 font-display text-lg font-bold capitalize">
                {subscription.plan_tier} — {formatLKR(subscription.price_lkr)} / month
              </div>
            </div>
            <Badge
              className={
                status.tone === "active" ? "bg-primary text-primary-foreground"
                  : status.tone === "grace" ? "bg-warning text-warning-foreground"
                    : "bg-destructive text-destructive-foreground"
              }
            >
              {status.label}
            </Badge>
          </div>
          {!subscription.is_paid && (
            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              {status.tone === "grace" ? <Clock className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              {status.tone === "grace"
                ? `Pay ${formatLKR(subscription.price_lkr)} before ${new Date(subscription.pay_by_date).toLocaleDateString()} (${daysLeft(subscription.pay_by_date)} day(s) left) to keep your access.`
                : `Payment deadline passed on ${new Date(subscription.pay_by_date).toLocaleDateString()} — your configs are disconnected. Pay to reactivate.`}
            </p>
          )}
          <Button className="mt-4" variant="outline" asChild>
            <a href={`mailto:godfather.devup@gmail.com?subject=coreVPN%20Payment%20-%20${subscription.plan_tier}`}>
              Send payment details
            </a>
          </Button>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => {
          const featured = p.tier === "standard";
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl border bg-card p-7 shadow-card transition-all hover:-translate-y-1 ${featured ? "border-primary/60 shadow-glow" : "border-border/60"}`}
            >
              {featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-2xl font-bold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{planDataLabel(p)}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">{formatLKR(p.price_lkr)}</span>
                <span className="pb-1 text-sm text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {(perks[p.tier] ?? []).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                {!user ? (
                  <Button asChild className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                    <Link to="/auth" search={{ mode: "register" }}>Sign in to start</Link>
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${featured ? "bg-gradient-primary text-primary-foreground shadow-glow" : ""}`}
                    variant={featured ? "default" : "outline"}
                    disabled={loading}
                    onClick={() => { setSelected(p); setDays(DEFAULT_GRACE_DAYS); }}
                  >
                    <Zap className="mr-1.5 h-4 w-4" />
                    {hasPlanAccess ? "Switch to this plan" : "Start now, pay later"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
        Payments are confirmed manually by the admin. Access stays open until your promised payment date
        (max {MAX_GRACE_DAYS} days); after that it is cut off automatically until payment is confirmed.
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start {selected?.name} plan</DialogTitle>
            <DialogDescription>
              {selected && `${formatLKR(selected.price_lkr)} per month • ${planDataLabel(selected)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="days">I will pay within (days)</Label>
            <Input
              id="days"
              type="number"
              min={1}
              max={MAX_GRACE_DAYS}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Your configs unlock immediately. If payment isn't confirmed by{" "}
              <strong>{new Date(Date.now() + Math.min(Math.max(1, days), MAX_GRACE_DAYS) * 86_400_000).toLocaleDateString()}</strong>,
              access is disconnected automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={start} disabled={busy} className="bg-gradient-primary text-primary-foreground">
              {busy ? "Starting…" : "Confirm & unlock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
