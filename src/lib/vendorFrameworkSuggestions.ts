/**
 * Regelverk og tiltak for en leverandør.
 *
 * Lara foreslår hvilke regelverk, standarder og retningslinjer leverandøren bør
 * etterleve ut fra type, bransje, land og kritikalitet. Hvert regelverk mapper
 * videre til konkrete tiltak brukeren kan handle på (be om dokumentasjon eller
 * opprette en aktivitet).
 */

export type FrameworkConfidence = "high" | "medium";

export interface VendorFramework {
  id: string;
  label: string;
  /** high = lovpålagt, medium = anbefalt. */
  confidence: FrameworkConfidence;
  /** Kort begrunnelse fra Lara. */
  reasonNb: string;
  reasonEn: string;
  /** Lagt til manuelt av brukeren (ikke foreslått av Lara). */
  manual?: boolean;
}

export type ActionCriticality = "kritisk" | "hoy" | "medium";

export interface VendorFrameworkAction {
  id: string;
  frameworkId: string;
  frameworkLabel: string;
  titleNb: string;
  titleEn: string;
  /** Hvilket krav tiltaket dekker, f.eks. "GDPR art. 28". */
  requirement: string;
  criticality: ActionCriticality;
  reasonNb: string;
  reasonEn: string;
  /** Dokumenttype i forespørselsdialogen. Uten verdi = kun aktivitet. */
  documentType?: string;
}

export interface VendorContext {
  id: string;
  name?: string;
  /** SaaS, IT-drift, Infrastruktur, Rådgivning … */
  vendorType?: string | null;
  industry?: string | null;
  country?: string | null;
  /** Kritikalitet satt av brukeren. */
  criticality?: string | null;
  /** Behandler personopplysninger på våre vegne. */
  processesPersonalData?: boolean;
}

interface FrameworkDefinition extends Omit<VendorFramework, "manual"> {
  actions: Array<Omit<VendorFrameworkAction, "frameworkId" | "frameworkLabel">>;
}

