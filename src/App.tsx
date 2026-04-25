import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import PrayerPrompt from "@/components/PrayerPrompt";
import OnboardingGate from "@/components/OnboardingGate";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import AlertsPage from "@/pages/AlertsPage";
import DonationsPage from "@/pages/DonationsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DawahPage from "@/pages/DawahPage";
import MapPage from "@/pages/MapPage";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import MorePage from "@/pages/MorePage";
import TvPage from "@/pages/TvPage";
import HajjUmrahPage from "@/pages/HajjUmrahPage";
import TourOperatorPage from "@/pages/TourOperatorPage";
import OperatorDashboard from "@/pages/OperatorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CHROME_HIDDEN = ["/auth", "/onboarding"];

const Shell = () => {
  const location = useLocation();
  const hideChrome = CHROME_HIDDEN.includes(location.pathname);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-calm shadow-xl sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl sm:shadow-none">
      {!hideChrome && <MobileHeader />}
      <main className={hideChrome ? "flex-1" : "flex-1 pb-20 md:pb-8"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/donations" element={<DonationsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/dawah" element={<DawahPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/tv" element={<TvPage />} />
          <Route path="/hajj-umrah" element={<HajjUmrahPage />} />
          <Route path="/hajj-umrah/:slug" element={<TourOperatorPage />} />
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideChrome && <BottomNav />}
      {!hideChrome && <PrayerPrompt />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OnboardingGate />
            <Shell />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
