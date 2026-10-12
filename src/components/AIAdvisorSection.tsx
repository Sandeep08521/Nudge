import { useState } from "react";
import { Sparkles, ShieldCheck, AlertTriangle, TrendingDown, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzePortfolio, evaluateSubscription, type AIAdvice } from "@/lib/aiAdvisor";
import { updateSubscription, type Subscription, type UsageFrequency } from "@/lib/subscriptions";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { toast } from "sonner";

export function AIAdvisorSection({
  items,
  setItems,
  onOpenCancellationGuide,
}: {
  items: Subscription[];
  setItems: React.Dispatch<React.SetStateAction<Subscription[]>>;
  onOpenCancellationGuide: (s: Subscription) => void;
}) {
  const { currencySymbol, formatCurrency } = useSubscriptions();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const activeItems = items.filter((s) => s.status !== "cancelled");
  const portfolio = analyzePortfolio(items, currencySymbol);

  const handleFrequencyChange = async (s: Subscription, newFreq: UsageFrequency) => {
    setUpdatingId(s.id);
    const updated = { ...s, usage_frequency: newFreq };
    setItems((prev) => prev.map((item) => (item.id === s.id ? updated : item)));
    try {
      await updateSubscription(s.id, { usage_frequency: newFreq });
      toast.success(`Updated usage for ${s.name}`);
    } catch {
      toast.error("Could not save usage change.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-lg border border-gold/40 bg-gold-soft/10 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <Sparkles className="size-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">
                Portfolio Health & Cost-Per-Use Audit
              </span>
            </div>
            <h3 className="mt-1 font-display text-2xl md:text-3xl font-normal">
              {portfolio.healthScore >= 80 ? "Your portfolio is in great shape." : "You have hidden spending leaks."}
            </h3>
            <p className="mt-1 max-w-xl text-xs md:text-sm text-muted-foreground leading-relaxed">
              {portfolio.summaryText}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portfolio Health</span>
              <div className="font-display text-4xl font-bold tabular-nums text-foreground">
                {portfolio.healthScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Potential Annual Savings</span>
              <div className="font-display text-4xl font-bold tabular-nums text-gold">
                {formatCurrency(portfolio.potentialYearlySavings)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Evaluation List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            ITEM-BY-ITEM USAGE AUDIT ({activeItems.length} ACTIVE)
          </p>
          <span className="text-[11px] text-muted-foreground">Self-report how often you actually use each service:</span>
        </div>

        {activeItems.map((s) => {
          const advice: AIAdvice = portfolio.advices[s.id] || evaluateSubscription(s, currencySymbol);
          const currentFreq = s.usage_frequency || "weekly";

          return (
            <div
              key={s.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-gold/30"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{s.name}</span>
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${advice.badgeBg} ${advice.verdictColor}`}>
                    {advice.verdictLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formatCurrency(s.amount)}/{s.cycle})
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{advice.reason}</p>

                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <span className="text-muted-foreground">
                    Cost per use: <strong className="text-foreground">{advice.costPerUseLabel}</strong>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    Billed via: <strong className="text-foreground">{s.payment_method || "Direct Mandate"}</strong>
                  </span>
                </div>
              </div>

              {/* Frequency Selector & Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 rounded-md border border-input bg-background p-1 text-xs">
                  <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase">Usage:</span>
                  {(["daily", "weekly", "monthly", "rarely", "never"] as UsageFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      disabled={updatingId === s.id}
                      onClick={() => handleFrequencyChange(s, freq)}
                      className={`rounded px-2 py-1 text-[11px] font-bold capitalize transition-colors ${
                        currentFreq === freq
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>

                {advice.verdict !== "keep" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onOpenCancellationGuide(s)}
                  >
                    <XCircle className="size-3.5" />
                    How to Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {activeItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No active subscriptions to audit. Add a subscription to see your personalized AI Cost-Per-Use advice.
          </div>
        )}
      </div>
    </div>
  );
}
