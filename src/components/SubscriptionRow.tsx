import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Ellipsis,
  Pause,
  Pencil,
  Play,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { evaluateSubscription } from "@/lib/aiAdvisor";
import { downloadCalendarFile } from "@/lib/calendarExport";
import { dayFromNow, type Subscription } from "@/lib/subscriptions";
import netflixLogo from "@/assets/netflix.svg";
import spotifyLogo from "@/assets/spotify.svg";
import notionLogo from "@/assets/notion.svg";
import youtubeLogo from "@/assets/youtube.svg";
import icloudLogo from "@/assets/icloud.svg";
import headspaceLogo from "@/assets/headspace.svg";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { toast } from "sonner";

const logos: Record<string, string> = {
  netflix: netflixLogo,
  spotify: spotifyLogo,
  notion: notionLogo,
  youtube: youtubeLogo,
  icloud: icloudLogo,
  headspace: headspaceLogo,
};

const dateLabel = (value: string) => {
  if (!value) return "";
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return value;
  }
};

export function SubscriptionRow({
  s,
  onEdit,
  onCancel,
  onRestore,
  onDelete,
  onOpenCancelGuide,
}: {
  s: Subscription;
  onEdit: (s: Subscription) => void;
  onCancel: (s: Subscription) => void;
  onRestore: (s: Subscription) => void;
  onDelete: (s: Subscription) => void;
  onOpenCancelGuide: (s: Subscription) => void;
}) {
  const { currencySymbol, formatCurrency, pauseSubscription, resumeSubscription } = useSubscriptions();
  const [menuOpen, setMenuOpen] = useState(false);
  const advice = evaluateSubscription(s, s.currency || currencySymbol);
  const cycleLabel =
    s.cycle === "quarterly" ? "quarter" : s.cycle === "half-yearly" ? "6 months" : s.cycle === "yearly" ? "year" : "month";

  return (
    <div
      className={`ledger-row relative flex items-center gap-3 rounded-md border border-border bg-card px-3 py-3.5 transition-[transform,box-shadow] duration-200 sm:gap-4 sm:px-4 ${
        menuOpen ? "z-30" : ""
      } ${s.status === "paused" ? "opacity-85 border-dashed" : ""}`}
    >
      {/* Brand Icon */}
      <div className={`brand-icon brand-${s.brand} flex size-11 shrink-0 items-center justify-center rounded-md text-xl font-extrabold`}>
        {logos[s.brand] ? <img src={logos[s.brand]} alt="" className="brand-logo" /> : s.initial}
      </div>

      {/* Main Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[13px] font-extrabold">{s.name}</span>
          {s.status === "trial" && (
            <span className="rounded-sm bg-gold-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-gold">
              Trial
            </span>
          )}
          {s.status === "cancelled" && (
            <span className="rounded-sm bg-sage-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sage">
              Cancelled
            </span>
          )}
          {s.status === "paused" && (
            <span className="rounded-sm bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Paused {s.paused_until ? `until ${dateLabel(s.paused_until)}` : ""}
            </span>
          )}
          {s.is_shared && (
            <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
              Shared (My share: {formatCurrency(s.my_share || s.amount, s.currency)})
            </span>
          )}
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5">
          <span>{s.category}</span>
          <span>·</span>
          <span>{s.payment_method || "Credit / Debit Card"}</span>
          <span>·</span>
          <span>
            {s.status === "cancelled"
              ? "No longer renewing"
              : s.status === "paused"
              ? `Paused · Resumes ${s.paused_until ? dateLabel(s.paused_until) : "on demand"}`
              : s.status === "trial"
              ? `Trial ends ${dateLabel(s.renewal)}`
              : `Renews ${dateLabel(s.renewal)}`}
          </span>
        </p>
      </div>

      {/* Pricing & Cost per use */}
      <div className="shrink-0 text-right">
        <div className="text-[13px] font-extrabold tabular-nums">
          {s.status === "paused" ? (
            <span className="line-through text-muted-foreground text-xs">{formatCurrency(s.amount, s.currency)}</span>
          ) : (
            formatCurrency(s.amount, s.currency)
          )}
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          {s.status === "paused" ? "Spend Paused" : `/ ${cycleLabel}`}
        </div>
        {s.status === "active" && advice.costPerUseLabel !== "—" && (
          <div className="mt-1 text-[10px] font-semibold text-sage">{advice.costPerUseLabel}/use</div>
        )}
      </div>

      {/* Action Ellipsis Menu */}
      <div className="relative ml-0.5 shrink-0 flex items-center gap-1.5">
        {s.status === "paused" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] font-bold px-2 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1 hidden sm:flex"
            onClick={() => resumeSubscription(s)}
            title="Resume subscription"
          >
            <Play className="size-3" /> Resume
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label={`Options for ${s.name}`}
          title={`Options for ${s.name}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Ellipsis className="size-4" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
            <Button
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-xs"
              onClick={() => {
                onOpenCancelGuide(s);
                setMenuOpen(false);
              }}
            >
              <ShieldAlert className="size-3.5 text-gold" /> Cancellation Guide
            </Button>

            <Button
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-xs"
              onClick={() => {
                downloadCalendarFile([s], `nudge-${s.name.toLowerCase().replace(/\s+/g, "-")}.ics`);
                toast.success(`Calendar alert (.ics) generated for ${s.name}`);
                setMenuOpen(false);
              }}
            >
              <Calendar className="size-3.5" /> Add to Calendar
            </Button>

            <Button
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-xs"
              onClick={() => {
                onEdit(s);
                setMenuOpen(false);
              }}
            >
              <Pencil className="size-3.5" /> Edit details
            </Button>

            {s.status === "paused" ? (
              <Button
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs text-purple-700 dark:text-purple-300 font-bold"
                onClick={() => {
                  resumeSubscription(s);
                  setMenuOpen(false);
                }}
              >
                <Play className="size-3.5" /> Resume to active
              </Button>
            ) : s.status === "active" ? (
              <Button
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs text-purple-700 dark:text-purple-300"
                onClick={() => {
                  pauseSubscription(s, dayFromNow(30));
                  setMenuOpen(false);
                }}
              >
                <Pause className="size-3.5" /> Pause for 30 days
              </Button>
            ) : null}

            {s.status === "cancelled" ? (
              <Button
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs"
                onClick={() => {
                  onRestore(s);
                  setMenuOpen(false);
                }}
              >
                <CheckCircle2 className="size-3.5 text-sage" /> Restore to active
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="h-8 w-full justify-start gap-2 px-2 text-xs text-destructive"
                onClick={() => {
                  onCancel(s);
                  setMenuOpen(false);
                }}
              >
                <X className="size-3.5" /> Mark cancelled
              </Button>
            )}

            <div className="my-1 border-t border-border" />

            <Button
              variant="ghost"
              className="h-8 w-full justify-start gap-2 px-2 text-xs text-destructive/80 hover:text-destructive"
              onClick={() => {
                onDelete(s);
                setMenuOpen(false);
              }}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
