import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import AlertsPage from "@/pages/AlertsPage";
import DonationsPage from "@/pages/DonationsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-xl">
              <MobileHeader />
              <main className="flex-1 pb-20">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/donations" element={<DonationsPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BottomNav />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
