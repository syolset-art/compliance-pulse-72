import { useState } from "react";
import { ChevronDown, FileText, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AiMappingDisclosure } from "@/components/msp/AiMappingDisclosure";
import { inactiveFrameworkPitch, type OfferCoverage } from "@/lib/offerCoverage";

interface Props {
  coverage: OfferCoverage;
  /** Regelverk som allerede er lagt inn som aktivering i tilbudet. */
  addedFrameworkIds: string[];
  onAddFramework: (fw: { id: string; label: string }) => void;
  showInOffer: boolean;
  onShowInOfferChange: (v: boolean) => void;
}

export function OfferCoveragePanel({
  coverage,
  addedFrameworkIds,
  onAddFramework,
  showInOffer,
  onShowInOfferChange,
}: Props) {
  const [open, setOpen] = useState(true);
  if (coverage.services.length === 0) return null;

  const pending = coverage.inactiveFrameworks.filter((f) => !addedFrameworkIds.includes(f.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          Dette dekker tilbudet
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {coverage.requirementCount} krav · {coverage.documentCount} dokumenter
        </span>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-md border border-border overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>{coverage.services.length} tjenester mappet mot krav og dokumentasjon</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="divide-y divide-border">
              {coverage.services.map((s) => (
                <div key={s.serviceLabel} className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{s.serviceLabel}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {s.requirements.length} krav · {s.documents.length} dokumenter
                    </span>
                  </div>

                  <div className="space-y-1">
                    {s.requirements.map((r) => (
                      <div
                        key={`${r.frameworkId}-${r.controlId}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-muted-foreground truncate">
                          <span className="text-foreground">{r.frameworkShortName}</span>
                          {" › "}
                          {r.controlId} {r.controlLabel}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-normal whitespace-nowrap",
                            r.active
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {r.active ? "Aktivert" : "Ikke aktivert"}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {s.documents.length > 0 && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        {s.documents.map((d, i) => (
                          <span key={d.name}>
                            {i > 0 && ", "}
                            {d.name}
                            {d.laraDraft && (
                              <Sparkles className="inline h-2.5 w-2.5 ml-0.5 text-primary align-baseline" />
                            )}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="px-3 py-2.5 border-t border-border bg-muted/20 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {inactiveFrameworkPitch(pending.map((f) => f.label))}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pending.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onAddFramework(f)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:border-foreground/40 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Legg til {f.label} i tilbudet
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 py-2 border-t border-border flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Vis dekning i tilbudet</span>
              <Switch checked={showInOffer} onCheckedChange={onShowInOfferChange} />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AiMappingDisclosure />
    </div>
  );
}
