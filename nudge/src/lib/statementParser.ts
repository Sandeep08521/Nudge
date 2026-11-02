import { dayFromNow, detectBrand, type Cycle, type NewSubscription } from "./subscriptions";

export type ParsedCandidate = {
  rawText: string;
  name: string;
  amount: number;
  category: string;
  cycle: Cycle;
  renewal: string;
  paymentMethod: string;
  brand: string;
  confidence: number;
};

const MERCHANT_CATEGORIES: Record<string, { category: string; cycle: Cycle; brand: string }> = {
  netflix: { category: "Entertainment", cycle: "monthly", brand: "netflix" },
  spotify: { category: "Music", cycle: "monthly", brand: "spotify" },
  hotstar: { category: "Entertainment", cycle: "quarterly", brand: "hotstar" },
  disney: { category: "Entertainment", cycle: "quarterly", brand: "hotstar" },
  prime: { category: "Entertainment", cycle: "yearly", brand: "prime" },
  amazon: { category: "Entertainment", cycle: "yearly", brand: "prime" },
  youtube: { category: "Entertainment", cycle: "monthly", brand: "youtube" },
  swiggy: { category: "Food & Delivery", cycle: "quarterly", brand: "swiggy" },
  zomato: { category: "Food & Delivery", cycle: "quarterly", brand: "zomato" },
  blinkit: { category: "Food & Delivery", cycle: "monthly", brand: "blinkit" },
  zepto: { category: "Food & Delivery", cycle: "monthly", brand: "zepto" },
  cult: { category: "Wellness", cycle: "yearly", brand: "cultfit" },
  apple: { category: "Storage", cycle: "monthly", brand: "apple" },
  icloud: { category: "Storage", cycle: "monthly", brand: "icloud" },
  google: { category: "Storage", cycle: "monthly", brand: "google" },
  notion: { category: "Productivity", cycle: "monthly", brand: "notion" },
  chatgpt: { category: "Productivity", cycle: "monthly", brand: "chatgpt" },
  openai: { category: "Productivity", cycle: "monthly", brand: "chatgpt" },
  timesprime: { category: "Lifestyle", cycle: "yearly", brand: "timesprime" },
  sonyliv: { category: "Entertainment", cycle: "yearly", brand: "sonyliv" },
  zee5: { category: "Entertainment", cycle: "yearly", brand: "zee5" },
};

export function parseStatementText(text: string): ParsedCandidate[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const candidates: ParsedCandidate[] = [];
  const seenMerchants = new Set<string>();

  // Regex patterns for amounts in international and regional formats: $15.49, €10.99, £9.99, Rs. 649, INR 899, ₹1499
  const amountRegex = /(?:Rs\.?|INR|₹|\$|€|£|USD|EUR|GBP)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const decimalRegex = /\b([\d,]+\.\d{2})\b/;
  
  // Date patterns: 04-Oct-26, 04/10/2026, 2026-10-04, 4 Oct
  const dateRegex = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check if line mentions any known subscription merchant
    let matchedKey: string | null = null;
    let merchantDisplayName = "";

    for (const [key, meta] of Object.entries(MERCHANT_CATEGORIES)) {
      if (lower.includes(key)) {
        matchedKey = key;
        merchantDisplayName = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === "hotstar") merchantDisplayName = "Disney+";
        if (key === "prime") merchantDisplayName = "Amazon Prime";
        if (key === "youtube") merchantDisplayName = "YouTube Premium";
        if (key === "swiggy") merchantDisplayName = "Swiggy One";
        if (key === "zomato") merchantDisplayName = "Zomato Gold";
        if (key === "cult") merchantDisplayName = "Cult.fit";
        break;
      }
    }

    if (!matchedKey) {
      // Look for explicit words like 'autopay', 'mandate', 'recurring', 'subscription', 'auto-renew'
      if (lower.includes("autopay") || lower.includes("mandate") || lower.includes("subscription") || lower.includes("recurring") || lower.includes("auto-renew")) {
        const amtMatch = line.match(amountRegex) || line.match(decimalRegex);
        if (amtMatch && amtMatch[1]) {
          const amt = parseFloat(amtMatch[1].replace(/,/g, ""));
          if (amt > 0) {
            candidates.push({
              rawText: line,
              name: "Recurring Payment",
              amount: amt,
              category: "Other",
              cycle: "monthly",
              renewal: dayFromNow(14),
              paymentMethod: lower.includes("paypal") ? "PayPal" : lower.includes("apple") ? "Apple Subscriptions" : lower.includes("upi") ? "UPI AutoPay" : "Credit / Debit Card",
              brand: "custom",
              confidence: 0.6,
            });
          }
        }
      }
      continue;
    }

    // If already detected this merchant in the paste, skip duplicate
    if (seenMerchants.has(matchedKey)) continue;

    // Extract amount
    const amtMatch = line.match(amountRegex) || line.match(decimalRegex);
    let amount = 0;
    if (amtMatch && amtMatch[1]) {
      amount = parseFloat(amtMatch[1].replace(/,/g, ""));
    } else {
      if (matchedKey === "netflix") amount = 15.49;
      else if (matchedKey === "spotify") amount = 10.99;
      else if (matchedKey === "youtube") amount = 13.99;
      else if (matchedKey === "chatgpt") amount = 20.00;
      else if (matchedKey === "apple") amount = 2.99;
      else amount = 9.99;
    }

    // Extract payment method hint
    let paymentMethod = "Credit / Debit Card";
    if (lower.includes("paypal")) paymentMethod = "PayPal";
    else if (lower.includes("apple") || lower.includes("itunes")) paymentMethod = "Apple Subscriptions";
    else if (lower.includes("google") || lower.includes("play")) paymentMethod = "Google Play";
    else if (lower.includes("phonepe") || lower.includes("gpay") || lower.includes("upi")) paymentMethod = "UPI AutoPay";
    else if (lower.includes("ach") || lower.includes("sepa") || lower.includes("direct debit")) paymentMethod = "Direct Debit";

    const meta = MERCHANT_CATEGORIES[matchedKey];
    seenMerchants.add(matchedKey);

    candidates.push({
      rawText: line,
      name: merchantDisplayName,
      amount,
      category: meta.category,
      cycle: meta.cycle,
      renewal: dayFromNow(15), // reasonable default
      paymentMethod,
      brand: meta.brand,
      confidence: 0.9,
    });
  }

  return candidates;
}

export function candidateToNewSubscription(c: ParsedCandidate): NewSubscription {
  return {
    name: c.name,
    category: c.category,
    amount: c.amount,
    cycle: c.cycle,
    renewal: c.renewal,
    status: "active",
    initial: c.name.charAt(0).toUpperCase(),
    brand: c.brand,
    payment_method: c.paymentMethod,
    usage_frequency: "weekly",
  };
}
