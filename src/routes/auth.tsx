import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { notifyRegistration } from "@/lib/discord.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "register" ? ("register" as const) : ("login" as const),
  }),
  head: () => ({ meta: [{ title: "Login or Register — coreVPN" }] }),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
});
const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "Name too short").max(60),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const notifySignup = useServerFn(notifyRegistration);

  useEffect(() => {
    if (user) navigate({ to: "/configs" });
  }, [user, navigate]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const parsed = registerSchema.parse({ email, password, displayName });
        const { error } = await supabase.auth.signUp({
          email: parsed.email,
          password: parsed.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.displayName },
          },
        });
        if (error) throw error;
        void notifySignup({ data: { email: parsed.email, displayName: parsed.displayName, provider: "email" } });
        toast.success("Account created! Check your inbox to verify your email.");
      } else {
        const parsed = loginSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.email, password: parsed.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/configs" });
      }
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border/60 bg-card p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to download configs" : "Free forever. No credit card."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <Label htmlFor="name">Display name</Label>
              <div className="relative mt-1">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-9" placeholder="John Doe" />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-medium text-primary hover:underline">
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back home</Link>
        </p>
      </div>
    </div>
  );
}
