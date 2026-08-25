import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Activity, Database, Users, Shield, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { notifyPaymentConfirmed, testDiscordWebhook } from "@/lib/discord.functions";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatLKR, subscriptionStatus, type Subscription } from "@/lib/plans";


export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — coreVPN" }, { name: "robots", content: "noindex" }] }),
});

type Config = {
  id: string;
  isp: string;
  package_name: string;
  config_name: string;
  config_data: string;
  description: string | null;
  requires_premium: boolean;
  expire_date: string | null;
  is_active: boolean;
  created_at: string;
};
type LogRow = {
  id: string; user_id: string | null; user_email: string | null; action: string;
  config_label: string | null; created_at: string;
};
type UserRow = { id: string; email: string; display_name: string | null; is_premium: boolean; created_at: string };
type SubRow = Subscription;


const empty = {
  isp: "Dialog", package_name: "", config_name: "", config_data: "",
  description: "", requires_premium: false, expire_date: "", is_active: true,
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const notifyPayment = useServerFn(notifyPaymentConfirmed);
  const testWebhook = useServerFn(testDiscordWebhook);
  const [testing, setTesting] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Config[]>([]);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Config | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    const [c, l, u, s, r] = await Promise.all([
      supabase.from("configs").select("*").order("created_at", { ascending: false }),
      supabase.from("access_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id,email,display_name,is_premium,created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
    ]);
    if (c.data) setConfigs(c.data as Config[]);
    if (l.data) setLogs(l.data as LogRow[]);
    if (u.data) setUsers(u.data as UserRow[]);
    if (s.data) setSubs(s.data as SubRow[]);
    if (r.data) setAdminIds(new Set((r.data as { user_id: string }[]).map((x) => x.user_id)));
  };


  const runWebhookTest = async (channel: "user" | "config" | "order") => {
    setTesting(channel);
    try {
      const res = await testWebhook({ data: { channel } });
      if (res.ok) toast.success(`${channel} webhook: ${res.message}`);
      else toast.error(`${channel} webhook: ${res.message}`);
    } catch {
      toast.error("Webhook test failed");
    } finally {
      setTesting(null);
    }
  };

  const markPaid = async (s: SubRow, paid: boolean) => {
    const paidAt = new Date();
    const { error } = await supabase.from("subscriptions").update({
      is_paid: paid,
      paid_at: paid ? paidAt.toISOString() : null,
      period_end: paid ? new Date(paidAt.getTime() + 30 * 86_400_000).toISOString() : s.period_end,
    }).eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      if (paid) void notifyPayment({ data: { subscriptionId: s.id } });
      toast.success(paid ? "Marked as paid — 30 days from today" : "Marked as unpaid");
      void load();
    }
  };


  const extendDeadline = async (s: SubRow) => {
    const input = prompt("Extend payment deadline by how many days?", "3");
    const d = Number(input);
    if (!d || d <= 0) return;
    const base = Math.max(Date.now(), new Date(s.pay_by_date).getTime());
    const { error } = await supabase.from("subscriptions")
      .update({ pay_by_date: new Date(base + d * 86_400_000).toISOString() }).eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Deadline extended"); void load(); }
  };

  const disconnectSub = async (s: SubRow) => {
    if (!confirm("Disconnect this subscription now?")) return;
    const { error } = await supabase.from("subscriptions")
      .update({ cancelled: true }).eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Subscription disconnected"); void load(); }
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };
  const openEdit = (c: Config) => {
    setEditing(c);
    setForm({
      isp: c.isp, package_name: c.package_name, config_name: c.config_name,
      config_data: c.config_data, description: c.description ?? "",
      requires_premium: c.requires_premium,
      expire_date: c.expire_date ? c.expire_date.slice(0, 16) : "",
      is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.isp || !form.package_name || !form.config_name || !form.config_data) {
      toast.error("Please fill all required fields");
      return;
    }
    const payload = {
      isp: form.isp.trim(),
      package_name: form.package_name.trim(),
      config_name: form.config_name.trim(),
      config_data: form.config_data.trim(),
      description: form.description.trim() || null,
      requires_premium: form.requires_premium,
      expire_date: form.expire_date ? new Date(form.expire_date).toISOString() : null,
      is_active: form.is_active,
    };
    const op = editing
      ? supabase.from("configs").update(payload).eq("id", editing.id)
      : supabase.from("configs").insert({ ...payload, created_by: user!.id });
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Config updated" : "Config created");
    setDialogOpen(false);
    void load();
  };

  const remove = async (c: Config) => {
    if (!confirm(`Delete ${c.config_name}?`)) return;
    const { error } = await supabase.from("configs").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); void load(); }
  };

  const togglePremium = async (u: UserRow) => {
    const { error } = await supabase.from("profiles").update({ is_premium: !u.is_premium }).eq("id", u.id);
    if (error) toast.error(error.message);
    else { toast.success(`${u.email} → ${!u.is_premium ? "Premium" : "Free"}`); void load(); }
  };

  if (loading) return <div className="container mx-auto p-16 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex rounded-full bg-warning/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-warning-foreground">
            <Shield className="mr-1 h-3 w-3" />Admin
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage configs, users and view logs.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { icon: Database, label: "Total configs", value: configs.length },
          { icon: Users, label: "Total users", value: users.length },
          { icon: Activity, label: "Recent events", value: logs.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="font-display text-2xl font-bold">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-sm font-bold">Discord webhooks</div>
            <p className="text-xs text-muted-foreground">Send a test message to verify each channel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "user", label: "Test user logs" },
              { key: "config", label: "Test config logs" },
              { key: "order", label: "Test order logs" },
            ] as const).map((c) => (
              <Button
                key={c.key}
                size="sm"
                variant="outline"
                disabled={testing !== null}
                onClick={() => void runWebhookTest(c.key)}
              >
                <Send className="mr-2 h-4 w-4" />
                {testing === c.key ? "Sending..." : c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>



      <Tabs defaultValue="configs" className="mt-8">
        <TabsList>
          <TabsTrigger value="configs">Configs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>

        </TabsList>

        <TabsContent value="configs" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Plus className="mr-1.5 h-4 w-4" />New config
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">ISP</th><th className="p-3">Package</th>
                    <th className="p-3">Name</th><th className="p-3">Status</th>
                    <th className="p-3">Expires</th><th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No configs. Add one.</td></tr>
                  )}
                  {configs.map((c) => (
                    <tr key={c.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.isp}</td>
                      <td className="p-3">{c.package_name}</td>
                      <td className="p-3">
                        {c.config_name}
                        {c.requires_premium && <Badge className="ml-2 bg-warning text-warning-foreground">Premium</Badge>}
                      </td>
                      <td className="p-3">
                        <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Disabled"}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {c.expire_date ? new Date(c.expire_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">Email</th><th className="p-3">Name</th>
                    <th className="p-3">Joined</th><th className="p-3">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border/60">
                      <td className="p-3 font-mono text-xs">{u.email}</td>
                      <td className="p-3">{u.display_name ?? "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Switch checked={u.is_premium} onCheckedChange={() => togglePremium(u)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">User</th><th className="p-3">Plan</th>
                    <th className="p-3">Price</th><th className="p-3">Pay by</th>
                    <th className="p-3">Period end</th><th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No subscriptions yet.</td></tr>
                  )}
                  {subs.map((s) => {
                    const st = subscriptionStatus(s);
                    return (
                      <tr key={s.id} className="border-t border-border/60">
                        <td className="p-3 font-mono text-xs">{users.find((u) => u.id === s.user_id)?.email ?? "—"}</td>
                        <td className="p-3 capitalize">{s.plan_tier}</td>
                        <td className="p-3">{formatLKR(s.price_lkr)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(s.pay_by_date).toLocaleDateString()}</td>
                        <td className="p-3 text-xs text-muted-foreground">{s.period_end ? new Date(s.period_end).toLocaleDateString() : "—"}</td>
                        <td className="p-3">
                          <Badge
                            className={
                              st.tone === "active" ? "bg-primary text-primary-foreground"
                                : st.tone === "grace" ? "bg-warning text-warning-foreground"
                                  : "bg-destructive text-destructive-foreground"
                            }
                          >
                            {st.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant={s.is_paid ? "outline" : "default"} onClick={() => markPaid(s, !s.is_paid)}>
                              {s.is_paid ? "Mark unpaid" : "Mark paid"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => extendDeadline(s)}>Extend</Button>
                            {!s.cancelled && (
                              <Button size="sm" variant="ghost" onClick={() => disconnectSub(s)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">When</th><th className="p-3">User</th>
                    <th className="p-3">Action</th><th className="p-3">Config</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No activity yet.</td></tr>
                  )}
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t border-border/60">
                      <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{l.user_email ?? users.find((u) => u.id === l.user_id)?.email ?? "—"}</td>
                      <td className="p-3"><Badge variant="secondary">{l.action}</Badge></td>
                      <td className="p-3 text-xs">{l.config_label ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Config dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit config" : "Add new config"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>ISP *</Label>
              <Input value={form.isp} onChange={(e) => setForm({ ...form, isp: e.target.value })} placeholder="Dialog, Hutch, Mobitel, SLT, Airtel" />
            </div>
            <div>
              <Label>Package *</Label>
              <Input value={form.package_name} onChange={(e) => setForm({ ...form, package_name: e.target.value })} placeholder="724 Zoom / Social Media" />
            </div>
            <div className="md:col-span-2">
              <Label>Config name *</Label>
              <Input value={form.config_name} onChange={(e) => setForm({ ...form, config_name: e.target.value })} placeholder="e.g. Dialog Zoom #1" />
            </div>
            <div className="md:col-span-2">
              <Label>VLESS config (vless://...) *</Label>
              <Textarea rows={4} value={form.config_data} onChange={(e) => setForm({ ...form, config_data: e.target.value })} placeholder="vless://uuid@host:443?..." className="font-mono text-xs" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
            </div>
            <div>
              <Label>Expire date</Label>
              <Input type="datetime-local" value={form.expire_date} onChange={(e) => setForm({ ...form, expire_date: e.target.value })} />
            </div>
            <div className="flex items-end gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.requires_premium} onCheckedChange={(v) => setForm({ ...form, requires_premium: v })} />
                <Label>Premium only</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="mr-1 h-4 w-4" />Cancel</Button>
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">{editing ? "Save changes" : "Create config"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
