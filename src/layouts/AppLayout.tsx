import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Download,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Plus,
  Settings,
  ShieldAlert,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { RemindersModal } from "@/components/RemindersModal";
import { CancellationModal } from "@/components/CancellationModal";
import { AddEditSubscriptionModal } from "@/components/AddEditSubscriptionModal";
import { type NewSubscription, type Subscription } from "@/lib/subscriptions";
import { Toaster, toast } from "sonner";

export function AppLayout() {
  const navigate = useNavigate();
  const {
    celebration,
    isCloudSynced,
    userEmail,
    upcomingRenewals,
    dueAlerts,
    dismissedAlertIds,
    addSubscription,
    editSubscription,
    signOut,
    formatCurrency,
  } = useSubscriptions();

  const [remindersOpen, setRemindersOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [cancellingSub, setCancellingSub] = useState<Subscription | null>(null);
  const [dismissTopAlert, setDismissTopAlert] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("To install Nudge on iOS: tap Share > 'Add to Home Screen'.");
      return;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success("Nudge installed successfully!");
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch {
      toast.info("Installation prompt closed.");
    }
  };

  const activeDueAlerts = dueAlerts.filter((a) => !dismissedAlertIds.includes(a.sub.id));

  const accountInitials = (userEmail.trim().charAt(0) || "U").toUpperCase();

  const handleSignOutWithToast = async () => {
    toast.success("Signed out successfully. See you soon!");
    await signOut();
    navigate("/");
  };

  const handleSaveSub = async (payload: NewSubscription, id?: number) => {
    if (id) {
      await editSubscription(id, payload);
    } else {
      await addSubscription(payload);
    }
  };

  const navItems = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/subscriptions", label: "Subscriptions", icon: Wallet },
    { to: "/advisor", label: "AI Advisor", icon: Lightbulb },
    { to: "/guides", label: "Cancellation Hub", icon: ShieldAlert },
    { to: "/import", label: "Paste Statement", icon: FileText },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="paper-surface min-h-screen flex flex-col">
      <Toaster position="bottom-center" richColors />

      {/* Celebration animation banner */}
      {celebration && (
        <div className="celebration" role="status" aria-live="polite">
          <div className="confetti-field" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="celebration-note">
            <span className="celebration-star" aria-hidden="true">✳</span>
            <span className="celebration-label">SAVINGS UNLOCKED!</span>
            <strong>{formatCurrency(celebration.amount)} back in your pocket.</strong>
            <span className="celebration-sub">One less recurring burden. Bye, {celebration.name}.</span>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className="border-b border-border bg-card/85 sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto flex min-h-18 max-w-350 items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="ledger-mark flex size-9 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground shadow-sm">
                <span className="font-display text-2xl italic leading-none">N</span>
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[23px] text-foreground group-hover:text-gold transition-colors">
                    Nudge
                  </span>
                  <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[9px] font-black uppercase text-gold tracking-wider">
                    Beta
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Take back recurring spend
                </span>
              </div>
            </NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground lg:flex">
              <span className="size-1.5 rounded-full bg-sage" /> Global Edition · Real Accounts
            </span>

            {/* Install PWA Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallClick}
              className="h-8 px-2.5 text-xs font-bold gap-1.5 border-border text-foreground hover:border-gold hover:text-gold transition-colors hidden sm:flex"
              title="Install Nudge as Mobile or Desktop App"
            >
              <Smartphone className="size-3.5 text-gold" />
              <span>Install App</span>
            </Button>

            {/* Quick Add Button in Header */}
            <Button
              size="sm"
              onClick={() => {
                setEditingSub(null);
                setAddModalOpen(true);
              }}
              className="gap-1.5 font-bold h-8 text-xs"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Add Subscription</span>
            </Button>

            {/* Reminders / Bell Button */}
            <Button
              variant="outline"
              size="icon"
              className="size-8.5 rounded-full shadow-none relative"
              title="Renewal Notifications & Reminders"
              onClick={() => setRemindersOpen(true)}
            >
              <Bell className="size-4" />
              {activeDueAlerts.length > 0 ? (
                <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black flex items-center justify-center animate-bounce shadow-xs">
                  {activeDueAlerts.length}
                </span>
              ) : upcomingRenewals.length > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-gold animate-pulse" />
              ) : null}
            </Button>

            {/* User Profile & Explicit Log Out Button */}
            <div className="flex items-center gap-2">
              <div
                className="flex size-8.5 items-center justify-center rounded-full border border-border bg-gold-soft text-xs font-bold text-gold select-none shadow-xs"
                title={`Signed in as ${userEmail}`}
              >
                {accountInitials}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOutWithToast}
                className="h-8 px-2.5 text-xs font-bold gap-1.5 border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
                title="Log out of Nudge"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Urgent Due-Date Banner */}
      {activeDueAlerts.length > 0 && !dismissTopAlert && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-foreground backdrop-blur-xs">
          <div className="mx-auto flex max-w-350 items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <span className="size-2 rounded-full bg-destructive animate-ping shrink-0" />
              <strong className="text-destructive font-black uppercase text-[10px] tracking-wider shrink-0">
                Action Needed:
              </strong>
              <span className="truncate">
                <strong>{activeDueAlerts[0].sub.name}</strong> is {activeDueAlerts[0].urgency === "today" ? "renewing TODAY" : activeDueAlerts[0].urgency === "tomorrow" ? "renewing TOMORROW" : `renewing in ${activeDueAlerts[0].daysLeft} days`} ({formatCurrency(activeDueAlerts[0].sub.amount, activeDueAlerts[0].sub.currency)}).
                {activeDueAlerts.length > 1 && ` (+${activeDueAlerts.length - 1} more renewals approaching)`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setRemindersOpen(true)}
                className="text-[11px] font-bold text-destructive hover:underline"
              >
                Review Alerts →
              </button>
              <button
                type="button"
                onClick={() => setDismissTopAlert(true)}
                className="text-muted-foreground hover:text-foreground"
                title="Dismiss banner"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sidebar + Outlet */}
      <div className="mx-auto grid max-w-350 flex-1 w-full grid-cols-1 md:grid-cols-[195px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar Nav */}
        <aside className="border-b border-border bg-card/40 px-3 py-3 md:min-h-[calc(100vh-72px)] md:border-r md:border-b-0 md:px-4 md:py-6">
          <div className="flex gap-1 overflow-x-auto md:block md:space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item h-10 shrink-0 flex items-center justify-start gap-3 px-3 rounded-md text-[13px] font-semibold transition-colors md:w-full ${
                    isActive
                      ? "bg-secondary text-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`
                }
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-10 hidden border-t border-border pt-5 md:block">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-muted-foreground">
              User Account
            </p>
            <div className="px-3 py-2.5 rounded-md bg-secondary/30 text-xs space-y-2">
              <div className="font-bold flex items-center justify-between text-foreground">
                <span className="truncate max-w-[140px]">{userEmail}</span>
                <span className="size-1.5 rounded-full bg-sage shrink-0" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {isCloudSynced ? "Synced with Supabase Cloud" : "Private User Storage"}
              </p>
              {!isCloudSynced && (
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="text-[10px] text-gold font-bold underline hover:text-foreground block"
                >
                  Configure Cloud Sync →
                </button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOutWithToast}
                className="w-full h-7 text-[11px] font-bold justify-start px-2 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
                Log Out
              </Button>
            </div>
          </div>

          {/* PWA Mobile App Card in Sidebar */}
          <div className="mt-4 hidden md:block">
            <div className="rounded-md border border-border/80 bg-card/60 p-2.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Smartphone className="size-3.5 text-gold" />
                <span>Nudge App</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Install Nudge on iOS, Android, or Desktop for 1-tap ledger access.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallClick}
                className="w-full h-7 text-[11px] font-bold gap-1 justify-center"
              >
                <Download className="size-3 text-gold" />
                Install Nudge
              </Button>
            </div>
          </div>

          <div className="mt-6 hidden px-3 text-[11px] leading-5 text-muted-foreground md:block">
            Universal subscription awareness & direct cancellation clarity.
          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className="min-w-0 px-4 pb-20 pt-6 md:px-8 md:pt-8 lg:px-10">
          <div className="mx-auto max-w-270">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <RemindersModal
        open={remindersOpen}
        onOpenChange={setRemindersOpen}
        subscriptions={upcomingRenewals}
        onOpenCancelGuide={(sub) => setCancellingSub(sub)}
      />

      <CancellationModal
        open={Boolean(cancellingSub)}
        onOpenChange={(isOpen) => !isOpen && setCancellingSub(null)}
        subscription={cancellingSub}
        userEmail={userEmail}
      />

      <AddEditSubscriptionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        editingSubscription={editingSub}
        onSave={handleSaveSub}
      />
    </div>
  );
}
