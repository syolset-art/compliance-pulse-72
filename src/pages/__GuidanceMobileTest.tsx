/**
 * Temporary test page for verifying the mobile layout of the "Veiledning fra Mynder" tab.
 * This file is NOT part of the production app and should be removed after verification.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import { CustomerFrameworkRecommendationsCard } from "@/components/msp/guidance/CustomerFrameworkRecommendationsCard";
import { CustomerRecommendationsCard } from "@/components/msp/guidance/CustomerRecommendationsCard";
import { CustomerMaturityMirrorCard } from "@/components/msp/guidance/CustomerMaturityMirrorCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Briefcase, Phone, Mail } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const mockCustomer = {
  id: "demo-cust-1",
  name: "Acme AS",
  customer_name: "Acme AS",
  org_number: "123456789",
  industry: "IT-tjenester",
  country: "NO",
  employees: 25,
  contact_email: "kontakt@acme.no",
  website: "https://acme.no",
  privacy_policy_url: "https://acme.no/privacy",
  recommended_frameworks: [
    { id: "gdpr", name: "GDPR", mandatory: true, confidence: 0.95 },
    { id: "nis2", name: "NIS2", mandatory: true, confidence: 0.88 },
    { id: "iso27001", name: "ISO 27001", mandatory: false, confidence: 0.72 },
  ],
  confirmed_frameworks: [{ id: "gdpr", name: "GDPR", mandatory: true, confidence: 0.95 }],
  active_modules: {
    core: { status: "active", tier: "tier_10", quantity: 10 },
    vendors: { status: "active", tier: "free", quantity: 0 },
    trust: { status: "inactive", tier: null, quantity: 0 },
    assets: { status: "inactive", tier: null, quantity: 0 },
  },
  partner_price_overrides: {},
};

const areaProgress = [
  { id: "governance", title: "Styring og ansvar", answered: 2, total: 5 },
  { id: "privacy", title: "Personvern", answered: 4, total: 8 },
  { id: "operations", title: "Drift og sikkerhet", answered: 1, total: 6 },
  { id: "identity", title: "Identitet og tilgang", answered: 0, total: 4 },
  { id: "thirdparty", title: "Tredjepart og verdikjede", answered: 1, total: 4 },
];

const planTasks = [
  {
    id: "lara-1",
    title: "Fullfør modenhetsvurderingen for Acme AS",
    insight: "Kunden har kun svart på 30 % av spørsmålene. Fullfør vurderingen for å få bedre anbefalinger.",
    severity: "high" as const,
    category: "Modenhet",
    canAutoRun: true,
    autoRunLabelNb: "La Lara fylle ut",
    primaryCtaLabelNb: "Se spørsmål",
  },
  {
    id: "lara-2",
    title: "Aktiver NIS2 for kunden",
    insight: "Acme AS har minst 20 ansatte og tilbyr IT-tjenester. NIS2 sannsynligvis gjelder.",
    severity: "critical" as const,
    category: "Regelverk",
    canAutoRun: false,
    primaryCtaLabelNb: "Aktiver",
  },
  {
    id: "lara-3",
    title: "Tilby avvikshåndtering",
    insight: "Kunden har ingen registrerte avvik. Et avvikssystem kan styrke etterlevelsen.",
    severity: "medium" as const,
    category: "Tjeneste",
    canAutoRun: false,
    primaryCtaLabelNb: "Les mer",
    readMoreCtaLabelNb: "Detaljer",
  },
];

export default function GuidanceMobileTest() {
  const [activeTab, setActiveTab] = useState("guidance");

  return (
    <div className="min-h-screen bg-background p-4">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Acme AS</h1>
            <p className="text-sm text-muted-foreground">Kundekort – test av mobilvisning</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <Briefcase className="h-3 w-3" />
              Driftspartner
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Mail className="h-3 w-3" />
              kontakt@acme.no
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/30 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Phone className="h-3 w-3" />
              Admin
            </span>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex justify-start overflow-x-auto">
            <TabsTrigger value="guidance">Veiledning fra Mynder</TabsTrigger>
            <TabsTrigger value="products">Tjenester og produkter</TabsTrigger>
            <TabsTrigger value="regulations">Regelverk</TabsTrigger>
          </TabsList>

          <TabsContent value="guidance" className="mt-6 space-y-5">
            <LaraRecommendationBanner
              totalCount={planTasks.length}
              criticalCount={1}
              tasks={planTasks}
              hideDismiss
              onPrimaryAction={() => {}}
              onReadMore={() => {}}
              onLaraAutoRun={() => {}}
            />

            <div id="msp-recommendations" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CustomerFrameworkRecommendationsCard
                customer={mockCustomer}
                status="partner_in_progress"
                answered={8}
                totalQuestions={27}
                onOffer={() => {}}
                onActivate={() => {}}
                onStartAssessment={() => {}}
                onEnterCustomer={() => {}}
              />
              <CustomerRecommendationsCard
                customer={mockCustomer}
                onOffer={() => {}}
                onActivate={() => {}}
                onEnterCustomer={() => {}}
              />
            </div>

            <CustomerMaturityMirrorCard
              customerId={mockCustomer.id}
              customerName={mockCustomer.name}
              customerOrgNumber={mockCustomer.org_number}
              areaProgress={areaProgress}
              totalAnswered={8}
              totalQuestions={27}
              hasBaselineAnswers={false}
              privacyPolicyUrl={mockCustomer.privacy_policy_url}
              onOpenProducts={() => setActiveTab("products")}
              onSeeServices={() => document.getElementById("msp-recommendations")?.scrollIntoView({ behavior: "smooth" })}
              onActivateFrameworks={() => setActiveTab("regulations")}
            />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card className="p-8">
              <p className="text-muted-foreground">Tjenester og produkter – testplassholder</p>
            </Card>
          </TabsContent>

          <TabsContent value="regulations" className="mt-6">
            <Card className="p-8">
              <p className="text-muted-foreground">Regelverk – testplassholder</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
