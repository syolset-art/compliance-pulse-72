import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { Check } from "lucide-react";
import { SaraActivityLogDialog } from "@/components/agents/SaraActivityLogDialog";
import { SaraSignalList } from "./SaraSignalList";
import { VendorAccessTab } from "@/components/asset-profile/tabs/VendorAccessTab";
import type { SaraVendorMapping } from "@/lib/saraVendorMapping";
import { USAGE_TAGS } from "@/lib/vendorContextSuggestion";
import { cn } from "@/lib/utils";

export interface SaraContextField {
  key: string;
  label: string;
  /** Nåværende lagret verdi (kan være null når ingenting er satt) */
  value: string | null | undefined;
  /** Laras utledede forslag */
  suggested: string;
  options: { value: string; label: string }[];
  /** True når brukeren har bekreftet/overstyrt feltet */
  overridden: boolean;
  /** Navn på mennesket som bekreftet verdien */
  approvedBy?: string | null;
  /** Dato (formatert) for bekreftelsen */
  approvedAt?: string | null;
  /** Godkjenn Laras forslag som det er */
  onApprove?: () => void;
  onChange: (value: string) => void;
}

interface Props {
  isNb: boolean;
  assetId: string;
  assetName: string;
  mapping: SaraVendorMapping;
  fields: SaraContextField[];
  purpose: string;
  tags: string[];
  onSavePurpose: (value: string) => void;
  onToggleTag: (value: string) => void;
}

/** Alternativ visning av "Bruk og kontekst" når alt er kartlagt av den lokale agenten Sara. */
export const SaraMappedContextView = ({
  isNb, assetId, assetName, mapping, fields, purpose, tags, onSavePurpose, onToggleTag,
}: Props) => {
  const [logOpen, setLogOpen] = useState(false);
  const [draft, setDraft] = useState(purpose || (isNb ? mapping.usageTextNb : mapping.usageTextEn));

  const labelOf = (f: SaraContextField, value: string) =>
    f.options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="space-y-4">
      {/* Status-stripe */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-3">
          <SaraIcon size={20} />
          <span className="text-[13px] font-medium text-foreground">
            {isNb ? "Kartlagt automatisk av Sara" : "Mapped automatically by Sara"}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {mapping.source} · {isNb ? "lokalt" : "local"} · v{mapping.agentVersion} ·{" "}
            {isNb ? "sist kjørt" : "last run"} {isNb ? mapping.lastRunNb : mapping.lastRunEn} ·{" "}
            {mapping.signals.length} {isNb ? "signaler" : "signals"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-[12px] text-primary"
            onClick={() => setLogOpen(true)}
          >
            {isNb ? "Se aktivitetslogg" : "View activity log"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* Kontekst (auto) */}
        <Card className="h-full">
          <CardContent className="space-y-3 p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-fit cursor-help items-center gap-1.5">
                  <LaraIcon size={14} />
                  <p className="text-[13px] font-medium text-foreground">
                    {isNb ? "Kontekst utledet av Lara" : "Context derived by Lara"}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-[12px]">
                {isNb
                  ? "Sara samler signaler lokalt hos deg. Lara tolker signalene og foreslår kritikalitet, prioritet, GDPR-rolle og risikonivå. Ingenting er gyldig før et menneske godkjenner – da logges navn og dato."
                  : "Sara collects signals locally in your environment. Lara interprets them and suggests criticality, priority, GDPR role and risk level. Nothing counts until a human approves – name and date are then logged."}
              </TooltipContent>
            </Tooltip>

            {fields.map((f) => {
              const current = f.value || f.suggested;
              return (
                <div key={f.key} className="space-y-1">
                  <span className="text-[12px] text-muted-foreground">{f.label}</span>
                  <div className="flex items-center gap-1.5">
                    <Select value={current} onValueChange={f.onChange}>
                      <SelectTrigger className="h-8 flex-1 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-[13px]">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!f.overridden && f.onApprove && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 px-2 text-[12px]"
                        onClick={f.onApprove}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        {isNb ? "Godkjenn" : "Approve"}
                      </Button>
                    )}
                  </div>
                  {f.overridden && f.approvedBy ? (
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Check className="h-3 w-3 text-success" />
                      {isNb ? "Bekreftet av" : "Confirmed by"} {f.approvedBy}
                      {f.approvedAt ? ` · ${f.approvedAt}` : ""}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {isNb
                        ? `Laras forslag: ${labelOf(f, f.suggested)} — utledet av ${mapping.signals.length} signaler`
                        : `Lara's suggestion: ${labelOf(f, f.suggested)} — derived from ${mapping.signals.length} signals`}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Bruk (auto) */}
        <Card className="h-full">
          <CardContent className="space-y-2.5 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">
                {isNb ? "Hva brukes leverandøren til?" : "What is this vendor used for?"}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="h-4 cursor-help gap-1 border-primary/30 px-1.5 text-[11px] text-primary"
                  >
                    <LaraIcon size={10} />
                    {isNb ? "Foreslått av Lara" : "Suggested by Lara"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px] text-[12px]">
                  {isNb
                    ? `Lara har foreslått bruksområder og beskrivelse basert på ${mapping.signals.length} signaler Sara fant lokalt i ${mapping.source}. Du kan endre alt fritt – teksten lagres først når du redigerer den.`
                    : `Lara suggested the usage tags and description from ${mapping.signals.length} signals Sara found locally in ${mapping.source}. You can change everything – the text is saved when you edit it.`}
                </TooltipContent>
              </Tooltip>
            </div>


            <div className="flex flex-wrap gap-1">
              {USAGE_TAGS.map((t) => {
                const active = tags.includes(t.value) || (!tags.length && mapping.usageTags.includes(t.value));
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => onToggleTag(t.value)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[12px] transition-colors",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {isNb ? t.labelNb : t.labelEn}
                  </button>
                );
              })}
            </div>

            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { if (draft !== purpose) onSavePurpose(draft); }}
              rows={3}
              className="min-h-[72px] text-[13px]"
            />
            <p className="text-[11px] text-muted-foreground">
              {isNb
                ? "Sammenstilt fra metadata Sara rapporterte. Du kan alltid endre teksten."
                : "Compiled from metadata Sara reported. You can always edit the text."}
            </p>
          </CardContent>
        </Card>
      </div>

      <SaraSignalList isNb={isNb} signals={mapping.signals} />
      <details className="rounded-xl border border-border bg-card/50 p-4 group">
        <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between">
          <span>{isNb ? 'Tilgang og roller' : 'Access & roles'}</span>
          <span className="text-xs text-muted-foreground font-normal">{isNb ? 'Valgfritt' : 'Optional'}</span>
        </summary>
        <div className="mt-4">
          <VendorAccessTab assetId={assetId} assetName={assetName} />
        </div>
      </details>
      <SaraActivityLogDialog open={logOpen} onOpenChange={setLogOpen} isNb={isNb} />
    </div>
  );
};
