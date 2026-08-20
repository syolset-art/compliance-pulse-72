import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { SaraActivityLogDialog } from "@/components/agents/SaraActivityLogDialog";
import { SaraSignalList } from "./SaraSignalList";
import { SaraPrivacyBoundaryCard } from "./SaraPrivacyBoundaryCard";
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
  mapping: SaraVendorMapping;
  fields: SaraContextField[];
  purpose: string;
  tags: string[];
  onSavePurpose: (value: string) => void;
  onToggleTag: (value: string) => void;
}

/** Alternativ visning av "Bruk og kontekst" når alt er kartlagt av den lokale agenten Sara. */
export const SaraMappedContextView = ({
  isNb, mapping, fields, purpose, tags, onSavePurpose, onToggleTag,
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

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* Kontekst (auto) */}
        <Card>
          <CardContent className="space-y-2.5 p-3">
            <p className="text-[13px] font-medium text-foreground">
              {isNb ? "Kontekst utledet av Sara" : "Context derived by Sara"}
            </p>
            {fields.map((f) => {
              const current = f.value || f.suggested;
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-muted-foreground">{f.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-4 gap-1 px-1.5 text-[11px]",
                        f.overridden ? "text-muted-foreground" : "border-primary/30 text-primary"
                      )}
                    >
                      {!f.overridden && <SaraIcon size={10} />}
                      {f.overridden
                        ? isNb ? "Satt av bruker" : "Set by user"
                        : isNb ? "Forslag" : "Suggested"}
                    </Badge>
                  </div>
                  <Select value={current} onValueChange={f.onChange}>
                    <SelectTrigger className="h-8 text-[13px]">
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
                  {!f.overridden && (
                    <p className="text-[11px] text-muted-foreground">
                      {isNb
                        ? `Utledet av ${mapping.signals.length} signaler — foreslått: ${labelOf(f, f.suggested)}`
                        : `Derived from ${mapping.signals.length} signals — suggested: ${labelOf(f, f.suggested)}`}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Bruk (auto) */}
        <Card>
          <CardContent className="space-y-2.5 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">
                {isNb ? "Hva brukes leverandøren til?" : "What is this vendor used for?"}
              </span>
              <Badge variant="outline" className="h-4 gap-1 border-primary/30 px-1.5 text-[11px] text-primary">
                <SaraIcon size={10} />
                {isNb ? "Auto" : "Auto"}
              </Badge>
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
      <SaraPrivacyBoundaryCard isNb={isNb} />

      <SaraActivityLogDialog open={logOpen} onOpenChange={setLogOpen} isNb={isNb} />
    </div>
  );
};
