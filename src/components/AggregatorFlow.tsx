import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  FlaskConical,
  Landmark,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AA_PROVIDERS,
  CONSENT_TERMS,
  SANDBOX_ACCOUNTS,
  buildSandboxTransactions,
  detectRecurring,
  monthlyEquivalent,
  type AAProvider,
  type RecurringFinding,
} from "@/lib/aggregator";

type Step = "link" | "otp" | "accounts" | "consent" | "fetching" | "results";

const STEPS: { id: Step; label: string }[] = [
  { id: "link", label: "Link" },
  { id: "otp", label: "Verify" },
  { id: "accounts", label: "Accounts" },
  { id: "consent", label: "Consent" },
  { id: "results", label: "Results" },
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

type Props = {
  /** Called with the findings the user selected. Omit for the public demo. */
  onImport?: (items: RecurringFinding[]) => Promise<void> | void;
  /** Public demo hand-off (e.g. "Create account to save these"). */
  onGuestContinue?: (items: RecurringFinding[]) => void;
  /** Skip straight to results with these findings (restored after sign-up). */
  initialFindings?: RecurringFinding[] | null;
};

export function AggregatorFlow({ onImport, onGuestContinue, initialFindings }: Props) {
  const [step, setStep] = useState<Step>(initialFindings?.length ? "results" : "link");
  const [provider, setProvider] = useState<AAProvider>(AA_PROVIDERS[0]);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [accountIds, setAccountIds] = useState<string[]>(SANDBOX_ACCOUNTS.map((a) => a.id));
  const [progress, setProgress] = useState(0);
  const [findings, setFindings] = useState<RecurringFinding[]>(initialFindings ?? []);
  const [txnCount, setTxnCount] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set((initialFindings ?? []).map((f) => f.key)));
  const [busy, setBusy] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const mobileValid = /^[6-9]\d{9}$/.test(mobile);
  const handle = mobileValid ? `${mobile}${provider.handle}` : `98XXXXXXXX${provider.handle}`;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [step]);

  // Simulated fetch: progress bar, then synthetic data + real detection logic.
  useEffect(() => {
    if (step !== "fetching") return;
    setProgress(0);
    const tick = setInterval(() => setProgress((p) => Math.min(100, p + 7)), 110);
    const done = setTimeout(() => {
      const txns = buildSandboxTransactions(accountIds);
      const found = detectRecurring(txns);
      setTxnCount(txns.length);
      setFindings(found);
      setPicked(new Set(found.map((f) => f.key)));
      setStep("results");
    }, 1700);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [step, accountIds]);

  const monthlyTotal = useMemo(
    () => findings.filter((f) => picked.has(f.key)).reduce((s, f) => s + monthlyEquivalent(f), 0),
    [findings, picked],
  );
  const selected = findings.filter((f) => picked.has(f.key));

  const reset = () => {
    setStep("link");
    setOtp("");
    setOtpError("");
    setFindings([]);
  };

  const verifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    setOtpError("");
    setStep("accounts");
  };

  const stepIndex = STEPS.findIndex((s) => s.id === (step === "fetching" ? "consent" : step));

  return (
    <div ref={topRef} className="rounded-xl border border-border bg-card shadow-xl overflow-hidden scroll-mt-24">
      {/* Sandbox banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/30 bg-gold-soft/30 px-4 py-2.5 text-[11px] font-bold text-gold">
        <span className="flex items-center gap-1.5">
          <FlaskConical className="size-3.5" /> SANDBOX · Synthetic data, no real bank is contacted
        </span>
        <span className="font-mono text-[10px] opacity-80">consent-flow v2 (ReBIT-style)</span>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-1 border-b border-border px-4 py-3 sm:px-6" aria-label="Progress">
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                aria-current={active ? "step" : undefined}
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition-colors ${
                  done
                    ? "border-sage bg-sage text-background"
                    : active
                      ? "border-gold bg-gold text-background"
                      : "border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span
                className={`hidden text-[11px] font-bold sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      <div className="p-5 sm:p-8">
        {/* 1. Link */}
        {step === "link" && (
          <div className="space-y-6">
            <Header
              kicker="STEP 1"
              title="Choose your Account Aggregator"
              body="An AA is an RBI-licensed middleman. It passes your bank data to Nudge only after you approve - and you can revoke at any time."
            />
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Account Aggregator">
              {AA_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={provider.id === p.id}
                  onClick={() => setProvider(p)}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    provider.id === p.id ? "border-gold bg-gold-soft/20" : "border-border hover:border-gold/50"
                  }`}
                >
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-gold">
                    <Landmark className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{p.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{p.tagline}</span>
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="aa-mobile" className="form-label">
                MOBILE NUMBER LINKED TO YOUR BANK
              </label>
              <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center gap-1.5 border-r border-input bg-secondary/50 px-3 text-xs font-bold text-muted-foreground">
                  <Smartphone className="size-3.5" /> +91
                </span>
                <input
                  id="aa-mobile"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="h-11 w-full bg-transparent px-3 text-sm tabular-nums outline-none"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Your AA handle: <span className="font-mono text-foreground">{handle}</span> · Any Indian mobile format works in the sandbox.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMobile("9876543210")}
                className="text-xs font-bold text-sage hover:underline"
              >
                Use a demo number
              </button>
              <Button disabled={!mobileValid} onClick={() => setStep("otp")} className="gap-2 font-bold">
                Send OTP <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 2. OTP */}
        {step === "otp" && (
          <div className="space-y-6">
            <Header
              kicker="STEP 2"
              title="Verify it's you"
              body={`${provider.name} sent a 6-digit code to +91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}. In this sandbox any 6 digits will work.`}
            />
            <div>
              <label htmlFor="aa-otp" className="form-label">
                ONE-TIME PASSWORD
              </label>
              <input
                id="aa-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                placeholder="• • • • • •"
                aria-invalid={Boolean(otpError)}
                aria-describedby={otpError ? "aa-otp-err" : undefined}
                className="h-12 w-full rounded-md border border-input bg-background px-4 text-center font-mono text-xl tracking-[0.5em] outline-none focus:ring-1 focus:ring-ring"
              />
              {otpError && (
                <p id="aa-otp-err" role="alert" className="mt-2 text-xs font-semibold text-destructive">
                  {otpError}
                </p>
              )}
            </div>
            <Nav onBack={() => setStep("link")} onNext={verifyOtp} nextLabel="Verify & continue" />
          </div>
        )}

        {/* 3. Accounts */}
        {step === "accounts" && (
          <div className="space-y-6">
            <Header
              kicker="STEP 3"
              title="Pick accounts to include"
              body="We found these accounts discovered under your number. Only the ones you tick will be shared."
            />
            <div className="space-y-2.5">
              {SANDBOX_ACCOUNTS.map((a) => {
                const on = accountIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                      on ? "border-gold/60 bg-gold-soft/10" : "border-border opacity-70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setAccountIds((prev) => (on ? prev.filter((x) => x !== a.id) : [...prev, a.id]))
                      }
                      className="size-4 accent-gold"
                    />
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-gold">
                      {a.type === "Credit Card" ? <CreditCard className="size-4" /> : <Banknote className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{a.bank}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {a.type} · {a.mask}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <Nav
              onBack={() => setStep("otp")}
              onNext={() => setStep("consent")}
              nextLabel="Review consent"
              disabled={accountIds.length === 0}
            />
          </div>
        )}

        {/* 4. Consent */}
        {step === "consent" && (
          <div className="space-y-6">
            <Header
              kicker="STEP 4"
              title="Review the consent request"
              body="This is exactly what Nudge is asking for. Nothing more can be fetched."
            />
            <dl className="divide-y divide-border rounded-lg border border-border text-sm">
              {[
                ["Purpose", CONSENT_TERMS.purpose],
                ["Data requested", CONSENT_TERMS.dataTypes.join(" · ")],
                ["Date range", CONSENT_TERMS.fetchRange],
                ["Consent valid for", CONSENT_TERMS.consentValidity],
                ["Fetch frequency", CONSENT_TERMS.frequency],
                ["Accounts", `${accountIds.length} of ${SANDBOX_ACCOUNTS.length} selected`],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[150px_1fr]">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-2.5 text-[11px] text-muted-foreground sm:grid-cols-3">
              <Pill icon={Lock} text="No passwords or PINs shared" />
              <Pill icon={Eye} text="Read-only. Cannot move money" />
              <Pill icon={ShieldCheck} text="Revoke anytime from your AA app" />
            </div>
            <Nav
              onBack={() => setStep("accounts")}
              onNext={() => setStep("fetching")}
              nextLabel="Approve & fetch"
              nextIcon={<CheckCircle2 className="size-4" />}
            />
          </div>
        )}

        {/* 5. Fetching */}
        {step === "fetching" && (
          <div className="space-y-6 py-6 text-center" role="status" aria-live="polite">
            <Loader2 className="mx-auto size-8 animate-spin text-gold" />
            <div>
              <h3 className="font-display text-2xl">Fetching from your banks…</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {progress < 45
                  ? "Consent artefact signed · requesting data"
                  : progress < 85
                    ? "Decrypting transactions in your browser"
                    : "Looking for recurring patterns"}
              </p>
            </div>
            <div className="mx-auto h-1.5 max-w-sm overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gold transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* 6. Results */}
        {step === "results" && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Transactions scanned" value={txnCount ? txnCount.toString() : "—"} />
              <Stat label="Recurring found" value={String(findings.length)} accent="gold" />
              <Stat label="Monthly run-rate" value={inr(monthlyTotal)} accent="sage" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <span>Detected subscriptions</span>
                <span>
                  {selected.length} of {findings.length} selected
                </span>
              </div>
              <ul className="space-y-2">
                {findings.map((f) => {
                  const on = picked.has(f.key);
                  const hike = f.previousAmount && f.amount > f.previousAmount;
                  return (
                    <li key={f.key}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          on ? "border-gold/50 bg-gold-soft/10" : "border-border opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setPicked((prev) => {
                              const next = new Set(prev);
                              if (next.has(f.key)) next.delete(f.key);
                              else next.add(f.key);
                              return next;
                            })
                          }
                          className="size-4 shrink-0 accent-gold"
                        />
                        <span className="brand-icon flex size-9 shrink-0 items-center justify-center rounded-md font-display text-lg">
                          {f.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 text-sm font-bold">
                            {f.name}
                            {hike && (
                              <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-destructive">
                                <TrendingUp className="size-2.5" /> Price up {inr(f.amount - f.previousAmount!)}
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {f.cycle} · {f.occurrences} charges · {f.paymentMethod} · next ~{" "}
                            {new Date(f.nextRenewal).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-sm font-bold tabular-nums">{inr(f.amount)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {findings.length === 0 && (
                <p className="rounded-md border border-border p-4 text-xs text-muted-foreground">
                  No recurring charges were detected in the selected accounts.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" size="sm" onClick={reset} className="gap-2 self-start text-muted-foreground">
                <RotateCcw className="size-3.5" /> Run again
              </Button>
              {onImport ? (
                <Button
                  disabled={busy || selected.length === 0}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onImport(selected);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="gap-2 font-bold"
                >
                  {busy ? "Adding…" : `Add ${selected.length} to my ledger`} <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  disabled={selected.length === 0}
                  onClick={() => onGuestContinue?.(selected)}
                  className="gap-2 font-bold"
                >
                  Create free account to save these <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Sandbox results use made-up transactions. Real AA connection is coming once Nudge completes FIU onboarding.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div>
      <p className="section-kicker">{kicker}</p>
      <h3 className="font-display text-2xl sm:text-3xl leading-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel,
  nextIcon,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back
      </Button>
      <Button onClick={onNext} disabled={disabled} className="gap-2 font-bold">
        {nextLabel} {nextIcon ?? <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}

function Pill({ icon: Icon, text }: { icon: typeof Lock; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
      <Icon className="size-3.5 shrink-0 text-sage" />
      <span>{text}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "gold" | "sage" }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3.5">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-3xl tabular-nums ${accent === "gold" ? "text-gold" : accent === "sage" ? "text-sage" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