const CATALOG: Record<string, FrameworkDefinition> = {
  gdpr: {
    id: "gdpr",
    label: "GDPR",
    confidence: "high",
    reasonNb: "Leverandøren behandler personopplysninger på deres vegne.",
    reasonEn: "The vendor processes personal data on your behalf.",
    actions: [
      {
        id: "gdpr-dpa",
        titleNb: "Inngå databehandleravtale",
        titleEn: "Sign a data processing agreement",
        requirement: "GDPR art. 28",
        criticality: "kritisk",
        reasonNb: "Uten en signert DPA mangler dere rettslig grunnlag for behandlingen hos leverandøren.",
        reasonEn: "Without a signed DPA you lack a legal basis for the processing at the vendor.",
        documentType: "dpa",
      },
      {
        id: "gdpr-transfer",
        titleNb: "Dokumenter overføringsgrunnlag utenfor EØS",
        titleEn: "Document transfer basis outside the EEA",
        requirement: "GDPR kap. V",
        criticality: "hoy",
        reasonNb: "Leverandøren har underleverandører utenfor EØS. Be om SCC eller tilsvarende.",
        reasonEn: "The vendor uses sub-processors outside the EEA. Request SCCs or equivalent.",
        documentType: "general",
      },
      {
        id: "gdpr-dpia",
        titleNb: "Vurder behov for DPIA",
        titleEn: "Assess the need for a DPIA",
        requirement: "GDPR art. 35",
        criticality: "medium",
        reasonNb: "Omfanget av personopplysninger tilsier at en personvernkonsekvensvurdering bør gjøres.",
        reasonEn: "The scope of personal data suggests a data protection impact assessment.",
        documentType: "dpia",
      },
    ],
  },
  nis2: {
    id: "nis2",
    label: "NIS2",
    confidence: "high",
    reasonNb: "Leveransen inngår i en verdikjede omfattet av NIS2.",
    reasonEn: "The delivery is part of a supply chain covered by NIS2.",
    actions: [
      {
        id: "nis2-supplychain",
        titleNb: "Be om leverandørens sikkerhetsdokumentasjon",
        titleEn: "Request the vendor's security documentation",
        requirement: "NIS2 art. 21",
        criticality: "kritisk",
        reasonNb: "NIS2 krever at dere vurderer sikkerheten i leverandørkjeden og kan dokumentere den.",
        reasonEn: "NIS2 requires you to assess and document supply chain security.",
        documentType: "iso27001",
      },
      {
        id: "nis2-incident",
        titleNb: "Avtal varslingsfrist ved hendelser",
        titleEn: "Agree on incident notification deadlines",
        requirement: "NIS2 art. 23",
        criticality: "hoy",
        reasonNb: "Dere må kunne varsle innen 24 timer — det forutsetter at leverandøren varsler dere raskt.",
        reasonEn: "You must report within 24 hours, which requires prompt notification from the vendor.",
      },
    ],
  },
  iso27001: {
    id: "iso27001",
    label: "ISO 27001",
    confidence: "medium",
    reasonNb: "Sertifisering gir uavhengig bekreftelse på styringssystemet for informasjonssikkerhet.",
    reasonEn: "Certification gives independent assurance of the information security management system.",
    actions: [
      {
        id: "iso-cert",
        titleNb: "Be om gyldig ISO 27001-sertifikat",
        titleEn: "Request a valid ISO 27001 certificate",
        requirement: "ISO/IEC 27001 pkt. 4–10",
        criticality: "hoy",
        reasonNb: "Et gyldig sertifikat fra uavhengig revisor dekker store deler av kontrollbehovet.",
        reasonEn: "A valid certificate from an independent auditor covers much of the control need.",
        documentType: "iso27001",
      },
      {
        id: "iso-soa",
        titleNb: "Be om Statement of Applicability",
        titleEn: "Request the Statement of Applicability",
        requirement: "ISO/IEC 27001 pkt. 6.1.3",
        criticality: "medium",
        reasonNb: "SoA viser hvilke kontroller som faktisk er implementert hos leverandøren.",
        reasonEn: "The SoA shows which controls the vendor has actually implemented.",
        documentType: "general",
      },
    ],
  },
  dora: {
    id: "dora",
    label: "DORA",
    confidence: "medium",
    reasonNb: "Leverandøren støtter kritiske IKT-tjenester i finansiell sektor.",
    reasonEn: "The vendor supports critical ICT services in the financial sector.",
    actions: [
      {
        id: "dora-exit",
        titleNb: "Etabler exit- og kontinuitetsplan",
        titleEn: "Establish an exit and continuity plan",
        requirement: "DORA art. 28",
        criticality: "hoy",
        reasonNb: "DORA krever dokumentert utgangsstrategi for kritiske IKT-leverandører.",
        reasonEn: "DORA requires a documented exit strategy for critical ICT providers.",
      },
      {
        id: "dora-pentest",
        titleNb: "Be om siste penetrasjonstest",
        titleEn: "Request the latest penetration test",
        requirement: "DORA art. 24–26",
        criticality: "medium",
        reasonNb: "Testresultater dokumenterer motstandsdyktigheten i tjenesten.",
        reasonEn: "Test results document the resilience of the service.",
        documentType: "penetration_test",
      },
    ],
  },
  soc2: {
    id: "soc2",
    label: "SOC 2",
    confidence: "medium",
    reasonNb: "Vanlig kontrollrapport for skytjenester fra internasjonale leverandører.",
    reasonEn: "Common assurance report for cloud services from international vendors.",
    actions: [
      {
        id: "soc2-report",
        titleNb: "Be om SOC 2 Type II-rapport",
        titleEn: "Request the SOC 2 Type II report",
        requirement: "SOC 2 TSC — Security",
        criticality: "medium",
        reasonNb: "Type II dekker kontrollenes effektivitet over tid, ikke bare på ett tidspunkt.",
        reasonEn: "Type II covers control effectiveness over time, not just at a point in time.",
        documentType: "soc2",
      },
    ],
  },
  sikkerhetsloven: {
    id: "sikkerhetsloven",
    label: "Sikkerhetsloven",
    confidence: "medium",
    reasonNb: "Leveransen kan berøre grunnleggende nasjonale funksjoner.",
    reasonEn: "The delivery may touch fundamental national functions.",
    actions: [
      {
        id: "sikkerhetsloven-agreement",
        titleNb: "Vurder behov for sikkerhetsavtale",
        titleEn: "Assess the need for a security agreement",
        requirement: "Sikkerhetsloven § 9-4",
        criticality: "medium",
        reasonNb: "Leverandører med tilgang til skjermingsverdige verdier krever egen sikkerhetsavtale.",
        reasonEn: "Vendors with access to classified assets require a dedicated security agreement.",
      },
    ],
  },
};

/** Alle regelverk Lara kjenner tiltak for. */
export function frameworkById(id: string): FrameworkDefinition | undefined {
  return CATALOG[id];
}

