import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Lock, Search, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/configs")({
  component: Configs,
  head: () => ({ meta: [{ title: "Configs — coreVPN" }, { name: "description", content: "Browse free VLESS configs for Sri Lankan ISPs." }] }),
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
};

function Configs() {
  const { user, profile, loading, subscription, hasPlanAccess } = useAuth();
  const unlocked = Boolean(profile?.is_premium) || hasPlanAccess;
  const [configs, setConfigs] = useState<Config[]>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [ispFilter, setIspFilter] = useState<string>("all");


  useEffect(() => {
    if (!user) return;
    setBusy(true);
    supabase.from("configs").select("*").order("isp").order("package_name").then(({ data, error }) => {
      if (error) toast.error(error.message);
      setConfigs((data ?? []) as Config[]);
      setBusy(false);
    });
  }, [user]);

  const isps = useMemo(() => Array.from(new Set(configs.map((c) => c.isp))), [configs]);
  const filtered = useMemo(
    () => configs.filter((c) =>
      (ispFilter === "all" || c.isp === ispFilter) &&
      (query === "" || `${c.isp} ${c.package_name} ${c.config_name}`.toLowerCase().includes(query.toLowerCase()))
    ),
    [configs, query, ispFilter]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, Config[]>();
    for (const c of filtered) {
      const key = `${c.isp} • ${c.package_name}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const handleCopy = async (c: Config) => {
    if (c.requires_premium && !unlocked) {
      toast.error("This config needs an active plan. Pick a monthly plan to unlock it.");
      return;
    }

    try {
      await navigator.clipboard.writeText(c.config_data);
      toast.success(`Copied: ${c.config_name}`);
      void supabase.from("access_logs").insert({
        user_id: user!.id,
        action: "config_copied",
        config_id: c.id,
        config_label: `${c.isp} > ${c.package_name} > ${c.config_name}`,
      });
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  if (loading) {
    return <div className="container mx-auto p-16 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Lock className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold">Login required</h1>
        <p className="mt-3 text-muted-foreground">
          You need to be signed in to view and download VLESS configs. It's free — registration takes 10 seconds.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/auth">Login</Link></Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Link to="/auth" search={{ mode: "register" }}>Register free</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">All Configs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} configurations available {profile?.is_premium && <span className="ml-1 text-warning-foreground">• Premium unlocked</span>}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {/* ISP tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setIspFilter("all")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${ispFilter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
        >All ISPs</button>
        {isps.map((i) => (
          <button key={i} onClick={() => setIspFilter(i)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${ispFilter === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
          >{i}</button>
        ))}
      </div>

      {busy ? (
        <div className="mt-12 text-center text-muted-foreground">Loading configs…</div>
      ) : grouped.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-border/60 bg-card p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-xl font-bold">No configs yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">The admin hasn't uploaded any configs matching your filter yet. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map(([group, items]) => (
            <section key={group}>
              <h2 className="font-display text-lg font-bold text-muted-foreground">{group}</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
                    {c.requires_premium && (
                      <div className="absolute right-3 top-3">
                        <Badge className="gap-1 bg-warning text-warning-foreground"><Star className="h-3 w-3" />Premium</Badge>
                      </div>
                    )}
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{c.isp}</div>
                    <h3 className="mt-1 font-display text-lg font-bold">{c.config_name}</h3>
                    {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                    <div className="mt-3 truncate rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {c.config_data.slice(0, 60)}…
                    </div>
                    {c.expire_date && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Expires: {new Date(c.expire_date).toLocaleDateString()}
                      </div>
                    )}
                    <Button
                      onClick={() => handleCopy(c)}
                      size="sm"
                      className="mt-4 w-full bg-gradient-primary text-primary-foreground"
                      disabled={c.requires_premium && !unlocked}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {c.requires_premium && !unlocked ? "Plan required" : "Copy config"}
                    </Button>

                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
