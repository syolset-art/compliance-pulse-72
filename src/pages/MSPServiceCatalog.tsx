import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MSPServiceCatalogTab } from "@/components/msp/MSPServiceCatalogTab";
import { MSPServiceSettingsTab } from "@/components/msp/MSPServiceSettingsTab";
import { MSPServiceHowItWorksTab } from "@/components/msp/MSPServiceHowItWorksTab";

type ServiceTab = "catalog" | "settings" | "how-it-works";

export default function MSPServiceCatalog() {
  const [tab, setTab] = useState<ServiceTab>("catalog");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Produkter og tjenester</h1>
            <p className="text-base text-foreground/80 mt-1 leading-relaxed max-w-3xl">
              Bygg din tjenestekatalog og se hvilke regelverk hver tjeneste dekker.
              Videreselg Mynder-produkter til dine kunder og tjen provisjon på lisenser.
            </p>
          </header>

          <Tabs value={tab} onValueChange={(v) => setTab(v as ServiceTab)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="catalog">Tjenestekatalog</TabsTrigger>
              <TabsTrigger value="settings">Innstillinger</TabsTrigger>
              <TabsTrigger value="how-it-works">Hvordan virker det</TabsTrigger>
            </TabsList>
            <TabsContent value="catalog" className="space-y-6">
              <MSPServiceCatalogTab />
            </TabsContent>
            <TabsContent value="settings" className="space-y-6">
              <MSPServiceSettingsTab />
            </TabsContent>
            <TabsContent value="how-it-works" className="space-y-6">
              <MSPServiceHowItWorksTab onNavigate={(t) => setTab(t)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
