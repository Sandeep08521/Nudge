import { useState, useMemo } from "react";
import {
  ArrowUpRight,
  BadgePercent,
  CheckCircle,
  Clock3,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { AIAdvisorSection } from "@/components/AIAdvisorSection";
import { CancellationModal } from "@/components/CancellationModal";
import { type Subscription } from "@/lib/subscriptions";
import { getSmartSwaps } from "@/lib/smartSwaps";
import { Button } from "@/components/ui/button";

export function AdvisorPage() {
  const {
    subscriptions,
    activeSubscriptions,
    trialSubscriptions,
    monthlyTotal,
    annualSavings,
    categories,
    userEmail,
    currencySymbol,
    formatCurrency,
    editSubscription,
  } = useSubscriptions();

  const money = (n: number) => formatCurrency(n);

  const [cancellationTarget, setCancellationTarget] = useState<Subscription | null>(null);

  const smartSwaps = useMemo(
    () => getSmartSwaps(subscriptions, currencySymbol),
    [subscriptions, currencySymbol]
  );
  const totalSwapSavings = smartSwaps.reduce((sum, s) => sum + s.estimatedYearlySavings, 0);

  // Adapter for AIAdvisorSection setItems
  const handleSetItems: React.Dispatch<React.SetStateAction<Subscription[]>> = (updater) => {
    // handled internally in AIAdvisorSection through updateSubscription
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
          DATA-GROUNDED HONESTY
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          "Worth It?" Usage Advisor
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          Self-report how often you actually use each subscription. We compute your real cost per use and flag money leaks.
        </p>
      </div>

      {/* Main Advisor Engine Component */}
      <AIAdvisorSection
        items={subscriptions}
        setItems={handleSetItems}
        onOpenCancellationGuide={(sub) => setCancellationTarget(sub)}
      />

      {/* Smart Swaps & Plan Downgrade Advisor */}
      <section className="rounded-lg border border-border bg-card/60 p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-sage-soft flex items-center justify-center text-sage">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold">Smart Swaps & Plan Downgrades</h2>
                {totalSwapSavings > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-sage text-primary-foreground px-2 py-0.5 rounded-full">
                    Save {money(totalSwapSavings)}/yr
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Downgrade to ad-supported tiers, split family plans, or switch to annual passes without giving up the content you love.
              </p>
            </div>
          </div>
        </div>

        {smartSwaps.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {smartSwaps.map((swap) => (
              <div
                key={swap.id}
                className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-gold/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                      {swap.subscriptionName}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage-soft text-sage">
                      {swap.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground mb-1">{swap.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{swap.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/70">
                  <div className="rounded-md bg-secondary/50 p-2 text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Current: {money(swap.currentCostPerYear)}/yr</span>
                    <span className="font-extrabold text-sage">
                      Save {money(swap.estimatedYearlySavings)}/yr
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      How to do it:
                    </span>
                    <ul className="space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
                      {swap.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>

                  {swap.actionUrl !== "#" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-bold gap-1.5 h-8 mt-1"
                      onClick={() => window.open(swap.actionUrl, "_blank", "noopener,noreferrer")}
                    >
                      <span>{swap.actionLabel}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <p>No active subscriptions match our downgrade catalog yet.</p>
            <p className="mt-1 text-[11px]">
              As you add subscriptions like Netflix, Spotify, ChatGPT, or Prime, Nudge will automatically generate money-saving swaps.
            </p>
          </div>
        )}
      </section>

      {/* Analytics Breakdown Grid */}
      <div className="grid gap-12 lg:grid-cols-2 pt-4 border-t border-border">
        {/* Category Breakdown */}
        <section>
          <p className="section-kicker">BY CATEGORY</p>
          <h2 className="mb-5 font-display text-2xl md:text-3xl">Where it all goes</h2>
          <div className="space-y-5">
            {categories.map(({ category, value }) => (
              <div key={category}>
                <div className="mb-1.5 flex justify-between text-xs md:text-sm">
                  <span className="font-semibold">{category}</span>
                  <span className="font-bold tabular-nums">
                    {money(value)}{" "}
                    <span className="font-normal text-muted-foreground">/mo</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-sage transition-all"
                    style={{ width: `${monthlyTotal ? (value / monthlyTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground">No active subscriptions to categorize.</p>
            )}
          </div>
        </section>

        {/* Things Worth Noticing */}
        <section className="lg:border-l lg:border-border lg:pl-10">
          <p className="section-kicker">THINGS WORTH NOTICING</p>
          <h2 className="mb-5 font-display text-2xl md:text-3xl">The bigger picture</h2>
          <div className="space-y-4">
            <InsightCard
              icon={<Wallet className="size-4" />}
              title="Your annual outlook"
              text={`At your current pace, you will spend ${money(
                monthlyTotal * 12
              )} on active subscriptions this year.`}
            />
            <InsightCard
              icon={<TrendingDown className="size-4" />}
              title="Money you've reclaimed"
              text={
                annualSavings
                  ? `Cancelling unused plans has freed up ${money(annualSavings)} per year.`
                  : "Cancel subscriptions you no longer use to start tracking your annual savings."
              }
            />
            <InsightCard
              icon={<Clock3 className="size-4" />}
              title="Free trials to watch"
              text={
                trialSubscriptions.length
                  ? `${trialSubscriptions.length} active trial${
                      trialSubscriptions.length === 1 ? "" : "s"
                    }. Set calendar alerts to cancel at least 24h before renewal.`
                  : "No free trials to watch out for right now."
              }
            />
            <InsightCard
              icon={<ShieldAlert className="size-4" />}
              title="Foreign Currency FX & Sales Tax Notice"
              text="International subscriptions often incur 2–4% foreign transaction fees plus regional VAT or sales tax. Keep an eye on your final billed statement amount."
            />
          </div>
        </section>
      </div>

      <CancellationModal
        open={!!cancellationTarget}
        onOpenChange={(open) => !open && setCancellationTarget(null)}
        subscription={cancellationTarget}
        userEmail={userEmail}
      />
    </div>
  );
}

function InsightCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3.5 border-b border-border/80 pb-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sage-soft text-sage">
        {icon}
      </span>
      <div>
        <h4 className="text-xs md:text-sm font-bold text-foreground">{title}</h4>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
