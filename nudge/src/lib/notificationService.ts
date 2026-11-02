import { type Subscription } from "./subscriptions";

export interface NotificationSettings {
  browserEnabled: boolean;
  leadDays: number; // e.g. 1, 2, 3, or 7 days
  notifyOnTrialEnd: boolean;
  notifyOnSameDay: boolean;
  emailRemindersEnabled: boolean;
  reminderEmail?: string;
  webhookUrl?: string;
  lastCheckedDate?: string;
}

const STORAGE_KEY = "nudge_notification_settings";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserEnabled: false,
  leadDays: 3,
  notifyOnTrialEnd: true,
  notifyOnSameDay: true,
  emailRemindersEnabled: true,
  reminderEmail: "",
  webhookUrl: "",
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

/**
 * Calculates days remaining until the renewal date.
 * 0 = renews today
 * 1 = renews tomorrow
 * < 0 = already passed
 */
export function getDaysUntilRenewal(dateStr: string): number {
  if (!dateStr) return 999;
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

export interface DueAlertItem {
  sub: Subscription;
  daysLeft: number;
  urgency: "today" | "tomorrow" | "soon" | "trial";
  message: string;
}

export function getDueAlerts(
  subscriptions: Subscription[],
  leadDays = 3,
  formatCurrencyFn?: (amount: number, symbol?: string) => string
): DueAlertItem[] {
  const activeSubs = subscriptions.filter((s) => s.status !== "cancelled");
  const alerts: DueAlertItem[] = [];

  for (const s of activeSubs) {
    const daysLeft = getDaysUntilRenewal(s.renewal);

    // Check if within lead window or due today
    if (daysLeft >= 0 && daysLeft <= leadDays) {
      const isTrial = s.status === "trial";
      const formattedAmount = formatCurrencyFn
        ? formatCurrencyFn(s.amount, s.currency)
        : `${s.currency || "$"}${s.amount}`;

      let urgency: DueAlertItem["urgency"] = "soon";
      let message = "";

      if (daysLeft === 0) {
        urgency = "today";
        message = isTrial
          ? `Free trial ends TODAY! Auto-renews to ${formattedAmount}.`
          : `Renews TODAY for ${formattedAmount}.`;
      } else if (daysLeft === 1) {
        urgency = "tomorrow";
        message = isTrial
          ? `Free trial ends TOMORROW! Auto-renews to ${formattedAmount}.`
          : `Renews TOMORROW for ${formattedAmount}.`;
      } else if (isTrial) {
        urgency = "trial";
        message = `Free trial ends in ${daysLeft} days (${formattedAmount}).`;
      } else {
        urgency = "soon";
        message = `Renews in ${daysLeft} days for ${formattedAmount}.`;
      }

      alerts.push({ sub: s, daysLeft, urgency, message });
    }
  }

  // Sort by urgency: lowest daysLeft first
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Request native browser notification permissions
 */
export async function requestBrowserPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser does not support desktop notifications.");
  }
  return await Notification.requestPermission();
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Dispatches a native browser notification if permissions are granted.
 */
export function sendNativeNotification(title: string, body: string, tag?: string): boolean {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    new Notification(title, {
      body,
      tag: tag || "nudge-alert",
      icon: "/favicon.ico",
    });
    return true;
  } catch (err) {
    console.warn("Could not dispatch native notification:", err);
    return false;
  }
}

/**
 * Fires an instant test notification to prove browser notifications are working
 */
export function triggerTestNotification(currencySymbol = "$"): boolean {
  return sendNativeNotification(
    "🔔 [Nudge] Test Renewal Alert",
    `Netflix renews in 2 days (${currencySymbol}15.49). Your pre-due-date alerts are active and working!`,
    "nudge-test"
  );
}

/**
 * Dispatches a webhook notification to Slack, Discord, or a custom webhook endpoint.
 */
export async function sendWebhookAlert(
  webhookUrl: string,
  alert: DueAlertItem,
  currencySymbol = "$"
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) return false;

  const payload = {
    content: `🚨 **[Nudge Alert]** **${alert.sub.name}** is due in **${alert.daysLeft === 0 ? "today" : `${alert.daysLeft} days`}**! Amount: ${currencySymbol}${alert.sub.amount}. Payment mode: ${alert.sub.payment_method || "Card/Mandate"}.`,
    username: "Nudge Assistant",
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn("Webhook dispatch failed:", err);
    return false;
  }
}
