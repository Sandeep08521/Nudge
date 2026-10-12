import { isSupabaseConfigured, supabase } from "./supabase";

export type Status = "active" | "trial" | "cancelled" | "paused";
export type Cycle = "monthly" | "quarterly" | "half-yearly" | "yearly";
export type UsageFrequency = "daily" | "weekly" | "monthly" | "rarely" | "never";

export type Subscription = {
  id: number;
  user_id?: string;
  name: string;
  category: string;
  amount: number;
  cycle: Cycle;
  renewal: string;
  status: Status;
  initial: string;
  brand: string;
  payment_method?: string;
  usage_frequency?: UsageFrequency;
  notes?: string;
  is_shared?: boolean;
  my_share?: number;
  currency?: string;
  paused_until?: string;
};

export type NewSubscription = Omit<Subscription, "id">;

const COLUMNS = "id,name,category,amount,cycle,renewal,status,initial,brand,payment_method,usage_frequency,notes,is_shared,my_share,currency,paused_until";

export const dayFromNow = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const KNOWN_BRANDS: Record<string, string> = {
  netflix: "netflix",
  spotify: "spotify",
  notion: "notion",
  youtube: "youtube",
  icloud: "icloud",
  apple: "apple",
  headspace: "headspace",
  hotstar: "hotstar",
  jio: "jiohotstar",
  prime: "prime",
  amazon: "prime",
  swiggy: "swiggy",
  zomato: "zomato",
  blinkit: "blinkit",
  zepto: "zepto",
  cult: "cultfit",
  chatgpt: "chatgpt",
  openai: "chatgpt",
  sonyliv: "sonyliv",
  zee5: "zee5",
  timesprime: "timesprime",
  google: "google",
};

export const detectBrand = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, brand] of Object.entries(KNOWN_BRANDS)) {
    if (lower.includes(key)) return brand;
  }
  return "custom";
};

export const monthlyCost = (s: Subscription): number => {
  const base = s.is_shared && s.my_share && s.my_share > 0 ? s.my_share : s.amount;
  switch (s.cycle) {
    case "quarterly":
      return base / 3;
    case "half-yearly":
      return base / 6;
    case "yearly":
      return base / 12;
    case "monthly":
    default:
      return base;
  }
};

export const annualCost = (s: Subscription): number => monthlyCost(s) * 12;

function getStorageKey(userId?: string): string {
  const cleanId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "_") : "default";
  return `nudge_subs_${cleanId}`;
}

function getLocalItems(userId?: string): Subscription[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalItems(items: Subscription[], userId?: string): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
}

const fromRow = (row: any): Subscription => ({
  ...row,
  amount: Number(row.amount),
  my_share: row.my_share ? Number(row.my_share) : undefined,
  payment_method: row.payment_method || "UPI AutoPay",
  usage_frequency: row.usage_frequency || "weekly",
  is_shared: Boolean(row.is_shared),
  currency: row.currency || "INR",
  paused_until: row.paused_until || undefined,
});

/**
 * Fetch real subscriptions for a real user.
 * Starts completely clean (0 rows) for a new user!
 */
export async function listSubscriptions(userId?: string): Promise<Subscription[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(COLUMNS)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return (data as any[]).map(fromRow);
      }
    } catch (err) {
      console.warn("Supabase query failed, falling back to user storage:", err);
    }
  }

  // Real user local isolation - starts with empty array for new accounts!
  return getLocalItems(userId);
}

export async function createSubscription(input: NewSubscription, userId?: string): Promise<Subscription> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("subscriptions").insert(input).select(COLUMNS).single();
      if (!error && data) {
        return fromRow(data);
      }
    } catch (err) {
      console.warn("Supabase insert failed, saving locally:", err);
    }
  }

  const items = getLocalItems(userId);
  const newId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const created: Subscription = { ...input, id: newId, user_id: userId };
  items.unshift(created);
  saveLocalItems(items, userId);
  return created;
}

export async function updateSubscription(id: number, patch: Partial<NewSubscription>, userId?: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
      if (!error) return;
    } catch (err) {
      console.warn("Supabase update failed, saving locally:", err);
    }
  }

  const items = getLocalItems(userId).map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveLocalItems(items, userId);
}

export async function deleteSubscription(id: number, userId?: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);
      if (!error) return;
    } catch (err) {
      console.warn("Supabase delete failed, deleting locally:", err);
    }
  }

  const items = getLocalItems(userId).filter((item) => item.id !== id);
  saveLocalItems(items, userId);
}

// Data portability
export function exportToJSON(items: Subscription[]): string {
  return JSON.stringify(items, null, 2);
}

export function exportToCSV(items: Subscription[]): string {
  const headers = ["Name", "Category", "Amount", "Cycle", "Next Renewal", "Status", "Payment Method", "Usage", "Shared", "My Share", "Notes"];
  const rows = items.map((s) => [
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.category}"`,
    s.amount,
    s.cycle,
    s.renewal,
    s.status,
    `"${s.payment_method || "UPI AutoPay"}"`,
    `"${s.usage_frequency || "weekly"}"`,
    s.is_shared ? "Yes" : "No",
    s.my_share || "",
    `"${(s.notes || "").replace(/"/g, '""')}"`,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
