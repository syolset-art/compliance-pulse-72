import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { NavigationModeProvider } from "@/hooks/useNavigationMode";
import { GlobalChatProvider } from "@/components/GlobalChatProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
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
                  {/* Public route */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                  <Route path="/ai-setup" element={<AuthGuard><AIAgentSetup /></AuthGuard>} />
                  <Route path="/ai-registry" element={<AuthGuard><AISystemRegistry /></AuthGuard>} />
                  <Route path="/tasks" element={<AuthGuard><Tasks /></AuthGuard>} />
                  <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
                  <Route path="/sustainability" element={<AuthGuard><Sustainability /></AuthGuard>} />
                  <Route path="/transparency" element={<AuthGuard><Transparency /></AuthGuard>} />
                  <Route path="/services" element={<AuthGuard><WorkAreas /></AuthGuard>} />
                  <Route path="/work-areas" element={<AuthGuard><WorkAreas /></AuthGuard>} />
                  <Route path="/assets" element={<AuthGuard><Assets /></AuthGuard>} />
                  <Route path="/assets/:id" element={<AuthGuard><AssetTrustProfile /></AuthGuard>} />
                  <Route path="/protocols" element={<AuthGuard><ProcessingRecords /></AuthGuard>} />
                  <Route path="/processes/:id" element={<AuthGuard><ProcessProfile /></AuthGuard>} />
                  <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
                  <Route path="/company-settings" element={<AuthGuard><CompanySettings /></AuthGuard>} />
                  <Route path="/regulations" element={<AuthGuard><Regulations /></AuthGuard>} />
                  <Route path="/subscriptions" element={<AuthGuard><Subscriptions /></AuthGuard>} />
                  <Route path="/terms-and-consent" element={<AuthGuard><TermsAndConsent /></AuthGuard>} />
                  <Route path="/deviations" element={<AuthGuard><Deviations /></AuthGuard>} />
                  <Route path="/resources" element={<AuthGuard><Resources /></AuthGuard>} />
                  <Route path="/compliance-checklist" element={<AuthGuard><ComplianceChecklist /></AuthGuard>} />
                  <Route path="/quality" element={<AuthGuard><QualityDashboard /></AuthGuard>} />
                  
                  {/* Legacy routes for backwards compatibility */}
                  <Route path="/systems" element={<AuthGuard><Assets /></AuthGuard>} />
                  <Route path="/systems/:id" element={<AuthGuard><AssetTrustProfile /></AuthGuard>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
