import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Clock, Zap, AlertTriangle, Landmark, User, Mail, ArrowLeft, ArrowRight, BadgeCheck, Signal, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { notifyPlanOrder } from "@/lib/discord.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlipUpload, SlipStatusBadge } from "@/components/SlipUpload";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  MAX_GRACE_DAYS, formatLKR, planDataLabel, ISPS, SIM_PACKAGES,
  subscriptionStatus, daysLeft, whatsappLink, BANK_DETAILS,
  type Plan, type PaymentRow,
} from "@/lib/plans";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
  head: () => ({
    meta: [
      { title: "Monthly Plans & Pricing — coreVPN" },
      { name: "description", content: "coreVPN monthly plans: Basic 100 GB LKR 200, Standard 200 GB LKR 300, Premium unlimited LKR 500. Pick your SIM package, get your config instantly and activate it after payment." },
      { property: "og:title", content: "Monthly Plans & Pricing — coreVPN" },
      { property: "og:description", content: "Pick a coreVPN plan and your SIM package — your VLESS config is reserved instantly and activated once the admin approves your bank slip." },
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
  isp?: string | null;
  simPackage?: string | null;
}) {
  return [
    "coreVPN Package Activation — Payment Slip",
    `Order ID: ${opts.orderId}`,
    `Plan: ${opts.planName} (${formatLKR(opts.price)} / month)`,
    opts.isp ? `SIM: ${opts.isp}${opts.simPackage ? ` — ${opts.simPackage}` : ""}` : "",
    `Name: ${opts.name}`,
    `Email: ${opts.email}`,
    "",
    "Mama me package eka pay karala — bank slip eka me chat eken attach karanawa.",
  ].filter(Boolean).join("\n");
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
const PHONE_RE = /^[0-9+\s-]{9,20}$/;

type Step = "details" | "payment" | "done";

function PlansPage() {
  const { user, profile, subscription, hasPlanAccess, refresh, loading } = useAuth();
  const notifyOrder = useServerFn(notifyPlanOrder);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isp, setIsp] = useState<string>(ISPS[0]);
  const [simPackage, setSimPackage] = useState<string>(SIM_PACKAGES[0]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [gotConfig, setGotConfig] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data, error }) => {
      if (error) toast.error(error.message);
      setPlans((data ?? []) as Plan[]);
    });
  }, []);

  const loadPayments = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payments").select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPayments((data ?? []) as PaymentRow[]);
  }, [user]);

  useEffect(() => { void loadPayments(); }, [loadPayments]);

  const latestPayment = subscription
    ? payments.find((p) => p.subscription_id === subscription.id) ?? null
    : null;

  const openWizard = (p: Plan) => {
    setSelected(p);
    setStep("details");
    setOrderId(null);
    setGotConfig(false);
    setName(profile?.display_name ?? "");
    setEmail(user?.email ?? "");
    setWhatsapp(profile?.whatsapp ?? "");
    setIsp(ISPS[0]);
    setSimPackage(SIM_PACKAGES[0]);
  };

  const closeWizard = () => setSelected(null);

  const continueToPayment = () => {
    if (name.trim().length < 2) { toast.error("ඔබේ නම ඇතුළත් කරන්න"); return; }
    if (!EMAIL_RE.test(email.trim())) { toast.error("නිවැරදි email ලිපිනයක් ඇතුළත් කරන්න"); return; }
    if (!PHONE_RE.test(whatsapp.trim())) { toast.error("නිවැරදි WhatsApp number එකක් ඇතුළත් කරන්න"); return; }
    setStep("payment");
  };

  const activate = async () => {
    if (!user || !selected) return;
    setBusy(true);
    const { data: subId, error } = await supabase.rpc("activate_package", {
      _plan_tier: selected.tier,
      _isp: isp,
      _sim_package: simPackage === "Any available" ? "" : simPackage,
      _customer_name: name.trim(),
      _customer_whatsapp: whatsapp.trim(),
    });
    if (error) { setBusy(false); toast.error(error.message); return; }

    const newId = subId as unknown as string;
    const { data: subRow } = await supabase
      .from("subscriptions").select("config_id").eq("id", newId).maybeSingle();
    setGotConfig(Boolean(subRow?.config_id));

    void supabase.from("access_logs").insert({
      user_id: user.id,
      action: "package_activated",
      config_id: subRow?.config_id ?? null,
      config_label: `${selected.name} • ${isp} • ${simPackage} • ${formatLKR(selected.price_lkr)}`,
    });
    void notifyOrder({ data: { subscriptionId: newId } });

    setOrderId(newId);
    setStep("done");
    setBusy(false);
    toast.success("Package activated — payment slip එක එවන්න");
    await refresh();
    await loadPayments();
  };

  const status = subscriptionStatus(subscription);

  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Crown className="h-3.5 w-3.5 text-warning-foreground" />Monthly plans
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Activate your package</h1>
        <p className="mt-3 text-muted-foreground">
          Choose a VPN package and your SIM package — a VLESS config is reserved for you instantly.
          Pay to our bank, upload the slip (or send it on WhatsApp) and the admin activates it for 30 days.
        </p>
      </div>

      {subscription && (
        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/60 bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your package</div>
              <div className="mt-1 font-display text-lg font-bold capitalize">
                {subscription.plan_tier} — {formatLKR(subscription.price_lkr)} / month
              </div>
              {subscription.isp && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  SIM: {subscription.isp}{subscription.sim_package ? ` • ${subscription.sim_package}` : ""}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {latestPayment && <SlipStatusBadge status={latestPayment.status} />}
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
          </div>
          {!subscription.is_paid && (
            <>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                {status.tone === "grace" ? <Clock className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                {status.tone === "grace"
                  ? `Pay ${formatLKR(subscription.price_lkr)} before ${new Date(subscription.pay_by_date).toLocaleDateString()} (${daysLeft(subscription.pay_by_date)} day(s) left) to keep your access.`
                  : `Your config is reserved but locked until the admin approves your payment slip.`}
              </p>
              <div className="mt-4"><BankDetailsCard /></div>
              <div className="mt-4">
                <SlipUpload
                  subscriptionId={subscription.id}
                  userId={user!.id}
                  latest={latestPayment}
                  onUploaded={() => void loadPayments()}
                />
              </div>
              <Button
                className="mt-4 w-full bg-[#25D366] text-white hover:bg-[#1ebe5d] sm:w-auto"
                onClick={() => {
                  const msg = slipMessage({
                    orderId: subscription.id,
                    planName: subscription.plan_tier.toUpperCase(),
                    price: subscription.price_lkr,
                    name: subscription.customer_name ?? profile?.display_name ?? "—",
                    email: user?.email ?? "—",
                    isp: subscription.isp,
                    simPackage: subscription.sim_package,
                  });
                  window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
                }}
              >
                <WhatsAppIcon className="mr-1.5 h-4 w-4" />
                Send payment slip on WhatsApp
              </Button>
            </>
          )}
          {subscription.is_paid && (
            <p className="mt-3 text-sm text-muted-foreground">
              Active until{" "}
              <strong className="text-foreground">
                {subscription.period_end ? new Date(subscription.period_end).toLocaleDateString() : "—"}
              </strong>{" "}
              — <Link to="/configs" className="text-primary hover:underline">view your config</Link>.
            </p>
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
                    {hasPlanAccess ? "Switch to this package" : "Activate package"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
        Payments are verified manually by the admin from your uploaded slip or WhatsApp message. After approval your
        config stays active for 30 days (grace period max {MAX_GRACE_DAYS} days).
      </p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeWizard()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === "details" && `${selected?.name} — your details`}
              {step === "payment" && `${selected?.name} — payment`}
              {step === "done" && "Package activated!"}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="flex items-center gap-1.5"><Signal className="h-3.5 w-3.5" /> SIM / ISP</Label>
                  <Select value={isp} onValueChange={setIsp}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ISPS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>SIM package</Label>
                  <Select value={simPackage} onValueChange={setSimPackage}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIM_PACKAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="buyer-name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Your name
                </Label>
                <Input id="buyer-name" className="mt-1.5" placeholder="e.g. Kamal Perera"
                  value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="buyer-email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Your email
                  </Label>
                  <Input id="buyer-email" className="mt-1.5" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="buyer-wa" className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp number
                  </Label>
                  <Input id="buyer-wa" className="mt-1.5" inputMode="tel" placeholder="0771234567"
                    value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={20} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                මේ details order එකට add වෙනවා — admin ඔබව හඳුනාගෙන config එක release කරනවා.
              </p>
            </div>
          )}

          {step === "payment" && selected && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
                <span className="font-semibold">{selected.name}</span> — {formatLKR(selected.price_lkr)} / month
                <div className="mt-1 text-xs text-muted-foreground">
                  {isp} • {simPackage} • {name.trim()} • {whatsapp.trim()}
                </div>
              </div>
              <BankDetailsCard />
              <p className="text-xs text-muted-foreground">
                1. "Activate" කරාම ඔබට config එකක් reserve වෙනවා → 2. Bank එකට {formatLKR(selected.price_lkr)} deposit කරන්න →
                3. Slip එක upload කරන්න හෝ WhatsApp එකෙන් එවන්න → Admin approve කළාම config එක 30 days activate වෙනවා.
              </p>
            </div>
          )}

          {step === "done" && selected && (
            <div className="space-y-4 text-center">
              <BadgeCheck className="mx-auto h-12 w-12 text-success" />
              <p className="text-sm text-muted-foreground">
                Order <span className="font-mono text-foreground">{orderId?.slice(0, 8)}…</span> created.{" "}
                {gotConfig
                  ? `${isp} config එකක් ඔබට reserve කළා — payment approve වුණාම configs page එකේ පේනවා.`
                  : `${isp} pool එකේ දැනට free config එකක් නැහැ — admin එකක් add කරලා ඔබට assign කරයි.`}
              </p>
              {orderId && user && (
                <SlipUpload
                  subscriptionId={orderId}
                  userId={user.id}
                  onUploaded={() => void loadPayments()}
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (!selected || !orderId) return;
                  window.open(
                    whatsappLink(slipMessage({
                      orderId,
                      planName: selected.name,
                      price: selected.price_lkr,
                      name: name.trim(),
                      email: email.trim(),
                      isp,
                      simPackage,
                    })),
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                <WhatsAppIcon className="mr-1.5 h-4 w-4 text-[#25D366]" />
                Send the slip on WhatsApp instead
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
                <Button onClick={activate} disabled={busy} className="bg-gradient-primary text-primary-foreground">
                  <Zap className="mr-1.5 h-4 w-4" />
                  {busy ? "Activating…" : "Activate package"}
                </Button>
              </>
            )}
            {step === "done" && (
              <Button asChild className="bg-gradient-primary text-primary-foreground">
                <Link to="/configs" onClick={closeWizard}>Go to my configs</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
