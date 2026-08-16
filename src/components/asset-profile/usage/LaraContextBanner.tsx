import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VendorContextSuggestion } from "@/lib/vendorContextSuggestion";
import { usageTagLabel } from "@/lib/vendorContextSuggestion";

interface Props {
  isNb: boolean;
  suggestion: VendorContextSuggestion;
  riskLabel: string;
  criticalityLabel: string;
  gdprLabel: string;
  loading?: boolean;
  onAcceptAll: () => void;
}

const sourceLabel = (s: string, isNb: boolean) => {
  switch (s) {
    case "category": return isNb ? "Bransje" : "Industry";
    case "privacyPolicy": return isNb ? "Personvernerklæring" : "Privacy policy";
    case "description": return isNb ? "Beskrivelse" : "Description";
    default: return isNb ? "Bruksformål" : "Purpose";
  }
};

export const LaraContextBanner = ({
  isNb, suggestion, riskLabel, criticalityLabel, gdprLabel, loading, onAcceptAll,
}: Props) => {
  const [open, setOpen] = useState(false);

  const summary = [
    suggestion.usageTags.length
      ? `${isNb ? "Bruk" : "Usage"}: ${suggestion.usageTags.map((t) => usageTagLabel(t, isNb)).join(", ")}`
      : null,
    suggestion.gdprRole ? gdprLabel : null,
    `${isNb ? "Kritikalitet" : "Criticality"} ${criticalityLabel}`,
    `${isNb ? "Risiko" : "Risk"} ${riskLabel}`,
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            {isNb ? "Laras forslag for denne leverandøren" : "Lara's suggestion for this vendor"}
          </p>
          <p className="text-[13px] text-muted-foreground leading-snug">{summary.join(" · ")}</p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {suggestion.sources.map((s) => (
              <Badge key={s} variant="outline" className="text-[11px] font-normal">
                {sourceLabel(s, isNb)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="h-8 gap-1.5 text-[13px]" disabled={loading} onClick={onAcceptAll}>
            <Sparkles className="h-3.5 w-3.5" />
            {isNb ? "Godta alle" : "Accept all"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-[13px]"
            onClick={() => setOpen((v) => !v)}
          >
            {isNb ? "Begrunnelse" : "Reasoning"}
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {open && (
        <ul className="mt-3 space-y-1 border-t border-primary/10 pt-2.5">
          {(isNb ? suggestion.reasonsNb : suggestion.reasonsEn).map((r) => (
            <li key={r} className="text-[13px] text-muted-foreground leading-snug">• {r}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
