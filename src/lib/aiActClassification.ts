/**
 * Forklarbar klassifisering av KI-agenter mot EU AI Act og ISO/IEC 42001.
 *
 * Prototype: klassifiseringen regnes ut i frontend av det som allerede er
 * kartlagt (prosess, persondata, risikokategori, mandat, kontrollpunkter).
 * Den skal ALLTID vises sammen med begrunnelsen, og er et utkast som må
 * bekreftes av et menneske.
 */

export type AiActRisk = "unacceptable" | "high" | "limited" | "minimal";

export const aiActRiskLabel = (r: AiActRisk): string => {
  switch (r) {
    case "unacceptable": return "Uakseptabel risiko";
    case "high": return "Høy risiko";
    case "limited": return "Begrenset risiko";
    default: return "Minimal risiko";
  }
};

export const aiActRiskClass = (r: AiActRisk): string => {
  switch (r) {
    case "unacceptable": return "bg-destructive/15 text-destructive border-destructive/30";
    case "high": return "bg-destructive/10 text-destructive border-destructive/25";
    case "limited": return "bg-warning/15 text-warning border-warning/30";
    default: return "bg-success/15 text-success border-success/30";
  }
};

export interface AiActInput {
  /** Agenten er satt i arbeid (ikke bare foreslått). */
  established: boolean;
  /** Prosessen(e) agenten jobber i behandler personopplysninger. */
  hasPersonalData: boolean;
  /** Kartlagt risikokategori fra process_ai_usage. */
  riskCategory?: string | null;
  /** Agenten kan utføre handlinger selv uten godkjenning. */
  autonomous: boolean;
}

export interface AiActResult {
  risk: AiActRisk;
  rationale: string;
}

export function classifyAiAct(input: AiActInput): AiActResult {
  const cat = (input.riskCategory || "").toLowerCase();
  if (cat.includes("unacceptable") || cat.includes("uakseptabel")) {
    return {
      risk: "unacceptable",
      rationale: "Kartleggingen har satt risikokategori «uakseptabel». Bruken må stanses eller endres.",
    };
  }
  if (cat.includes("high") || cat.includes("høy")) {
    return {
      risk: "high",
      rationale: "Kartleggingen har satt høy risikokategori på prosessen agenten jobber i.",
    };
  }
  if (input.hasPersonalData && input.autonomous) {
    return {
      risk: "high",
      rationale: "Agenten behandler personopplysninger og kan utføre handlinger selv. Krever menneskelig kontroll og logging.",
    };
  }
  if (input.hasPersonalData) {
    return {
      risk: "limited",
      rationale: "Agenten behandler personopplysninger, men handlinger krever godkjenning fra et menneske.",
    };
  }
  if (input.autonomous) {
    return {
      risk: "limited",
      rationale: "Agenten utfører handlinger selv, men uten personopplysninger i prosessen.",
    };
  }
  return {
    risk: "minimal",
    rationale: input.established
      ? "Ingen personopplysninger kartlagt, og agenten støtter mennesket uten å handle selv."
      : "Agenten er foreslått og ikke satt i arbeid ennå.",
  };
}

/** Åpenhet, menneskelig kontroll og logging – AI Act-pliktene vi kan si noe om. */
export interface AiActDutyCheck {
  key: "transparency" | "human_oversight" | "logging";
  label: string;
  ok: boolean;
  detail: string;
}

export function aiActDuties(opts: {
  established: boolean;
  hasMandate: boolean;
  requiresApproval: boolean;
  hasLogging: boolean;
}): AiActDutyCheck[] {
  return [
    {
      key: "transparency",
      label: "Åpenhet om at KI brukes",
      ok: opts.established,
      detail: opts.established
        ? "Agenten er registrert i KI-registeret og synlig for de som jobber i prosessen."
        : "Agenten er foreslått og ikke registrert i drift ennå.",
    },
    {
      key: "human_oversight",
      label: "Menneskelig kontroll",
      ok: opts.requiresApproval || opts.hasMandate,
      detail: opts.requiresApproval
        ? "Handlinger krever godkjenning fra et menneske."
        : opts.hasMandate
          ? "Mandat er definert, men det er ikke satt krav om godkjenning."
          : "Verken mandat eller kontrollpunkt er definert.",
    },
    {
      key: "logging",
      label: "Logging av hva agenten gjør",
      ok: opts.hasLogging,
      detail: opts.hasLogging
        ? "Aktivitet logges i aktivitetsloggen."
        : "Logging er ikke bekreftet for denne agenten.",
    },
  ];
}

/** ISO/IEC 42001 – kravområdene vi kan dekke fra dagens kartlegging. */
export interface Iso42001Area {
  key: string;
  clause: string;
  label: string;
  description: string;
}

export const ISO_42001_AREAS: Iso42001Area[] = [
  { key: "context", clause: "4", label: "Kontekst og roller", description: "Arbeidsområde, prosess og ansvarlig er kartlagt." },
  { key: "policy", clause: "5", label: "Mål og policy", description: "Policyer er valgt for agenten." },
  { key: "risk", clause: "6", label: "Risikovurdering", description: "Risiko og AI Act-kategori er vurdert." },
  { key: "resources", clause: "7", label: "Ressurser og data", description: "Systemer og datagrunnlag agenten bruker er beskrevet." },
  { key: "operation", clause: "8", label: "Drift og kontrollpunkter", description: "Mandat og hva som krever godkjenning er definert." },
  { key: "monitoring", clause: "9", label: "Overvåking og logging", description: "Aktivitet logges og kan følges opp." },
  { key: "improvement", clause: "10", label: "Forbedring", description: "Vurderingen er bekreftet av et menneske og holdes oppdatert." },
];

export interface Iso42001Coverage {
  key: string;
  covered: boolean;
  note: string;
}

export function iso42001Coverage(opts: {
  hasWorkArea: boolean;
  hasOwner: boolean;
  hasPolicies: boolean;
  riskAssessed: boolean;
  hasSystems: boolean;
  hasMandate: boolean;
  hasLogging: boolean;
  humanConfirmed: boolean;
}): Iso42001Coverage[] {
  return [
    { key: "context", covered: opts.hasWorkArea, note: opts.hasWorkArea ? "Koblet til arbeidsområde og prosess." : "Mangler kobling til prosess/arbeidsområde." },
    { key: "policy", covered: opts.hasPolicies, note: opts.hasPolicies ? "Policyer er valgt." : "Ingen policyer valgt for agenten." },
    { key: "risk", covered: opts.riskAssessed, note: opts.riskAssessed ? "Risiko er vurdert i kartleggingen." : "Risikokategori er ikke satt på prosessen." },
    { key: "resources", covered: opts.hasSystems, note: opts.hasSystems ? "Systemer/data er beskrevet." : "Datagrunnlaget er ikke beskrevet." },
    { key: "operation", covered: opts.hasMandate, note: opts.hasMandate ? "Mandat og godkjenningskrav er definert." : "Mandat mangler." },
    { key: "monitoring", covered: opts.hasLogging, note: opts.hasLogging ? "Logging er på." : "Logging er ikke bekreftet." },
    { key: "improvement", covered: opts.humanConfirmed, note: opts.humanConfirmed ? "Bekreftet av et menneske." : "Forslag som ikke er bekreftet av et menneske." },
  ];
}
