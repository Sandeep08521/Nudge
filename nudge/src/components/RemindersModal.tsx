import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Mail,
  Send,
  ShieldAlert,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadCalendarFile } from "@/lib/calendarExport";
import { type Subscription } from "@/lib/subscriptions";
import { useSubscriptions } from "@/context/SubscriptionContext";
import {
  requestBrowserPermission,
  getBrowserNotificationPermission,
  triggerTestNotification,
  sendWebhookAlert,
  isBrowserNotificationSupported,
  getDaysUntilRenewal,
} from "@/lib/notificationService";
import { toast } from "sonner";

export function RemindersModal({
  open,
  onOpenChange,
  subscriptions,
  onOpenCancelGuide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: Subscription[];
  onOpenCancelGuide?: (sub: Subscription) => void;
}) {
  const {
    currencySymbol,
    formatCurrency,
    notificationSettings,
    updateNotificationSettings,
    dueAlerts,
    dismissedAlertIds,
    dismissAlert,
  } = useSubscriptions();

  const [tab, setTab] = useState<"alerts" | "channels" | "calendar">("alerts");
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [webhookInput, setWebhookInput] = useState(notificationSettings.webhookUrl || "");
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [open]);

  const activeAlerts = dueAlerts.filter((item) => !dismissedAlertIds.includes(item.sub.id));

  const activeSubs = subscriptions.filter((s) => s.status !== "cancelled");
  const sortedUpcoming = [...activeSubs]
    .sort((a, b) => a.renewal.localeCompare(b.renewal))
    .slice(0, 8);

  const handleEnableBrowser = async () => {
    try {
      const perm = await requestBrowserPermission();
      setBrowserPermission(perm);
      if (perm === "granted") {
        updateNotificationSettings({ browserEnabled: true });
        toast.success("Desktop notifications enabled! You will be alerted before renewal dates.");
        triggerTestNotification(currencySymbol);
      } else if (perm === "denied") {
        toast.error("Notification permission was blocked in your browser settings.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable notifications.");
    }
  };

  const handleTestNotification = () => {
    if (browserPermission !== "granted") {
      toast.info("Please grant browser notification permission first.");
      handleEnableBrowser();
      return;
    }
    const success = triggerTestNotification(currencySymbol);
    if (success) {
      toast.success("Test notification dispatched! Check your desktop / device alerts.");
    } else {
      toast.error("Could not display notification. Check browser settings.");
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings({ webhookUrl: webhookInput.trim() });
    toast.success("Webhook URL saved!");
  };

  const handleTestWebhook = async () => {
    if (!webhookInput.trim()) {
      toast.error("Please enter a Discord or Slack Webhook URL first.");
      return;
    }
    setTestingWebhook(true);
    const mockAlert = activeAlerts[0] || {
      sub: {
        id: 999,
        name: "Netflix",
        amount: 15.49,
        category: "Entertainment",
        cycle: "monthly",
        renewal: "2026-10-15",
        status: "active",
        initial: "N",
        brand: "netflix",
      },
      daysLeft: 2,
      urgency: "soon" as const,
      message: `Renews in 2 days for ${currencySymbol}15.49`,
    };

    const ok = await sendWebhookAlert(webhookInput.trim(), mockAlert, currencySymbol);
    setTestingWebhook(false);
    if (ok) {
      toast.success("Test alert successfully sent to your webhook!");
      updateNotificationSettings({ webhookUrl: webhookInput.trim() });
    } else {
      toast.error("Failed to send webhook alert. Check the URL and try again.");
    }
  };

  const handleCalendarSyncAll = () => {
    downloadCalendarFile(activeSubs);
    toast.success("Downloaded calendar alerts (.ics) with automated pre-debit alarms!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-lg bg-card p-6 md:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold">
            <BellRing className="size-5" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest">
              Notification & Renewal Hub
            </span>
          </div>
          <DialogTitle className="font-display text-2xl md:text-3xl font-normal">
            Pre-Due Date Reminders & Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified before cards are charged or trials auto-convert. Configure browser push alerts, calendar sync, and webhooks.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="mt-4 flex border-b border-border text-xs font-bold">
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              tab === "alerts"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("alerts")}
          >
            <Clock className="size-3.5" />
            Due Soon Alerts
            {activeAlerts.length > 0 && (
              <span className="size-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              tab === "channels"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("channels")}
          >
            <Volume2 className="size-3.5" />
            Alert Channels
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              tab === "calendar"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("calendar")}
          >
            <Calendar className="size-3.5" />
            Calendar Sync (.ics)
          </button>
        </div>

        {/* TAB 1: DUE SOON ALERTS */}
        {tab === "alerts" && (
          <div className="mt-5 space-y-4">
            {activeAlerts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>Action Needed ({activeAlerts.length} renewing soon)</span>
                  <span className="text-[11px] font-normal">
                    Lead time: {notificationSettings.leadDays} days
                  </span>
                </div>

                {activeAlerts.map(({ sub, daysLeft, urgency, message }) => (
                  <div
                    key={sub.id}
                    className={`rounded-lg border p-4 space-y-2 transition-all ${
                      urgency === "today"
                        ? "border-destructive/60 bg-destructive/10"
                        : urgency === "tomorrow"
                        ? "border-gold/50 bg-gold-soft/20"
                        : "border-border bg-card/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{sub.name}</span>
                          {urgency === "today" ? (
                            <span className="rounded bg-destructive text-destructive-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
                              Due Today
                            </span>
                          ) : urgency === "tomorrow" ? (
                            <span className="rounded bg-gold text-primary-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Due Tomorrow
                            </span>
                          ) : sub.status === "trial" ? (
                            <span className="rounded bg-gold-soft text-gold px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Trial Expiring
                            </span>
                          ) : (
                            <span className="rounded bg-secondary text-foreground px-2 py-0.5 text-[10px] font-bold">
                              In {daysLeft} days
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground leading-tight">{message}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Payment: {sub.payment_method || "Card / Mandate"} · Renewal Date: {sub.renewal}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-sm tabular-nums">
                          {formatCurrency(sub.amount, sub.currency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">/ {sub.cycle}</div>
                      </div>
                    </div>

                    {/* Quick actions for due subscription */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs font-bold gap-1.5"
                        onClick={() => {
                          if (onOpenCancelGuide) {
                            onOpenChange(false);
                            onOpenCancelGuide(sub);
                          } else {
                            toast.info(`Go to Cancellation Hub to view steps for ${sub.name}.`);
                          }
                        }}
                      >
                        <ShieldAlert className="size-3" />
                        How to Cancel
                      </Button>

                      <button
                        type="button"
                        onClick={() => dismissAlert(sub.id)}
                        className="text-[11px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                      >
                        <X className="size-3" /> Dismiss alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-sage/40 bg-sage-soft/20 p-5 text-center space-y-2">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-sage-soft text-sage">
                  <Check className="size-5" />
                </div>
                <h4 className="font-display text-lg text-foreground">You are all clear!</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No subscriptions on your ledger are renewing within the next {notificationSettings.leadDays} days. Nudge will alert you as due dates approach.
                </p>
              </div>
            )}

            {/* Upcoming Schedule */}
            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                Full Upcoming Renewal Timeline
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sortedUpcoming.map((s) => {
                  const days = getDaysUntilRenewal(s.renewal);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/40 text-xs border border-transparent hover:border-border transition-colors"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.status === "trial" && (
                            <span className="text-[9px] font-extrabold uppercase text-gold bg-gold-soft px-1 rounded">
                              Trial
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.payment_method || "Card"} · Renews {s.renewal}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold tabular-nums">{formatCurrency(s.amount, s.currency)}</div>
                        <div className="text-[10px] font-bold text-gold">
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALERT CHANNELS & SETTINGS */}
        {tab === "channels" && (
          <div className="mt-5 space-y-5 text-xs">
            {/* Native Browser Notifications */}
            <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-md bg-gold-soft flex items-center justify-center text-gold">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Browser Push & Desktop Alerts</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Receive alerts on your laptop or phone before subscription debits occur.
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    browserPermission === "granted"
                      ? "bg-sage-soft text-sage"
                      : browserPermission === "denied"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {browserPermission === "granted"
                    ? "Active"
                    : browserPermission === "denied"
                    ? "Blocked"
                    : "Not Enabled"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {browserPermission !== "granted" ? (
                  <Button size="sm" onClick={handleEnableBrowser} className="font-bold text-xs gap-1.5">
                    <Sparkles className="size-3.5" />
                    Enable Desktop Notifications
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTestNotification}
                      className="font-bold text-xs gap-1.5"
                    >
                      <Volume2 className="size-3.5" />
                      Send Test Notification
                    </Button>
                    <span className="text-[11px] text-sage font-semibold flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Alerts enabled
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Reminder Lead Time */}
            <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
              <h4 className="font-bold text-sm text-foreground">Reminder Advance Window</h4>
              <p className="text-muted-foreground text-[11px]">
                Choose how many days prior to the renewal date Nudge should start alerting you:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[1, 2, 3, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      updateNotificationSettings({ leadDays: days });
                      toast.success(`Updated reminder window to ${days} day${days > 1 ? "s" : ""} in advance.`);
                    }}
                    className={`p-2.5 rounded-md border text-center transition-all ${
                      notificationSettings.leadDays === days
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                        : "border-border bg-card hover:bg-secondary/50 text-foreground"
                    }`}
                  >
                    <div className="text-sm font-extrabold">{days} {days === 1 ? "Day" : "Days"}</div>
                    <div className="text-[9px] opacity-80">{days === 3 ? "Recommended" : days === 1 ? "Cutoff alert" : "In advance"}</div>
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-2 border-t border-border/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnTrialEnd}
                    onChange={(e) => updateNotificationSettings({ notifyOnTrialEnd: e.target.checked })}
                    className="size-4 rounded accent-primary"
                  />
                  <span>
                    <strong>Free Trial Conversion Alarms:</strong> Send priority warning 24 hours before trials convert to paid subscriptions.
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnSameDay}
                    onChange={(e) => updateNotificationSettings({ notifyOnSameDay: e.target.checked })}
                    className="size-4 rounded accent-primary"
                  />
                  <span>
                    <strong>Same-Day Pre-Debit Warning:</strong> Morning-of reminder before the bank debit occurs.
                  </span>
                </label>
              </div>
            </div>

            {/* Webhook Alerts (Discord / Slack) */}
            <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-gold" />
                <h4 className="font-bold text-sm text-foreground">Discord / Slack Webhook Integration</h4>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Post automated renewal alerts to a private Discord channel or Slack workspace.
              </p>

              <form onSubmit={handleSaveWebhook} className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="text-xs font-bold">
                    Save Webhook
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !webhookInput.trim()}
                    className="text-xs font-bold gap-1.5"
                  >
                    <Send className="size-3" />
                    {testingWebhook ? "Sending…" : "Test Webhook Alert"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PHONE CALENDAR SYNC (.ICS) */}
        {tab === "calendar" && (
          <div className="mt-5 space-y-4 text-xs">
            <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-gold font-bold text-sm">
                <Calendar className="size-4" />
                <span>Zero-Tracking Native Calendar Sync</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Export all renewals into your device calendar. Works natively with Apple Calendar (iOS & macOS), Google Calendar, and Microsoft Outlook.
              </p>

              <div className="space-y-2 rounded-md bg-secondary/40 p-3 text-[11px]">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="size-3.5 text-sage" /> Alarms Configured Automatically:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>3 days prior to renewal (Early reminder to cancel or adjust plan)</li>
                  <li>24 hours prior to renewal (Urgent cutoff alert before debit)</li>
                  <li>Direct links and notes for each service stored in the event description</li>
                </ul>
              </div>

              <Button size="sm" onClick={handleCalendarSyncAll} className="w-full gap-2 font-bold h-9">
                <Calendar className="size-3.5" />
                Download Calendar File (.ics) for All Subscriptions
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
