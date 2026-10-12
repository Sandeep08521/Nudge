import { useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  Download,
  FileText,
  FolderOpen,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { SubscriptionCalendar } from "@/components/SubscriptionCalendar";
import { AddEditSubscriptionModal } from "@/components/AddEditSubscriptionModal";
import { CancellationModal } from "@/components/CancellationModal";
import { exportToCSV, exportToJSON, type NewSubscription, type Subscription } from "@/lib/subscriptions";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Filter = "All" | "Active" | "Trials" | "Paused" | "Cancelled";
type SortBy = "renewal" | "amount-desc" | "amount-asc" | "name";

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const {
    subscriptions,
    activeSubscriptions,
    trialSubscriptions,
    pausedSubscriptions,
    cancelledSubscriptions,
    addSubscription,
    editSubscription,
    cancelSubscription,
    restoreSubscription,
    removeSubscription,
    userEmail,
  } = useSubscriptions();

  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("renewal");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [cancellationTarget, setCancellationTarget] = useState<Subscription | null>(null);

  const handleSave = async (payload: NewSubscription, id?: number) => {
    if (id) {
      await editSubscription(id, payload);
    } else {
      await addSubscription(payload);
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(subscriptions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nudge-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV file downloaded successfully!");
  };

  const visible = useMemo(() => {
    let list = subscriptions.filter((s) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Trials" ? s.status === "trial" : s.status === filter.toLowerCase());
      const matchesQuery = `${s.name} ${s.category} ${s.payment_method || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });

    return list.sort((a, b) => {
      if (sortBy === "renewal") return a.renewal.localeCompare(b.renewal);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [subscriptions, filter, query, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Heading & View Switcher */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
            THE FULL PICTURE
          </p>
          <h1 className="font-display text-3xl md:text-5xl leading-tight">
            Your subscriptions
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            Everything you are paying for, all in one place with zero bank account linking.
          </p>
        </div>

        {/* View Mode Toggle: Table Ledger vs Interactive Calendar */}
        <div className="flex items-center rounded-md border border-border p-1 bg-secondary/40 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${
              viewMode === "table"
                ? "bg-card text-foreground shadow-xs font-extrabold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="size-3.5" /> Ledger View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${
              viewMode === "calendar"
                ? "bg-card text-foreground shadow-xs font-extrabold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="size-3.5 text-gold" /> Monthly Calendar
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <SubscriptionCalendar
          onOpenCancelGuide={(sub) => setCancellationTarget(sub)}
          onEdit={(sub) => {
            setEditingSub(sub);
            setAddModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* Filter Tabs & Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex flex-wrap gap-1">
              {(["All", "Active", "Trials", "Paused", "Cancelled"] as Filter[]).map((tab) => {
                const count =
                  tab === "All"
                    ? subscriptions.length
                    : tab === "Active"
                    ? activeSubscriptions.length
                    : tab === "Trials"
                    ? trialSubscriptions.length
                    : tab === "Paused"
                    ? pausedSubscriptions.length
                    : cancelledSubscriptions.length;

                return (
                  <Button
                    key={tab}
                    variant="ghost"
                    className={`h-9 rounded-md px-3 text-xs font-bold transition-all ${
                      filter === tab
                        ? "bg-secondary text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/40"
                    }`}
                    onClick={() => setFilter(tab)}
                  >
                    {tab}
                    <span className="ml-1.5 opacity-60 text-[11px] tabular-nums font-normal">
                      ({count})
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/import")}
                className="gap-1.5 text-xs h-8.5"
              >
                <FileText className="size-3.5 text-gold" /> Paste Statement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 text-xs h-8.5"
              >
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button
                onClick={() => {
                  setEditingSub(null);
                  setAddModalOpen(true);
                }}
                size="sm"
                className="lift-control gap-1.5 transition-all text-xs font-bold h-8.5"
              >
                <Plus className="size-3.5" /> Add subscription
              </Button>
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search subscriptions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, category, or payment method (PhonePe, Card...)"
                className="h-9 bg-card pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="h-8 rounded-md border border-input bg-card px-2.5 text-xs font-medium"
              >
                <option value="renewal">Upcoming Renewal Date</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Subscription List */}
          <div className="space-y-2.5">
            {visible.map((s) => (
              <SubscriptionRow
                key={s.id}
                s={s}
                onEdit={(sub) => {
                  setEditingSub(sub);
                  setAddModalOpen(true);
                }}
                onCancel={(sub) => cancelSubscription(sub)}
                onRestore={(sub) => restoreSubscription(sub)}
                onDelete={(sub) => removeSubscription(sub)}
                onOpenCancelGuide={(sub) => setCancellationTarget(sub)}
              />
            ))}

            {visible.length === 0 && (
              <div className="flex flex-col items-center rounded-md border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                <FolderOpen className="mb-3 size-8 text-gold" />
                <h3 className="font-display text-2xl">
                  {query || filter !== "All" ? "No matching subscriptions found." : "No subscriptions yet."}
                </h3>
                <p className="mt-1 max-w-64 text-xs leading-5 text-muted-foreground">
                  {query || filter !== "All"
                    ? "Try clearing your search query or switching tabs."
                    : "Add your first subscription or paste an SMS debit alert to begin."}
                </p>
                {!query && filter === "All" && (
                  <Button
                    onClick={() => {
                      setEditingSub(null);
                      setAddModalOpen(true);
                    }}
                    className="mt-5 gap-2 font-bold text-xs"
                  >
                    <Plus className="size-4" /> Add subscription
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <AddEditSubscriptionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        editingSubscription={editingSub}
        onSave={handleSave}
      />

      <CancellationModal
        open={!!cancellationTarget}
        onOpenChange={(open) => !open && setCancellationTarget(null)}
        subscription={cancellationTarget}
        userEmail={userEmail}
      />
    </div>
  );
}
