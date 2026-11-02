import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/authService";

const NAV: { label: string; href: string; route?: boolean }[] = [
  { label: "The Reality", href: "/#problem" },
  { label: "Features", href: "/#features" },
  { label: "Try Account Aggregator", href: "/try-aggregator", route: true },
  { label: "Cancellation Hub", href: "/#cancellation" },
  { label: "Privacy", href: "/#privacy" },
  { label: "FAQ", href: "/#faq" },
];

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Nudge home">
      <div
        className={`ledger-mark flex items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground shadow-sm ${
          size === "lg" ? "size-10" : "size-9"
        }`}
      >
        <span className="font-display text-2xl italic leading-none">N</span>
      </div>
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-display text-[23px] text-foreground">Nudge</span>
          <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold">
            Beta
          </span>
        </div>
        <span className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground sm:block">
          Take back recurring spend
        </span>
      </div>
    </Link>
  );
}

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    authService.getSession().then((s) => setIsLoggedIn(Boolean(s)));
  }, []);

  // Close the drawer on navigation, and on Escape.
  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (item: (typeof NAV)[number]) => {
    setOpen(false);
    if (item.route) return navigate(item.href);
    // In-page anchors: if already on "/", scroll; otherwise navigate home first.
    const id = item.href.split("#")[1];
    if (location.pathname === "/") document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    else navigate(item.href);
  };

  const linkCls = (route?: boolean) =>
    `rounded px-1 py-0.5 text-xs font-semibold transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      route ? "text-gold" : "text-muted-foreground"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <button key={item.label} type="button" onClick={() => go(item)} className={linkCls(item.route)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button onClick={() => navigate("/dashboard")} className="h-9 gap-1.5 text-xs font-bold">
              Dashboard <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/auth?mode=signin")}
                className="hidden h-9 text-xs font-bold text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth?mode=signup")} className="h-9 gap-1.5 text-xs font-bold">
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Get Started</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border bg-card lg:hidden view-enter">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => go(item)}
                className={`border-b border-border/60 py-3 text-left text-sm font-semibold last:border-0 ${
                  item.route ? "text-gold" : "text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => navigate("/auth?mode=signin")}
                className="py-3 text-left text-sm font-semibold text-muted-foreground sm:hidden"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="border-t border-border bg-card/60 py-10 text-xs text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs leading-relaxed">
            A private, free way to see every recurring charge, and stop the ones you don&apos;t want.
          </p>
        </div>
        <FooterCol title="Product">
          <Link to="/try-aggregator">Try Account Aggregator</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#cancellation">Cancellation Hub</Link>
        </FooterCol>
        <FooterCol title="Account">
          <Link to="/auth?mode=signup">Create account</Link>
          <Link to="/auth?mode=signin">Sign in</Link>
        </FooterCol>
        <FooterCol title="Trust">
          <Link to="/#privacy">Privacy</Link>
          <Link to="/#faq">FAQ</Link>
          <span>Open source · MIT</span>
        </FooterCol>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-border px-4 pt-5 text-[11px] sm:px-6 md:flex-row md:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Nudge · Free public beta</p>
        {children ?? (
          <p>Account Aggregator demo uses synthetic data. Nudge is not a bank or a registered AA.</p>
        )}
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 [&_a:hover]:text-foreground [&_a]:transition-colors">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.17em] text-foreground">{title}</p>
      {children}
    </div>
  );
}
