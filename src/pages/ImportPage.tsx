import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/context/SubscriptionContext";
import {
  parseStatementText,
  candidateToNewSubscription,
  type ParsedCandidate,
} from "@/lib/statementParser";
import { toast } from "sonner";

const SAMPLE_STATEMENT = `Alert: Recurring charge of $15.49 for NETFLIX on card ending 4582 on 03-Oct-26.
Notification: Auto-renew for SPOTIFY of $10.99 processed via PayPal.
Renewal notice: Your annual subscription for AMAZON PRIME $139.00 will renew on 10-Oct-26.
Charge: APPLE.COM/BILL $2.99 on 04-Oct-26 for iCloud+ Storage.
Your CHATGPT PLUS subscription renewed for $20.00 on 15-Oct-26.`;

export function ImportPage() {
  const navigate = useNavigate();
  const { addSubscription, currencySymbol } = useSubscriptions();

  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [analyzed, setAnalyzed] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error("Please paste statement or notification text first.");
      return;
    }
    const results = parseStatementText(text);
    setCandidates(results);
    setSelectedIndices(new Set(results.map((_, i) => i)));
    setAnalyzed(true);
    if (results.length === 0) {
      toast.info("No recurring subscription patterns detected. Check text format.");
    } else {
      toast.success(`Found ${results.length} recurring subscription candidate${results.length > 1 ? "s" : ""}!`);
    }
  };

  const loadSample = () => {
    setText(SAMPLE_STATEMENT);
    const results = parseStatementText(SAMPLE_STATEMENT);
    setCandidates(results);
    setSelectedIndices(new Set(results.map((_, i) => i)));
    setAnalyzed(true);
    toast.success("Loaded sample debit notifications & statement alerts!");
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const updateCandidateAmount = (index: number, val: number) => {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, amount: val } : c)));
  };

  const handleImport = async () => {
    const toImport = candidates.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) {
      toast.error("Please select at least one item to import.");
      return;
    }
    setImporting(true);
    try {
      for (const item of toImport) {
        await addSubscription(candidateToNewSubscription(item));
      }
      toast.success(`Successfully imported ${toImport.length} subscriptions!`);
      navigate("/subscriptions");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import subscriptions.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
          ZERO-CREDENTIAL BULK IMPORT
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          Paste Statement or SMS
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          Copy-paste debit alerts from HDFC, ICICI, SBI, Axis, or PhonePe/GPay passbooks. Everything is parsed 100% locally in your browser.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between pb-2">
            <label htmlFor="sms-text" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Paste SMS or statement text:
            </label>
            <button
              type="button"
              onClick={loadSample}
              className="text-xs font-bold text-sage hover:underline flex items-center gap-1"
            >
              <Sparkles className="size-3.5" />
              Try sample notification alerts
            </button>
          </div>
          <textarea
            id="sms-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. $15.49 debited towards NETFLIX on Oct 03... Automatic payment of $10.99 for SPOTIFY..."
            className="w-full rounded-md border border-input bg-background p-3.5 text-xs font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {analyzed
              ? `${candidates.length} subscriptions identified`
              : "Detects Netflix, Spotify, Hotstar, Swiggy, Zomato, Cultpass & more"}
          </span>
          <Button size="sm" onClick={handleAnalyze} className="gap-2 font-bold">
            <FileText className="size-3.5" />
            {analyzed ? "Re-analyze Text" : "Analyze Messages"}
          </Button>
        </div>

        {analyzed && candidates.length > 0 && (
          <div className="mt-6 space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>DETECTED SUBSCRIPTIONS TO ADD</span>
              <span>
                {selectedIndices.size} of {candidates.length} selected
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {candidates.map((cand, idx) => {
                const isChecked = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                      isChecked
                        ? "border-gold/50 bg-gold-soft/10"
                        : "border-border bg-card/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(idx)}
                        className="size-4 rounded accent-gold cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{cand.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {cand.category} · {cand.cycle} · {cand.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">₹</span>
                      <input
                        type="number"
                        value={cand.amount}
                        onChange={(e) => updateCandidateAmount(idx, Number(e.target.value))}
                        className="h-8 w-22 rounded border border-input bg-background px-2 text-xs font-bold tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setText("");
                  setCandidates([]);
                  setAnalyzed(false);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing || selectedIndices.size === 0}
                className="gap-2 font-bold"
              >
                <Plus className="size-3.5" />
                {importing
                  ? "Importing..."
                  : `Add ${selectedIndices.size} Subscription${selectedIndices.size > 1 ? "s" : ""} to Ledger`}
              </Button>
            </div>
          </div>
        )}

        {analyzed && candidates.length === 0 && (
          <div className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
            <AlertCircle className="size-4 shrink-0 text-gold" />
            <span>
              No recognizable subscription charges were found. Try copying bank SMS debit alerts directly or test with the sample button above.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
