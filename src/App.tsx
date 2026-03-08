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

import QualityDashboard from "./pages/QualityDashboard";
import LaraInbox from "./pages/LaraInbox";
import CustomerRequests from "./pages/CustomerRequests";
import VendorResponseDemo from "./pages/VendorResponseDemo";
import MSPDashboard from "./pages/MSPDashboard";
import MSPCustomerDetail from "./pages/MSPCustomerDetail";
import MSPCustomerPortal from "./pages/MSPCustomerPortal";
import MSPBillingSettings from "./pages/MSPBillingSettings";
import MSPLicenses from "./pages/MSPLicenses";
import MSPInvoices from "./pages/MSPInvoices";
import MSPROICalculator from "./pages/MSPROICalculator";
import MSPSalesGuide from "./pages/MSPSalesGuide";
import MSPCustomerROI from "./pages/MSPCustomerROI";
import MynderMe from "./pages/MynderMe";
import TrustProfileArchitecture from "./pages/developer/TrustProfileArchitecture";
import DashboardV2 from "./pages/DashboardV2";
import FeatureGuide from "./pages/FeatureGuide";
import MaturityMethodology from "./pages/MaturityMethodology";
import MynderControls from "./pages/MynderControls";
import TrustCenterSaaS from "./pages/TrustCenterSaaS";
import TrustCenterShared from "./pages/TrustCenterShared";
import TrustCenterCompliance from "./pages/TrustCenterCompliance";
import TrustCenterPolicies from "./pages/TrustCenterPolicies";
import TrustCenterCertifications from "./pages/TrustCenterCertifications";
import TrustCenterProducts from "./pages/TrustCenterProducts";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import ComplianceChecklist from "./pages/ComplianceChecklist";
import MSPCustomerTrustProfile from "./pages/MSPCustomerTrustProfile";
import MSPCustomerNIS2 from "./pages/MSPCustomerNIS2";
import DemoLibrary from "./pages/DemoLibrary";

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
                  <Route path="/compliance" element={<ComplianceChecklist />} />
                  <Route path="/maturity" element={<MaturityMethodology />} />
                  <Route path="/controls" element={<MynderControls />} />
                  <Route path="/compliance-checklist" element={<ComplianceChecklist />} />
                  <Route path="/resources/controls" element={<MynderControls />} />
                  <Route path="/quality" element={<QualityDashboard />} />
                  <Route path="/lara-inbox" element={<LaraInbox />} />
                  <Route path="/customer-requests" element={<CustomerRequests />} />
                  <Route path="/systems" element={<Assets />} />
                  <Route path="/systems/:id" element={<AssetTrustProfile />} />
                  <Route path="/vendor-response-demo" element={<VendorResponseDemo />} />
                  <Route path="/msp-dashboard" element={<MSPDashboard />} />
                  <Route path="/msp-dashboard/:customerId" element={<MSPCustomerDetail />} />
                  <Route path="/msp-dashboard/:customerId/trust-profile" element={<MSPCustomerTrustProfile />} />
                  <Route path="/msp-dashboard/:customerId/nis2" element={<MSPCustomerNIS2 />} />
                  <Route path="/msp-dashboard/:customerId/portal" element={<MSPCustomerPortal />} />
                  <Route path="/msp-licenses" element={<MSPLicenses />} />
                  <Route path="/msp-invoices" element={<MSPInvoices />} />
                  <Route path="/msp-roi" element={<MSPROICalculator />} />
                  <Route path="/msp-sales-guide" element={<MSPSalesGuide />} />
                  <Route path="/msp-customer-roi" element={<MSPCustomerROI />} />
                  <Route path="/msp-billing" element={<MSPBillingSettings />} />
                  <Route path="/mynder-me" element={<MynderMe />} />
                  <Route path="/developer/trust-profile-architecture" element={<TrustProfileArchitecture />} />
                  <Route path="/dashboard-v2" element={<DashboardV2 />} />
                  <Route path="/resources/features/:slug" element={<FeatureGuide />} />
                  <Route path="/resources/maturity" element={<MaturityMethodology />} />
                  <Route path="/resources/controls" element={<MynderControls />} />
                  <Route path="/trust-center/saas" element={<TrustCenterSaaS />} />
                  <Route path="/trust-center/shared" element={<TrustCenterShared />} />
                  <Route path="/trust-center/products" element={<TrustCenterProducts />} />
                  <Route path="/trust-center/compliance" element={<TrustCenterCompliance />} />
                  <Route path="/trust-center/policies" element={<TrustCenterPolicies />} />
                  <Route path="/trust-center/certifications" element={<TrustCenterCertifications />} />
                  <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
                  <Route path="/demo-library" element={<DemoLibrary />} />
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
