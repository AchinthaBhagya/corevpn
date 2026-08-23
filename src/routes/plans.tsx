import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Clock, Zap, AlertTriangle, Landmark, User, Mail, ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { notifyPlanOrder } from "@/lib/discord.functions";
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
  subscriptionStatus, daysLeft, whatsappLink, BANK_DETAILS,
  type Plan, type Subscription,
} from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "Monthly Plans & Pricing — coreVPN" },
      { name: "description", content: "coreVPN monthly plans: Basic 100 GB LKR 200, Standard 200 GB LKR 300, Premium unlimited LKR 500. Pay by bank transfer and send your slip on WhatsApp." },
      { property: "og:title", content: "Monthly Plans & Pricing — coreVPN" },
      { property: "og:description", content: "Pick a coreVPN monthly plan — pay to our bank, send the slip on WhatsApp, and the admin activates your access." },
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function slipMessage(opts: {
  orderId: string;
  planName: string;
  price: number;
  name: string;
  email: string;
  payBy: Date;
}) {
  return [
    "coreVPN Plan Order — Payment Slip",
    `Order ID: ${opts.orderId}`,
    `Plan: ${opts.planName} (${formatLKR(opts.price)} / month)`,
    `Name: ${opts.name}`,
    `Email: ${opts.email}`,
    `Pay by: ${opts.payBy.toLocaleDateString()}`,
    "",
    "Mama me plan eka pay karala — bank slip eka me chat eken attach karanawa.",
  ].join("\n");
}

function BankDetailsCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Landmark className="h-4 w-4 text-primary" /> Bank transfer details
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{BANK_DETAILS.bank}</dd>
        <dt className="text-muted-foreground">Account holder</dt><dd className="font-medium">{BANK_DETAILS.holder}</dd>
        <dt className="text-muted-foreground">Account number</dt><dd className="font-mono font-medium">{BANK_DETAILS.account}</dd>
        <dt className="text-muted-foreground">Branch</dt><dd className="font-medium">{BANK_DETAILS.branch}</dd>
      </dl>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "details" | "payment" | "done";

