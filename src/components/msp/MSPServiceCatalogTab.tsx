import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceForm } from "./ServiceForm";
import { ServiceCard } from "./ServiceCard";
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

  // Stats
  const stats = {
    count: services.length,
    controls: (() => {
      const ids = new Set<string>();
      services.forEach((s) =>
        s.frameworkMappings.forEach((m) =>
          m.controlIds.forEach((c) => ids.add(`${m.frameworkId}:${c}`)),
        ),
      );
      return ids.size;
    })(),
    frameworks: (() => {
      const ids = new Set<string>();
      services.forEach((s) => s.frameworkMappings.forEach((m) => ids.add(m.frameworkId)));
      return ids.size;
    })(),
    suggestions: suggestions?.length ?? 0,
  };

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
        <>
          {/* Top action row */}
          <div className="flex items-center justify-end gap-2">
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

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="I katalog" value={stats.count} />
            <StatCard label="Kontrollpunkter dekket" value={stats.controls} />
            <StatCard label="Regelverk" value={stats.frameworks} />
            <StatCard
              label="Lara foreslår"
              value={stats.suggestions}
              highlight={stats.suggestions > 0}
            />
          </div>
        </>
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

      {/* Service grid */}
      {services.length > 0 && !inSuggestionMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => {
            const totalControls = totalControlCount(s.frameworkMappings);
            const isEditing = editing === s.id;
            const primaryId = primaryFrameworkId(s.frameworkMappings);
            const theme = primaryId ? getFrameworkTheme(primaryId) : null;
            return (
              <Card
                key={s.id}
                className={cn(
                  "p-4 hover:border-primary/30 transition-colors border-l-4",
                  theme ? theme.border : "border-l-muted",
                  isEditing && "md:col-span-2",
                )}
              >
                {isEditing ? (
                  <ServiceForm
                    initial={s}
                    onCancel={() => setEditing(null)}
                    onSave={(updated) => {
                      setServices((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                      setEditing(null);
                    }}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        theme ? theme.iconBg : "bg-muted",
                      )}
                    >
                      <Shield className={cn("h-4 w-4", theme ? theme.iconColor : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{s.name}</span>
                            {(s.price != null || s.priceNote) && (
                              <Badge variant="outline" className="text-[10px] gap-1 bg-success/5 text-success border-success/30">
                                <Tag className="h-3 w-3" />
                                {formatPrice(s)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {s.defaultChecklist.length} leveransepunkter
                            {totalControls > 0 && <> · {totalControls} kontrollpunkter</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <label
                            className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1.5 py-1 cursor-pointer hover:bg-muted/60 transition-colors"
                            title={
                              s.publishedToCustomers
                                ? "Synlig og bestillbar i kundens portal"
                                : "Skjult — kun synlig for deg"
                            }
                          >
                            {s.publishedToCustomers ? (
                              <Eye className="h-3 w-3 text-primary" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                            )}
                            <Switch
                              checked={!!s.publishedToCustomers}
                              onCheckedChange={(checked) =>
                                setServices((prev) =>
                                  prev.map((x) =>
                                    x.id === s.id ? { ...x, publishedToCustomers: checked } : x,
                                  ),
                                )
                              }
                            />
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditing(s.id)}
                            title="Rediger tjeneste"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-snug">{s.description}</p>
                      <ServiceEvidenceSection
                        mappings={s.frameworkMappings}
                        onConnect={() => setEditing(s.id)}
                        compact
                      />
                    </div>
                  </div>
                )}
              </Card>
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

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("p-3", highlight && "border-primary/30 bg-primary/[0.04]")}>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold mt-1",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

const PRICE_MODEL_LABEL: Record<NonNullable<PartnerService["priceModel"]>, string> = {
  fixed: "fastpris",
  monthly: "kr/mnd",
  hourly: "kr/time",
  "per-user": "kr/bruker/mnd",
  quote: "etter avtale",
};

function formatPrice(s: PartnerService): string {
  const model = s.priceModel ?? "fixed";
  if (model === "quote") return s.priceNote || "Etter avtale";
  if (s.price == null && !s.priceNote) return "";
  const amount =
    s.price != null ? new Intl.NumberFormat("nb-NO").format(s.price) : "";
  const label = PRICE_MODEL_LABEL[model];
  const base =
    model === "fixed"
      ? amount ? `${amount} kr` : ""
      : amount ? `${amount} ${label}` : label;
  return [base, s.priceNote].filter(Boolean).join(" · ");
}

