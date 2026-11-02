import { monthlyCost, annualCost, type Subscription, type UsageFrequency } from "./subscriptions";

export type Verdict = "keep" | "reconsider" | "cancel";

export type AIAdvice = {
  subscriptionId: number;
  verdict: Verdict;
  verdictLabel: string;
  verdictColor: string; // e.g. "text-sage", "text-gold", "text-destructive"
  badgeBg: string;
  costPerUse: number | null; // in active currency
  costPerUseLabel: string;
  monthlyEquivalent: number;
  annualEquivalent: number;
  potentialYearlySavings: number;
  reason: string;
  actionRecommendation: string;
};

export type PortfolioAnalysis = {
  healthScore: number; // 0 - 100
  totalAnnualSpend: number;
  potentialYearlySavings: number;
  keepCount: number;
  reconsiderCount: number;
  cancelCount: number;
  summaryText: string;
  advices: Record<number, AIAdvice>;
};

const FREQUENCY_USES_PER_MONTH: Record<UsageFrequency, number> = {
  daily: 30,
  weekly: 4.3,
  monthly: 1,
  rarely: 0.25,
  never: 0,
};

export function evaluateSubscription(s: Subscription, currencySymbol = "$"): AIAdvice {
  const usage: UsageFrequency = s.usage_frequency || "weekly";
  const monthly = monthlyCost(s);
  const annual = annualCost(s);
  const usesPerMonth = FREQUENCY_USES_PER_MONTH[usage];

  const fmt = (n: number) => `${currencySymbol}${Math.round(n).toLocaleString()}`;

  let verdict: Verdict = "keep";
  let verdictLabel = "Keep";
  let verdictColor = "text-sage";
  let badgeBg = "bg-sage-soft";
  let costPerUse: number | null = null;
  let costPerUseLabel = `${currencySymbol}0`;
  let potentialYearlySavings = 0;
  let reason = "";
  let actionRecommendation = "";

  if (s.status === "cancelled") {
    return {
      subscriptionId: s.id,
      verdict: "cancel",
      verdictLabel: "Already Cancelled",
      verdictColor: "text-muted-foreground",
      badgeBg: "bg-secondary",
      costPerUse: null,
      costPerUseLabel: "—",
      monthlyEquivalent: monthly,
      annualEquivalent: annual,
      potentialYearlySavings: annual,
      reason: "Successfully marked cancelled. Savings are already counted.",
      actionRecommendation: "No action needed.",
    };
  }

  if (usage === "never") {
    verdict = "cancel";
    verdictLabel = "Money Leak — Cancel";
    verdictColor = "text-destructive";
    badgeBg = "bg-destructive/15";
    costPerUse = null;
    costPerUseLabel = "Infinite";
    potentialYearlySavings = annual;
    reason = `You self-reported zero usage. You are paying ${fmt(annual)}/year for nothing.`;
    actionRecommendation = "Cancel immediately or revoke recurring payment mandate.";
  } else if (usage === "rarely") {
    costPerUse = monthly / usesPerMonth;
    costPerUseLabel = fmt(costPerUse);
    verdict = "cancel";
    verdictLabel = "Exorbitant Cost Per Use";
    verdictColor = "text-destructive";
    badgeBg = "bg-destructive/15";
    potentialYearlySavings = annual;
    reason = `At ~${costPerUseLabel} per single use, you are paying a massive premium. It is far cheaper to pay on-demand or pause.`;
    actionRecommendation = "Cancel now and buy on-demand when you actually need it.";
  } else if (usage === "monthly") {
    costPerUse = monthly;
    costPerUseLabel = fmt(costPerUse);
    // threshold normalized across currencies
    const threshold = currencySymbol === "₹" ? 300 : 15;
    if (costPerUse > threshold) {
      verdict = "reconsider";
      verdictLabel = "Questionable Value";
      verdictColor = "text-gold";
      badgeBg = "bg-gold-soft";
      potentialYearlySavings = annual;
      reason = `Using it only once a month means each session costs you ${costPerUseLabel}. Consider if this is really essential.`;
      actionRecommendation = "Downgrade to a cheaper tier or split with friends/family.";
    } else {
      verdict = "keep";
      verdictLabel = "Moderate Value";
      verdictColor = "text-sage";
      badgeBg = "bg-sage-soft";
      potentialYearlySavings = 0;
      reason = `Acceptable cost (${costPerUseLabel}/use) for monthly peace of mind or occasional utility.`;
      actionRecommendation = "Keep active, but review periodically.";
    }
  } else if (usage === "weekly") {
    costPerUse = monthly / usesPerMonth;
    costPerUseLabel = fmt(costPerUse);
    const threshold = currencySymbol === "₹" ? 200 : 10;
    if (costPerUse > threshold) {
      verdict = "reconsider";
      verdictLabel = "Review Plan Tier";
      verdictColor = "text-gold";
      badgeBg = "bg-gold-soft";
      potentialYearlySavings = annual * 0.5;
      reason = `You use it weekly, but at ${costPerUseLabel} per week, an annual plan or basic tier might save you 30-50%.`;
      actionRecommendation = "Check if an annual or lower-tier plan is available.";
    } else {
      verdict = "keep";
      verdictLabel = "Solid Value";
      verdictColor = "text-sage";
      badgeBg = "bg-sage-soft";
      potentialYearlySavings = 0;
      reason = `Healthy cost of ${costPerUseLabel} per session. Earns its place on your ledger.`;
      actionRecommendation = "Keep active.";
    }
  } else {
    // Daily
    costPerUse = monthly / usesPerMonth;
    costPerUseLabel = fmt(costPerUse);
    verdict = "keep";
    verdictLabel = "High Daily Utility";
    verdictColor = "text-sage";
    badgeBg = "bg-sage-soft";
    potentialYearlySavings = 0;
    reason = `Outstanding return at only ${costPerUseLabel} per day. One of your best everyday investments.`;
    actionRecommendation = "Keep active and consider annual renewal for discounts.";
  }

  return {
    subscriptionId: s.id,
    verdict,
    verdictLabel,
    verdictColor,
    badgeBg,
    costPerUse,
    costPerUseLabel,
    monthlyEquivalent: monthly,
    annualEquivalent: annual,
    potentialYearlySavings,
    reason,
    actionRecommendation,
  };
}

