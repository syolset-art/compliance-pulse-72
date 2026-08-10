import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Building2, Coins, Download, Handshake, Receipt, ShieldCheck, Users } from "lucide-react";
import { AdminRouteGuard } from "@/components/mynder-admin/AdminRouteGuard";
import { PartnerChannelView } from "@/components/mynder-admin/PartnerChannelView";
import { DirectSalesView } from "@/components/mynder-admin/DirectSalesView";
import { InvoiceBasisView } from "@/components/mynder-admin/InvoiceBasisView";
import { PARTNERS, CUSTOMERS } from "@/components/mynder-admin/adminDemoData";

export default function MynderAdminDashboard() {
  const partnerCount = PARTNERS.length;
  const partnerCustomers = CUSTOMERS.filter((c) => c.salesChannel === "partner");
  const directCustomers = CUSTOMERS.filter((c) => c.salesChannel === "direct");
  const totalMrr = CUSTOMERS.reduce((s, c) => s + c.mrrNok, 0);

  return (
    <AdminRouteGuard>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-64 pt-16 px-6 pb-12">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">Mynder innstillinger</span>
                </div>
                <h1 className="text-2xl font-semibold text-foreground">Eierdashbord</h1>
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
            <Tabs defaultValue="partner" className="w-full">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="partner" className="gap-2">
                  <Handshake className="h-4 w-4" />
                  Partnerkanal ({partnerCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="direct" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Direktesalg ({directCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="invoice" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Fakturagrunnlag
                </TabsTrigger>
              </TabsList>
              <TabsContent value="partner" className="mt-4">
                <PartnerChannelView />
              </TabsContent>
              <TabsContent value="direct" className="mt-4">
                <DirectSalesView />
              </TabsContent>
              <TabsContent value="invoice" className="mt-4">
                <InvoiceBasisView />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AdminRouteGuard>
  );
}
