import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { NavigationModeProvider } from "@/hooks/useNavigationMode";
import { GlobalChatProvider } from "@/components/GlobalChatProvider";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AIAgentSetup from "./pages/AIAgentSetup";
import AISystemRegistry from "./pages/AISystemRegistry";
import Tasks from "./pages/Tasks";
import Onboarding from "./pages/Onboarding";
import Sustainability from "./pages/Sustainability";
import Transparency from "./pages/Transparency";
import WorkAreas from "./pages/WorkAreas";
import Assets from "./pages/Assets";
import AssetTrustProfile from "./pages/AssetTrustProfile";
import ProcessingRecords from "./pages/ProcessingRecords";
import CompanySettings from "./pages/CompanySettings";
import Regulations from "./pages/Regulations";
import Subscriptions from "./pages/Subscriptions";
import TermsAndConsent from "./pages/TermsAndConsent";
import Reports from "./pages/Reports";
import ProcessProfile from "./pages/ProcessProfile";
import Deviations from "./pages/Deviations";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import ComplianceChecklist from "./pages/ComplianceChecklist";
import QualityDashboard from "./pages/QualityDashboard";
import LaraInbox from "./pages/LaraInbox";
import CustomerRequests from "./pages/CustomerRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <NavigationModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GlobalChatProvider>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/ai-setup" element={<AIAgentSetup />} />
                  <Route path="/ai-registry" element={<AISystemRegistry />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/sustainability" element={<Sustainability />} />
                  <Route path="/transparency" element={<Transparency />} />
                  <Route path="/services" element={<WorkAreas />} />
                  <Route path="/work-areas" element={<WorkAreas />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/assets/:id" element={<AssetTrustProfile />} />
                  <Route path="/protocols" element={<ProcessingRecords />} />
                  <Route path="/processes/:id" element={<ProcessProfile />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/company-settings" element={<CompanySettings />} />
                  <Route path="/regulations" element={<Regulations />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/terms-and-consent" element={<TermsAndConsent />} />
                  <Route path="/deviations" element={<Deviations />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/compliance-checklist" element={<ComplianceChecklist />} />
                  <Route path="/quality" element={<QualityDashboard />} />
                  <Route path="/lara-inbox" element={<LaraInbox />} />
                  <Route path="/customer-requests" element={<CustomerRequests />} />
                  <Route path="/systems" element={<Assets />} />
                  <Route path="/systems/:id" element={<AssetTrustProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </GlobalChatProvider>
            </TooltipProvider>
          </NavigationModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
