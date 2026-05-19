import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Crown, Calendar, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — coreVPN" }] }),
});

function ProfilePage() {
  const { user, profile, isAdmin, loading, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Re-fetch role/profile on mount so newly-granted admin shows up without re-login
  useEffect(() => { if (user) void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  useEffect(() => { setDisplayName(profile?.display_name ?? ""); }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); await refresh(); }
  };

  if (loading || !user) return <div className="container mx-auto p-16 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your coreVPN account</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" asChild><Link to="/admin">Admin Panel</Link></Button>
            )}
            <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-1.5 h-4 w-4" />Sign out
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
            <div className="mt-1 font-mono text-sm">{user.email}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Plan</div>
            <div className="mt-1 flex items-center gap-2">
              {profile?.is_premium ? (
                <><Crown className="h-4 w-4 text-warning-foreground" /><span className="font-semibold">Premium</span></>
              ) : (
                <><Star className="h-4 w-4 text-muted-foreground" /><span>Free</span></>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Label htmlFor="dn">Display name</Label>
          <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
          <Button onClick={save} disabled={busy} className="bg-gradient-primary text-primary-foreground">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Premium upgrade CTA */}
      {!profile?.is_premium && (
        <div className="mt-8 overflow-hidden rounded-3xl border border-warning/40 bg-gradient-hero p-8">
          <div className="flex items-start gap-3">
            <Crown className="h-6 w-6 text-warning-foreground" />
            <div>
              <h2 className="font-display text-2xl font-bold">Upgrade to coreVPN Pro</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Unlock all premium configs, priority releases &amp; ultra-fast servers. To upgrade, send a request to the admin and they will activate Premium on your account.
              </p>
              <ul className="mt-4 list-inside list-disc text-sm text-muted-foreground">
                <li>Unlimited premium-only configs</li>
                <li>New configs as soon as released</li>
                <li>Priority support</li>
              </ul>
              <Button className="mt-5 bg-gradient-primary text-primary-foreground shadow-glow" asChild>
                <a href="mailto:godfather.devup@gmail.com?subject=coreVPN%20Premium%20Upgrade%20Request">
                  Request upgrade
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
        <Calendar className="mr-1 inline h-3 w-3" />
        Joined {profile?.id && new Date((profile as { created_at?: string }).created_at ?? "").toLocaleDateString()}
      </div>
    </div>
  );
}
