export type PlanTier = "basic" | "standard" | "premium";

export type Plan = {
  id: string;
  tier: PlanTier;
  name: string;
  data_gb: number | null;
  price_lkr: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_tier: PlanTier;
  price_lkr: number;
  is_paid: boolean;
  paid_at: string | null;
  pay_by_date: string;
  period_end: string | null;
  cancelled: boolean;
  admin_note: string | null;
  created_at: string;
};

/** Max number of days a customer may take before paying. */
export const MAX_GRACE_DAYS = 7;
export const DEFAULT_GRACE_DAYS = 3;

/** Where customers send bank-slip screenshots after paying.
 *  A full WhatsApp click-to-chat link (wa.me/message/...) or a bare phone number. */
export const ADMIN_WHATSAPP = "https://wa.me/message/YIGZTMDLT3O2J1";

export const BANK_DETAILS = {
  bank: "BOC",
  holder: "A.B. Premarathna",
  account: "0096471982",
  branch: "Kandy",
};

export function whatsappLink(message: string) {
  // If ADMIN_WHATSAPP is a full URL, append the pre-filled text; otherwise treat it as a phone number.
  if (/^https?:\/\//i.test(ADMIN_WHATSAPP)) {
    const sep = ADMIN_WHATSAPP.includes("?") ? "&" : "?";
    return `${ADMIN_WHATSAPP}${sep}text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function planDataLabel(p: Pick<Plan, "data_gb">) {
  return p.data_gb ? `${p.data_gb} GB / month` : "Unlimited data";
}

export function formatLKR(v: number) {
  return `LKR ${v.toLocaleString("en-LK")}`;
}

/** Access is granted while paid & inside the period, or unpaid but inside the promised-payment window. */
export function subscriptionActive(s: Subscription | null | undefined, now = Date.now()) {
  if (!s || s.cancelled) return false;
  if (s.is_paid) return !s.period_end || new Date(s.period_end).getTime() > now;
  return new Date(s.pay_by_date).getTime() > now;
}

export function subscriptionStatus(s: Subscription | null | undefined): {
  label: string;
  tone: "active" | "grace" | "expired" | "none";
} {
  if (!s) return { label: "No plan", tone: "none" };
  if (s.cancelled) return { label: "Cancelled", tone: "expired" };
  const now = Date.now();
  if (s.is_paid) {
    return !s.period_end || new Date(s.period_end).getTime() > now
      ? { label: "Active (paid)", tone: "active" }
      : { label: "Expired", tone: "expired" };
  }
  return new Date(s.pay_by_date).getTime() > now
    ? { label: "Active — payment pending", tone: "grace" }
    : { label: "Disconnected — unpaid", tone: "expired" };
}

export function daysLeft(dateIso: string) {
  const ms = new Date(dateIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
