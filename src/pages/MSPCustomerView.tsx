import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailOfferView } from "@/components/msp/customer-view/EmailOfferView";
import { CatalogView } from "@/components/msp/customer-view/CatalogView";
import { PublicProfileView } from "@/components/msp/customer-view/PublicProfileView";
import { HandoverEmailView } from "@/components/msp/customer-view/HandoverEmailView";
import { DeliveryReportView } from "@/components/msp/customer-view/DeliveryReportView";
import { Eye } from "lucide-react";

type ViewTab = "email-offer" | "catalog" | "public-profile" | "handover" | "report";

export default function MSPCustomerView() {
  const [tab, setTab] = useState<ViewTab>("email-offer");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Eye className="h-3.5 w-3.5" />
              Intern referansevisning
            </div>
            <h1 className="text-3xl font-bold text-foreground">Kundevisning</h1>
            <p className="text-base text-foreground/80 mt-1 leading-relaxed max-w-3xl">
              Slik ser tilbudet og leveransen ut fra kundens side. Bruk dette som referanse
              når du implementerer touchpoints — hver visning peker til riktig komponent og
              forklarer hva som trigger den.
            </p>
          </header>

          <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)} className="space-y-6">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="email-offer">1. Tilbud (e-post)</TabsTrigger>
              <TabsTrigger value="catalog">2. Tjenestekatalog</TabsTrigger>
              <TabsTrigger value="public-profile">3. Trust Profile (offentlig)</TabsTrigger>
              <TabsTrigger value="handover">4. Overlevering (e-post)</TabsTrigger>
              <TabsTrigger value="report">5. Leveranserapport (PDF)</TabsTrigger>
            </TabsList>

            <TabsContent value="email-offer"><EmailOfferView /></TabsContent>
            <TabsContent value="catalog"><CatalogView /></TabsContent>
            <TabsContent value="public-profile"><PublicProfileView /></TabsContent>
            <TabsContent value="handover"><HandoverEmailView /></TabsContent>
            <TabsContent value="report"><DeliveryReportView /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
