import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  dayFromNow,
  detectBrand,
  monthlyCost,
  type Cycle,
  type NewSubscription,
  type Status,
  type Subscription,
  type UsageFrequency,
} from "@/lib/subscriptions";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { toast } from "sonner";
import { AlertTriangle, PauseCircle } from "lucide-react";

const getPresets = (symbol: string) => {
  const isRupee = symbol === "₹";
  return [
    { name: "Netflix Standard", amount: isRupee ? 499 : 15.49, cycle: "monthly" as Cycle, category: "Entertainment", brand: "netflix", payment_method: "Credit / Debit Card" },
    { name: "Spotify Premium", amount: isRupee ? 119 : 10.99, cycle: "monthly" as Cycle, category: "Music", brand: "spotify", payment_method: "PayPal Automatic Payment" },
    { name: "YouTube Premium", amount: isRupee ? 149 : 13.99, cycle: "monthly" as Cycle, category: "Entertainment", brand: "youtube", payment_method: "Google Play Subscriptions" },
    { name: "ChatGPT Plus", amount: isRupee ? 2100 : 20.00, cycle: "monthly" as Cycle, category: "Productivity", brand: "chatgpt", payment_method: "Credit / Debit Card" },
    { name: "Apple iCloud+ (50GB)", amount: isRupee ? 75 : 0.99, cycle: "monthly" as Cycle, category: "Storage", brand: "icloud", payment_method: "Apple Subscriptions" },
    { name: "Amazon Prime", amount: isRupee ? 1499 : 139.00, cycle: "yearly" as Cycle, category: "Entertainment", brand: "prime", payment_method: "Credit / Debit Card" },
    { name: "Notion Plus", amount: isRupee ? 800 : 10.00, cycle: "monthly" as Cycle, category: "Productivity", brand: "notion", payment_method: "Credit / Debit Card" },
    { name: "Disney+", amount: isRupee ? 299 : 13.99, cycle: isRupee ? ("quarterly" as Cycle) : ("monthly" as Cycle), category: "Entertainment", brand: "hotstar", payment_method: "Credit / Debit Card" },
  ];
};

