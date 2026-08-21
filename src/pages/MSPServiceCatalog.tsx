import { useCallback, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, FileText } from "lucide-react";
import { MSPServiceCatalogTab } from "@/components/msp/MSPServiceCatalogTab";
import { MSPServiceSettingsTab } from "@/components/msp/MSPServiceSettingsTab";
import { MSPServiceHowItWorksTab } from "@/components/msp/MSPServiceHowItWorksTab";

type SecondaryView = "settings" | "how-it-works" | null;

export default function MSPServiceCatalog() {
  const [secondary, setSecondary] = useState<SecondaryView>(null);
  const actionsRef = useRef<{ openWizard: () => void } | null>(null);
  const registerActions = useCallback((actions: { openWizard: () => void }) => {
    actionsRef.current = actions;
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">Produkter og tjenester</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2"
                    aria-label="Innstillinger, tjenesteprofil og hjelp"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Innstillinger</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => setSecondary("settings")}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Innstillinger
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => actionsRef.current?.openWizard()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Tjenesteprofil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setSecondary("how-it-works")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Hvordan virker det
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-base text-foreground/80 mt-1 leading-relaxed max-w-3xl">
              Bygg din tjenestekatalog og se hvilke regelverk hver tjeneste dekker.
              Videreselg Mynder-produkter til dine kunder og tjen provisjon på lisenser.
            </p>
          </header>

          <MSPServiceCatalogTab
            onOpenSecondary={(v) => setSecondary(v)}
            onRegisterActions={registerActions}
          />
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
