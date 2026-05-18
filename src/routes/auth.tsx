import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

  useEffect(() => {
    if (user) navigate({ to: "/configs" });
  }, [user, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    toast.success("Signed in!");
    navigate({ to: "/configs" });
  };

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

        <Button type="button" onClick={handleGoogle} disabled={busy} variant="outline" className="mt-6 w-full">
          <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
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
