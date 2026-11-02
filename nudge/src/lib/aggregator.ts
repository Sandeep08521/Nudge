/**
 * Account Aggregator (AA) sandbox.
 *
 * India's Account Aggregator framework (RBI-regulated, run by NBFC-AAs such as
 * Finvu, OneMoney, CAMSfinserv, PhonePe AA, etc.) lets you share bank data with
 * an app through a consent you approve, revoke and time-limit - without ever
 * handing over net-banking credentials.
 *
 * Nudge is NOT yet a registered Financial Information User (FIU), so this file
 * simulates the flow end-to-end with SYNTHETIC data. Nothing here calls a real
 * bank, AA or network. Swap `fetchSandboxTransactions` for a call to your FIU
 * backend once you are onboarded.
 */
import { dayFromNow, type Cycle, type NewSubscription } from "./subscriptions";

export type AAProvider = {
  id: string;
  name: string;
  handle: string;
  tagline: string;
};

export const AA_PROVIDERS: AAProvider[] = [
  { id: "finvu", name: "Finvu", handle: "@finvu", tagline: "Used by 100+ banks" },
  { id: "onemoney", name: "OneMoney", handle: "@onemoney", tagline: "Fast OTP consent" },
  { id: "cams", name: "CAMSfinserv", handle: "@camsaa", tagline: "Bank + investments" },
  { id: "phonepe", name: "PhonePe AA", handle: "@ybl", tagline: "Link via UPI number" },
];

export type SandboxAccount = {
  id: string;
  bank: string;
  type: "Savings" | "Current" | "Credit Card";
  mask: string;
};

export const SANDBOX_ACCOUNTS: SandboxAccount[] = [
  { id: "acc-hdfc", bank: "HDFC Bank", type: "Savings", mask: "XX4821" },
  { id: "acc-icici", bank: "ICICI Bank", type: "Credit Card", mask: "XX7730" },
  { id: "acc-sbi", bank: "State Bank of India", type: "Savings", mask: "XX0915" },
];

export type ConsentTerms = {
  purpose: string;
  dataTypes: string[];
  fetchRange: string;
  consentValidity: string;
  frequency: string;
};

export const CONSENT_TERMS: ConsentTerms = {
  purpose: "Detect recurring payments and subscriptions (Code 103 · Personal finance)",
  dataTypes: ["Account transactions", "Account summary"],
  fetchRange: "Last 6 months",
  consentValidity: "24 hours (one-time fetch)",
  frequency: "Once - no continuous monitoring",
};

export type AATransaction = {
  id: string;
  date: string; // yyyy-mm-dd
  narration: string;
  amount: number; // debit, positive INR
  accountId: string;
};

type Seed = {
  merchant: string; // text appearing in narration
  amount: number;
  everyDays: number;
  accountId: string;
  mode: string;
  /** last charge N days ago */
  lastAgo: number;
  /** optional price change on latest charge */
  latestAmount?: number;
};

const SEEDS: Seed[] = [
  { merchant: "NETFLIX.COM", amount: 649, everyDays: 30, accountId: "acc-icici", mode: "CARD", lastAgo: 6 },
  { merchant: "SPOTIFY INDIA", amount: 119, everyDays: 30, accountId: "acc-hdfc", mode: "UPI-AUTOPAY", lastAgo: 11 },
  { merchant: "APPLE.COM/BILL ICLOUD", amount: 75, everyDays: 30, accountId: "acc-icici", mode: "CARD", lastAgo: 3 },
  { merchant: "GOOGLE YOUTUBEPREMIUM", amount: 149, everyDays: 30, accountId: "acc-hdfc", mode: "UPI-AUTOPAY", lastAgo: 17, latestAmount: 189 },
  { merchant: "OPENAI CHATGPT SUBSCR", amount: 1999, everyDays: 30, accountId: "acc-icici", mode: "CARD", lastAgo: 9 },
  { merchant: "JIOHOTSTAR", amount: 299, everyDays: 91, accountId: "acc-hdfc", mode: "UPI-AUTOPAY", lastAgo: 40 },
  { merchant: "SWIGGY ONE MEMBERSHIP", amount: 299, everyDays: 91, accountId: "acc-sbi", mode: "UPI", lastAgo: 52 },
  { merchant: "CULT.FIT MEMBERSHIP", amount: 1499, everyDays: 30, accountId: "acc-icici", mode: "CARD", lastAgo: 21 },
];

