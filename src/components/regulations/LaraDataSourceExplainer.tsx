import { Bot, Users, Sparkles, FileQuestion, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentType } from "react";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { getRequirementDataSource } from "@/lib/requirementDataSourceMap";

export interface LaraCrossReferenceDoc {
  name: string;
  sourceRequirementName: string;
  uploadedBy: string;
  uploadedAt: string;
  classification?: string;
  coversRequirements?: string[];
  onAccept: () => void;
}

interface LaraDataSourceExplainerProps {
  requirement: ComplianceRequirement;
  status: "not_met" | "partial" | "met";
  onManualDocument: () => void;
  crossReferenceDoc?: LaraCrossReferenceDoc;
}

export function LaraDataSourceExplainer({
  requirement,
  status,
  onManualDocument,
  crossReferenceDoc,
}: LaraDataSourceExplainerProps) {
  const source = getRequirementDataSource(requirement);
  const capability = requirement.agent_capability;

  // Header-tekst tilpasset capability og status
  const heading =
    capability === "manual"
      ? "Krever manuell dokumentasjon"
      : status === "partial"
        ? "Lara har delvis data — dette gjenstår"
        : "Dokument oppdaget";

  // Velg ikon basert på capability
  const Icon =
    capability === "manual" ? Users : capability === "assisted" ? Sparkles : Bot;

  // Bygg forklaringstekst
  let explanation: string;
  if (capability === "manual") {
    explanation =
      "Dette kravet kan ikke hentes automatisk. Det krever et signert dokument, en styrebeslutning eller en bekreftelse fra en person.";
  } else if (capability === "assisted") {
    explanation = crossReferenceDoc 
      ? "Dekker Prosedyrer for registrertes rettigheter, Overføringskonsekven"
      : source
        ? `Lara kan forberede et utkast basert på dataene i ${source.module}, men trenger din godkjenning før det regnes som oppfylt.`
        : "Lara kan forberede et utkast, men trenger din godkjenning før kravet regnes som oppfylt.";
  } else {
    // full / auto
    explanation = source
      ? source.whyMissing
      : "Lara har ikke funnet en automatisk datakilde for dette kravet ennå.";
  }


  return (
    <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 space-y-2">
      <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs font-medium text-foreground">{heading}</p>
          {source && capability !== "manual" && (
            <p className="text-[11px] text-muted-foreground">
              Lara henter dette fra:{" "}
              <span className="font-medium text-foreground">{source.module}</span>
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-snug pl-5">
        {explanation}
      </p>

      {crossReferenceDoc && (
        <div className="ml-5 flex items-center gap-1.5 text-[11px] min-w-0">
          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1 truncate text-muted-foreground">
            <span className="font-medium text-foreground">{crossReferenceDoc.name}</span>
            {crossReferenceDoc.classification && (
              <>
                <span className="px-1">·</span>
                <span>{crossReferenceDoc.classification}</span>
              </>
            )}
            <span className="px-1">·</span>
            <span>
              {crossReferenceDoc.coversRequirements && crossReferenceDoc.coversRequirements.length > 0 ? (
                <>{crossReferenceDoc.coversRequirements.slice(0, 2).join(", ")}{crossReferenceDoc.coversRequirements.length > 2 && ` +${crossReferenceDoc.coversRequirements.length - 2} til`}</>
              ) : (
                <>Matcher dokumentasjonskravet</>
              )}
            </span>
            <span className="px-1">·</span>
            <span>
              {crossReferenceDoc.uploadedBy}, {crossReferenceDoc.uploadedAt}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs rounded-pill shrink-0"
            onClick={crossReferenceDoc.onAccept}
          >
            <Check className="h-3.5 w-3.5" />
            Bekreft
          </Button>
        </div>
      )}


      <div className="flex flex-col sm:flex-row gap-2 pl-5">
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
