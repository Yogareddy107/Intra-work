import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Loader2, Sparkles, Zap, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — IntraWork" },
      { name: "description", content: "Access your premium enterprise workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, resetPassword, session, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(error);
      toast.error("Sign in failed", { description: error });
    } else {
      toast.success("Welcome back!");
      router.invalidate();
    }
  }

  async function onResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await resetPassword(email.trim());
    setBusy(false);
    if (error) {
      toast.error("Reset failed", { description: error });
    } else {
      toast.success("Check your email", { description: "We've sent you a password reset link." });
      setMode("login");
    }
  }

  const quickLogin = async (role: "admin" | "employee") => {
    setEmail(role === "admin" ? "teamintrasphere@gmail.com" : "rahul@intrasphere.io");
    setPassword(role === "admin" ? "Teamintra" : "password123");
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden font-sans">
      {/* Left Side: Branding/Visual */}
      <div className="relative hidden w-0 flex-1 lg:block overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#3b82f6_0%,#1e3a8a_50%,#0f172a_100%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl transition-transform hover:scale-110">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">IntraWork</span>
          </div>

          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge
              variant="outline"
              className="mb-4 border-white/20 bg-white/5 text-white/90 px-3 py-1 text-xs uppercase tracking-widest font-bold"
            >
              Enterprise v2.0
            </Badge>
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              The OS for <br />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">
                Modern Teams.
              </span>
            </h2>
            <p className="mt-6 text-lg text-blue-100/70 leading-relaxed">
              Experience the world's most sophisticated workspace. From HR to Dev workflows, managed
              in one premium platform.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-10">
              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success transition-transform group-hover:scale-110">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Ultra Fast</p>
                  <p className="text-xs text-white/50">Optimized for speed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-blue-300 transition-transform group-hover:scale-110">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Premium UI</p>
                  <p className="text-xs text-white/50">State-of-the-art design.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/30 font-medium italic">
            © 2026 Intrasphere Labs. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background/50 backdrop-blur-3xl relative">
        <div className="absolute top-0 right-0 p-8 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">IntraWork</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500">
          {mode === "login" ? (
            <>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  Enter your credentials to access your workspace.
                </p>
              </div>

              <div className="mt-10">
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Work Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-premium hover:opacity-95 transition-all active:scale-[0.98]"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Sign in <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="text-center lg:text-left">
                <button
                  onClick={() => setMode("login")}
                  className="mb-6 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" /> Back to sign in
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Reset Password
                </h1>
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              <div className="mt-10">
                <form onSubmit={onResetRequest} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="reset-email"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Your Email
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-premium hover:opacity-95 transition-all active:scale-[0.98]"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link <Sparkles className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "outline" ? "text-foreground" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
