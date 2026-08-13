// Forventet dokumentasjon per krav i et regelverk + agent-bekreftede bevis.
// Demo/prototype-data: utledes deterministisk fra kravene slik at visningen
// alltid forteller samme historie. Erstattes senere av data fra backend.

import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { toCanonicalArea, type ControlAreaKey } from "@/lib/controlAreas";

export type ExpectedEvidenceStatus = "received" | "agent_confirmed" | "missing";

export interface ExpectedEvidenceRow {
  requirementId: string;
  requirementName: string;
  area: ControlAreaKey;
  /** Kort navn på dokumentet som forventes, f.eks. "Policy / rutine" */
  docLabel: string;
  status: ExpectedEvidenceStatus;
}

const DOC_LABELS: Record<ControlAreaKey | "default", { nb: string; en: string }[]> = {
  governance: [
    { nb: "Policy eller styrende dokument", en: "Policy or governing document" },
    { nb: "Styrevedtak / ledelsesprotokoll", en: "Board decision / management minutes" },
  ],
  operations: [
    { nb: "Rutine eller driftsprosedyre", en: "Procedure or operating routine" },
    { nb: "Logg eller testrapport", en: "Log or test report" },
  ],
  identityAccess: [
    { nb: "Tilgangsoversikt eller kontrollrapport", en: "Access overview or control report" },
    { nb: "Rutine for tilgangsstyring", en: "Access management procedure" },
  ],
  privacy: [
    { nb: "Behandlingsprotokoll eller DPIA", en: "Processing record or DPIA" },
    { nb: "Personvernerklæring", en: "Privacy notice" },
  ],
  vendor: [
    { nb: "Databehandleravtale eller leverandøravtale", en: "Data processing or vendor agreement" },
    { nb: "Leverandørvurdering", en: "Vendor assessment" },
  ],
  default: [{ nb: "Dokumentasjon på gjennomføring", en: "Documentation of implementation" }],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

export function expectedDocLabel(req: ComplianceRequirement, isNb: boolean): string {
  const area = toCanonicalArea(req.sla_category);
  const options = DOC_LABELS[area] ?? DOC_LABELS.default;
  const pick = options[hash(req.requirement_id) % options.length];
  return isNb ? pick.nb : pick.en;
}

/**
 * Krav der kundens agent har signalisert at dokumentet finnes, uten at fil er
 * lastet opp. Deterministisk demo-utvalg blant krav uten dokumenter.
 */
export function agentConfirmedRequirementIds(
  requirements: ComplianceRequirement[],
  hasDocuments: (requirementId: string) => boolean,
): Set<string> {
  const out = new Set<string>();
  requirements.forEach((req) => {
    if (hasDocuments(req.requirement_id)) return;
    if (hash(req.requirement_id) % 3 === 0) out.add(req.requirement_id);
  });
  return out;
}

export function buildExpectedEvidenceRows(
  requirements: ComplianceRequirement[],
  hasDocuments: (requirementId: string) => boolean,
  agentConfirmed: Set<string>,
  isNb: boolean,
): ExpectedEvidenceRow[] {
  return requirements.map((req) => ({
    requirementId: req.requirement_id,
    requirementName: isNb ? req.name_no : req.name_no,
    area: toCanonicalArea(req.sla_category),
    docLabel: expectedDocLabel(req, isNb),
    status: hasDocuments(req.requirement_id)
      ? "received"
      : agentConfirmed.has(req.requirement_id)
        ? "agent_confirmed"
        : "missing",
  }));
}

export function expectedStatusLabel(status: ExpectedEvidenceStatus, isNb: boolean): string {
  if (status === "received") return isNb ? "Mottatt" : "Received";
  if (status === "agent_confirmed") return isNb ? "Bekreftet av agent" : "Confirmed by agent";
  return isNb ? "Mangler" : "Missing";
}
