import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionActive, type Subscription } from "@/lib/plans";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  subscription: Subscription | null;
  hasPlanAccess: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string, email: string | undefined) => {
    const [{ data: prof }, { data: roles }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .eq("cancelled", false)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setProfile((prof as Profile | null) ?? null);
    setIsAdmin((roles ?? []).some((r: { role: string }) => r.role === "admin"));
    setSubscription(((subs ?? [])[0] as Subscription | undefined) ?? null);
    // Log login once per session start
    void supabase.from("access_logs").insert({
      user_id: uid,
      action: "session_active",
    });
  };


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { void loadExtras(s.user.id, s.user.email); }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setSubscription(null);
      }

    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void loadExtras(data.session.user.id, data.session.user.email);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (user) await loadExtras(user.id, user.email);
  };

  const signOut = async () => {
    // Stop in-flight queries before 401s land, then drop cached protected data.
    await queryClient.cancelQueries();
    queryClient.clear();
    setProfile(null);
    setIsAdmin(false);
    setSubscription(null);
    setSession(null);
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Session may already be gone (missing/expired) — safe to ignore.
      console.warn("signOut:", e);
    }
  };

  const hasPlanAccess = subscriptionActive(subscription);

  return (
    <Ctx.Provider value={{ user, session, profile, isAdmin, subscription, hasPlanAccess, loading, signOut, refresh }}>

      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