/** One-off spends that must NOT be flagged as subscriptions. */
const NOISE = [
  { merchant: "BIGBASKET GROCERIES", range: [420, 2100] },
  { merchant: "UBER INDIA", range: [120, 480] },
  { merchant: "ZOMATO ORDER", range: [180, 760] },
  { merchant: "AMAZON PAY RETAIL", range: [350, 3400] },
  { merchant: "BPCL FUEL STATION", range: [800, 2500] },
  { merchant: "APOLLO PHARMACY", range: [90, 640] },
];

// Small deterministic PRNG so the demo is stable between runs.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDaysAgo = (n: number) => dayFromNow(-n);

export function buildSandboxTransactions(accountIds: string[]): AATransaction[] {
  const rand = mulberry32(2611);
  const txns: AATransaction[] = [];
  let n = 0;
  const horizon = 183;

  for (const s of SEEDS) {
    if (!accountIds.includes(s.accountId)) continue;
    let ago = s.lastAgo;
    let first = true;
    while (ago <= horizon) {
      const jitter = Math.round((rand() - 0.5) * 2); // +/- 1 day banking jitter
      txns.push({
        id: `tx-${++n}`,
        date: isoDaysAgo(Math.max(1, ago + jitter)),
        narration: `${s.mode}/${s.merchant}/${Math.floor(100000 + rand() * 899999)}`,
        amount: first && s.latestAmount ? s.latestAmount : s.amount,
        accountId: s.accountId,
      });
      first = false;
      ago += s.everyDays;
    }
  }

  for (const nz of NOISE) {
    const count = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const acc = accountIds[Math.floor(rand() * accountIds.length)];
      txns.push({
        id: `tx-${++n}`,
        date: isoDaysAgo(2 + Math.floor(rand() * horizon)),
        narration: `UPI/${nz.merchant}/${Math.floor(100000 + rand() * 899999)}`,
        amount: Math.round(nz.range[0] + rand() * (nz.range[1] - nz.range[0])),
        accountId: acc,
      });
    }
  }

  return txns.sort((a, b) => b.date.localeCompare(a.date));
}

/* ------------------------------------------------------------------ */
/* Recurring detection                                                  */
/* ------------------------------------------------------------------ */

export type RecurringFinding = {
  key: string;
  name: string;
  category: string;
  brand: string;
  amount: number;
  previousAmount?: number;
  cycle: Cycle;
  occurrences: number;
  lastCharged: string;
  nextRenewal: string;
  paymentMethod: string;
  accountId: string;
  confidence: number;
};

const MERCHANT_MAP: { match: RegExp; name: string; category: string; brand: string }[] = [
  { match: /netflix/i, name: "Netflix", category: "Entertainment", brand: "netflix" },
  { match: /spotify/i, name: "Spotify", category: "Music", brand: "spotify" },
  { match: /icloud|apple\.com/i, name: "iCloud+", category: "Storage", brand: "icloud" },
  { match: /youtube/i, name: "YouTube Premium", category: "Entertainment", brand: "youtube" },
  { match: /openai|chatgpt/i, name: "ChatGPT Plus", category: "Productivity", brand: "chatgpt" },
  { match: /hotstar/i, name: "JioHotstar", category: "Entertainment", brand: "hotstar" },
  { match: /swiggy/i, name: "Swiggy One", category: "Food & Delivery", brand: "swiggy" },
  { match: /cult\.?fit/i, name: "Cult.fit", category: "Wellness", brand: "cultfit" },
];

