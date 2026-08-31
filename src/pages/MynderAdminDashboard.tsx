import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Briefcase, Building2, Coins, Download, Handshake, Receipt, ShieldCheck, Users, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminRouteGuard } from "@/components/mynder-admin/AdminRouteGuard";
import { PartnerChannelView } from "@/components/mynder-admin/PartnerChannelView";
import { DirectSalesView } from "@/components/mynder-admin/DirectSalesView";
import { InvoiceBasisView } from "@/components/mynder-admin/InvoiceBasisView";
import { PartnersView } from "@/components/mynder-admin/PartnersView";
import { PartnerInvoicesView } from "@/components/mynder-admin/PartnerInvoicesView";
import { MynderProjectsView } from "@/components/mynder-admin/MynderProjectsView";
import { PARTNERS, CUSTOMERS } from "@/components/mynder-admin/adminDemoData";

/** Prognose fra interne styrende dokumenter (budsjett 2026). Erstattes av backend-kobling. */
const MRR_FORECAST_NOK = 75000;

export default function MynderAdminDashboard() {
  const [revenueView, setRevenueView] = useState<"mrr" | "arr">("mrr");
  const partnerCount = PARTNERS.length;
  const partnerCustomers = CUSTOMERS.filter((c) => c.salesChannel === "partner");
  const directCustomers = CUSTOMERS.filter((c) => c.salesChannel === "direct");
  const totalMrr = CUSTOMERS.reduce((s, c) => s + c.mrrNok, 0);
  const isArr = revenueView === "arr";
  const revenueValue = isArr ? totalMrr * 12 : totalMrr;
  const forecastValue = isArr ? MRR_FORECAST_NOK * 12 : MRR_FORECAST_NOK;
  const deviationPct = Math.round(((revenueValue - forecastValue) / forecastValue) * 100);
  const onTrack = deviationPct >= 0;


  return (
    <AdminRouteGuard>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11 px-4 md:px-8 pb-12">
          <div className="max-w-6xl mx-auto py-6 md:py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Mynder innstillinger</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Dashbord</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Partnerkanal og direktesalg — kun for daglig leder og superbruker.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Eksporter
              </Button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard title="Partnere" value={partnerCount} icon={Handshake} />
              <MetricCard title="Partnerkunder" value={partnerCustomers.length} subtitle="Solgt via partner" icon={Users} />
              <MetricCard title="Direktekunder" value={directCustomers.length} subtitle="Solgt direkte" icon={Building2} />
              <MetricCard title="MRR totalt" value={`${totalMrr.toLocaleString("nb-NO")} kr`} icon={Coins} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="partners" className="w-full">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="partners" className="gap-2">
                  <Handshake className="h-4 w-4" />
                  Partnere ({partnerCount})
                </TabsTrigger>
                <TabsTrigger value="partner" className="gap-2">
                  <Users className="h-4 w-4" />
                  Partnerkanal ({partnerCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Direktekunder ({directCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="partner-invoices" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Fakturaer til partnere
                </TabsTrigger>
                <TabsTrigger value="invoice" className="gap-2">
                  <Coins className="h-4 w-4" />
                  Fakturagrunnlag
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Prosjekter
                </TabsTrigger>
              </TabsList>
              <TabsContent value="partners" className="mt-4">
                <PartnersView />
              </TabsContent>
              <TabsContent value="partner" className="mt-4">
                <PartnerChannelView />
              </TabsContent>
              <TabsContent value="direct" className="mt-4">
                <DirectSalesView />
              </TabsContent>
              <TabsContent value="partner-invoices" className="mt-4">
                <PartnerInvoicesView />
              </TabsContent>
              <TabsContent value="invoice" className="mt-4">
                <InvoiceBasisView />
              </TabsContent>
              <TabsContent value="projects" className="mt-4">
                <MynderProjectsView />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AdminRouteGuard>
  );
}
