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
        : "Hvorfor mangler Lara data nå da?";

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

      {crossReferenceDoc && (
        <div className="ml-11 rounded-md border border-primary/30 bg-background p-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground">
              Lara fant et dokument som matcher dokumentasjonskravet for dette kontrollpunktet.
            </p>
          </div>
          <div className="flex items-start gap-2 pl-5">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="text-sm font-medium text-foreground truncate">{crossReferenceDoc.name}</div>
              <div className="text-[11px] text-muted-foreground">
                Lastet opp under <span className="text-foreground/80">{crossReferenceDoc.sourceRequirementName}</span> · {crossReferenceDoc.uploadedBy} · {crossReferenceDoc.uploadedAt}
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {crossReferenceDoc.classification && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                    Klassifisert: {crossReferenceDoc.classification}
                  </span>
                )}
                {crossReferenceDoc.coversRequirements?.slice(0, 3).map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Dekker: {r}
                  </span>
                ))}
                {crossReferenceDoc.coversRequirements && crossReferenceDoc.coversRequirements.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{crossReferenceDoc.coversRequirements.length - 3} til
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pl-5">
            <Button
              size="sm"
              className="gap-1.5 h-7 text-xs rounded-pill"
              onClick={crossReferenceDoc.onAccept}
            >
              <Check className="h-3.5 w-3.5" />
              Bekreft — dokumentet er OK
            </Button>
          </div>
        </div>
      )}


      <div className="flex flex-col sm:flex-row gap-2 pl-11">
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
