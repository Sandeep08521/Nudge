import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/authService";
import { useEffect, useState } from "react";

export function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    authService.getSession().then((session) => {
      setIsLoggedIn(Boolean(session));
    });
  }, []);

  return (
    <div className="paper-surface min-h-screen text-foreground selection:bg-gold-soft selection:text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/85 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="ledger-mark flex size-9 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground shadow-sm">
              <span className="font-display text-2xl italic leading-none">N</span>
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-display text-[23px] text-foreground">Nudge</span>
                <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[9px] font-black uppercase text-gold tracking-wider">
                  Global
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Take back recurring spend
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">
              The Reality
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#cancellation" className="hover:text-foreground transition-colors">
              Cancellation Hub
            </a>
            <a href="#privacy" className="hover:text-foreground transition-colors">
              Privacy First
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="font-bold text-xs gap-1.5 h-9"
              >
                Go to Dashboard <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth?mode=signin")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground h-9"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/auth?mode=signup")}
                  className="font-bold text-xs gap-1.5 h-9"
                >
                  Get Started Free <ArrowRight className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-gold">
              <Sparkles className="size-3.5" />
              <span>Universal Subscription Awareness & Cancellation Assistant</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-foreground tracking-tight">
              Stop paying for subscriptions you forgot you had.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Nudge gives you a private, single view of your recurring spend, computes your real <strong>Cost-Per-Use</strong> with AI, and guides you to revoke recurring mandates across <strong>Apple, Google Play, PayPal, Cards, and Banks</strong> before debits occur.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              <Button
                size="lg"
                onClick={() => navigate("/auth?mode=signup")}
                className="font-bold text-sm h-11 px-7 gap-2 shadow-md"
              >
                Start Tracking for Free <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth?mode=signin")}
                className="font-bold text-sm h-11 px-6"
              >
                Sign In to Your Workspace
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="size-4 text-sage" /> Zero bank logins
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-4 text-sage" /> Zero Gmail scraping
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-4 text-sage" /> Multi-Currency Support ($, €, £, C$, A$, ₹)
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-4 text-sage" /> 100% Free during beta
              </span>
            </div>
          </div>

          {/* Interactive Hero Showcase Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-xl border border-border bg-card/80 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-destructive/60" />
                <div className="size-3 rounded-full bg-gold/60" />
                <div className="size-3 rounded-full bg-sage/60" />
                <span className="text-xs font-bold text-muted-foreground ml-2 font-mono">
                  nudge-dashboard.preview
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-sage-soft text-sage px-2 py-0.5 rounded">
                Live Cost-Per-Use Audit
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* Card 1: Money Leak */}
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Netflix Premium</span>
                  <span className="rounded bg-destructive/20 text-destructive text-[10px] font-black uppercase px-2 py-0.5">
                    Money Leak
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">$15.49 / month · Billed via Card</div>
                <div className="text-xs pt-1 border-t border-border/50">
                  Usage: <strong>Rarely (1-2x/mo)</strong>
                  <div className="text-destructive font-bold text-sm mt-0.5">$7.75 per watch</div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                  Exorbitant cost per session. Cancel now and save $185.88/yr.
                </p>
              </div>

              {/* Card 2: Solid Value */}
              <div className="rounded-lg border border-sage/30 bg-sage-soft/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Spotify Premium</span>
                  <span className="rounded bg-sage-soft text-sage text-[10px] font-black uppercase px-2 py-0.5">
                    Solid Value
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">$10.99 / month · Apple Subscriptions</div>
                <div className="text-xs pt-1 border-t border-border/50">
                  Usage: <strong>Daily</strong>
                  <div className="text-sage font-bold text-sm mt-0.5">$0.36 per day</div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                  High everyday utility. One of your best personal investments.
                </p>
              </div>

              {/* Card 3: Free Trial Trap */}
              <div className="rounded-lg border border-gold/40 bg-gold-soft/15 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">SaaS Workspace Pro</span>
                  <span className="rounded bg-gold-soft text-gold text-[10px] font-black uppercase px-2 py-0.5">
                    Trial Watch
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">$39.00 / month · Renews in 3 days</div>
                <div className="text-xs pt-1 border-t border-border/50">
                  Type: <strong>Free Trial Conversion</strong>
                  <div className="text-gold font-bold text-sm mt-0.5">Auto-Debit Risk</div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight pt-1">
                  1-click calendar alarm set for 24h before trial auto-converts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="problem" className="border-t border-border py-16 md:py-24 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <p className="section-kicker">THE RECURRING TRAP</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">
              Why subscriptions are so easy to forget.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Between streaming platforms, cloud storage, fitness apps, AI tools, and free trials, silent recurring charges chip away at your savings every single month.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <div className="size-10 rounded-md bg-gold-soft flex items-center justify-center text-gold">
                <Clock3 className="size-5" />
              </div>
              <h3 className="font-display text-xl font-bold">The Silent Renewal Problem</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Free trials and annual plans roll over without noticeable alerts until the statement charge has already posted to your card or account.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <div className="size-10 rounded-md bg-destructive/15 flex items-center justify-center text-destructive">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="font-display text-xl font-bold">Dark Pattern Cancellations</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Websites intentionally bury the cancel button behind multi-step surveys, retention discounts, or customer support phone queues. Revoking authorizations at the platform level bypasses them completely.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <div className="size-10 rounded-md bg-sage-soft flex items-center justify-center text-sage">
                <Lock className="size-5" />
              </div>
              <h3 className="font-display text-xl font-bold">Invasive Trackers</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Traditional trackers demand access to your bank login passwords, scan your personal email inbox, or sell aggregated purchase habits. Nudge operates with zero financial account linking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <p className="section-kicker">BUILT FOR CLARITY</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">
              Everything you need to regain control.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Designed for global payment clarity across Apple, Google Play, PayPal, Credit Cards, and Direct Debit networks.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <Sparkles className="size-5 text-gold" />
              <h4 className="font-display text-xl">AI Cost-Per-Use Advisor</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Self-report how frequently you actually use a service. Get an honest, data-grounded assessment: Keep, Reconsider, or Cancel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <ShieldCheck className="size-5 text-sage" />
              <h4 className="font-display text-xl">Universal Cancellation Hub</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Step-by-step guides to revoke authorizations directly inside Apple App Store, Google Play, PayPal, and Card banking portals. Stop recurring charges at the source.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <Calendar className="size-5 text-gold" />
              <h4 className="font-display text-xl">1-Click Phone Calendar Sync</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download a clean `.ics` calendar sync that sets automated reminder alerts 3 days and 24 hours before renewals right on your phone or computer.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <FileText className="size-5 text-sage" />
              <h4 className="font-display text-xl">Paste Statement & Alerts</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste bank charge notifications or billing statements. Our client-side parser detects recurring charges without sending raw financial statements to external servers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <Mail className="size-5 text-gold" />
              <h4 className="font-display text-xl">Draft Refund & Cancel Notices</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accidentally billed? Generate professional, legally structured cancellation and consumer refund notices ready to copy and send to support teams.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-3">
              <Wallet className="size-5 text-sage" />
              <h4 className="font-display text-xl">Multi-Currency & Shared Plans</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Switch currencies seamlessly between $, €, £, C$, A$, and ₹. Track monthly, quarterly, and annual intervals with shared plan cost splitting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cancellation Hub Deep Dive */}
      <section id="cancellation" className="border-t border-border py-16 md:py-24 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-sage/40 bg-sage-soft/30 px-3 py-1 text-[11px] font-black uppercase text-sage">
                <ShieldCheck className="size-3.5" />
                <span>The Direct Cancellation Advantage</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-tight">
                Cancel directly from your payment platform.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Most digital subscriptions rely on platform billing authorizations or payment mandates. You always retain the right to terminate authorizations directly at the payment processor level.
              </p>
              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-sage shrink-0 mt-0.5" />
                  <span><strong>Apple iOS:</strong> Settings → Apple Account → Subscriptions → Select & Cancel.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-sage shrink-0 mt-0.5" />
                  <span><strong>Google Play:</strong> Play Store → Payments & Subscriptions → Subscriptions → Cancel.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4.5 text-sage shrink-0 mt-0.5" />
                  <span><strong>PayPal & Banking Portals:</strong> Settings → Automatic Payments → Cancel Authorization, or revoke recurring card mandates directly via your bank.</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate("/auth?mode=signup")}
                  className="font-bold text-xs gap-1.5 h-10 px-5"
                >
                  View Step-by-Step Hub <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Revocation Safeguards
                </span>
                <span className="text-[10px] font-black uppercase text-sage bg-sage-soft px-2 py-0.5 rounded">
                  Guaranteed Rights
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="p-3 rounded-md bg-secondary/40 border border-border">
                  <p className="font-bold text-foreground">1. No Merchant Permission Needed</p>
                  <p className="mt-1">Once cancelled in your platform or banking portal, all future debit attempts will be rejected automatically.</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/40 border border-border">
                  <p className="font-bold text-foreground">2. Access Retained Until End of Term</p>
                  <p className="mt-1">Revoking auto-renewal does not terminate your already-paid period. You keep access until the current cycle expires.</p>
                </div>
                <div className="p-3 rounded-md bg-secondary/40 border border-border">
                  <p className="font-bold text-foreground">3. Complete Protection from Dark Patterns</p>
                  <p className="mt-1">Companies can no longer charge unannounced fees, auto-convert trials silently, or keep you on hold with phone agents.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="privacy" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <p className="section-kicker">RADICAL SIMPLICITY</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">
              How Nudge compares.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Built on personal privacy and self-reported clarity, not invasive data harvesting.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-gold font-bold">Nudge (Global)</th>
                  <th className="py-3 px-4">Commercial US Apps</th>
                  <th className="py-3 px-4">Excel / Notes App</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="py-3.5 px-4 font-semibold">Bank / Netbanking Login</td>
                  <td className="py-3.5 px-4 font-bold text-sage">Never (Zero Access)</td>
                  <td className="py-3.5 px-4 text-destructive">Requires Plaid / Bank Logins</td>
                  <td className="py-3.5 px-4">None</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">Email Inbox Scanning</td>
                  <td className="py-3.5 px-4 font-bold text-sage">Never (Zero Access)</td>
                  <td className="py-3.5 px-4 text-destructive">Requires OAuth Access to Inbox</td>
                  <td className="py-3.5 px-4">None</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">Direct Platform Revocation Guides</td>
                  <td className="py-3.5 px-4 font-bold text-sage">Yes (Apple, GPlay, PayPal, Cards, UPI)</td>
                  <td className="py-3.5 px-4 text-muted-foreground">Limited or automated fees</td>
                  <td className="py-3.5 px-4 text-muted-foreground">No</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">AI Cost-Per-Use Audit</td>
                  <td className="py-3.5 px-4 font-bold text-sage">Yes (Self-reported CPU)</td>
                  <td className="py-3.5 px-4 text-muted-foreground">No</td>
                  <td className="py-3.5 px-4 text-muted-foreground">Manual formulas</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">Phone Calendar Sync (.ics)</td>
                  <td className="py-3.5 px-4 font-bold text-sage">1-Click (24h & 3-Day Alerts)</td>
                  <td className="py-3.5 px-4 text-muted-foreground">Push notifications only</td>
                  <td className="py-3.5 px-4 text-muted-foreground">No</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold">Cost / Monetization</td>
                  <td className="py-3.5 px-4 font-bold text-sage">100% Free Public Beta</td>
                  <td className="py-3.5 px-4 text-destructive">Takes 35–60% of savings</td>
                  <td className="py-3.5 px-4">Free</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-border py-16 md:py-24 bg-card/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <p className="section-kicker">FREQUENTLY ASKED QUESTIONS</p>
            <h2 className="font-display text-3xl sm:text-4xl">Got questions? We're open.</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h3 className="font-display text-lg font-bold">Do you ask for my bank password or card numbers?</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Never. Nudge operates strictly on manual entry and client-side statement pasting. We deliberately do not integrate with bank logins or read private emails.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h3 className="font-display text-lg font-bold">How does direct platform revocation work?</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                When you sign up for subscriptions via Apple, Google Play, PayPal, or card mandates, recurring authorizations are registered. Our cancellation hub provides direct pathways to revoke those authorizations in your account settings, cutting off future debits immediately.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h3 className="font-display text-lg font-bold">What is Cost-Per-Use (CPU)?</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Cost-Per-Use divides your monthly plan price by how often you actually use it. If you pay $15.49/month for Netflix and watch it twice a month, each watch costs $7.75. Our AI advisor flags low-usage subscriptions as money leaks.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h3 className="font-display text-lg font-bold">Is Nudge really free to use?</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Yes! All features — including the AI Advisor, Cancellation Hub, Statement Parser, Calendar Sync, and Multi-Currency support — are 100% unlocked and free while in active development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="border-t border-border py-16 md:py-24 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl max-w-2xl mx-auto leading-tight">
            Take back control of your recurring spend today.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create your private account in seconds. No bank logins, no credit card required.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="font-bold text-sm h-11 px-8 gap-2 shadow-lg"
            >
              Create Free Account <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-card/60">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-foreground font-bold">Nudge</span>
            <span>· Take back recurring spend</span>
          </div>
          <p className="text-[11px]">
            Global Edition · In Active Development · Zero Bank Credentials Stored
          </p>
        </div>
      </footer>
    </div>
  );
}
