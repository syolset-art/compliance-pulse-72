import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { NavigationModeProvider } from "@/hooks/useNavigationMode";
import { ActiveOrganizationProvider } from "@/contexts/ActiveOrganizationContext";
import { GlobalChatProvider } from "@/components/GlobalChatProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { DemoSyncProvider } from "@/contexts/DemoSyncContext";
import { CustomerRequestDemoController } from "@/components/demo/CustomerRequestDemoController";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SystemTrustProfile from "./pages/SystemTrustProfile";
import AIAgentSetup from "./pages/AIAgentSetup";
import AISystemRegistry from "./pages/AISystemRegistry";
import Tasks from "./pages/Tasks";
import Systems from "./pages/Systems";
import Onboarding from "./pages/Onboarding";
import Sustainability from "./pages/Sustainability";
import Transparency from "./pages/Transparency";
import WorkAreas from "./pages/WorkAreas";
import Assets from "./pages/Assets";
import VendorDashboard from "./pages/VendorDashboard";
import AssetTrustProfile from "./pages/AssetTrustProfile";
import ProcessingRecords from "./pages/ProcessingRecords";
import CompanySettings from "./pages/CompanySettings";
import PersonalSettings from "./pages/PersonalSettings";
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
import MSPPartnerDashboard from "./pages/MSPPartnerDashboard";
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
import MaturityDashboard from "./pages/MaturityDashboard";
import MynderControls from "./pages/MynderControls";
import TrustCenterSaaS from "./pages/TrustCenterSaaS";
import TrustCenterShared from "./pages/TrustCenterShared";
import TrustCenterCompliance from "./pages/TrustCenterCompliance";
import TrustCenterPolicies from "./pages/TrustCenterPolicies";
import TrustCenterCertifications from "./pages/TrustCenterCertifications";
import TrustCenterEvidence from "./pages/TrustCenterEvidence";
import TrustCenterProducts from "./pages/TrustCenterProducts";
import TrustCenterProductsPublic from "./pages/TrustCenterProductsPublic";
import TrustCenterRegulations from "./pages/TrustCenterRegulations";
import ComplianceCalendar from "./pages/ComplianceCalendar";
import ComplianceChecklist from "./pages/ComplianceChecklist";
import MSPCustomerTrustProfile from "./pages/MSPCustomerTrustProfile";
import MSPCustomerNIS2 from "./pages/MSPCustomerNIS2";
import DemoLibrary from "./pages/DemoLibrary";
import AdminOrganisation from "./pages/AdminOrganisation";
import AdminDocuments from "./pages/AdminDocuments";
import AdminNotifications from "./pages/AdminNotifications";
import AdminAccessManagement from "./pages/AdminAccessManagement";
import BusinessRiskDetail from "./pages/BusinessRiskDetail";
import FrameworkDetail from "./pages/FrameworkDetail";
import ComplianceOverview from "./pages/ComplianceOverview";
import TrustCenterProfile from "./pages/TrustCenterProfile";
import TrustCenterServiceProfile from "./pages/TrustCenterServiceProfile";
import TrustCenterEditProfile from "./pages/TrustCenterEditProfile";
import TrustEngine from "./pages/TrustEngine";
import PublicTrustProfile from "./pages/PublicTrustProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <ActiveOrganizationProvider>
          <NavigationModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <DemoSyncProvider>
                <CustomerRequestDemoController />
                <GlobalChatProvider>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/ai-setup" element={<AIAgentSetup />} />
                  <Route path="/ai-registry" element={<AISystemRegistry />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/vendors" element={<VendorDashboard />} />
                  <Route path="/sustainability" element={<Sustainability />} />
                  <Route path="/transparency" element={<Transparency />} />
                  <Route path="/services" element={<WorkAreas />} />
                  <Route path="/work-areas" element={<WorkAreas />} />
                  <Route path="/assets" element={<Assets />} />
                  <Route path="/assets/:id" element={<AssetTrustProfile />} />
                  <Route path="/protocols" element={<ProcessingRecords />} />
                  <Route path="/processes/:id" element={<ProcessProfile />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/compliance" element={<ComplianceOverview />} />
                  <Route path="/company-settings" element={<CompanySettings />} />
                  <Route path="/settings" element={<PersonalSettings />} />
                  <Route path="/regulations" element={<Regulations />} />
                  <Route path="/regulations/:frameworkId" element={<FrameworkDetail />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/terms-and-consent" element={<TermsAndConsent />} />
                  <Route path="/deviations" element={<Deviations />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/compliance" element={<ComplianceChecklist />} />
                  <Route path="/maturity" element={<MaturityDashboard />} />
                  <Route path="/controls" element={<MynderControls />} />
                  <Route path="/compliance-checklist" element={<ComplianceChecklist />} />
                  <Route path="/resources/controls" element={<MynderControls />} />
                  <Route path="/quality" element={<QualityDashboard />} />
                  <Route path="/lara-inbox" element={<LaraInbox />} />
                  <Route path="/customer-requests" element={<CustomerRequests />} />
                  <Route path="/systems" element={<Systems />} />
                  <Route path="/systems/:id" element={<SystemTrustProfile />} />
                  <Route path="/vendor-response-demo" element={<VendorResponseDemo />} />
                  <Route path="/msp-partner" element={<MSPPartnerDashboard />} />
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
                  <Route path="/trust-center/profile" element={<TrustCenterProfile />} />
                  <Route path="/trust-center/profile/:id" element={<TrustCenterServiceProfile />} />
                  <Route path="/trust-center/edit" element={<TrustCenterEditProfile />} />
                  <Route path="/trust-center/saas" element={<TrustCenterSaaS />} />
                  <Route path="/trust-center/shared" element={<TrustCenterShared />} />
                  <Route path="/trust-center/products" element={<TrustCenterProducts />} />
                  <Route path="/trust-center/products/public" element={<TrustCenterProductsPublic />} />
                  <Route path="/trust-center/compliance" element={<TrustCenterCompliance />} />
                  <Route path="/trust-center/policies" element={<TrustCenterPolicies />} />
                  <Route path="/trust-center/certifications" element={<TrustCenterCertifications />} />
                  <Route path="/trust-center/evidence" element={<TrustCenterEvidence />} />
                  <Route path="/trust-center/regulations" element={<Regulations />} />
                  <Route path="/compliance-calendar" element={<ComplianceCalendar />} />
                  <Route path="/trust-engine" element={<TrustEngine />} />
                  <Route path="/trust-engine/profile/:assetId" element={<PublicTrustProfile />} />
                  <Route path="/demo-library" element={<DemoLibrary />} />
                  <Route path="/admin/organisation" element={<AdminOrganisation />} />
                  <Route path="/admin/documents" element={<AdminDocuments />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/access" element={<AdminAccessManagement />} />
                  <Route path="/risk" element={<BusinessRiskDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </GlobalChatProvider>
              </DemoSyncProvider>
            </TooltipProvider>
          </NavigationModeProvider>
          </ActiveOrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
