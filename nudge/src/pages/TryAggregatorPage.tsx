import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, EyeOff, KeyRound, Timer } from "lucide-react";
import { AggregatorFlow } from "@/components/AggregatorFlow";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { authService } from "@/lib/authService";
import { stashFindings } from "@/lib/aggregator";

const POINTS = [
  { icon: KeyRound, title: "No passwords, ever", body: "You approve with an OTP at your AA. Nudge never sees net-banking credentials." },
  { icon: Timer, title: "You set the clock", body: "Consent is time-boxed and one-off here. Revoke it any time from your AA app." },
  { icon: EyeOff, title: "Read-only access", body: "Statements only. An AA consent cannot move money or change anything." },
  { icon: BadgeCheck, title: "RBI-regulated rails", body: "Built on the Account Aggregator framework used by India's largest banks." },
];

export function TryAggregatorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Try Account Aggregator · Nudge";
    return () => {
      document.title = "Nudge — Know where your money goes";
    };
  }, []);

  const onGuestContinue = async (items: Parameters<typeof stashFindings>[0]) => {
    stashFindings(items);
    const session = await authService.getSession();
    navigate(session ? "/aggregator" : "/auth?mode=signup&next=aggregator");
  };

  return (
    <div className="paper-surface min-h-screen text-foreground">
      <PublicHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
            <p className="section-kicker">LIVE SANDBOX</p>
            <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
              Find every subscription in about a minute.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Walk through a real Account Aggregator consent flow, then watch Nudge pick the recurring charges out of six months of
              bank activity. It runs on synthetic data, so you can try it without linking anything.
            </p>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
            <AggregatorFlow onGuestContinue={onGuestContinue} />

            <aside className="space-y-3 lg:sticky lg:top-24" aria-label="Why Account Aggregator">
              <p className="form-label">WHY THIS IS SAFER THAN A BANK LOGIN</p>
              {POINTS.map((p) => (
                <div key={p.title} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sage-soft text-sage">
                    <p.icon className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">{p.title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
