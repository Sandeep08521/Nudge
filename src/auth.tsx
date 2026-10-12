import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, RefreshCw, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authService, type AuthSession } from "@/lib/authService";
import { toast } from "sonner";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="paper-surface grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="ledger-mark flex size-10 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground shadow-sm">
            <span className="font-display text-3xl italic leading-none">N</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[26px] text-foreground">Nudge</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Take back recurring spend</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 md:p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

export function Splash() {
  return (
    <div className="paper-surface grid min-h-screen place-items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-gold animate-ping" />
        <span>Loading your workspace…</span>
      </div>
    </div>
  );
}

type Mode = "signin" | "signup";

export function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (session: AuthSession) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryMode = searchParams.get("mode");
  const [mode, setMode] = useState<Mode>(queryMode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Email verification / OTP states
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [emailTypoSuggestion, setEmailTypoSuggestion] = useState<string | null>(null);

  // Google sign in states
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  useEffect(() => {
    if (queryMode === "signup" || queryMode === "signin") {
      setMode(queryMode);
    }
  }, [queryMode]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setSearchParams({ mode: next });
    setError("");
    setNotice("");
    setOtpStep(false);
    setOtpCode("");
    setEmailTypoSuggestion(null);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setError("");
    if (mode === "signup" && val.includes("@") && val.includes(".")) {
      const res = authService.validateEmail(val);
      if (res.suggestion && res.suggestion !== val.toLowerCase()) {
        setEmailTypoSuggestion(res.suggestion);
      } else {
        setEmailTypoSuggestion(null);
      }
    } else {
      setEmailTypoSuggestion(null);
    }
  };

  const applySuggestedEmail = () => {
    if (emailTypoSuggestion) {
      setEmail(emailTypoSuggestion);
      setEmailTypoSuggestion(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (mode === "signin") {
        const session = await authService.signIn(email, password);
        onAuthSuccess(session);
        navigate("/dashboard");
      } else {
        // Sign up with email verification
        const res = await authService.sendVerificationCode(email, password);
        setOtpStep(true);
        setSimulatedOtp(res.simulatedCode || "");
        setNotice(res.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed. Please check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const session = await authService.verifyOtp(email, otpCode);
      toast.success("Email verified successfully! Welcome to Nudge.");
      onAuthSuccess(session);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setBusy(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await authService.sendVerificationCode(email, password);
      setSimulatedOtp(res.simulatedCode || "");
      toast.success("A new verification code has been dispatched!");
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAuthClick = async () => {
    setError("");
    setNotice("");

    if (authService.isCloudActive()) {
      setBusy(true);
      try {
        await authService.signInWithGoogle();
      } catch (err) {
        console.warn("Supabase Google OAuth fallback:", err);
        setGoogleModalOpen(true);
      } finally {
        setBusy(false);
      }
    } else {
      setGoogleModalOpen(true);
    }
  };

  const handleExecuteGoogleAccount = async (targetEmail: string) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const session = await authService.signInWithGoogle(targetEmail);
      if (session.user.id !== "oauth_redirecting") {
        setGoogleModalOpen(false);
        onAuthSuccess(session);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const isCloud = authService.isCloudActive();

  return (
    <Shell>
      {/* Mode Switch Tabs (hidden during OTP step) */}
      {!otpStep && (
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`flex-1 pb-3 text-center text-xs font-bold transition-all border-b-2 ${
              mode === "signin"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 pb-3 text-center text-xs font-bold transition-all border-b-2 ${
              mode === "signup"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Create New Account
          </button>
        </div>
      )}

      {/* STEP 1: LOGIN OR REGISTRATION */}
      {!otpStep ? (
        <>
          <div className="mb-5">
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              {mode === "signin" ? "Welcome back." : "Start fresh with clarity."}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your personal subscription ledger."
                : "Create your private account with email verification. Zero bank linking."}
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuthClick}
              disabled={busy}
              className="w-full h-10 text-xs font-bold gap-3 border-border bg-card hover:bg-secondary/70 transition-all shadow-xs"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Typo Correction Prompt */}
              {emailTypoSuggestion && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gold">
                  <span>Did you mean <strong>{emailTypoSuggestion}</strong>?</span>
                  <button
                    type="button"
                    onClick={applySuggestedEmail}
                    className="font-bold underline hover:text-foreground"
                  >
                    Use suggestion
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {notice && (
              <div role="status" className="rounded-md border border-sage/30 bg-sage-soft/30 p-3 text-xs text-sage">
                {notice}
              </div>
            )}

            <Button type="submit" className="w-full font-bold h-9 text-xs mt-2" disabled={busy}>
              {busy ? "Validating & Submitting…" : mode === "signin" ? "Sign In to Nudge" : "Verify Email & Create Account"}
            </Button>
          </form>
        </>
      ) : (
        /* STEP 2: EMAIL VERIFICATION CODE (OTP) SCREEN */
        <div className="space-y-4">
          <div className="text-center space-y-1.5">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-gold-soft text-gold mb-2">
              <KeyRound className="size-5" />
            </div>
            <h2 className="font-display text-2xl text-foreground">Verify your email address</h2>
            <p className="text-xs text-muted-foreground">
              We sent a 6-digit verification code to:
              <br />
              <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          {/* Test / Offline Mode Code Helper Badge */}
          {simulatedOtp && (
            <div className="rounded-lg border border-gold/40 bg-gold-soft/20 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gold flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> Preview Mode Verification
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(simulatedOtp)}
                  className="text-[10px] font-black uppercase text-gold hover:underline"
                >
                  Auto-fill code
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your 6-digit code is: <strong className="font-mono text-foreground text-sm tracking-widest">{simulatedOtp}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">
                Enter 6-digit verification code
              </Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="text-center font-mono text-lg tracking-[0.4em] font-extrabold h-11"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {notice && (
              <div role="status" className="rounded-md border border-sage/30 bg-sage-soft/30 p-3 text-xs text-sage">
                {notice}
              </div>
            )}

            <Button type="submit" className="w-full font-bold h-9 text-xs" disabled={busy || otpCode.length !== 6}>
              {busy ? "Verifying Code…" : "Confirm Code & Enter Workspace"}
            </Button>

            <div className="flex items-center justify-between text-xs pt-2 text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setError("");
                }}
                className="hover:text-foreground font-semibold"
              >
                ← Edit email address
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={busy}
                className="text-gold hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className={`size-3 ${busy ? "animate-spin" : ""}`} /> Resend code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security note */}
      <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-sage" />
          {isCloud ? "Cloud Synced via Supabase" : "Encrypted Local Storage"}
        </span>
        <span>Global Edition</span>
      </div>

      {/* Google Account Selector Dialog */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary/70 mb-2">
              <svg className="size-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <DialogTitle className="text-center font-display text-xl">Sign in with Google</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Choose an account to continue to Nudge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Account Option 1 */}
            <button
              type="button"
              onClick={() => handleExecuteGoogleAccount(email && email.includes("@") ? email : "alex.developer@gmail.com")}
              disabled={busy}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="size-8.5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {(email && email.includes("@") ? email.charAt(0) : "A").toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {email && email.includes("@") ? email.split("@")[0] : "Alex"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {email && email.includes("@") ? email : "alex.developer@gmail.com"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary px-2.5 py-1 bg-secondary rounded group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Continue →
              </span>
            </button>

            {/* Account Option 2 */}
            <button
              type="button"
              onClick={() => handleExecuteGoogleAccount("subscriber.demo@gmail.com")}
              disabled={busy}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/40 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="size-8.5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  N
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Nudge Subscriber</p>
                  <p className="text-[11px] text-muted-foreground">subscriber.demo@gmail.com</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-primary px-2.5 py-1 bg-secondary rounded group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Continue →
              </span>
            </button>

            {/* Custom Google account input */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Or enter another Gmail account:
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="text-xs h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customGoogleEmail.trim()) {
                      e.preventDefault();
                      handleExecuteGoogleAccount(customGoogleEmail.trim());
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (customGoogleEmail.trim()) {
                      handleExecuteGoogleAccount(customGoogleEmail.trim());
                    }
                  }}
                  disabled={!customGoogleEmail.trim() || busy}
                  className="h-9 px-3.5 text-xs font-bold shrink-0"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
