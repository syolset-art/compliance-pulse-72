import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MSPServiceCatalogTab } from "@/components/msp/MSPServiceCatalogTab";
import { MSPServiceSettingsTab } from "@/components/msp/MSPServiceSettingsTab";
import { MSPServiceHowItWorksTab } from "@/components/msp/MSPServiceHowItWorksTab";

type SecondaryView = "settings" | "how-it-works" | null;

export default function MSPServiceCatalog() {
  const [secondary, setSecondary] = useState<SecondaryView>(null);

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

          <MSPServiceCatalogTab onOpenSecondary={(v) => setSecondary(v)} />
        </div>
      </main>

      <Sheet open={secondary !== null} onOpenChange={(open) => !open && setSecondary(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {secondary === "settings" ? "Innstillinger" : "Hvordan virker det"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {secondary === "settings" && <MSPServiceSettingsTab />}
            {secondary === "how-it-works" && (
              <MSPServiceHowItWorksTab onNavigate={() => setSecondary(null)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
