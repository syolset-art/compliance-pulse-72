/**
 * Gjør manglende dokumentasjon om til prissatte leveranser partneren kan tjene på.
 *
 * Kilde til dokumentnavn: `requirementDocumentationHints.ts` via
 * `getDocumentStatus()` i `maturityNextActions.ts`.
 *
 * Rene funksjoner — ingen UI, ingen persistens.
 */

export type DeliverableKind = "ai-draft" | "advisory" | "technical";

export interface DeliverableProfile {
  kind: DeliverableKind;
  /** Estimerte timer for partneren. */
  hours: { min: number; max: number };
  /** Kan Lara lage et førsteutkast? */
  laraDraft: boolean;
  /** Kort begrunnelse vist i UI. */
  note: string;
}

interface Rule {
  match: RegExp;
  profile: DeliverableProfile;
}

const ADVISORY = (min: number, max: number, note: string, laraDraft = true): DeliverableProfile => ({
  kind: "advisory",
  hours: { min, max },
  laraDraft,
  note,
});

const RULES: Rule[] = [
  {
    match: /protokoll|ropa|behandlingsaktivitet/i,
    profile: ADVISORY(4, 8, "Kartlegging av behandlinger + utfylt protokoll."),
  },
  {
    match: /databehandleravtale|dpa|underleverand/i,
    profile: ADVISORY(2, 4, "Avtaleutkast basert på kundens systemer og leverandører."),
  },
  {
    match: /personvernerkl|informasjonsskriv/i,
    profile: ADVISORY(2, 4, "Publiseringsklar tekst tilpasset kundens tjenester."),
  },
  {
    match: /dpia|konsekvensvurdering|tia|transfer impact/i,
    profile: ADVISORY(6, 12, "Strukturert vurdering med risikoer og tiltak."),
  },
  {
    match: /risikovurdering|risiko/i,
    profile: ADVISORY(6, 12, "Risikoworkshop med kunden + dokumentert vurdering."),
  },
  {
    match: /policy|styrende|retningslinj|rammeverk/i,
    profile: ADVISORY(3, 6, "Policyutkast tilpasset bransje og størrelse."),
  },
  {
    match: /rutine|prosedyre|prosess for|rutinebeskrivelse/i,
    profile: ADVISORY(2, 5, "Rutinebeskrivelse med roller og frister."),
  },
  {
    match: /beredskap|varsling|avviksmelding|hendelse/i,
    profile: ADVISORY(4, 8, "Beredskaps- og varslingsplan med rollekart."),
  },
  {
    match: /gap-analyse|aktsomhetsvurdering|redegj|kartlegging/i,
    profile: ADVISORY(6, 14, "Analysearbeid med rapport og tiltaksplan."),
  },
  {
    match: /opplæring|kurs|kompetanse|phishing/i,
    profile: {
      kind: "technical",
      hours: { min: 4, max: 10 },
      laraDraft: false,
      note: "Gjennomføring av opplæring + dokumentert deltakelse.",
    },
  },
  {
    match: /pentest|penetrasjon|sårbarhet|testrapport/i,
    profile: {
      kind: "technical",
      hours: { min: 12, max: 30 },
      laraDraft: false,
      note: "Teknisk test utført av partner. Rapporten er beviset.",
    },
  },
  {
    match: /backup|gjenoppretting|konfigurasjon|edr|antivirus|siem|soc|overvåking|patch|adgangskontroll/i,
    profile: {
      kind: "technical",
      hours: { min: 6, max: 16 },
      laraDraft: false,
      note: "Teknisk arbeid som dokumenteres i etterkant.",
    },
  },
  {
    match: /avtale|klausul|kontrakt|scc|standard personvernbestemmelser|exit/i,
    profile: ADVISORY(2, 5, "Avtaletekst og klausuler tilpasset kunden."),
  },
  {
    match: /oversikt|register|logg|dekningsrapport|oppnevnelse|mandat|styrevedtak|godkjenning/i,
    profile: ADVISORY(1, 3, "Struktureres og dokumenteres av partner."),
  },
];

const DEFAULT_PROFILE: DeliverableProfile = ADVISORY(
  2,
  5,
  "Dokumentutkast utarbeidet av partner.",
);

export function getDeliverableProfile(docName: string): DeliverableProfile {
  return RULES.find((r) => r.match.test(docName))?.profile ?? DEFAULT_PROFILE;
}

export interface DocumentDeliverable {
  name: string;
  areaId: string;
  areaTitle: string;
  articleLabel: string;
  profile: DeliverableProfile;
  /** Prisspenn eks. mva, avrundet til nærmeste 100. */
  price: { min: number; max: number };
}

function roundTo(value: number, step = 100): number {
  return Math.round(value / step) * step;
}

export function estimateDocumentPrice(
  docName: string,
  hourlyRate: number,
): { min: number; max: number } {
  const { hours } = getDeliverableProfile(docName);
  return {
    min: roundTo(hours.min * hourlyRate),
    max: roundTo(hours.max * hourlyRate),
  };
}

export interface DocumentRowInput {
  name: string;
  areaId: string;
  areaTitle: string;
  articleLabel: string;
}

export function toDeliverables(
  rows: DocumentRowInput[],
  hourlyRate: number,
): DocumentDeliverable[] {
  return rows.map((r) => ({
    ...r,
    profile: getDeliverableProfile(r.name),
    price: estimateDocumentPrice(r.name, hourlyRate),
  }));
}

export interface PotentialSummary {
  count: number;
  hours: { min: number; max: number };
  price: { min: number; max: number };
}

export function summarizePotential(items: DocumentDeliverable[]): PotentialSummary {
  return items.reduce<PotentialSummary>(
    (acc, d) => ({
      count: acc.count + 1,
      hours: {
        min: acc.hours.min + d.profile.hours.min,
        max: acc.hours.max + d.profile.hours.max,
      },
      price: { min: acc.price.min + d.price.min, max: acc.price.max + d.price.max },
    }),
    { count: 0, hours: { min: 0, max: 0 }, price: { min: 0, max: 0 } },
  );
}

/** "4 500–9 000 kr" — eks. mva, formatert med partnerens valuta. */
export function formatPriceRange(
  range: { min: number; max: number },
  currency: string,
): string {
  const fmt = (n: number) => n.toLocaleString("nb-NO");
  const symbol = currency === "NOK" || currency === "SEK" || currency === "DKK" ? "kr" : currency;
  if (range.min === range.max) return `${fmt(range.min)} ${symbol}`;
  return `${fmt(range.min)}–${fmt(range.max)} ${symbol}`;
}

export function formatHours(hours: { min: number; max: number }): string {
  return hours.min === hours.max ? `${hours.min} t` : `${hours.min}–${hours.max} t`;
}

export const DELIVERABLE_KIND_LABEL: Record<DeliverableKind, string> = {
  "ai-draft": "AI-utkast",
  advisory: "Rådgivning",
  technical: "Teknisk leveranse",
};
