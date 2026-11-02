import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Clock,
  Clock3,
  FileText,
  FolderOpen,
  Gauge,
  Plus,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { AddEditSubscriptionModal } from "@/components/AddEditSubscriptionModal";
import { CancellationModal } from "@/components/CancellationModal";
import { RemindersModal } from "@/components/RemindersModal";
import { downloadCalendarFile } from "@/lib/calendarExport";
import { type NewSubscription, type Subscription } from "@/lib/subscriptions";
import { toast } from "sonner";

const dateLabel = (value: string) => {
  if (!value) return "";
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return value;
  }
};
const daysUntil = (value: string) => {
  if (!value) return 0;
  return Math.ceil((new Date(`${value}T12:00:00`).getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000);
};

export function OverviewPage() {
  const navigate = useNavigate();
  const {
    subscriptions,
    activeSubscriptions,
    trialSubscriptions,
    pausedSubscriptions,
    monthlyTotal,
    annualSavings,
    savedPulse,
    upcomingRenewals,
    dueAlerts,
    dismissedAlertIds,
    currencySymbol,
    formatCurrency,
    monthlyBudget,
    setMonthlyBudget,
    budgetUsagePercent,
    remainingBudget,
    isOverBudget,
    addSubscription,
    editSubscription,
    cancelSubscription,
    restoreSubscription,
    removeSubscription,
    userEmail,
  } = useSubscriptions();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [cancellationTarget, setCancellationTarget] = useState<Subscription | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const activeAlerts = dueAlerts.filter((a) => !dismissedAlertIds.includes(a.sub.id));
  const totalDueUpcoming = activeAlerts.reduce((sum, item) => sum + item.sub.amount, 0);

  const handleSave = async (payload: NewSubscription, id?: number) => {
    if (id) {
      await editSubscription(id, payload);
    } else {
      await addSubscription(payload);
    }
  };

  const handleCalendarSyncAll = () => {
    downloadCalendarFile(subscriptions);
    toast.success("Downloaded calendar alerts (.ics) for all renewals!");
  };

  const topActive = activeSubscriptions.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Quick Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
            Your money, in focus
          </p>
          <h1 className="font-display text-3xl md:text-5xl leading-tight text-foreground">
            Good to see you.
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            Here is where your recurring commitments stand today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 md:h-10 gap-2 text-xs"
            onClick={() => navigate("/import")}
          >
            <FileText className="size-4 text-gold" /> Paste Statement / SMS
          </Button>
          <Button
            className="lift-control h-9 md:h-10 gap-2 rounded-md px-4 transition-all font-bold text-xs"
            onClick={() => {
              setEditingSub(null);
              setAddModalOpen(true);
            }}
          >
            <Plus className="size-4" /> Add subscription
          </Button>
        </div>
      </div>

      {/* Due Date Alert Card */}
      {activeAlerts.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 md:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
                <BellRing className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>Upcoming Renewals Due Soon ({activeAlerts.length})</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-destructive text-white px-2 py-0.5 rounded-full animate-pulse">
                    Pre-Debit Alert
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <strong>{activeAlerts[0].sub.name}</strong> is {activeAlerts[0].urgency === "today" ? "renewing TODAY" : activeAlerts[0].urgency === "tomorrow" ? "renewing TOMORROW" : `renewing in ${activeAlerts[0].daysLeft} days`} ({formatCurrency(activeAlerts[0].sub.amount, activeAlerts[0].sub.currency)}). Total upcoming charges: <strong>{formatCurrency(totalDueUpcoming)}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRemindersOpen(true)}
                className="h-8 text-xs font-bold gap-1.5"
              >
                <Clock className="size-3.5" />
                Review & Set Alarms
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Budget Guard Card */}
      <div className="rounded-lg border border-border bg-card/70 p-4 md:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`size-8 rounded-md flex items-center justify-center ${
              isOverBudget
                ? "bg-destructive/20 text-destructive"
                : monthlyBudget
                ? "bg-sage-soft text-sage"
                : "bg-secondary text-muted-foreground"
            }`}>
              {isOverBudget ? <AlertTriangle className="size-4" /> : <Gauge className="size-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">Monthly Budget Guard</h3>
                {monthlyBudget !== null && (
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isOverBudget
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : budgetUsagePercent && budgetUsagePercent > 80
                      ? "bg-gold-soft text-gold"
                      : "bg-sage-soft text-sage"
                  }`}>
                    {isOverBudget ? "Over Budget" : `${budgetUsagePercent}% Utilized`}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {monthlyBudget !== null
                  ? `${formatCurrency(monthlyTotal)} spent out of ${formatCurrency(monthlyBudget)} cap.`
                  : "Protect yourself against subscription creep by setting a hard monthly cap."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingBudget ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBudgetInput(monthlyBudget ? String(monthlyBudget) : "");
                  setIsEditingBudget(true);
                }}
                className="h-8 text-xs font-bold gap-1"
              >
                {monthlyBudget ? "Adjust Cap" : "+ Set Monthly Cap"}
              </Button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const num = Number(budgetInput);
                  if (budgetInput && !isNaN(num) && num > 0) {
                    setMonthlyBudget(num);
                    toast.success(`Monthly budget cap set to ${formatCurrency(num)}`);
                  } else {
                    setMonthlyBudget(null);
                    toast.info("Monthly budget cap cleared");
                  }
                  setIsEditingBudget(false);
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    autoFocus
                    placeholder="e.g. 50"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="h-8 w-28 pl-6 text-xs bg-card"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8 text-xs font-bold px-2.5">
                  Save
                </Button>
                {monthlyBudget !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMonthlyBudget(null);
                      setIsEditingBudget(false);
                      toast.info("Budget cap removed");
                    }}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 px-2"
                    title="Remove Budget Cap"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBudget(false)}
                  className="h-8 text-xs px-2"
                >
                  ✕
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Progress Bar & Subtext */}
        {monthlyBudget !== null && (
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full bg-secondary/80 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? "bg-destructive"
                    : budgetUsagePercent && budgetUsagePercent > 80
                    ? "bg-gold"
                    : "bg-sage"
                }`}
                style={{ width: `${Math.min(budgetUsagePercent || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{budgetUsagePercent}% of monthly cap</span>
              <span>
                {isOverBudget ? (
                  <strong className="text-destructive">
                    Exceeded by {formatCurrency(monthlyTotal - monthlyBudget)}
                  </strong>
                ) : (
                  <strong className="text-sage">
                    {formatCurrency(remainingBudget || 0)} buffer remaining
                  </strong>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat
          label="ACTIVE PLANS"
          value={String(activeSubscriptions.length).padStart(2, "0")}
          note="The ones you keep"
          icon={<Wallet />}
          style=""
        />
        <Stat
          label="MONTHLY SPEND"
          value={formatCurrency(monthlyTotal)}
          note={`${formatCurrency(monthlyTotal * 12)} per year`}
          icon={<ArrowUpRight />}
          style="stat-gold"
        />
        <Stat
          label="TRIALS TO WATCH"
          value={String(trialSubscriptions.length).padStart(2, "0")}
          note="Keep an eye out"
          icon={<Clock3 />}
          style="stat-deep"
        />
        <Stat
          label="SAVED SO FAR"
          value={formatCurrency(annualSavings)}
          note="In yearly savings"
          icon={<ArrowDownRight />}
          style="stat-sage"
          pulse={savedPulse}
        />
      </div>

      {/* AI Health Quick Insight Banner */}
      <div className="rounded-lg border border-border bg-card/60 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-sage-soft text-sage shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">AI Cost-Per-Use Audit Available</h4>
            <p className="text-xs text-muted-foreground">
              Self-report how often you actually use each service to uncover hidden money leaks.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs shrink-0"
          onClick={() => navigate("/advisor")}
        >
          View AI Audit <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {/* Content Split: Subscriptions List vs Upcoming Renewals */}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="section-kicker">01 / YOUR LIST</p>
              <h2 className="font-display text-2xl md:text-3xl leading-tight">Your subscriptions</h2>
            </div>
            <Link
              to="/subscriptions"
              className="flex items-center gap-1 text-xs font-bold text-ink-soft hover:text-foreground transition-colors"
            >
              View all ({subscriptions.length}) <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topActive.map((s) => (
              <SubscriptionRow
                key={s.id}
                s={s}
                onEdit={(sub) => {
                  setEditingSub(sub);
                  setAddModalOpen(true);
                }}
                onCancel={(sub) => cancelSubscription(sub)}
                onRestore={(sub) => restoreSubscription(sub)}
                onDelete={(sub) => removeSubscription(sub)}
                onOpenCancelGuide={(sub) => setCancellationTarget(sub)}
              />
            ))}

            {topActive.length === 0 && (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-gold-soft/30 text-gold mb-4">
                  <Sparkles className="size-7" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold">Your ledger is ready.</h3>
                <p className="mt-1.5 max-w-md text-xs md:text-sm leading-relaxed text-muted-foreground">
                  You have not added any subscriptions yet. Add what you pay for to start tracking renewals, cost-per-use audits, and direct cancellation guides.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
                  <Button
                    onClick={() => {
                      setEditingSub(null);
                      setAddModalOpen(true);
                    }}
                    className="gap-2 font-bold text-xs h-9.5 px-4"
                  >
                    <Plus className="size-4" /> Add your first subscription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/import")}
                    className="gap-2 text-xs h-9.5 px-4"
                  >
                    <FileText className="size-4 text-gold" /> Paste bank SMS / Statement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Renewals & RBI Guidance */}
        <div className="space-y-7">
          <section className="rounded-lg border border-border bg-card/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-kicker !mb-0">COMING UP</p>
              <button
                type="button"
                onClick={handleCalendarSyncAll}
                className="text-[11px] font-bold text-sage hover:underline flex items-center gap-1"
                title="Export all upcoming renewals to your phone calendar"
              >
                <CalendarDays className="size-3.5" /> Sync .ICS
              </button>
            </div>

            <div className="border-t border-border/80">
              {upcomingRenewals.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 border-b border-border/50 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold">{s.name}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {s.status === "trial" ? "Trial ends" : "Renews"} {dateLabel(s.renewal)}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                      daysUntil(s.renewal) <= 7 ? "bg-gold-soft text-gold" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {daysUntil(s.renewal) <= 0 ? "Today" : `In ${daysUntil(s.renewal)} days`}
                  </span>
                </div>
              ))}

              {upcomingRenewals.length === 0 && (
                <p className="py-4 text-xs text-muted-foreground text-center">Nothing on the horizon.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-sage/30 bg-sage-soft/15 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-sage">
              <Sparkles className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mandate Revocation Guide</span>
            </div>
            <p className="font-display text-lg leading-tight">
              Revoke recurring debits directly at the source.
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              You can revoke recurring payment authorizations directly through your payment app or bank (Apple Subscriptions, Google Play, PayPal, or card standing instructions).
            </p>
            <Link
              to="/guides"
              className="text-xs font-bold text-sage hover:underline inline-flex items-center gap-1 pt-1"
            >
              Direct Cancellation Guides <ArrowRight className="size-3" />
            </Link>
          </section>
        </div>
      </div>

      {/* Global Modals */}
      <RemindersModal
        open={remindersOpen}
        onOpenChange={setRemindersOpen}
        subscriptions={upcomingRenewals}
        onOpenCancelGuide={(sub) => setCancellationTarget(sub)}
      />

      <AddEditSubscriptionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        editingSubscription={editingSub}
        onSave={handleSave}
      />

      <CancellationModal
        open={!!cancellationTarget}
        onOpenChange={(open) => !open && setCancellationTarget(null)}
        subscription={cancellationTarget}
        userEmail={userEmail}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  icon,
  style,
  pulse,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  style: string;
  pulse?: number;
}) {
  return (
    <div
      className={`stat-cell ${style} min-w-0 overflow-hidden rounded-sm border border-border bg-card px-4 py-4.5 shadow-sm md:px-5`}
    >
      <div className="mb-4 flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted-foreground">
        <span>{label}</span>
        <span className="[&_svg]:size-4">{icon}</span>
      </div>
      <div className={`${pulse ? "savings-bump" : ""} font-display text-2xl md:text-3xl leading-none tabular-nums font-bold`}>
        {value}
      </div>
      <p className="mt-2 text-[10px] md:text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}
