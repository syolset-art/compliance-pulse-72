import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Pencil, Tag, Eye, EyeOff, X, ClipboardList, Clock } from "lucide-react";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { cn } from "@/lib/utils";
import {
  ServiceEvidenceSection,
  totalControlCount,
  primaryFrameworkId,
} from "./ServiceEvidenceSection";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import type { PartnerService } from "@/lib/serviceCatalog";

const PRICE_MODEL_LABEL: Record<NonNullable<PartnerService["priceModel"]>, string> = {
  fixed: "fastpris",
  monthly: "kr/mnd",
  hourly: "kr/time",
  "per-user": "kr/bruker/mnd",
  quote: "etter avtale",
};

export function formatServicePrice(s: PartnerService): string {
  const model = s.priceModel ?? "fixed";
  if (model === "quote") return s.priceNote || "Etter avtale";
  if (s.price == null && !s.priceNote) return "";
  const amount = s.price != null ? new Intl.NumberFormat("nb-NO").format(s.price) : "";
  const label = PRICE_MODEL_LABEL[model];
  const base =
    model === "fixed"
      ? amount ? `${amount} kr` : ""
      : amount ? `${amount} ${label}` : label;
  return [base, s.priceNote].filter(Boolean).join(" · ");
}

interface ServiceCardProps {
  service: PartnerService;
  onEdit: () => void;
  onTogglePublished: (value: boolean) => void;
  /** Når satt: vis import-checkbox og evt. fjern-knapp (suggestion mode). */
  selectable?: {
    selected: boolean;
    onToggleSelect: () => void;
    onRemove?: () => void;
  };
}

export function ServiceCard({
  service: s,
  onEdit,
  onTogglePublished,
  selectable,
}: ServiceCardProps) {
  const totalControls = totalControlCount(s.frameworkMappings);
  const primaryId = primaryFrameworkId(s.frameworkMappings);
  const theme = primaryId ? getFrameworkTheme(primaryId) : null;
  const dimmed = selectable && !selectable.selected;

  return (
    <Card
      className={cn(
        "p-4 hover:border-primary/30 transition-all border-l-4 relative",
        theme ? theme.border : "border-l-muted",
        dimmed && "opacity-60",
        selectable?.selected && "ring-1 ring-primary/30",
      )}
    >
      {selectable && (
        <button
          type="button"
          onClick={selectable.onToggleSelect}
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 backdrop-blur px-1.5 py-1 hover:bg-muted/60 transition-colors"
          aria-label={selectable.selected ? "Fjern fra import" : "Velg for import"}
          title={selectable.selected ? "Valgt for import" : "Klikk for å velge"}
        >
          <Checkbox checked={selectable.selected} tabIndex={-1} className="pointer-events-none" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {selectable.selected ? "Valgt" : "Velg"}
          </span>
        </button>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
            theme ? theme.iconBg : "bg-muted",
          )}
        >
          <Shield className={cn("h-4 w-4", theme ? theme.iconColor : "text-muted-foreground")} />
        </div>
        <div className={cn("flex-1 min-w-0 space-y-1.5", selectable && "pr-20")}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                {s.deliveryType === "questionnaire" && (
                  <Badge variant="outline" className="text-xs gap-1 bg-primary/10 text-primary border-primary/30">
                    <ClipboardList className="h-3 w-3" />
                    Spørreskjema
                  </Badge>
                )}
                {(s.price != null || s.priceNote) && (
                  <Badge variant="outline" className="text-xs gap-1 bg-success/5 text-success border-success/30">
                    <Tag className="h-3 w-3" />
                    {formatServicePrice(s)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.deliveryType === "questionnaire" && s.questionnaireId ? (
                  <>
                    {getQuestionnaire(s.questionnaireId).totalQuestions} spørsmål
                    {s.estimatedMinutes && (
                      <> · <Clock className="h-3 w-3 inline-block -mt-0.5" /> ca. {s.estimatedMinutes} min</>
                    )}
                  </>
                ) : (
                  <>
                    {s.defaultChecklist.length} leveransepunkter
                    {totalControls > 0 && <> · {totalControls} kontrollpunkter</>}
                  </>
                )}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground leading-snug">{s.description}</p>
          <ServiceEvidenceSection
            mappings={s.frameworkMappings}
            onConnect={onEdit}
            compact
          />

          {/* Action-rad: synlighet + rediger (+ fjern i suggestion-mode) */}
          <div className="flex items-center gap-1 pt-1">
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
                onCheckedChange={onTogglePublished}
              />
              <span className="text-xs text-muted-foreground">
                {s.publishedToCustomers ? "Synlig" : "Skjult"}
              </span>
            </label>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={onEdit}
              title="Rediger tjeneste"
            >
              <Pencil className="h-3.5 w-3.5" />
              Rediger
            </Button>
            {selectable?.onRemove && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive ml-auto"
                onClick={selectable.onRemove}
                title="Fjern forslag"
              >
                <X className="h-3.5 w-3.5" />
                Fjern
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
