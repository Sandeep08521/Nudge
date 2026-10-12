import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
      <Routes>
        {/* Public Landing / Opening Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Route */}
        <Route
          path="/auth"
          element={
            session ? (
              <Navigate to="/dashboard" replace />
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
          <Route path="/import" element={<ImportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

