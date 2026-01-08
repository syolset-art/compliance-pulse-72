import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { NavigationModeProvider } from "@/hooks/useNavigationMode";
import Index from "./pages/Index";
import AIAgentSetup from "./pages/AIAgentSetup";
import Tasks from "./pages/Tasks";
import Onboarding from "./pages/Onboarding";
import Sustainability from "./pages/Sustainability";
import Transparency from "./pages/Transparency";
import WorkAreas from "./pages/WorkAreas";
import Assets from "./pages/Assets";
import AssetTrustProfile from "./pages/AssetTrustProfile";
import ProcessingRecords from "./pages/ProcessingRecords";
import CompanySettings from "./pages/CompanySettings";
import Subscriptions from "./pages/Subscriptions";
import TermsAndConsent from "./pages/TermsAndConsent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NavigationModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ai-setup" element={<AIAgentSetup />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/transparency" element={<Transparency />} />
            <Route path="/services" element={<WorkAreas />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/assets/:id" element={<AssetTrustProfile />} />
            <Route path="/protocols" element={<ProcessingRecords />} />
            <Route path="/company-settings" element={<CompanySettings />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/terms-and-consent" element={<TermsAndConsent />} />
            {/* Legacy routes for backwards compatibility */}
            <Route path="/systems" element={<Assets />} />
            <Route path="/systems/:id" element={<AssetTrustProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </NavigationModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
