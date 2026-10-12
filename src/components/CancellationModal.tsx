import { useState } from "react";
import { Copy, Check, ExternalLink, Mail, ShieldAlert, ArrowRight, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getGuideForMerchant, UPI_AUTOPAY_GUIDE } from "@/lib/cancellationGuides";
import { type Subscription } from "@/lib/subscriptions";
import { toast } from "sonner";

export function CancellationModal({
  open,
  onOpenChange,
  subscription,
  userEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  userEmail: string;
}) {
  const [tab, setTab] = useState<"merchant" | "autopay" | "email">("merchant");
  const [emailMode, setEmailMode] = useState<"cancel" | "refund">("cancel");
  const [copied, setCopied] = useState(false);

  if (!subscription) return null;

  const guide = getGuideForMerchant(subscription.name);

  // Email template generation
  const todayStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const sym = subscription.currency || "$";
  const subject =
    emailMode === "cancel"
      ? `Cancellation & Mandate Termination Request - ${subscription.name} (${userEmail})`
      : `Refund Request for Unintended Auto-Debit - ${subscription.name} (${userEmail})`;

  const emailBody =
    emailMode === "cancel"
      ? `Dear ${subscription.name} Support Team,\n\nI am writing to formally request the immediate cancellation of my recurring subscription for ${subscription.name}, associated with the email address ${userEmail || "[Your Registered Email]"}.\n\nSubscription Details:\n- Service: ${subscription.name}\n- Amount: ${sym}${subscription.amount} (${subscription.cycle})\n- Next Scheduled Renewal: ${subscription.renewal}\n- Payment Mode: ${subscription.payment_method || "Card / Payment Platform"}\n\nPlease confirm that my subscription will not be renewed and that any associated recurring authorizations (platform mandates or standing instructions) have been deactivated.\n\nKindly send a written confirmation once processed.\n\nThank you,\n${userEmail || "[Your Name]"}\nDate: ${todayStr}`
      : `Dear ${subscription.name} Billing & Customer Support,\n\nI recently noticed an automatic renewal charge of ${sym}${subscription.amount} debited on ${subscription.renewal} for my ${subscription.name} account (${userEmail || "[Your Email]"}).\n\nI did not intend to renew this service and have not used the benefits since the renewal date. Under the applicable consumer protection guidelines and payment network rules, I respectfully request a full refund of this recent charge and the permanent cancellation of my subscription.\n\nPlease process the refund to the original payment source and confirm the cancellation.\n\nThank you for your prompt assistance,\n${userEmail || "[Your Name]"}\nDate: ${todayStr}`;

  const copyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const openMailto = () => {
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-lg bg-card p-6 md:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 text-gold">
            <ShieldAlert className="size-5" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest">Cancellation Assistant</span>
          </div>
          <DialogTitle className="font-display text-2xl md:text-3xl font-normal">
            How to cancel {subscription.name}
          </DialogTitle>
          <DialogDescription>
            Step-by-step guidance to stop recurring charges and revoke payment mandates.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="mt-4 flex border-b border-border text-xs font-bold">
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === "merchant" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("merchant")}
          >
            1. Merchant Steps
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === "autopay" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("autopay")}
          >
            2. Platform & Mandate Revocation
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === "email" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("email")}
          >
            3. Draft Support Email
          </button>
        </div>

        {/* Tab 1: Merchant Direct Steps */}
        {tab === "merchant" && (
          <div className="mt-5 space-y-4 text-sm">
            {guide.directUrl && (
              <a
                href={guide.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border border-gold/40 bg-gold-soft/30 p-3 text-gold transition-colors hover:bg-gold-soft/50"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-4" />
                  <span className="font-bold">Open {subscription.name} Cancellation Page</span>
                </div>
                <ArrowRight className="size-4" />
              </a>
            )}

            <div className="space-y-3 rounded-md border border-border bg-card/60 p-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Direct Instructions:</h4>
              <ol className="list-decimal space-y-2.5 pl-4 text-xs md:text-sm text-foreground/90">
                {guide.steps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {guide.tips && (
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Pro-Tip: </span>
                {guide.tips}
              </div>
            )}

            {guide.refundPolicyNotes && (
              <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Refund Policy: </span>
                {guide.refundPolicyNotes}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Universal Platform & Mandate Revocation */}
        {tab === "autopay" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-sage/30 bg-sage-soft/30 p-3 text-xs text-sage">
              <p className="font-bold">Platform Authorization Protection:</p>
              <p className="mt-0.5 text-foreground/80">
                If the merchant makes cancellation difficult, revoking the authorization in Apple, Google Play, PayPal, or your banking portal guarantees future charges cannot occur.
              </p>
            </div>

            <div className="space-y-3">
              {UPI_AUTOPAY_GUIDE.apps.map((item) => (
                <div key={item.app} className="rounded-md border border-border bg-card/70 p-3.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <span>{item.icon}</span>
                    <span>{item.app}</span>
                  </div>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground">
                    {item.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Draft Support Email */}
        {tab === "email" && (
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Template:</span>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  emailMode === "cancel" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
                onClick={() => setEmailMode("cancel")}
              >
                Cancellation Request
              </button>
              <button
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-bold ${
                  emailMode === "refund" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
                onClick={() => setEmailMode("refund")}
              >
                Accidental Renewal Refund
              </button>
            </div>

            <div className="space-y-2 rounded-md border border-border bg-background p-4 text-xs font-mono">
              <div className="border-b border-border pb-2 text-muted-foreground">
                <span className="font-bold text-foreground">Subject: </span>
                {subject}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{emailBody}</div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={copyEmail} className="gap-2">
                {copied ? <Check className="size-3.5 text-sage" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              <Button size="sm" onClick={openMailto} className="gap-2">
                <Mail className="size-3.5" />
                Open in Email App
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
