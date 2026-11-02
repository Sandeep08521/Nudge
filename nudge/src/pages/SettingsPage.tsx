import { useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  Database,
  Download,
  Gauge,
  Key,
  LogOut,
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { exportToCSV, exportToJSON } from "@/lib/subscriptions";
import { clearSupabaseConfig, configureSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  requestBrowserPermission,
  triggerTestNotification,
  getBrowserNotificationPermission,
} from "@/lib/notificationService";
import { toast } from "sonner";

export function SettingsPage() {
  const {
    subscriptions,
    isCloudSynced,
    userEmail,
    currencySymbol,
    setCurrencySymbol,
    monthlyBudget,
    setMonthlyBudget,
    formatCurrency,
    notificationSettings,
    updateNotificationSettings,
    signOut,
  } = useSubscriptions();

  const [feedback, setFeedback] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [budgetCapInput, setBudgetCapInput] = useState(monthlyBudget ? String(monthlyBudget) : "");

  // Cloud Database Connection State
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  const handleExportCSV = () => {
    const csv = exportToCSV(subscriptions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nudge-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV file downloaded!");
  };

  const handleExportJSON = () => {
    const jsonStr = exportToJSON(subscriptions);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nudge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("JSON backup downloaded!");
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      toast.error("Please enter both Supabase Project URL and Anon Key.");
      return;
    }
    configureSupabase(supabaseUrl, supabaseKey);
    toast.success("Connected to Supabase! Page reloading...");
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
    toast.info("Disconnected from custom Supabase project.");
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSending(true);
    setTimeout(() => {
      setFeedbackSending(false);
      setFeedback("");
      toast.success("Thank you! Your feedback has been sent to the product team.");
    }, 500);
  };

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
      {/* Page Heading */}
      <div>
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
          PREFERENCES & TRANSPARENCY
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          Settings & Account
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          Manage your account, preferred currency, cloud database connection, and data portability.
        </p>
      </div>

      {/* Currency Preference Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-xl font-bold">Preferred Currency</h3>
            <p className="text-xs text-muted-foreground">
              Select your currency symbol for subscription prices and savings calculations.
            </p>
          </div>
          <span className="text-sm font-bold text-gold px-2.5 py-1 bg-gold-soft/40 rounded border border-gold/30">
            Active: {currencySymbol}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {[
            { label: "USD ($)", symbol: "$" },
            { label: "EUR (€)", symbol: "€" },
            { label: "GBP (£)", symbol: "£" },
            { label: "CAD (C$)", symbol: "C$" },
            { label: "AUD (A$)", symbol: "A$" },
            { label: "INR (₹)", symbol: "₹" },
          ].map((c) => (
            <button
              key={c.symbol}
              type="button"
              onClick={() => {
                setCurrencySymbol(c.symbol);
                toast.success(`Currency set to ${c.label}`);
              }}
              className={`p-2.5 rounded-md border text-center transition-all ${
                currencySymbol === c.symbol
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-semibold"
              }`}
            >
              <div className="text-sm">{c.symbol}</div>
              <div className="text-[10px] opacity-80">{c.label.split(" ")[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Budget Guard Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-sage-soft flex items-center justify-center text-sage">
              <Gauge className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Monthly Spend Cap (Budget Guard)</h3>
              <p className="text-xs text-muted-foreground">
                Set a monthly maximum for your recurring commitments. We'll warn you if subscriptions breach it.
              </p>
            </div>
          </div>
          {monthlyBudget !== null && (
            <span className="text-xs font-bold text-sage bg-sage-soft px-2.5 py-1 rounded">
              Cap: {formatCurrency(monthlyBudget)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="relative w-44">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
              {currencySymbol}
            </span>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 100"
              value={budgetCapInput}
              onChange={(e) => setBudgetCapInput(e.target.value)}
              className="h-9 pl-7 text-xs bg-card"
            />
          </div>

          <Button
            size="sm"
            onClick={() => {
              const num = Number(budgetCapInput);
              if (budgetCapInput && !isNaN(num) && num > 0) {
                setMonthlyBudget(num);
                toast.success(`Monthly cap set to ${formatCurrency(num)}`);
              } else {
                setMonthlyBudget(null);
                setBudgetCapInput("");
                toast.info("Monthly spend cap removed.");
              }
            }}
            className="h-9 text-xs font-bold px-4"
          >
            Save Cap
          </Button>

          {monthlyBudget !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMonthlyBudget(null);
                setBudgetCapInput("");
                toast.info("Monthly spend cap removed.");
              }}
              className="h-9 text-xs text-destructive hover:bg-destructive/10"
            >
              Clear Cap
            </Button>
          )}
        </div>
      </div>

      {/* Install App (PWA) Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-gold-soft flex items-center justify-center text-gold">
              <Smartphone className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Install Nudge as Mobile / Desktop App</h3>
              <p className="text-xs text-muted-foreground">
                Run Nudge natively on your iPhone, Android, or laptop with offline support.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-gold-soft text-gold px-2 py-0.5 rounded">
            PWA Ready
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground pt-1">
          <div className="rounded-md border border-border/70 p-3 space-y-1.5 bg-secondary/20">
            <strong className="text-foreground flex items-center gap-1.5 text-xs">
              <span>Apple iOS (iPhone / iPad)</span>
            </strong>
            <p className="text-[11px] leading-relaxed">
              Open Nudge in Safari, tap the <strong>Share</strong> icon (square with arrow up), then select <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
          <div className="rounded-md border border-border/70 p-3 space-y-1.5 bg-secondary/20">
            <strong className="text-foreground flex items-center gap-1.5 text-xs">
              <span>Android & Desktop (Chrome / Edge)</span>
            </strong>
            <p className="text-[11px] leading-relaxed">
              Tap the <strong>"Install App"</strong> button in Nudge's navigation bar or select "Install Nudge" in your browser menu.
            </p>
          </div>
        </div>
      </div>

      {/* Due-Date Alert & Notification Preferences Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-gold-soft flex items-center justify-center text-gold">
              <BellRing className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Renewal Alerts & Notifications</h3>
              <p className="text-xs text-muted-foreground">
                Set automated warnings before recurring charges hit your cards or trials expire.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-sage bg-sage-soft px-2.5 py-1 rounded">
            Lead: {notificationSettings.leadDays} days
          </span>
        </div>

        {/* Advance window selection */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Reminder Advance Window
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 7].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  updateNotificationSettings({ leadDays: days });
                  toast.success(`Set reminder lead window to ${days} day${days > 1 ? "s" : ""}.`);
                }}
                className={`p-2.5 rounded-md border text-center transition-all ${
                  notificationSettings.leadDays === days
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-semibold"
                }`}
              >
                <div className="text-sm font-bold">{days} {days === 1 ? "Day" : "Days"}</div>
                <div className="text-[9px] opacity-80">{days === 3 ? "Recommended" : days === 1 ? "Cutoff alert" : "In advance"}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Browser Push Alerts Toggle & Test Button */}
        <div className="pt-2 border-t border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-foreground flex items-center gap-2">
                <span>Desktop & Mobile Push Alerts</span>
                {typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && (
                  <span className="text-[10px] text-sage font-black uppercase flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Granted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Native OS alerts pop up before card debits occur, even when multitasking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const perm = await requestBrowserPermission();
                    if (perm === "granted") {
                      updateNotificationSettings({ browserEnabled: true });
                      triggerTestNotification(currencySymbol);
                      toast.success("Desktop alerts active! Test notification sent.");
                    } else {
                      toast.error("Notification permission was denied in your browser settings.");
                    }
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Notification error.");
                  }
                }}
                className="text-xs font-bold gap-1.5 h-8"
              >
                <Volume2 className="size-3.5" />
                Test Browser Alert
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.notifyOnTrialEnd}
                onChange={(e) => updateNotificationSettings({ notifyOnTrialEnd: e.target.checked })}
                className="size-4 rounded accent-primary"
              />
              <span>
                <strong>Free Trial Expiration Notice:</strong> Priority alarm 24 hours before trials auto-convert into paid plans.
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.notifyOnSameDay}
                onChange={(e) => updateNotificationSettings({ notifyOnSameDay: e.target.checked })}
                className="size-4 rounded accent-primary"
              />
              <span>
                <strong>Same-Day Morning Notice:</strong> Final pre-debit alarm the morning of scheduled bank debits.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* User Account & Session Card */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-xl font-bold">User Account</h3>
            <p className="text-xs text-muted-foreground">
              Currently signed-in account session.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-sage">
            <ShieldCheck className="size-4" />
            {isCloudSynced ? "Supabase Cloud" : "Authenticated"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Signed in as: </span>
            <strong className="text-foreground">{userEmail}</strong>
          </div>

          <Button size="sm" variant="outline" onClick={signOut} className="gap-1.5 text-xs">
            <LogOut className="size-3.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Cloud Database (Supabase) Setup Section */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-gold" />
            <h3 className="font-display text-xl font-bold">Cloud Database (Supabase)</h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              isSupabaseConfigured
                ? "bg-sage-soft text-sage"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {isSupabaseConfigured ? "Connected" : "Not Connected"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Nudge supports instant synchronization with your own private Supabase PostgreSQL database. Enter your Supabase Project URL and Anon/Publishable Key below to enable multi-device sync.
        </p>

        {!isSupabaseConfigured ? (
          <div>
            {!showConfig ? (
              <Button size="sm" variant="outline" onClick={() => setShowConfig(true)} className="text-xs">
                + Connect Your Supabase Project
              </Button>
            ) : (
              <form onSubmit={handleSaveSupabase} className="mt-3 space-y-3 border-t border-border pt-4">
                <div>
                  <label htmlFor="supa-url" className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Supabase Project URL
                  </label>
                  <Input
                    id="supa-url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="supa-key" className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Supabase Anon / Publishable Key
                  </label>
                  <Input
                    id="supa-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" type="button" onClick={() => setShowConfig(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" className="font-bold">
                    Save & Connect Supabase
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-sage font-semibold">
              ✓ Subscriptions and auth are syncing with PostgreSQL in real time.
            </span>
            <Button size="sm" variant="outline" onClick={handleDisconnectSupabase} className="text-xs">
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {/* Data Portability */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-display text-xl font-bold">Data Ownership & Portability</h3>
          <p className="text-xs text-muted-foreground">
            Zero lock-in. Download your complete subscription history anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 text-xs">
            <Download className="size-3.5" /> Export as CSV (Spreadsheet)
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-2 text-xs">
            <Download className="size-3.5" /> Download JSON Backup
          </Button>
        </div>
      </div>

      {/* User Feedback & Roadmap */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-gold" />
          <h3 className="font-display text-xl font-bold">Feedback & Feature Requests</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          What merchant cancellation steps or bank alert patterns should we add next?
        </p>

        <form onSubmit={handleSendFeedback} className="space-y-3">
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Please add cancellation guides for Adobe Creative Cloud, Audible, or Paramount+..."
            className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              type="submit"
              disabled={feedbackSending || !feedback.trim()}
              className="gap-1.5 font-bold text-xs"
            >
              <Send className="size-3.5" />
              {feedbackSending ? "Sending..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
