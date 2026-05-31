import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MSPServiceCatalogTab } from "@/components/msp/MSPServiceCatalogTab";
import { MSPServiceSettingsTab } from "@/components/msp/MSPServiceSettingsTab";

export default function MSPServiceCatalog() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Tjenester</h1>
            <p className="text-muted-foreground mt-1">
              Definer dine egne tjenester og se hvordan de treffer kontrollpunkter på tvers av regelverk.
            </p>
          </header>

          <Tabs defaultValue="catalog" className="space-y-6">
            <TabsList>
              <TabsTrigger value="catalog">Tjenestekatalog</TabsTrigger>
              <TabsTrigger value="settings">Innstillinger</TabsTrigger>
            </TabsList>
            <TabsContent value="catalog" className="space-y-6">
              <MSPServiceCatalogTab />
            </TabsContent>
            <TabsContent value="settings" className="space-y-6">
              <MSPServiceSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
