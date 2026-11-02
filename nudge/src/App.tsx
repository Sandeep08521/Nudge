import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthScreen, Splash } from "./auth";
import { authService, type AuthSession } from "./lib/authService";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { AppLayout } from "./layouts/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { AdvisorPage } from "./pages/AdvisorPage";
import { GuidesPage } from "./pages/GuidesPage";
import { ImportPage } from "./pages/ImportPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AggregatorPage } from "./pages/AggregatorPage";
import { TryAggregatorPage } from "./pages/TryAggregatorPage";

// Scroll to #anchors (or top) on navigation, since the SPA router doesn't do it.
function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// After sign-in, honour ?next=aggregator (set by the public demo) and nothing else.
function PostAuthRedirect() {
  const [params] = useSearchParams();
  return <Navigate to={params.get("next") === "aggregator" ? "/aggregator" : "/dashboard"} replace />;
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

  useEffect(() => {
    // Initial session load
    authService.getSession().then((cur) => setSession(cur));

    // Listen to real-time auth changes
    const unsubscribe = authService.onAuthStateChange((next) => {
      setSession(next);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setSession(null);
  };

  // Loading state
  if (session === undefined) return <Splash />;

  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        {/* Public Landing / Opening Page */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/try-aggregator" element={<TryAggregatorPage />} />

        {/* Auth Route */}
        <Route
          path="/auth"
          element={
            session ? (
              <PostAuthRedirect />
            ) : (
              <AuthScreen onAuthSuccess={(newSession) => setSession(newSession)} />
            )
          }
        />

        {/* Protected Authenticated Workspace */}
        <Route
          element={
            session ? (
              <SubscriptionProvider
                key={session.user.id}
                userId={session.user.id}
                userEmail={session.user.email}
                isCloudSynced={authService.isCloudActive()}
                onSignOut={handleSignOut}
              >
                <AppLayout />
              </SubscriptionProvider>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        >
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/aggregator" element={<AggregatorPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

