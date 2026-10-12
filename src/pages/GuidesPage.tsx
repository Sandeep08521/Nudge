import { useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CANCELLATION_GUIDES, UPI_AUTOPAY_GUIDE } from "@/lib/cancellationGuides";
import { useSubscriptions } from "@/context/SubscriptionContext";
import { toast } from "sonner";

export function GuidesPage() {
  const { userEmail, currencySymbol } = useSubscriptions();
  const [tab, setTab] = useState<"autopay" | "merchants" | "email">("autopay");
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("netflix");

  // Email generator state
  const [emailService, setEmailService] = useState("Netflix");
  const [emailAmount, setEmailAmount] = useState(currencySymbol === "₹" ? "649" : "15.49");
  const [emailMode, setEmailMode] = useState<"cancel" | "refund">("cancel");
  const [copied, setCopied] = useState(false);

  const guideList = Object.values(CANCELLATION_GUIDES);
  const filteredGuides = guideList.filter((g) =>
    `${g.name} ${g.category}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeGuide = CANCELLATION_GUIDES[selectedMerchant] || guideList[0];

  const todayStr = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subject =
    emailMode === "cancel"
      ? `Cancellation & Mandate Termination Request - ${emailService} (${userEmail || "Account"})`
      : `Refund Request for Unintended Auto-Debit - ${emailService} (${userEmail || "Account"})`;

  const emailBody =
    emailMode === "cancel"
      ? `Dear ${emailService} Support Team,\n\nI am writing to formally request the immediate cancellation of my recurring subscription for ${emailService}, associated with the email address ${userEmail || "[Your Registered Email]"}.\n\nSubscription Details:\n- Service: ${emailService}\n- Amount: ${currencySymbol}${emailAmount}\n- Status: Mandate Cancellation\n\nPlease confirm that my subscription will not be renewed and that any associated recurring billing authorizations (credit card standing instructions, Apple/Google Play subscriptions, or payment mandates) have been deactivated.\n\nKindly send a written confirmation once processed.\n\nThank you,\n${userEmail || "[Your Name]"}\nDate: ${todayStr}`
      : `Dear ${emailService} Billing & Customer Support,\n\nI recently noticed an automatic renewal charge of ${currencySymbol}${emailAmount} debited for my ${emailService} account (${userEmail || "[Your Email]"}).\n\nI did not intend to renew this service and have not used any benefits since this renewal. Under applicable consumer protection regulations and fair recurring billing practices, I respectfully request a full refund of this recent charge and the permanent cancellation of my subscription.\n\nPlease process the refund to the original payment source and confirm the cancellation.\n\nThank you for your prompt assistance,\n${userEmail || "[Your Name]"}\nDate: ${todayStr}`;

  const copyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`);
    setCopied(true);
    toast.success("Email template copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const openMailto = () => {
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
          KNOWLEDGE BASE & MANDATE CONTROL
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          Cancellation Hub
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          Never get trapped by dark patterns. Revoke mandates directly at the source or follow step-by-step merchant guides.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-bold">
        <button
          type="button"
          className={`py-3 px-4 transition-colors border-b-2 ${
            tab === "autopay"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("autopay")}
        >
          1. Direct Mandate & Platform Revocation
        </button>
        <button
          type="button"
          className={`py-3 px-4 transition-colors border-b-2 ${
            tab === "merchants"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("merchants")}
        >
          2. Merchant Guides & Portals
        </button>
        <button
          type="button"
          className={`py-3 px-4 transition-colors border-b-2 ${
            tab === "email"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("email")}
        >
          3. Draft Cancellation / Refund Email
        </button>
      </div>

      {/* TAB 1: UPI AUTOPAY */}
      {tab === "autopay" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-sage/40 bg-sage-soft/20 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sage">
              <Sparkles className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Universal Mandate & Consumer Protection
              </span>
            </div>
            <h3 className="font-display text-xl md:text-2xl text-foreground font-normal">
              You Have the Right to Revoke Any Payment Authorization
            </h3>
            <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
              If a merchant makes cancelling painful, confusing, or hidden behind retention screens, you do not need their permission. Revoking the authorization directly in your payment platform (Apple, Google Play, PayPal, Card Portals, or UPI) blocks any future debits immediately.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {UPI_AUTOPAY_GUIDE.apps.map((item) => (
              <div
                key={item.app}
                className="rounded-lg border border-border bg-card p-5 space-y-3 shadow-sm hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 font-bold text-base text-foreground">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.app}</span>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-xs text-muted-foreground leading-relaxed">
                  {item.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MERCHANT GUIDES */}
      {tab === "merchants" && (
        <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          {/* Merchant Selector List */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search merchant..."
                className="h-8.5 bg-card pl-8 text-xs"
              />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {filteredGuides.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedMerchant(guide.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-between ${
                    selectedMerchant === guide.id
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{guide.name}</span>
                  <span className="text-[10px] font-normal opacity-60">{guide.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guide Display Panel */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {activeGuide.category}
                </span>
                <h3 className="font-display text-2xl md:text-3xl">{activeGuide.name}</h3>
              </div>

              {activeGuide.directUrl && (
                <a
                  href={activeGuide.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-gold/40 bg-gold-soft/30 px-3.5 py-1.5 text-xs font-bold text-gold hover:bg-gold-soft/50 transition-colors"
                >
                  <span>Open {activeGuide.name} Page</span>
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Step-by-step instructions:
              </h4>
              <ol className="list-decimal space-y-2.5 pl-5 text-xs md:text-sm text-foreground/90 leading-relaxed">
                {activeGuide.steps.map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ol>
            </div>

            {activeGuide.tips && (
              <div className="rounded-md border border-border bg-secondary/30 p-3.5 text-xs text-muted-foreground">
                <strong className="text-foreground">Pro-Tip: </strong>
                {activeGuide.tips}
              </div>
            )}

            {activeGuide.refundPolicyNotes && (
              <div className="rounded-md border border-border bg-card p-3.5 text-xs text-muted-foreground">
                <strong className="text-foreground">Refund Policy: </strong>
                {activeGuide.refundPolicyNotes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DRAFT EMAIL GENERATOR */}
      {tab === "email" && (
        <div className="max-w-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Email Type:</span>
              <button
                type="button"
                className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                  emailMode === "cancel"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEmailMode("cancel")}
              >
                Cancellation Request
              </button>
              <button
                type="button"
                className={`rounded px-3 py-1 text-xs font-bold transition-colors ${
                  emailMode === "refund"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setEmailMode("refund")}
              >
                Accidental Renewal Refund
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="text"
                value={emailService}
                onChange={(e) => setEmailService(e.target.value)}
                placeholder="Service name"
                className="h-8 w-28 rounded border border-input bg-card px-2 text-xs font-bold"
              />
              <input
                type="number"
                value={emailAmount}
                onChange={(e) => setEmailAmount(e.target.value)}
                placeholder="Amount ₹"
                className="h-8 w-20 rounded border border-input bg-card px-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-background p-5 text-xs font-mono">
            <div className="border-b border-border pb-2 text-muted-foreground">
              <strong className="text-foreground">Subject: </strong>
              {subject}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{emailBody}</div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={copyEmail} className="gap-2">
              {copied ? <Check className="size-3.5 text-sage" /> : <Copy className="size-3.5" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button size="sm" onClick={openMailto} className="gap-2 font-bold">
              <Mail className="size-3.5" />
              Open in Email App
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
