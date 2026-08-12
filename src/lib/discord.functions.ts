import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerInput = z.object({
  email: z.string().trim().email().max(255),
  displayName: z.string().trim().max(80).optional(),
  provider: z.string().trim().max(30).optional(),
});

/** New signup notification. Verified against a freshly created profile row. */
export const notifyRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registerInput.parse(d))
  .handler(async ({ data }) => {
    const { sendDiscord } = await import("./discord.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, created_at")
      .ilike("email", data.email)
      .maybeSingle();

    // Only notify for accounts actually created in the last 5 minutes.
    if (!prof || Date.now() - new Date(prof.created_at).getTime() > 5 * 60_000) {
      return { ok: false };
    }

    await sendDiscord(process.env["DISCORD_WEBHOOK_USER_LOGS"], {
      title: "🆕 New user registered",
      color: 0x5865f2,
      fields: [
        { name: "Email", value: prof.email },
        { name: "Name", value: prof.display_name ?? data.displayName ?? "—" },
        { name: "Method", value: data.provider ?? "email" },
        { name: "User ID", value: prof.id, inline: false },
      ],
    });
    return { ok: true };
  });

const configInput = z.object({
  configId: z.string().uuid(),
});

/** Config download/copy notification. */
export const notifyConfigDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => configInput.parse(d))
  .handler(async ({ data, context }) => {
    const { sendDiscord } = await import("./discord.server");
    const { data: cfg } = await context.supabase
      .from("configs")
      .select("isp, package_name, config_name, requires_premium")
      .eq("id", data.configId)
      .maybeSingle();
    if (!cfg) return { ok: false };

    const { data: prof } = await context.supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    await sendDiscord(process.env["DISCORD_WEBHOOK_CONFIG_LOGS"], {
      title: "📥 Config downloaded",
      color: 0x22c55e,
      fields: [
        { name: "User", value: prof?.email ?? context.userId },
        { name: "Name", value: prof?.display_name ?? "—" },
        { name: "ISP", value: cfg.isp },
        { name: "Package", value: cfg.package_name },
        { name: "Config", value: cfg.config_name },
        { name: "Type", value: cfg.requires_premium ? "Premium" : "Free" },
      ],
    });
    return { ok: true };
  });

const orderInput = z.object({
  subscriptionId: z.string().uuid(),
});

/** New plan order notification. */
export const notifyPlanOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { sendDiscord } = await import("./discord.server");
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("plan_tier, price_lkr, pay_by_date, is_paid, created_at")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub) return { ok: false };

    const { data: prof } = await context.supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    await sendDiscord(process.env["DISCORD_WEBHOOK_ORDER_LOGS"], {
      title: "🛒 New plan order",
      color: 0xf59e0b,
      fields: [
        { name: "User", value: prof?.email ?? context.userId },
        { name: "Name", value: prof?.display_name ?? "—" },
        { name: "Plan", value: String(sub.plan_tier).toUpperCase() },
        { name: "Price", value: `LKR ${sub.price_lkr}` },
        { name: "Pay by", value: new Date(sub.pay_by_date).toLocaleString("en-GB") },
        { name: "Paid", value: sub.is_paid ? "Yes" : "Pending" },
      ],
    });
    return { ok: true };
  });

const paymentInput = z.object({
  subscriptionId: z.string().uuid(),
});

/** Admin confirmed a bank slip / payment — 30 day access starts now. */
export const notifyPaymentConfirmed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => paymentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { sendDiscord } = await import("./discord.server");

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false };

    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("user_id, plan_tier, price_lkr, paid_at, period_end, is_paid")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub || !sub.is_paid) return { ok: false };

    const { data: prof } = await context.supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", sub.user_id)
      .maybeSingle();

    await sendDiscord(process.env["DISCORD_WEBHOOK_ORDER_LOGS"], {
      title: "✅ Payment confirmed — 30 days activated",
      color: 0x22c55e,
      fields: [
        { name: "User", value: prof?.email ?? sub.user_id },
        { name: "Name", value: prof?.display_name ?? "—" },
        { name: "Plan", value: String(sub.plan_tier).toUpperCase() },
        { name: "Paid", value: `LKR ${sub.price_lkr}` },
        { name: "Paid on", value: sub.paid_at ? new Date(sub.paid_at).toLocaleString("en-GB") : "—" },
        { name: "Expires", value: sub.period_end ? new Date(sub.period_end).toLocaleString("en-GB") : "—" },
      ],
    });
    return { ok: true };
  });
