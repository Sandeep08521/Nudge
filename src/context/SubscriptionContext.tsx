import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  annualCost,
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  monthlyCost,
  updateSubscription,
  type NewSubscription,
  type Subscription,
} from "@/lib/subscriptions";

import {
  getNotificationSettings,
  saveNotificationSettings,
  getDueAlerts,
  sendNativeNotification,
  type NotificationSettings,
  type DueAlertItem,
} from "@/lib/notificationService";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface SubscriptionContextType {
  subscriptions: Subscription[];
  loading: boolean;
  activeSubscriptions: Subscription[];
  trialSubscriptions: Subscription[];
  cancelledSubscriptions: Subscription[];
  pausedSubscriptions: Subscription[];
  monthlyTotal: number;
  annualTotal: number;
  annualSavings: number;
  upcomingRenewals: Subscription[];
  categories: { category: string; value: number }[];
  celebration: { name: string; amount: number } | null;
  savedPulse: number;
  isCloudSynced: boolean;
  userId: string;
  userEmail: string;
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  formatCurrency: (amount: number, customSymbol?: string) => string;
  monthlyBudget: number | null;
  setMonthlyBudget: (budget: number | null) => void;
  budgetUsagePercent: number | null;
  remainingBudget: number | null;
  isOverBudget: boolean;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;
  dueAlerts: DueAlertItem[];
  dismissedAlertIds: number[];
  dismissAlert: (subId: number) => void;
  addSubscription: (sub: NewSubscription) => Promise<Subscription>;
  editSubscription: (id: number, patch: Partial<NewSubscription>) => Promise<void>;
  cancelSubscription: (sub: Subscription) => Promise<void>;
  restoreSubscription: (sub: Subscription) => Promise<void>;
  pauseSubscription: (sub: Subscription, pausedUntil?: string) => Promise<void>;
  resumeSubscription: (sub: Subscription) => Promise<void>;
  removeSubscription: (sub: Subscription) => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
  signOut: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({
  children,
  userId,
  userEmail,
  isCloudSynced,
  onSignOut,
}: {
  children: React.ReactNode;
  userId: string;
  userEmail: string;
  isCloudSynced: boolean;
  onSignOut: () => void;
}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<{ name: string; amount: number } | null>(null);
  const [savedPulse, setSavedPulse] = useState(0);

  const [currencySymbol, setCurrencySymbolState] = useState<string>(() => {
    try {
      return localStorage.getItem("nudge_currency_symbol") || "$";
    } catch {
      return "$";
    }
  });

  // Notification and due-date alert preferences
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [dismissedAlertIds, setDismissedAlertIds] = useState<number[]>([]);

  const updateNotificationSettings = (patch: Partial<NotificationSettings>) => {
    setNotificationSettingsState((prev) => {
      const updated = { ...prev, ...patch };
      saveNotificationSettings(updated);
      return updated;
    });
  };

  const dismissAlert = (subId: number) => {
    setDismissedAlertIds((prev) => [...prev, subId]);
  };

  const setCurrencySymbol = (symbol: string) => {
    setCurrencySymbolState(symbol);
    try {
      localStorage.setItem("nudge_currency_symbol", symbol);
    } catch {}

    if (isSupabaseConfigured && userId) {
      supabase
        .from("profiles")
        .upsert({ id: userId, currency_symbol: symbol, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn("Could not sync currency to cloud profile:", error);
        });
    }
  };

  const formatCurrency = (amount: number, customSymbol?: string) => {
    const sym = customSymbol || currencySymbol;
    return `${sym}${Math.round(amount).toLocaleString()}`;
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      // Fetches real user's subscriptions. Starts at 0 for new real users!
      const rows = await listSubscriptions(userId);
      setSubscriptions(rows);

      // Fetch user profile settings from Supabase if connected
      if (isSupabaseConfigured && userId) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("currency_symbol, monthly_budget, lead_days")
            .eq("id", userId)
            .maybeSingle();

          if (!error && data) {
            if (data.currency_symbol) {
              setCurrencySymbolState(data.currency_symbol);
              try {
                localStorage.setItem("nudge_currency_symbol", data.currency_symbol);
              } catch {}
            }
            if (data.monthly_budget !== null && data.monthly_budget !== undefined) {
              setMonthlyBudgetState(Number(data.monthly_budget));
              try {
                localStorage.setItem(budgetStorageKey, String(data.monthly_budget));
              } catch {}
            }
            if (data.lead_days) {
              updateNotificationSettings({ leadDays: Number(data.lead_days) });
            }
          }
        } catch (profileErr) {
          console.warn("Profile fetch skipped:", profileErr);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubscriptions();
    }
  }, [userId, isCloudSynced]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 3800);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  // Monthly Budget Guard State
  const budgetStorageKey = `nudge_monthly_budget_${userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "_") : "default"}`;
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(() => {
    try {
      const val = localStorage.getItem(budgetStorageKey);
      return val ? Number(val) : null;
    } catch {
      return null;
    }
  });

  const setMonthlyBudget = (val: number | null) => {
    setMonthlyBudgetState(val);
    try {
      if (val === null || val <= 0) {
        localStorage.removeItem(budgetStorageKey);
      } else {
        localStorage.setItem(budgetStorageKey, String(val));
      }
    } catch {}

    if (isSupabaseConfigured && userId) {
      supabase
        .from("profiles")
        .upsert({ id: userId, monthly_budget: val, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn("Could not sync budget to cloud profile:", error);
        });
    }
  };

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "active"),
    [subscriptions]
  );
  const trialSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "trial"),
    [subscriptions]
  );
  const cancelledSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "cancelled"),
    [subscriptions]
  );
  const pausedSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "paused"),
    [subscriptions]
  );

  const monthlyTotal = useMemo(
    () => activeSubscriptions.reduce((sum, s) => sum + monthlyCost(s), 0),
    [activeSubscriptions]
  );
  const annualTotal = monthlyTotal * 12;
  const annualSavings = useMemo(
    () => cancelledSubscriptions.reduce((sum, s) => sum + annualCost(s), 0),
    [cancelledSubscriptions]
  );

  const budgetUsagePercent = useMemo(() => {
    if (!monthlyBudget || monthlyBudget <= 0) return null;
    return Math.round((monthlyTotal / monthlyBudget) * 100);
  }, [monthlyTotal, monthlyBudget]);

  const remainingBudget = useMemo(() => {
    if (monthlyBudget === null) return null;
    return monthlyBudget - monthlyTotal;
  }, [monthlyTotal, monthlyBudget]);

  const isOverBudget = useMemo(() => {
    return monthlyBudget !== null && monthlyTotal > monthlyBudget;
  }, [monthlyTotal, monthlyBudget]);

  const dueAlerts = useMemo(() => {
    return getDueAlerts(subscriptions, notificationSettings.leadDays, formatCurrency);
  }, [subscriptions, notificationSettings.leadDays, currencySymbol]);

  // Automated browser notification dispatch on app load
  useEffect(() => {
    if (dueAlerts.length === 0 || !notificationSettings.browserEnabled) return;
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastSessionNotify = sessionStorage.getItem("nudge_last_session_notify");
    if (lastSessionNotify === todayStr) return;

    const totalDue = dueAlerts.reduce((sum, item) => sum + item.sub.amount, 0);
    sendNativeNotification(
      `🔔 [Nudge] ${dueAlerts.length} Renewal${dueAlerts.length > 1 ? "s" : ""} Due Soon!`,
      `${dueAlerts[0].sub.name} is due soon (${formatCurrency(dueAlerts[0].sub.amount)}). Total upcoming: ${formatCurrency(totalDue)}.`
    );
    sessionStorage.setItem("nudge_last_session_notify", todayStr);
  }, [dueAlerts, notificationSettings.browserEnabled]);

  const upcomingRenewals = useMemo(() => {
    return [...subscriptions.filter((s) => s.status !== "cancelled")]
      .sort((a, b) => a.renewal.localeCompare(b.renewal))
      .slice(0, 6);
  }, [subscriptions]);

  const categories = useMemo(() => {
    return Array.from(new Set(activeSubscriptions.map((s) => s.category)))
      .map((category) => ({
        category,
        value: activeSubscriptions
          .filter((s) => s.category === category)
          .reduce((sum, s) => sum + monthlyCost(s), 0),
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeSubscriptions]);

  const addSubscription = async (sub: NewSubscription): Promise<Subscription> => {
    const created = await createSubscription(sub, userId);
    setSubscriptions((prev) => [created, ...prev]);
    toast.success(`${created.name} added to your ledger`);
    return created;
  };

  const editSubscription = async (id: number, patch: Partial<NewSubscription>): Promise<void> => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await updateSubscription(id, patch, userId);
    toast.success("Subscription updated");
  };

  const cancelSubscription = async (sub: Subscription): Promise<void> => {
    const savedAmount = annualCost(sub);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: "cancelled" } : s))
    );
    setSavedPulse((n) => n + 1);
    setCelebration({ name: sub.name, amount: savedAmount });
    toast.success(`🎉 ${sub.name} marked cancelled — saving ${formatCurrency(savedAmount)}/yr!`, {
      duration: 5000,
    });
    await updateSubscription(sub.id, { status: "cancelled" }, userId);
  };

  const restoreSubscription = async (sub: Subscription): Promise<void> => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: "active", paused_until: undefined } : s))
    );
    toast.success(`${sub.name} restored to active`);
    await updateSubscription(sub.id, { status: "active", paused_until: undefined }, userId);
  };

  const pauseSubscription = async (sub: Subscription, pausedUntil?: string): Promise<void> => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, status: "paused", paused_until: pausedUntil || undefined } : s
      )
    );
    toast.info(`⏸️ ${sub.name} paused${pausedUntil ? ` until ${pausedUntil}` : ""}`);
    await updateSubscription(sub.id, { status: "paused", paused_until: pausedUntil || undefined }, userId);
  };

  const resumeSubscription = async (sub: Subscription): Promise<void> => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: "active", paused_until: undefined } : s))
    );
    toast.success(`▶️ ${sub.name} resumed to active`);
    await updateSubscription(sub.id, { status: "active", paused_until: undefined }, userId);
  };

  const removeSubscription = async (sub: Subscription): Promise<void> => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
    toast.info(`${sub.name} deleted`);
    await deleteSubscription(sub.id, userId);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        loading,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        pausedSubscriptions,
        monthlyTotal,
        annualTotal,
        annualSavings,
        upcomingRenewals,
        categories,
        celebration,
        savedPulse,
        isCloudSynced,
        userId,
        userEmail,
        currencySymbol,
        setCurrencySymbol,
        formatCurrency,
        monthlyBudget,
        setMonthlyBudget,
        budgetUsagePercent,
        remainingBudget,
        isOverBudget,
        notificationSettings,
        updateNotificationSettings,
        dueAlerts,
        dismissedAlertIds,
        dismissAlert,
        addSubscription,
        editSubscription,
        cancelSubscription,
        restoreSubscription,
        pauseSubscription,
        resumeSubscription,
        removeSubscription,
        refreshSubscriptions: fetchSubscriptions,
        signOut: onSignOut,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptions must be used within a SubscriptionProvider");
  }
  return context;
}
