import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { downloadCalendarFile } from "@/lib/calendarExport";
import { type Subscription } from "@/lib/subscriptions";
import { toast } from "sonner";

interface SubscriptionCalendarProps {
  onOpenCancelGuide: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
}

export function SubscriptionCalendar({
  onOpenCancelGuide,
  onEdit,
}: SubscriptionCalendarProps) {
  const { subscriptions, formatCurrency } = useSubscriptions();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(() => {
    return new Date().getDate();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Filter subscriptions that renew in this month
  // Note: For recurring subscriptions, renewals recur on the same day of the month or matching date
  const monthRenewals = useMemo(() => {
    const map = new Map<number, Subscription[]>();

    subscriptions.forEach((sub) => {
      if (sub.status === "cancelled") return;
      if (!sub.renewal) return;

      const [rYear, rMonth, rDay] = sub.renewal.split("-").map(Number);
      if (!rDay) return;

      // Check if it renews in this calendar month:
      // For monthly cycle: renews every month on that day
      // For specific date matching:
      let renewsThisMonth = false;
      if (sub.cycle === "monthly") {
        renewsThisMonth = true;
      } else if (rYear === year && rMonth - 1 === month) {
        renewsThisMonth = true;
      } else {
        // Multi-month cycle calculation
        const cycleMonths = sub.cycle === "quarterly" ? 3 : sub.cycle === "half-yearly" ? 6 : 12;
        const totalMonthsDiff = (year - rYear) * 12 + (month - (rMonth - 1));
        if (totalMonthsDiff >= 0 && totalMonthsDiff % cycleMonths === 0) {
          renewsThisMonth = true;
        }
      }

      if (renewsThisMonth) {
        const effectiveDay = Math.min(rDay, daysInMonth);
        const existing = map.get(effectiveDay) || [];
        existing.push(sub);
        map.set(effectiveDay, existing);
      }
    });

    return map;
  }, [subscriptions, year, month, daysInMonth]);

  // Total cash out this month
  const totalMonthSpend = useMemo(() => {
    let total = 0;
    monthRenewals.forEach((subs) => {
      subs.forEach((s) => {
        if (s.status !== "paused") {
          total += s.amount;
        }
      });
    });
    return total;
  }, [monthRenewals]);

  // Find biggest cash-out day (spike day)
  const spikeDay = useMemo(() => {
    let maxSpend = 0;
    let maxDay: number | null = null;
    monthRenewals.forEach((subs, day) => {
      const daySpend = subs.reduce((sum, s) => sum + (s.status === "paused" ? 0 : s.amount), 0);
      if (daySpend > maxSpend) {
        maxSpend = daySpend;
        maxDay = day;
      }
    });
    return maxDay && maxSpend > 0 ? { day: maxDay, amount: maxSpend } : null;
  }, [monthRenewals]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayNumber(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayNumber(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayNumber(now.getDate());
  };

  const selectedDaySubs = selectedDayNumber ? monthRenewals.get(selectedDayNumber) || [] : [];
  const selectedDayTotal = selectedDaySubs.reduce((sum, s) => sum + (s.status === "paused" ? 0 : s.amount), 0);

  const isCurrentMonthToday = (dayNum: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === dayNum;
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation & Top Stats */}
      <div className="rounded-lg border border-border bg-card/60 p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-md bg-gold-soft flex items-center justify-center text-gold">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {monthName} {year}
            </h2>
            <p className="text-xs text-muted-foreground">
              Total projected renewals: <strong className="text-foreground">{formatCurrency(totalMonthSpend)}</strong> across{" "}
              {Array.from(monthRenewals.values()).flat().length} debits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {spikeDay && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 mr-2">
              <Flame className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                Spike Day: <strong>{monthName.slice(0, 3)} {spikeDay.day}</strong> ({formatCurrency(spikeDay.amount)})
              </span>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleToday} className="h-8 text-xs font-bold">
            Current Month
          </Button>
          <div className="flex items-center border border-border rounded-md bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Calendar View + Day Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar Grid */}
        <div className="rounded-lg border border-border bg-card p-4 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Leading empty blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-20 rounded-md bg-secondary/10 p-1 opacity-40" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const daySubs = monthRenewals.get(dayNum) || [];
              const isToday = isCurrentMonthToday(dayNum);
              const isSelected = selectedDayNumber === dayNum;
              const isSpike = spikeDay?.day === dayNum;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`min-h-20 rounded-md border p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-secondary/80 ring-2 ring-primary/20 shadow-xs"
                      : isSpike
                      ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
                      : isToday
                      ? "border-gold/50 bg-gold-soft/10 hover:border-gold"
                      : "border-border/60 bg-card/40 hover:bg-secondary/40 hover:border-border"
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold size-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-gold text-primary-foreground font-black"
                          : isSelected
                          ? "bg-foreground text-background font-black"
                          : "text-muted-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {daySubs.length > 0 && (
                      <span className="text-[10px] font-black tabular-nums text-foreground">
                        {daySubs.length}
                      </span>
                    )}
                  </div>

                  {/* Renewals list snippets */}
                  <div className="space-y-1 mt-1">
                    {daySubs.slice(0, 2).map((sub) => (
                      <div
                        key={sub.id}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-bold leading-tight ${
                          sub.status === "paused"
                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 line-through"
                            : "bg-secondary text-foreground"
                        }`}
                        title={`${sub.name}: ${formatCurrency(sub.amount, sub.currency)}`}
                      >
                        {sub.name.split(" ")[0]} {formatCurrency(sub.amount, sub.currency)}
                      </div>
                    ))}
                    {daySubs.length > 2 && (
                      <div className="text-[8px] font-bold text-muted-foreground text-center">
                        +{daySubs.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Sidebar */}
        <div className="rounded-lg border border-border bg-card/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                  Day Inspector
                </span>
                <h3 className="font-display text-xl font-bold">
                  {selectedDayNumber ? `${monthName} ${selectedDayNumber}` : "Select a day"}
                </h3>
              </div>
              {selectedDayNumber && selectedDaySubs.length > 0 && (
                <div className="text-right">
                  <div className="text-sm font-black tabular-nums">{formatCurrency(selectedDayTotal)}</div>
                  <div className="text-[10px] text-muted-foreground">due on this day</div>
                </div>
              )}
            </div>

            {/* List of Subscriptions on Selected Day */}
            <div className="mt-4 space-y-3">
              {selectedDaySubs.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-md border border-border bg-card p-3 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold">{sub.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {sub.category} · {sub.payment_method || "Card"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black">{formatCurrency(sub.amount, sub.currency)}</span>
                      {sub.status === "paused" && (
                        <div className="text-[9px] font-bold text-purple-600">Paused</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6.5 text-[10px] font-bold px-2 gap-1"
                      onClick={() => onOpenCancelGuide(sub)}
                    >
                      <ShieldAlert className="size-3 text-gold" /> Cancel Guide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6.5 text-[10px] font-bold px-2 gap-1"
                      onClick={() => {
                        downloadCalendarFile([sub], `nudge-${sub.name.toLowerCase().replace(/\s+/g, "-")}.ics`);
                        toast.success(`Calendar alarm (.ics) generated for ${sub.name}`);
                      }}
                    >
                      <Clock className="size-3" /> .ICS Alarm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6.5 text-[10px] px-1.5"
                      onClick={() => onEdit(sub)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}

              {selectedDayNumber && selectedDaySubs.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                  <div className="size-9 rounded-full bg-secondary mx-auto flex items-center justify-center">
                    <Info className="size-4" />
                  </div>
                  <p>No renewals scheduled on {monthName} {selectedDayNumber}.</p>
                  <p className="text-[10px]">Click any date on the calendar with badges to inspect renewals.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Calendar Export of this month */}
          <div className="pt-4 border-t border-border mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allSubs = Array.from(monthRenewals.values()).flat();
                if (allSubs.length === 0) {
                  toast.info("No subscriptions to sync for this month.");
                  return;
                }
                downloadCalendarFile(allSubs, `nudge-renewals-${year}-${month + 1}.ics`);
                toast.success(`Exported ${allSubs.length} calendar events for ${monthName}!`);
              }}
              className="w-full h-8 text-xs font-bold gap-1.5"
            >
              <CalendarDays className="size-3.5" /> Sync Entire Month to Calendar (.ics)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
