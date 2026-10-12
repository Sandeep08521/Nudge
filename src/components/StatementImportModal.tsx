import { useState } from "react";
import { FileText, Plus, Sparkles, Check, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseStatementText, candidateToNewSubscription, type ParsedCandidate } from "@/lib/statementParser";
import { createSubscription, type Subscription } from "@/lib/subscriptions";
import { toast } from "sonner";

const SAMPLE_SMS = `Dear Customer, Rs.649.00 debited from A/C **4582 on 03-Oct-26 towards NETFLIX. Info: UPI/AUTOPAY/NETFLIX
Alert: AutoPay of Rs 119.00 initiated for SPOTIFY on your HDFC Bank Card ending 1234.
Pre-debit notification: Your mandate for DISNEY HOTSTAR of Rs 899.00 will be debited on 10-Oct-26.
UPI/DR/SWIGGY ONE/Rs 299.00/PhonePe/AutoPay/04-Oct-26
Your Cultpass membership will renew for Rs 1499.00 on 15-Oct-26.`;

export function StatementImportModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newSubs: Subscription[]) => void;
}) {
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [analyzed, setAnalyzed] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error("Please paste statement or SMS text first.");
      return;
    }
    const results = parseStatementText(text);
    setCandidates(results);
    setSelectedIndices(new Set(results.map((_, i) => i)));
    setAnalyzed(true);
    if (results.length === 0) {
      toast.info("No recurring subscription patterns detected. Check the text format.");
    } else {
      toast.success(`Found ${results.length} recurring subscription candidate${results.length > 1 ? "s" : ""}!`);
    }
  };

  const loadSample = () => {
    setText(SAMPLE_SMS);
    const results = parseStatementText(SAMPLE_SMS);
    setCandidates(results);
    setSelectedIndices(new Set(results.map((_, i) => i)));
    setAnalyzed(true);
    toast.success("Loaded sample bank & payment notification alerts!");
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
      const added: Subscription[] = [];
      for (const item of toImport) {
        const sub = await createSubscription(candidateToNewSubscription(item));
        added.push(sub);
      }
      toast.success(`Successfully imported ${added.length} subscriptions!`);
      onSuccess(added);
      onOpenChange(false);
      setText("");
      setCandidates([]);
      setAnalyzed(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import subscriptions.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-lg bg-card p-6 md:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold">
            <Sparkles className="size-5" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest">Paste & Parse</span>
          </div>
          <DialogTitle className="font-display text-2xl md:text-3xl font-normal">
            Bulk import from statement or SMS
          </DialogTitle>
          <DialogDescription>
            Paste your bank SMS alerts, payment confirmations, or card statement text. We parse it 100% locally in your browser — zero bank credentials required.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label htmlFor="sms-text" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Paste statement or SMS messages
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="text-xs font-bold text-sage hover:underline"
              >
                + Try sample alerts
              </button>
            </div>
            <textarea
              id="sms-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. $15.49 debited towards NETFLIX... Payment of $10.99 for SPOTIFY..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {analyzed ? `${candidates.length} subscriptions detected` : "Parses Netflix, Spotify, YouTube, ChatGPT, Apple & more"}
            </span>
            <Button size="sm" onClick={handleAnalyze} className="gap-2">
              <FileText className="size-3.5" />
              {analyzed ? "Re-analyze" : "Analyze Text"}
            </Button>
          </div>

          {analyzed && candidates.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-bold text-muted-foreground">
                <span>SELECT ITEMS TO ADD TO NUDGE</span>
                <span>
                  {selectedIndices.size} of {candidates.length} selected
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {candidates.map((cand, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors ${
                        isChecked ? "border-gold/50 bg-gold-soft/10" : "border-border bg-card/40 opacity-60"
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
                          className="h-7 w-20 rounded border border-input bg-background px-2 text-xs font-bold tabular-nums"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing || selectedIndices.size === 0} className="gap-2">
                  <Plus className="size-3.5" />
                  {importing ? "Importing..." : `Import ${selectedIndices.size} Subscription${selectedIndices.size > 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          )}

          {analyzed && candidates.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
              <AlertCircle className="size-4 shrink-0 text-gold" />
              <span>No recognizable subscription debits were found in the text. Try copying the SMS debit alert verbatim or use the sample button above.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