function normaliseMerchant(narration: string): string {
  const parts = narration.split("/");
  // mode/merchant/ref  ->  merchant
  const merchant = parts.length >= 3 ? parts[1] : narration;
  return merchant.replace(/[^A-Za-z0-9.\s]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

function cycleFromGap(gap: number): Cycle | null {
  if (gap >= 26 && gap <= 35) return "monthly";
  if (gap >= 84 && gap <= 98) return "quarterly";
  if (gap >= 170 && gap <= 195) return "half-yearly";
  if (gap >= 350 && gap <= 380) return "yearly";
  return null;
}

const CYCLE_DAYS: Record<Cycle, number> = { monthly: 30, quarterly: 91, "half-yearly": 182, yearly: 365 };

export function detectRecurring(txns: AATransaction[]): RecurringFinding[] {
  const groups = new Map<string, AATransaction[]>();
  for (const t of txns) {
    const key = normaliseMerchant(t.narration);
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const findings: RecurringFinding[] = [];
  for (const [key, list] of groups) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const known = MERCHANT_MAP.find((m) => m.match.test(key));
    // Need two charges for a cadence, or one charge from a known subscription merchant.
    if (sorted.length < 2 && !known) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i].date, sorted[i - 1].date));
    const median = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 30;
    const cycle = cycleFromGap(median) ?? (known ? "monthly" : null);
    if (!cycle) continue;

    // Reject noise: cadence only counts when the charges are regular and amounts are stable.
    const amounts = sorted.map((t) => t.amount);
    const latest = amounts[amounts.length - 1];
    const prev = amounts.length > 1 ? amounts[amounts.length - 2] : undefined;
    const stable = amounts.filter((a) => Math.abs(a - latest) / latest < 0.35).length / amounts.length;
    const regular = gaps.length ? gaps.filter((g) => Math.abs(g - median) <= 4).length / gaps.length : 0.5;
    if (!known && (stable < 0.7 || regular < 0.7)) continue;

    const last = sorted[sorted.length - 1];
    const next = new Date(last.date);
    next.setDate(next.getDate() + CYCLE_DAYS[cycle]);
    // keep next renewal in the future
    while (next.getTime() < Date.now()) next.setDate(next.getDate() + CYCLE_DAYS[cycle]);

    const mode = last.narration.split("/")[0];
    findings.push({
      key,
      name: known?.name ?? toTitle(key),
      category: known?.category ?? "Other",
      brand: known?.brand ?? "custom",
      amount: latest,
      previousAmount: prev !== undefined && prev !== latest ? prev : undefined,
      cycle,
      occurrences: sorted.length,
      lastCharged: last.date,
      nextRenewal: next.toISOString().slice(0, 10),
      paymentMethod: mode.includes("AUTOPAY") ? "UPI AutoPay" : mode === "CARD" ? "Credit / Debit Card" : "UPI AutoPay",
      accountId: last.accountId,
      confidence: Math.min(0.99, 0.6 + sorted.length * 0.08 + (known ? 0.15 : 0)),
    });
  }

  return findings.sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
}

const toTitle = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function monthlyEquivalent(f: Pick<RecurringFinding, "amount" | "cycle">): number {
  return f.amount / ({ monthly: 1, quarterly: 3, "half-yearly": 6, yearly: 12 }[f.cycle]);
}

export function findingToNewSubscription(f: RecurringFinding): NewSubscription {
  return {
    name: f.name,
    category: f.category,
    amount: f.amount,
    cycle: f.cycle,
    renewal: f.nextRenewal,
    status: "active",
    initial: f.name.charAt(0).toUpperCase(),
    brand: f.brand,
    payment_method: f.paymentMethod,
    usage_frequency: "weekly",
    notes: "Detected via Account Aggregator sandbox (synthetic data)",
  };
}

/* ------------------------------------------------------------------ */
/* Hand-off between the public demo and the signed-in workspace          */
/* ------------------------------------------------------------------ */

const PENDING_KEY = "nudge_pending_aa_import";

export function stashFindings(findings: RecurringFinding[]) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(findings));
  } catch {
    /* storage unavailable - user can simply re-run the demo */
  }
}

export function takeStashedFindings(): RecurringFinding[] | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecurringFinding[]) : null;
  } catch {
    return null;
  }
}