const norm = (v?: string | null) => (v ?? "").toLowerCase();

/** Deterministisk «tilfeldighet» slik at samme leverandør alltid får samme forslag. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Regelverk Lara anbefaler for leverandøren. */
export function deriveVendorFrameworks(ctx: VendorContext): VendorFramework[] {
  const type = norm(ctx.vendorType);
  const industry = norm(ctx.industry);
  const country = norm(ctx.country);
  const crit = norm(ctx.criticality);
  const ids: string[] = [];

  const isDataProcessor =
    ctx.processesPersonalData !== false &&
    (type.includes("saas") || type.includes("it") || type.includes("rådgiv") || type === "");
  if (isDataProcessor) ids.push("gdpr");

  const highCriticality = crit.includes("høy") || crit.includes("hoy") || crit.includes("kritisk");
  if (highCriticality || type.includes("infrastruktur") || type.includes("it-drift")) {
    ids.push("nis2");
  }

  ids.push("iso27001");

  if (industry.includes("finans") || industry.includes("bank") || industry.includes("forsikring")) {
    ids.push("dora");
  }

  const isForeign = country !== "" && country !== "no" && country !== "norge";
  if (isForeign || type.includes("saas")) ids.push("soc2");

  if (type.includes("infrastruktur") && (hash(ctx.id) % 2 === 0)) ids.push("sikkerhetsloven");

  const seen = new Set<string>();
  return ids
    .filter((id) => CATALOG[id] && !seen.has(id) && seen.add(id))
    .map((id) => {
      const def = CATALOG[id];
      return {
        id: def.id,
        label: def.label,
        confidence: def.confidence,
        reasonNb: def.reasonNb,
        reasonEn: def.reasonEn,
      };
    });
}

/** Tiltak for de valgte regelverkene, sortert etter kritikalitet. */
export function deriveVendorActions(frameworks: VendorFramework[]): VendorFrameworkAction[] {
  const order: Record<ActionCriticality, number> = { kritisk: 0, hoy: 1, medium: 2 };
  const out: VendorFrameworkAction[] = [];
  for (const f of frameworks) {
    const def = CATALOG[f.id];
    if (!def) continue;
    for (const a of def.actions) {
      out.push({ ...a, frameworkId: f.id, frameworkLabel: f.label });
    }
  }
  return out.sort((a, b) => order[a.criticality] - order[b.criticality]);
}

/** Tiltak for et regelverk som ikke finnes i katalogen (manuelt lagt til). */
export function fallbackActionFor(f: VendorFramework): VendorFrameworkAction {
  return {
    id: `${f.id}-doc`,
    frameworkId: f.id,
    frameworkLabel: f.label,
    titleNb: `Be om dokumentasjon på etterlevelse av ${f.label}`,
    titleEn: `Request evidence of compliance with ${f.label}`,
    requirement: f.label,
    criticality: "medium",
    reasonNb: "Du la til dette regelverket selv. Be leverandøren dokumentere hvordan de etterlever det.",
    reasonEn: "You added this framework yourself. Ask the vendor to document how they comply.",
    documentType: "general",
  };
}

export const CRITICALITY_STYLE: Record<
  ActionCriticality,
  { nb: string; en: string; className: string }
> = {
  kritisk: {
    nb: "Kritisk",
    en: "Critical",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  hoy: { nb: "Høy", en: "High", className: "border-warning/30 bg-warning/10 text-warning" },
  medium: {
    nb: "Medium",
    en: "Medium",
    className: "border-border bg-muted text-muted-foreground",
  },
};

// ── Lagring av brukerens egne valg per leverandør ──

const KEY = (assetId: string) => `mynder_vendor_frameworks_${assetId}`;

export interface StoredFrameworkState {
  /** Manuelt lagt til av brukeren. */
  added: VendorFramework[];
  /** Id-er fra Laras forslag som brukeren har fjernet. */
  removed: string[];
}

export function readFrameworkState(assetId: string): StoredFrameworkState {
  try {
    const raw = localStorage.getItem(KEY(assetId));
    if (!raw) return { added: [], removed: [] };
    const parsed = JSON.parse(raw);
    return { added: parsed.added ?? [], removed: parsed.removed ?? [] };
  } catch {
    return { added: [], removed: [] };
  }
}

export function writeFrameworkState(assetId: string, state: StoredFrameworkState) {
  try {
    localStorage.setItem(KEY(assetId), JSON.stringify(state));
  } catch {
    /* ignorer — kun preferanselagring */
  }
}
