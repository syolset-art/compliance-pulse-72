import { useNavigate } from "react-router-dom";
import { Bot, ArrowRight, Users, Sparkles, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { getRequirementDataSource } from "@/lib/requirementDataSourceMap";

interface LaraDataSourceExplainerProps {
  requirement: ComplianceRequirement;
  status: "not_met" | "partial" | "met";
  onManualDocument: () => void;
}

export function LaraDataSourceExplainer({
  requirement,
  status,
  onManualDocument,
}: LaraDataSourceExplainerProps) {
  const navigate = useNavigate();
  const source = getRequirementDataSource(requirement);
  const capability = requirement.agent_capability;

  // Header-tekst tilpasset capability og status
  const heading =
    capability === "manual"
      ? "Krever manuell dokumentasjon"
      : status === "partial"
        ? "Lara har delvis data — dette gjenstår"
        : "Hvorfor mangler Lara data?";

  // Velg ikon basert på capability
  const Icon =
    capability === "manual" ? Users : capability === "assisted" ? Sparkles : Bot;

  // Bygg forklaringstekst
  let explanation: string;
  if (capability === "manual") {
    explanation =
      "Dette kravet kan ikke hentes automatisk. Det krever et signert dokument, en styrebeslutning eller en bekreftelse fra en person.";
  } else if (capability === "assisted") {
    explanation = source
      ? `Lara kan forberede et utkast basert på dataene i ${source.module}, men trenger din godkjenning før det regnes som oppfylt.`
      : "Lara kan forberede et utkast, men trenger din godkjenning før kravet regnes som oppfylt.";
  } else {
    // full / auto
    explanation = source
      ? source.whyMissing
      : "Lara har ikke funnet en automatisk datakilde for dette kravet ennå.";
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{heading}</p>
          {source && capability !== "manual" && (
            <p className="text-xs text-muted-foreground">
              Lara henter dette fra:{" "}
              <span className="font-medium text-foreground">{source.module}</span>
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed pl-11">
        {explanation}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 pl-11">
        {/* Primær CTA — gå til datakilden hvis mulig */}
        {source && capability !== "manual" && (
          <Button
            size="sm"
            className="gap-1.5 rounded-pill"
            onClick={() => navigate(source.route)}
          >
            {source.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Sekundær CTA — dokumenter manuelt */}
        <Button
          size="sm"
          variant={capability === "manual" ? "default" : "outline"}
          className="gap-1.5 rounded-pill"
          onClick={onManualDocument}
        >
          {capability === "manual" ? (
            <>
              <FileQuestion className="h-3.5 w-3.5" />
              Last opp dokument
            </>
          ) : (
            <>
              <Users className="h-3.5 w-3.5" />
              Dokumenter manuelt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
