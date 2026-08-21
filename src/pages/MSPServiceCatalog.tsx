import { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useGlobalChat } from "@/components/GlobalChatProvider";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import laraButterfly from "@/assets/lara-butterfly.png";
import { PartnerSalesPotentialCard } from "@/components/msp/PartnerSalesPotentialCard";
import { PartnerProductList } from "@/components/msp/PartnerProductList";
import { MSPFrameworkHoursTab } from "@/components/msp/MSPFrameworkHoursTab";
import { MSPServiceSettingsTab } from "@/components/msp/MSPServiceSettingsTab";
import { MSPServiceHowItWorksTab } from "@/components/msp/MSPServiceHowItWorksTab";

type SecondaryView = "settings" | "how-it-works" | null;

export default function MSPServiceCatalog() {
  const [secondary, setSecondary] = useState<SecondaryView>(null);
  const { currency } = useServiceDefaults();
  const { t } = useTranslation();
  const { setIsChatOpen, setIsDocked } = useGlobalChat();

  const openLaraDocked = () => {
    setIsDocked(true);
    setIsChatOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">Produkter og tjenester</h1>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={openLaraDocked}
                  aria-label={t("chatPanel.talkToLara")}
                >
                  <img src={laraButterfly} alt="" className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("chatPanel.talkToLara")}</span>
                </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2"
                    aria-label="Innstillinger og hjelp"
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
                  <DropdownMenuItem onSelect={() => setSecondary("how-it-works")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Hvordan virker det
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
            <p className="text-base text-foreground/80 mt-1 leading-relaxed max-w-3xl">
              Alt du kan selge til kundene dine — Mynder-produkter og egne rådgivningstimer. Sett
              opp pakkene her, så ligger de klare når du lager tilbud.
            </p>
          </header>

          <PartnerSalesPotentialCard currency={currency} />

          <PartnerProductList />

          <section id="regelverk-pakker" className="space-y-3 scroll-mt-20">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Regelverk og rådgivningspakker
              </h2>
              <p className="text-sm text-muted-foreground">
                Aktiver regelverk og sett opp rådgivningspakken med AI-foreslåtte timer per krav.
              </p>
            </div>
            <MSPFrameworkHoursTab />
          </section>
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
