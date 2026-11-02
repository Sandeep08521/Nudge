import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AggregatorFlow } from "@/components/AggregatorFlow";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { findingToNewSubscription, takeStashedFindings, type RecurringFinding } from "@/lib/aggregator";

export function AggregatorPage() {
  const navigate = useNavigate();
  const { addSubscription } = useSubscriptions();
  // Findings carried over from the public demo (read once, then cleared).
  const restored = useMemo(() => takeStashedFindings(), []);

  const handleImport = async (items: RecurringFinding[]) => {
    try {
      for (const f of items) await addSubscription(findingToNewSubscription(f));
      toast.success(`Added ${items.length} subscription${items.length === 1 ? "" : "s"} to your ledger.`);
      navigate("/subscriptions");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add subscriptions.");
    }
  };

  return (
    <div className="max-w-3xl space-y-6 view-enter">
      <div>
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">ACCOUNT AGGREGATOR · SANDBOX</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">Connect with consent</h1>
        <p className="mt-1 text-xs text-muted-foreground md:text-sm">
          Approve a one-time, read-only data share and let Nudge detect recurring charges for you. Runs on synthetic data until live AA access is enabled.
        </p>
      </div>
      <AggregatorFlow onImport={handleImport} initialFindings={restored} />
    </div>
  );
}
