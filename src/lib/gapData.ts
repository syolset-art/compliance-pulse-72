/**
 * Felles kilde for gap-analyse-data (demo).
 * Brukes av MSPGapAnalysisDialog og MSPCreateOfferDialog så samme bilde
 * vises i analyse og tilbud, og slik at tilbudet kan fryse et øyeblikksbilde.
 */

export interface GapItem {
  id: string;
  title: string;
  domain: string;
  reference?: string;
  severity: "critical" | "high" | "medium" | "low";
  /** Kontroll-id-er (slik de står i tjenestekatalogen) som dette gapet hører til. */
  relatedControlIds: string[];
}

export interface FrameworkGap {
  framework_id: string;
  framework_name: string;
  score: number;
  total: number;
  fulfilled: number;
  gaps: GapItem[];
}

export const DEMO_GAPS: FrameworkGap[] = [
  {
    framework_id: "nis2",
    framework_name: "NIS2",
    score: 18,
    total: 24,
    fulfilled: 4,
    gaps: [
      { id: "n1", title: "Mangler dokumentert hendelsesrapporteringsrutine til myndigheter", domain: "Hendelseshåndtering", reference: "Artikkel 23", severity: "critical", relatedControlIds: ["Art.23"] },
      { id: "n2", title: "Ingen formell risikoanalyse av nettverk og informasjonssystemer", domain: "Risiko", reference: "Artikkel 21(2)(a)", severity: "critical", relatedControlIds: ["Art.21"] },
      { id: "n3", title: "Ledelsen ikke involvert i cybersikkerhetsbeslutninger", domain: "Styring", reference: "Artikkel 20", severity: "critical", relatedControlIds: ["Art.20"] },
      { id: "n4", title: "Leverandørstyring ikke dokumentert", domain: "Tredjepart", reference: "Artikkel 21(2)(d)", severity: "high", relatedControlIds: ["Art.21"] },
      { id: "n5", title: "Tilgangskontroll og autentisering uten MFA-policy", domain: "Tilgang", reference: "Artikkel 21(2)(j)", severity: "high", relatedControlIds: ["Art.21"] },
      { id: "n6", title: "Kontinuitetsplan og backup-strategi mangler", domain: "Drift", reference: "Artikkel 21(2)(c)", severity: "high", relatedControlIds: ["Art.21"] },
      { id: "n7", title: "Sårbarhetshåndteringsprosess ikke etablert", domain: "Drift", reference: "Artikkel 21(2)(e)", severity: "high", relatedControlIds: ["Art.21"] },
      { id: "n8", title: "Kryptering av data ikke implementert systematisk", domain: "Drift", reference: "Artikkel 21(2)(h)", severity: "medium", relatedControlIds: ["Art.21"] },
      { id: "n9", title: "Awareness-trening ikke gjennomført", domain: "HR", reference: "Artikkel 21(2)(g)", severity: "medium", relatedControlIds: ["Art.21"] },
    ],
  },
  {
    framework_id: "gdpr",
    framework_name: "GDPR",
    score: 42,
    total: 18,
    fulfilled: 8,
    gaps: [
      { id: "g1", title: "Behandlingsprotokoll ikke ferdigstilt", domain: "Dokumentasjon", reference: "Artikkel 30", severity: "critical", relatedControlIds: ["Art.30"] },
      { id: "g2", title: "Databehandleravtaler mangler for 3 leverandører", domain: "Tredjepart", reference: "Artikkel 28", severity: "high", relatedControlIds: ["Art.28"] },
      { id: "g3", title: "Rutine for innsynsbegjæringer", domain: "Rettigheter", reference: "Artikkel 15", severity: "medium", relatedControlIds: ["Art.15"] },
      { id: "g4", title: "DPIA mangler for HR-system", domain: "Risiko", reference: "Artikkel 35", severity: "high", relatedControlIds: ["Art.35"] },
      { id: "g5", title: "Slettingsrutiner ikke implementert", domain: "Drift", reference: "Artikkel 17", severity: "medium", relatedControlIds: ["Art.17", "Art.5"] },
    ],
  },
  {
    framework_id: "iso27001",
    framework_name: "ISO 27001",
    score: 53,
    total: 93,
    fulfilled: 49,
    gaps: [
      { id: "i1", title: "Ledelsens gjennomgang ikke utført siste 12 mnd", domain: "Styring", reference: "Krav 9.3", severity: "high", relatedControlIds: ["A.5.1"] },
      { id: "i2", title: "Risikobehandlingsplan mangler", domain: "Risiko", reference: "Krav 6.1.3", severity: "high", relatedControlIds: ["A.5.1", "A.6.1"] },
      { id: "i3", title: "Awareness-trening ikke dokumentert", domain: "HR", reference: "Vedlegg A.7.2", severity: "medium", relatedControlIds: ["A.6.3"] },
      { id: "i4", title: "Penetrasjonstest mangler", domain: "Drift", reference: "Vedlegg A.8.8", severity: "high", relatedControlIds: ["A.8.8"] },
      { id: "i5", title: "Klassifisering av informasjon", domain: "Eiendeler", reference: "Vedlegg A.5.12", severity: "medium", relatedControlIds: ["A.8.1", "A.5.10"] },
      { id: "i6", title: "Beredskapsøvelse ikke gjennomført", domain: "Kontinuitet", reference: "Vedlegg A.5.30", severity: "medium", relatedControlIds: ["A.5.4"] },
    ],
  },
  {
    framework_id: "aiact",
    framework_name: "EU AI Act",
    score: 0,
    total: 12,
    fulfilled: 0,
    gaps: [
      { id: "a1", title: "AI-systemregister ikke etablert", domain: "Styring", reference: "Artikkel 49", severity: "critical", relatedControlIds: ["Art.4", "Art.26"] },
      { id: "a2", title: "Risikoklassifisering av AI-systemer mangler", domain: "Risiko", reference: "Artikkel 6", severity: "critical", relatedControlIds: ["Art.9"] },
      { id: "a3", title: "Menneskelig tilsyn ikke definert", domain: "Drift", reference: "Artikkel 14", severity: "high", relatedControlIds: ["Art.10", "Art.26"] },
      { id: "a4", title: "Transparens overfor brukere", domain: "Dokumentasjon", reference: "Artikkel 13", severity: "high", relatedControlIds: ["Art.4"] },
    ],
  },
];

export const SEVERITY_LABEL: Record<GapItem["severity"], string> = {
  critical: "Kritisk",
  high: "Vesentlig",
  medium: "Mindre",
  low: "Mindre",
};

export function severityDotClass(s: GapItem["severity"]): string {
  if (s === "critical") return "bg-destructive";
  if (s === "high") return "bg-warning";
  return "bg-muted-foreground/40";
}

export function getFrameworkGap(frameworkId: string): FrameworkGap | undefined {
  return DEMO_GAPS.find((f) => f.framework_id === frameworkId);
}

/** Returnerer id-er for gap som matcher en eller flere kontroll-id-er fra tjenestekatalogen. */
export function getGapIdsForControls(frameworkId: string, controlIds: string[]): string[] {
  const fw = getFrameworkGap(frameworkId);
  if (!fw) return [];
  const wanted = new Set(controlIds);
  return fw.gaps
    .filter((g) => g.relatedControlIds.some((c) => wanted.has(c)))
    .map((g) => g.id);
}