export function AddEditSubscriptionModal({
  open,
  onOpenChange,
  editingSubscription,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSubscription: Subscription | null;
  onSave: (payload: NewSubscription, id?: number) => Promise<void>;
}) {
  const { currencySymbol, monthlyBudget, monthlyTotal, formatCurrency } = useSubscriptions();
  const presets = getPresets(currencySymbol);

  const [form, setForm] = useState({
    name: "",
    category: "Entertainment",
    amount: "",
    cycle: "monthly" as Cycle,
    renewal: dayFromNow(7),
    status: "active" as Status,
    paused_until: dayFromNow(30),
    payment_method: "Credit / Debit Card",
    usage_frequency: "weekly" as UsageFrequency,
    is_shared: false,
    my_share: "",
    notes: "",
  });

  useEffect(() => {
    if (editingSubscription) {
      setForm({
        name: editingSubscription.name,
        category: editingSubscription.category,
        amount: String(editingSubscription.amount),
        cycle: editingSubscription.cycle,
        renewal: editingSubscription.renewal,
        status: editingSubscription.status || "active",
        paused_until: editingSubscription.paused_until || dayFromNow(30),
        payment_method: editingSubscription.payment_method || "Credit / Debit Card",
        usage_frequency: editingSubscription.usage_frequency || "weekly",
        is_shared: Boolean(editingSubscription.is_shared),
        my_share: editingSubscription.my_share ? String(editingSubscription.my_share) : "",
        notes: editingSubscription.notes || "",
      });
    } else {
      setForm({
        name: "",
        category: "Entertainment",
        amount: "",
        cycle: "monthly",
        renewal: dayFromNow(7),
        status: "active",
        paused_until: dayFromNow(30),
        payment_method: "Credit / Debit Card",
        usage_frequency: "weekly",
        is_shared: false,
        my_share: "",
        notes: "",
      });
    }
  }, [editingSubscription, open]);

  // Projected monthly spend calculation for Budget Guard
  const currentSubMonthly = editingSubscription && editingSubscription.status === "active"
    ? monthlyCost(editingSubscription)
    : 0;

  const enteredAmount = Number(form.amount) || 0;
  const baseCost = form.is_shared && form.my_share && Number(form.my_share) > 0 ? Number(form.my_share) : enteredAmount;
  let enteredMonthly = baseCost;
  if (form.cycle === "quarterly") enteredMonthly = baseCost / 3;
  else if (form.cycle === "half-yearly") enteredMonthly = baseCost / 6;
  else if (form.cycle === "yearly") enteredMonthly = baseCost / 12;

  const projectedMonthlyTotal = form.status === "paused"
    ? monthlyTotal - currentSubMonthly
    : monthlyTotal - currentSubMonthly + enteredMonthly;

  const willExceedBudget =
    monthlyBudget !== null &&
    form.status !== "paused" &&
    enteredAmount > 0 &&
    projectedMonthlyTotal > monthlyBudget;

  const overageAmount = monthlyBudget !== null ? projectedMonthlyTotal - monthlyBudget : 0;

  const applyPreset = (preset: ReturnType<typeof getPresets>[number]) => {
    setForm({
      ...form,
      name: preset.name,
      amount: String(preset.amount),
      cycle: preset.cycle,
      category: preset.category,
      payment_method: preset.payment_method,
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0 || !form.renewal) {
      toast.error("Please provide a valid subscription name, amount, and renewal date.");
      return;
    }
    const name = form.name.trim();
    const initial = name.charAt(0).toUpperCase();
    const brand = detectBrand(name);
    const myShareNum = form.is_shared && form.my_share ? Number(form.my_share) : undefined;

    const payload: NewSubscription = {
      ...form,
      name,
      amount,
      initial,
      brand,
      my_share: myShareNum,
      is_shared: form.is_shared,
      payment_method: form.payment_method,
      usage_frequency: form.usage_frequency,
      status: form.status,
      paused_until: form.status === "paused" ? form.paused_until : undefined,
    };

    try {
      await onSave(payload, editingSubscription ? editingSubscription.id : undefined);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save subscription.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-md bg-card p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl md:text-3xl font-normal">
            {editingSubscription ? "Edit subscription" : "Add a subscription"}
          </DialogTitle>
          <DialogDescription>
            Enter your recurring subscription details. We never ask for bank or card logins.
          </DialogDescription>
        </DialogHeader>

        {/* Quick-Add Presets for Subscriptions */}
        {!editingSubscription && (
          <div className="mt-2 space-y-1.5 border-b border-border pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Quick-add common subscriptions:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs hover:border-gold hover:text-gold transition-colors"
                >
                  + {preset.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
              NAME
            </label>
            <Input
              id="name"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Netflix Premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CATEGORY
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
              >
                <option>Entertainment</option>
                <option>Music</option>
                <option>Food & Delivery</option>
                <option>Productivity</option>
                <option>Storage</option>
                <option>Wellness</option>
                <option>Education</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="payment_method" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                BILLED VIA / MANDATE
              </label>
              <select
                id="payment_method"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
              >
                <option>Credit / Debit Card</option>
                <option>PayPal Automatic Payment</option>
                <option>Apple Subscriptions</option>
                <option>Google Play Subscriptions</option>
                <option>Direct Debit / ACH / SEPA</option>
                <option>UPI AutoPay</option>
                <option>Net Banking</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="amount" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                AMOUNT ({currencySymbol})
              </label>
              <Input
                id="amount"
                required
                type="number"
                min="0.1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder={currencySymbol === "₹" ? "499" : "14.99"}
              />
            </div>

            <div>
              <label htmlFor="cycle" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                BILLING CYCLE
              </label>
              <select
                id="cycle"
                value={form.cycle}
                onChange={(e) => setForm({ ...form, cycle: e.target.value as Cycle })}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (3 Months)</option>
                <option value="half-yearly">Half-Yearly (6 Months)</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Real-time Budget Guard Alert */}
          {willExceedBudget && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Budget Guard: Exceeds Monthly Spending Cap</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Adding this brings monthly spend to <strong>{formatCurrency(projectedMonthlyTotal)}</strong>, exceeding your cap of <strong>{formatCurrency(monthlyBudget!)}</strong> by <strong className="text-destructive">{formatCurrency(overageAmount)}</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="renewal" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                NEXT RENEWAL / TRIAL END
              </label>
              <Input
                id="renewal"
                required
                type="date"
                value={form.renewal}
                onChange={(e) => setForm({ ...form, renewal: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="status" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
                TYPE / STATUS
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
              >
                <option value="active">Paid subscription</option>
                <option value="trial">Free trial</option>
                <option value="paused">Paused / Snoozed</option>
              </select>
            </div>
          </div>

          {/* Paused Subscription Resume Settings */}
          {form.status === "paused" && (
            <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                <PauseCircle className="size-4" />
                <span>Subscription Paused / Snoozed</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paused subscriptions are excluded from your active monthly spend calculation until unpaused.
              </p>
              <div>
                <label htmlFor="paused_until" className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  PLANNED RESUME DATE
                </label>
                <Input
                  id="paused_until"
                  type="date"
                  value={form.paused_until}
                  onChange={(e) => setForm({ ...form, paused_until: e.target.value })}
                  className="h-8 text-xs bg-card"
                />
              </div>
            </div>
          )}

          {/* AI Advisor Frequency Self-Report */}
          <div>
            <label htmlFor="usage" className="form-label text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ESTIMATED USAGE (FOR AI COST-PER-USE AUDIT)
            </label>
            <select
              id="usage"
              value={form.usage_frequency}
              onChange={(e) => setForm({ ...form, usage_frequency: e.target.value as UsageFrequency })}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs"
            >
              <option value="daily">Daily (~30 times/month)</option>
              <option value="weekly">Weekly (1-2 times/week)</option>
              <option value="monthly">Monthly (once a month)</option>
              <option value="rarely">Rarely (once every few months)</option>
              <option value="never">Never (unused / forgotten)</option>
            </select>
          </div>

          {/* Shared Subscription Option */}
          <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.is_shared}
                onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
                className="size-4 rounded accent-gold"
              />
              <span>Split with friends / flatmates? (Chanda tracker)</span>
            </label>
            {form.is_shared && (
              <div>
                <label htmlFor="my_share" className="text-[10px] font-bold uppercase text-muted-foreground">
                  MY ACTUAL SHARE ({currencySymbol})
                </label>
                <Input
                  id="my_share"
                  type="number"
                  placeholder="e.g. 162"
                  value={form.my_share}
                  onChange={(e) => setForm({ ...form, my_share: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold">
              {editingSubscription ? "Save changes" : "Add subscription"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