export function analyzePortfolio(items: Subscription[], currencySymbol = "$"): PortfolioAnalysis {
  const active = items.filter((s) => s.status !== "cancelled");
  const totalAnnualSpend = active.reduce((sum, s) => sum + annualCost(s), 0);

  const advices: Record<number, AIAdvice> = {};
  let potentialYearlySavings = 0;
  let keepCount = 0;
  let reconsiderCount = 0;
  let cancelCount = 0;

  for (const s of active) {
    const advice = evaluateSubscription(s, currencySymbol);
    advices[s.id] = advice;
    if (advice.verdict === "cancel") {
      cancelCount++;
      potentialYearlySavings += advice.potentialYearlySavings;
    } else if (advice.verdict === "reconsider") {
      reconsiderCount++;
      potentialYearlySavings += advice.potentialYearlySavings;
    } else {
      keepCount++;
    }
  }

  // Health score calculation
  const totalCount = active.length;
  let healthScore = 100;
  if (totalCount > 0) {
    const wastedRatio = (cancelCount * 1.0 + reconsiderCount * 0.4) / totalCount;
    healthScore = Math.max(10, Math.round((1 - wastedRatio) * 100));
  }

  const fmt = (n: number) => `${currencySymbol}${Math.round(n).toLocaleString()}`;
  let summaryText = "Your subscription portfolio is lean and high-value.";
  if (cancelCount > 0) {
    summaryText = `You have ${cancelCount} subscription${cancelCount > 1 ? "s" : ""} you rarely use. Cancelling them would save ${fmt(potentialYearlySavings)} per year.`;
  } else if (reconsiderCount > 0) {
    summaryText = `Reviewing ${reconsiderCount} subscription${reconsiderCount > 1 ? "s" : ""} could optimize your monthly recurring burn.`;
  }

  return {
    healthScore,
    totalAnnualSpend,
    potentialYearlySavings,
    keepCount,
    reconsiderCount,
    cancelCount,
    summaryText,
    advices,
  };
}
