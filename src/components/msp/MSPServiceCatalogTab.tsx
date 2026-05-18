import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ServiceForm } from "./ServiceForm";
import { ServiceTableRow } from "./ServiceTableRow";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";
import { MSPLaraServiceWizard } from "./MSPLaraServiceWizard";
import { MSPLaraServiceSuggestions } from "./MSPLaraServiceSuggestions";

export function MSPServiceCatalogTab() {
  // Demo: start tom så Lara-flyten vises første gang
  const [services, setServices] = useState<PartnerService[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [suggestions, setSuggestions] = useState<PartnerService[] | null>(null);

  // Auto-åpne veiviser første gang katalogen er tom
  useEffect(() => {
    if (services.length === 0 && !wizardDone && !suggestions) {
      setWizardOpen(true);
    }
  }, [services.length, wizardDone, suggestions]);

  const addService = (s: PartnerService) => {
    setServices((prev) => [...prev, s]);
    setAdding(false);
  };

  const handleWizardComplete = (sug: PartnerService[]) => {
    setSuggestions(sug);
    setWizardDone(true);
  };

  const handleAddSuggestions = (chosen: PartnerService[]) => {
    setServices((prev) => [...prev, ...chosen]);
    setSuggestions(null);
  };

  const seedDemo = () => {
    setServices(PARTNER_SERVICES);
    setWizardDone(true);
    setSuggestions(null);
  };

  const showEmptyHero = services.length === 0 && !suggestions;


  const inSuggestionMode = !!suggestions;

  return (
    <div className="space-y-4">
      {/* Header — empty hero, suggestion mode, eller katalog-modus */}
      {showEmptyHero ? (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  La Lara sette opp tjenestekatalogen din
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Svar på fire korte spørsmål om hva dere leverer, så foreslår Lara en
                  skreddersydd tjenestepakke. Du kan velge, tilpasse eller lage egne tjenester
                  etterpå.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Kom i gang med Lara
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
                  Lag egen tjeneste
                </Button>
                <Button size="sm" variant="ghost" onClick={seedDemo}>
                  Bruk demo-katalog
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : inSuggestionMode ? (
        <Card className="p-4 border-primary/20 bg-primary/[0.04]">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground">
                Lara har skreddersydd {suggestions!.length} tjenester — tilpass før du importerer
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Toggle synlighet, rediger detaljer eller fjern forslag du ikke vil ha. Trykk «Importer» når du er klar.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => {
                  setSuggestions(null);
                  setWizardOpen(true);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start på nytt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-muted-foreground"
                onClick={() => setSuggestions(null)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Forkast alle
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">
              Klikk på timer eller pris for å justere. Aktiviteter og kontrollpunkter velges fra
              Mynders bibliotek.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5"
              onClick={() => setWizardOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Lara: foreslå flere
            </Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Ny tjeneste
            </Button>
          </div>
        </div>
      )}

      {/* Lara-forslag — primær landing etter wizard */}
      {suggestions && (
        <MSPLaraServiceSuggestions
          suggestions={suggestions}
          onChangeSuggestions={(next) => setSuggestions(next)}
          onImport={handleAddSuggestions}
          onDismiss={() => setSuggestions(null)}
        />
      )}

      {adding && !inSuggestionMode && (
        <ServiceForm onCancel={() => setAdding(false)} onSave={addService} />
      )}

      {/* Service-tabell */}
      {services.length > 0 && !inSuggestionMode && (
        <div className="space-y-2">
          {/* Kolonneoverskrifter */}
          <div className="grid items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground grid-cols-[1fr_180px_80px_120px_120px_40px]">
            <span>Tjeneste</span>
            <span>Regelverk</span>
            <span>Timer</span>
            <span>Timepris</span>
            <span className="text-right">Totalpris</span>
            <span />
          </div>
          {services.map((s) => {
            const isEditing = editing === s.id;
            if (isEditing) {
              return (
                <ServiceForm
                  key={s.id}
                  initial={s}
                  onCancel={() => setEditing(null)}
                  onSave={(updated) => {
                    setServices((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                    setEditing(null);
                  }}
                />
              );
            }
            return (
              <ServiceTableRow
                key={s.id}
                service={s}
                onEdit={() => setEditing(s.id)}
                onTogglePublished={(checked) =>
                  setServices((prev) =>
                    prev.map((x) =>
                      x.id === s.id ? { ...x, publishedToCustomers: checked } : x,
                    ),
                  )
                }
                onDelete={() =>
                  setServices((prev) => prev.filter((x) => x.id !== s.id))
                }
              />
            );
          })}
        </div>
      )}

      <MSPLaraServiceWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
        onSkip={() => setWizardDone(true)}
      />
    </div>
  );
}



