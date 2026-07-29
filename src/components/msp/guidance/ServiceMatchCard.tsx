import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Sparkles, Check, ArrowRight } from "lucide-react";
import { matchServicesToFrameworks } from "@/lib/serviceMatcher";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";

interface Props {
  activeFrameworkIds: string[];
  catalogTemplateIds: Set<string>;
  onCreateOffer: (templateId: string, templateName: string) => void;
  onSeeAll?: () => void;
}

/**
 * Viser hvilke tjenester partneren typisk kan levere til denne kunden basert
 * på aktive/anbefalte regelverk. Merker om tjenesten allerede finnes i egen
 * katalog eller bare i Mynders bibliotek.
 */
export function ServiceMatchCard({ activeFrameworkIds, catalogTemplateIds, onCreateOffer, onSeeAll }: Props) {
  const matches = useMemo(
    () => matchServicesToFrameworks(activeFrameworkIds, SERVICE_LIBRARY, 6),
    [activeFrameworkIds],
  );

  const labelForFramework = (id: string) => ALL_FRAMEWORKS.find((f) => f.id === id)?.name.split(" ")[0] ?? id.toUpperCase();

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Tjenester du kan tilby denne kunden</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basert på kundens regelverk. Lag et tilbud direkte, eller åpne katalogen for å tilpasse.
            </p>
          </div>
        </div>
        {onSeeAll && (
          <Button variant="ghost" size="sm" onClick={onSeeAll} className="shrink-0 h-7 text-xs">
            Se katalog
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Bekreft minst ett regelverk over for å se matchende tjenester.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {matches.map((m) => {
            const inCatalog = catalogTemplateIds.has(m.templateId);
            return (
              <div key={m.templateId} className="rounded-lg border border-border/60 p-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground line-clamp-2">{m.name}</span>
                  {inCatalog ? (
                    <Badge variant="outline" className="h-5 gap-1 border-primary/40 text-primary text-[10px] font-medium shrink-0">
                      <Check className="h-2.5 w-2.5" /> I katalogen
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-5 gap-1 text-muted-foreground text-[10px] font-medium shrink-0">
                      <Sparkles className="h-2.5 w-2.5" /> Fra Mynder
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.frameworks.slice(0, 3).map((fid) => (
                    <span key={fid} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {labelForFramework(fid)}
                    </span>
                  ))}
                  {m.frameworks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{m.frameworks.length - 3}</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateOffer(m.templateId, m.name)}
                  className="h-7 text-xs mt-auto"
                >
                  Lag tilbud
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
