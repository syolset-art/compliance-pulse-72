import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plug, Sparkles, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConnectedSources } from "@/hooks/useConnectedSources";

interface ConnectSourcesCalloutProps {
  /** Kort kontekst-tekst: hva Lara ville hentet her */
  context?: string;
  /** Sekundær handling: legg til manuelt */
  onManual?: () => void;
  manualLabel?: string;
  /** Vis også når kunden allerede har en aktiv kilde */
  alwaysShow?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

/**
 * Gjenbrukbar inngang til «koble på deg selv» — brukes i tomtilstander,
 * på dashbordet og der bevis mangler. Peker alltid til Innstillinger > Integrasjoner.
 */
export function ConnectSourcesCallout({
  context,
  onManual,
  manualLabel,
  alwaysShow = false,
  variant = "card",
  className = "",
}: ConnectSourcesCalloutProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { hasConnectedSource } = useConnectedSources();

  if (hasConnectedSource && !alwaysShow) return null;

  const title = isNb ? "Slipp Lara til kildene dine" : "Give Lara access to your sources";
  const body =
    context ??
    (isNb
      ? "Koble til for eksempel Acronis, Microsoft 365 eller Notion, så kartlegger Lara automatisk."
      : "Connect sources like Acronis, Microsoft 365 or Notion and Lara maps everything automatically.");

  const guarantees = isNb
    ? [
        "Kun lesetilgang",
        "Ingenting legges til registeret uten din godkjenning",
        "Du kan trekke tilgangen når som helst",
      ]
    : [
        "Read-only access",
        "Nothing is added to the register without your approval",
        "You can revoke access at any time",
      ];

  const connectButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" onClick={() => navigate("/settings/integrations")} className="gap-1.5">
            <Plug className="h-3.5 w-3.5" />
            {isNb ? "Koble til kilde" : "Connect a source"}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <ul className="space-y-0.5 text-xs">
            {guarantees.map((g) => (
              <li key={g}>• {g}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">{body}</span>
        <button
          type="button"
          onClick={() => navigate("/settings/integrations")}
          className="text-primary hover:underline font-medium"
        >
          {isNb ? "Koble til kilde" : "Connect a source"}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-left ${className}`}
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Sparkles className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {connectButton}
        {onManual && (
          <Button size="sm" variant="outline" onClick={onManual} className="gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            {manualLabel ?? (isNb ? "Legg til manuelt" : "Add manually")}
          </Button>
        )}
      </div>
    </div>
  );
}
