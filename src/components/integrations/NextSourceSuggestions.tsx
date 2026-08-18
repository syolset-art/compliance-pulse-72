import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import type { DiscoveryType } from "@/lib/integrationCatalog";

interface NextSourceSuggestionsProps {
  /** Hvilke typer kilden(e) som allerede er tilkoblet dekker. */
  covered: DiscoveryType[];
}

const SUGGESTIONS: Record<DiscoveryType, string> = {
  documents:
    "Ingen dokumentkilde tilkoblet — Sara, Notion eller Microsoft 365 dekker dokumentasjonskrav.",
  systems:
    "Ingen systemkilde tilkoblet — Entra ID, Microsoft 365 eller Intune gir Lara systemregisteret.",
  vendors:
    "Ingen leverandørkilde tilkoblet — Tripletex, Fiken eller Xero avdekker leverandørene dine.",
  users:
    "Ingen kilde for personer og tilganger — Entra ID, Okta eller Google Workspace dekker dette.",
};

const ORDER: DiscoveryType[] = ["documents", "systems", "vendors", "users"];

/** Neste steg fra Lara: hvilke kildetyper som mangler for automatisk kravdekning. */
export function NextSourceSuggestions({ covered }: NextSourceSuggestionsProps) {
  const missing = ORDER.filter((t) => !covered.includes(t));
  if (missing.length === 0) return null;

  return (
    <Card className="mt-8 border-primary/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Neste steg fra Lara</p>
          <ul className="mt-1.5 space-y-1">
            {missing.map((t) => (
              <li key={t} className="text-[13px] text-muted-foreground">
                • {SUGGESTIONS[t]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
