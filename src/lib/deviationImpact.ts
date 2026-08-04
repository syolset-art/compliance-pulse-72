// Avvik som signal — mapping fra avvik til berørte krav og kontrollområder.
// Grunnlag: Styrende dokumenter, «Mynder Score Model (v1)» R5 og playbooken
// «Avvik som signal» (04.08.2026). Et åpent avvik setter berørte krav til null
// så lenge det står åpent. Dokumentasjonen slettes ikke.

import type { ControlAreaKey } from "./controlAreas";

export type DeviationSource = "manual" | "vendor_self" | "agent" | "7security";

export interface RequirementImpactSuggestion {
  requirement_id: string;
  requirement_label: string;
  framework_id: string;
  control_area: ControlAreaKey;
}

export const DEVIATION_SOURCE_LABELS: Record<string, { nb: string; en: string }> = {
  manual: { nb: "Registrert av oss", en: "Registered by us" },
  vendor_self: { nb: "Meldt av leverandøren", en: "Reported by vendor" },
  agent: { nb: "Oppdaget av agent", en: "Detected by agent" },
  "7security": { nb: "Oppdaget av agent", en: "Detected by agent" },
};

export function deviationSourceLabel(source: string | null | undefined, isNb: boolean): string {
  const entry = DEVIATION_SOURCE_LABELS[source || "manual"] ?? DEVIATION_SOURCE_LABELS.manual;
  return isNb ? entry.nb : entry.en;
}

/** Kilder som krever at et menneske bekrefter før krav settes til null. */
export function requiresConfirmation(source: string | null | undefined): boolean {
  return source === "agent" || source === "7security" || source === "vendor_self";
}

const CATEGORY_IMPACTS: Record<string, RequirementImpactSuggestion[]> = {
  datainnbrudd: [
    { requirement_id: "sup_2", requirement_label: "Databehandleravtale er på plass og etterleves", framework_id: "GDPR", control_area: "vendor" },
    { requirement_id: "prv_4", requirement_label: "Oppbevaring og sletting av persondata", framework_id: "GDPR", control_area: "privacy" },
    { requirement_id: "ops_3", requirement_label: "Hendelseshåndtering fungerer i praksis", framework_id: "ISO27001", control_area: "operations" },
  ],
  tilgangskontroll: [
    { requirement_id: "iam_1", requirement_label: "Tilgangskontrollpolicy etterleves", framework_id: "ISO27001", control_area: "identityAccess" },
    { requirement_id: "iam_4", requirement_label: "Tilgangsgjennomgang gjennomføres", framework_id: "ISO27001", control_area: "identityAccess" },
    { requirement_id: "sup_3", requirement_label: "Leverandørrisikovurdering er oppdatert", framework_id: "NIS2", control_area: "vendor" },
  ],
  "hendelseshåndtering": [
    { requirement_id: "ops_3", requirement_label: "Hendelseshåndtering fungerer i praksis", framework_id: "NIS2", control_area: "operations" },
    { requirement_id: "sup_4", requirement_label: "Oppfølging av underleverandører", framework_id: "NIS2", control_area: "vendor" },
  ],
  prosess_og_rutiner: [
    { requirement_id: "gov_2", requirement_label: "Risikostyringsprosess følges", framework_id: "ISO27001", control_area: "governance" },
    { requirement_id: "ops_4", requirement_label: "Endringshåndtering følges", framework_id: "ISO27001", control_area: "operations" },
  ],
  personvern: [
    { requirement_id: "prv_2", requirement_label: "Behandlingsprotokollen er korrekt", framework_id: "GDPR", control_area: "privacy" },
    { requirement_id: "sup_2", requirement_label: "Databehandleravtale er på plass og etterleves", framework_id: "GDPR", control_area: "vendor" },
  ],
  ai_avvik: [
    { requirement_id: "gov_1", requirement_label: "Retningslinjer for bruk av AI", framework_id: "EU AI Act", control_area: "governance" },
    { requirement_id: "sup_3", requirement_label: "Leverandørrisikovurdering er oppdatert", framework_id: "EU AI Act", control_area: "vendor" },
  ],
  sikkerhet: [
    { requirement_id: "ops_2", requirement_label: "Backup- og gjenopprettingsrutiner", framework_id: "ISO27001", control_area: "operations" },
    { requirement_id: "sup_3", requirement_label: "Leverandørrisikovurdering er oppdatert", framework_id: "ISO27001", control_area: "vendor" },
  ],
};

const FALLBACK_IMPACTS: RequirementImpactSuggestion[] = [
  { requirement_id: "sup_1", requirement_label: "Leverandøroversikt er oppdatert", framework_id: "ISO27001", control_area: "vendor" },
  { requirement_id: "sup_3", requirement_label: "Leverandørrisikovurdering er oppdatert", framework_id: "ISO27001", control_area: "vendor" },
];

/**
 * Foreslår hvilke krav et leverandøravvik bryter forutsetningen for.
 * Forslaget må alltid bekreftes av et menneske før krav settes til null.
 */
export function suggestRequirementImpacts(
  category: string | null | undefined,
  severity?: string | null,
): RequirementImpactSuggestion[] {
  const base = (category && CATEGORY_IMPACTS[category]) || FALLBACK_IMPACTS;
  if (severity === "critical") {
    const extra: RequirementImpactSuggestion = {
      requirement_id: "gov_3",
      requirement_label: "Ledelsen er informert om alvorlige hendelser",
      framework_id: "ISO27001",
      control_area: "governance",
    };
    if (!base.some((b) => b.requirement_id === extra.requirement_id)) {
      return [...base, extra];
    }
  }
  return base;
}

/** Tiltak som genereres til navngitt ansvarlig når avviket registreres. */
export function suggestedMeasuresForDeviation(title: string, category?: string | null): string[] {
  const measures = [
    `Kartlegg omfang og berørte data for «${title}»`,
    "Innhent bekreftelse og dokumentasjon fra leverandøren",
    "Vurder om kravene kan gjenopprettes, og lukk avviket med begrunnelse",
  ];
  if (category === "datainnbrudd" || category === "personvern") {
    measures.splice(1, 0, "Vurder meldeplikt til Datatilsynet innen 72 timer");
  }
  return measures;
}