function PlansPage() {
  const { user, profile, subscription, hasPlanAccess, refresh, loading } = useAuth();
  const notifyOrder = useServerFn(notifyPlanOrder);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(DEFAULT_GRACE_DAYS);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [payBy, setPayBy] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data, error }) => {
      if (error) toast.error(error.message);
      setPlans((data ?? []) as Plan[]);
    });
  }, []);

  const openWizard = (p: Plan) => {
    setSelected(p);
    setStep("details");
    setDays(DEFAULT_GRACE_DAYS);
    setOrderId(null);
    setPayBy(null);
    setName(profile?.display_name ?? "");
    setEmail(user?.email ?? "");
  };

  const closeWizard = () => setSelected(null);

  const continueToPayment = () => {
    if (name.trim().length < 2) { toast.error("ඔබේ නම ඇතුළත් කරන්න"); return; }
    if (!EMAIL_RE.test(email.trim())) { toast.error("නිවැරදි email ලිපිනයක් ඇතුළත් කරන්න"); return; }
    setStep("payment");
  };

  const placeOrder = async () => {
    if (!user || !selected) return;
    setBusy(true);
    const d = Math.min(Math.max(1, days), MAX_GRACE_DAYS);
    const payByDate = new Date(Date.now() + d * 86_400_000);
    const periodEnd = new Date(Date.now() + 30 * 86_400_000);
    const { data: inserted, error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_tier: selected.tier,
      price_lkr: selected.price_lkr,
      pay_by_date: payByDate.toISOString(),
      period_end: periodEnd.toISOString(),
      admin_note: `Name: ${name.trim()} • Email: ${email.trim()}`,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }

    if (name.trim() && name.trim() !== (profile?.display_name ?? "")) {
      void supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    }
    void supabase.from("access_logs").insert({
      user_id: user.id,
      action: "plan_started",
      config_label: `${selected.name} • ${formatLKR(selected.price_lkr)} • ${name.trim()} • ${email.trim()} • pay by ${payByDate.toLocaleDateString()}`,
    });
    if (inserted?.id) void notifyOrder({ data: { subscriptionId: inserted.id } });

    setOrderId(inserted?.id ?? null);
    setPayBy(payByDate);
    setStep("done");
    window.open(
      whatsappLink(slipMessage({
        orderId: inserted?.id ?? "—",
        planName: selected.name,
        price: selected.price_lkr,
        name: name.trim(),
        email: email.trim(),
        payBy: payByDate,
      })),
      "_blank",
      "noopener,noreferrer",
    );
    toast.success("Order placed — WhatsApp එකෙන් slip එක එවන්න");
    await refresh();
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
          Choose a package, enter your name &amp; email, pay to our bank account and send the slip on WhatsApp —
          the admin verifies it and activates your access for 30 days.
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
            <>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                {status.tone === "grace" ? <Clock className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                {status.tone === "grace"
                  ? `Pay ${formatLKR(subscription.price_lkr)} before ${new Date(subscription.pay_by_date).toLocaleDateString()} (${daysLeft(subscription.pay_by_date)} day(s) left) to keep your access.`
                  : `Payment deadline passed on ${new Date(subscription.pay_by_date).toLocaleDateString()} — your configs are disconnected. Pay to reactivate.`}
              </p>
              <div className="mt-4"><BankDetailsCard /></div>
              <Button
                className="mt-4 w-full bg-[#25D366] text-white hover:bg-[#1ebe5d] sm:w-auto"
                onClick={() => {
                  const msg = slipMessage({
                    orderId: subscription.id,
                    planName: subscription.plan_tier.toUpperCase(),
                    price: subscription.price_lkr,
                    name: profile?.display_name ?? "—",
                    email: user?.email ?? "—",
                    payBy: new Date(subscription.pay_by_date),
                  });
                  window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
                }}
              >
                <WhatsAppIcon className="mr-1.5 h-4 w-4" />
                Send payment slip on WhatsApp
              </Button>
            </>
          )}
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
                    onClick={() => openWizard(p)}
                  >
                    <Zap className="mr-1.5 h-4 w-4" />
                    {hasPlanAccess ? "Switch to this plan" : "Buy now"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
        Payments are confirmed manually by the admin from your WhatsApp slip. Access stays open until your promised
        payment date (max {MAX_GRACE_DAYS} days); after that it is cut off automatically until payment is confirmed.
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeWizard()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === "details" && `Buy ${selected?.name} — your details`}
              {step === "payment" && `Buy ${selected?.name} — payment`}
              {step === "done" && "Order placed!"}
            </DialogTitle>
            <DialogDescription>
              {selected && `${formatLKR(selected.price_lkr)} per month • ${planDataLabel(selected)}`}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {["Details", "Payment", "Done"].map((label, i) => {
              const idx = step === "details" ? 0 : step === "payment" ? 1 : 2;
              const active = i === idx;
              const complete = i < idx;
              return (
                <span key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-4 bg-border" />}
                  <span className={active ? "text-primary" : complete ? "text-success" : ""}>
                    {i + 1}. {label}
                  </span>
                </span>
              );
            })}
          </div>

          {step === "details" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="buyer-name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Your name
                </Label>
                <Input
                  id="buyer-name"
                  className="mt-1.5"
                  placeholder="e.g. Kamal Perera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div>
                <Label htmlFor="buyer-email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Your email
                </Label>
                <Input
                  id="buyer-email"
                  className="mt-1.5"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                මේ details ඔබේ WhatsApp slip message එකට සහ order එකට add වෙනවා — admin ඔබව හඳුනාගන්න.
              </p>
            </div>
          )}

          {step === "payment" && selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
                <span className="font-semibold">{selected.name}</span> — {formatLKR(selected.price_lkr)} / month
                <div className="mt-1 text-xs text-muted-foreground">{name.trim()} • {email.trim()}</div>
              </div>
              <BankDetailsCard />
              <div>
                <Label htmlFor="days">I will pay within (days)</Label>
                <Input
                  id="days"
                  className="mt-1.5"
                  type="number"
                  min={1}
                  max={MAX_GRACE_DAYS}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Your configs unlock immediately. If payment isn't confirmed by{" "}
                  <strong>{new Date(Date.now() + Math.min(Math.max(1, days), MAX_GRACE_DAYS) * 86_400_000).toLocaleDateString()}</strong>,
                  access is disconnected automatically.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                1. Bank එකට {formatLKR(selected.price_lkr)} deposit කරන්න → 2. පහළ button එකෙන් order එක place වෙලා WhatsApp open වෙනවා →
                3. Slip photo එක attach කරලා send කරන්න → Admin verify කරලා 30 days access activate කරනවා.
              </p>
            </div>
          )}

          {step === "done" && selected && (
            <div className="space-y-4 text-center">
              <BadgeCheck className="mx-auto h-12 w-12 text-success" />
              <p className="text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground">{orderId?.slice(0, 8)}…</span> placed.
                WhatsApp එකේ slip එක එවූ විට admin confirm කරලා{" "}
                {payBy && <strong className="text-foreground">{payBy.toLocaleDateString()}</strong>} ට පෙර
                ඔබේ 30-day access activate කරනවා.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (!selected || !payBy) return;
                  window.open(
                    whatsappLink(slipMessage({
                      orderId: orderId ?? "—",
                      planName: selected.name,
                      price: selected.price_lkr,
                      name: name.trim(),
                      email: email.trim(),
                      payBy,
                    })),
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <WhatsAppIcon className="mr-1.5 h-4 w-4 text-[#25D366]" />
                WhatsApp open වුණේ නැද්ද? නැවත open කරන්න
              </Button>
            </div>
          )}

          <DialogFooter>
            {step === "details" && (
              <>
                <Button variant="outline" onClick={closeWizard}>Cancel</Button>
                <Button onClick={continueToPayment} className="bg-gradient-primary text-primary-foreground">
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </>
            )}
            {step === "payment" && (
              <>
                <Button variant="outline" onClick={() => setStep("details")}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button onClick={placeOrder} disabled={busy} className="bg-[#25D366] text-white hover:bg-[#1ebe5d]">
                  <WhatsAppIcon className="mr-1.5 h-4 w-4" />
                  {busy ? "Placing order…" : "Pay & send slip on WhatsApp"}
                </Button>
              </>
            )}
            {step === "done" && (
              <Button asChild className="bg-gradient-primary text-primary-foreground">
                <Link to="/configs" onClick={closeWizard}>Go to configs</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
