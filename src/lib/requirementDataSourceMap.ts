// Mapping fra compliance-krav til hvor i Mynder Lara henter data fra.
// Brukes til å forklare brukeren hvorfor et krav ikke er oppfylt automatisk
// og hvor de må gå for å fylle ut manglende data.

import type { ComplianceRequirement } from "./complianceRequirementsData";

export interface RequirementDataSource {
  /** Modulnavn slik det vises til brukeren, f.eks. "Behandlingsprotokoll" */
  module: string;
  /** Rute Lara henter fra og som CTA navigerer til */
  route: string;
  /** Konkret forklaring på hvorfor Lara ikke har data ennå */
  whyMissing: string;
  /** Knapp-tekst for primær CTA */
  ctaLabel: string;
}

// Spesifikke mappinger per requirement_id (overstyrer fallback)
export const REQUIREMENT_DATA_SOURCES: Record<string, RequirementDataSource> = {
  // ─── GDPR ──────────────────────────────────────────────────────
  "gdpr:art30": {
    module: "Behandlingsprotokoll (ROPA)",
    route: "/processing-records",
    whyMissing:
      "Lara fant ingen registrerte behandlingsaktiviteter. Protokollen bygges automatisk når behandlinger er registrert i ROPA-modulen.",
    ctaLabel: "Gå til Behandlingsprotokoll",
  },
  "gdpr:art28": {
    module: "Leverandører",
    route: "/assets",
    whyMissing:
      "Lara fant ingen registrerte databehandlere med signert databehandleravtale (DPA). Legg til leverandører og last opp DPA-er for å oppfylle dette kravet.",
    ctaLabel: "Gå til Leverandører",
  },
  "gdpr:art33": {
    module: "Avvik",
    route: "/deviations",
    whyMissing:
      "Lara overvåker avviksregisteret for personvernbrudd og varslingsfrister. Ingen rutine eller dokumentasjon er registrert ennå.",
    ctaLabel: "Gå til Avvik",
  },
  "gdpr:art35": {
    module: "Behandlingsprotokoll (DPIA)",
    route: "/processing-records",
    whyMissing:
      "Lara identifiserer høyrisiko-behandlinger som krever DPIA basert på registrerte aktiviteter. Ingen behandlinger er registrert ennå.",
    ctaLabel: "Gå til Behandlingsprotokoll",
  },
  "gdpr:art32": {
    module: "Systemer",
    route: "/systems",
    whyMissing:
      "Lara vurderer tekniske og organisatoriske tiltak basert på registrerte systemer og deres sikkerhetsdokumentasjon.",
    ctaLabel: "Gå til Systemer",
  },

  // ─── ISO 27001 — Annex A ───────────────────────────────────────
  "A.5.1": {
    module: "Dokumenter",
    route: "/admin/documents",
    whyMissing:
      "Lara fant ingen godkjent informasjonssikkerhetspolicy lastet opp. Last opp en signert policy for at kravet skal regnes som oppfylt.",
    ctaLabel: "Gå til Dokumenter",
  },
  "A.5.2": {
    module: "Organisasjon",
    route: "/admin/organisation",
    whyMissing:
      "Lara henter roller og ansvar fra organisasjonsoppsettet. Definer nøkkelpersoner (CISO, DPO, compliance-ansvarlig) for å oppfylle kravet.",
    ctaLabel: "Gå til Organisasjon",
  },
  "A.5.7": {
    module: "Leverandører",
    route: "/assets",
    whyMissing:
      "Lara analyserer trusselbildet fra registrerte leverandører og integrasjoner. Fyll ut leverandørregisteret for å gi Lara grunnlag.",
    ctaLabel: "Gå til Leverandører",
  },
  "A.5.23": {
    module: "Systemer",
    route: "/systems",
    whyMissing:
      "Lara henter sky-konfigurasjon fra registrerte systemer. Ingen systemer med skyleverandør-info er registrert ennå.",
    ctaLabel: "Gå til Systemer",
  },
  "A.6.3": {
    module: "Personlige innstillinger",
    route: "/settings",
    whyMissing:
      "Lara sporer fullført opplæring per ansatt. Ingen kursfullføringer er registrert. Aktiver opplæringsmodulen for å samle bevis.",
    ctaLabel: "Gå til Innstillinger",
  },
  "A.8.9": {
    module: "Systemer",
    route: "/systems",
    whyMissing:
      "Lara analyserer konfigurasjonsstyring fra registrerte systemer. Legg til systemer med konfigurasjonsdetaljer for at Lara skal kunne vurdere kravet.",
    ctaLabel: "Gå til Systemer",
  },
  "A.8.16": {
    module: "Avvik",
    route: "/deviations",
    whyMissing:
      "Lara overvåker hendelser og overvåkingsaktiviteter via avviksregisteret. Ingen overvåkingsrutiner er registrert ennå.",
    ctaLabel: "Gå til Avvik",
  },

  // ─── AI Act ────────────────────────────────────────────────────
  "Art.9": {
    module: "AI-systemregister",
    route: "/ai-registry",
    whyMissing:
      "Lara bygger risikostyringsoversikt basert på registrerte AI-systemer. Ingen AI-systemer er registrert ennå.",
    ctaLabel: "Gå til AI-systemregister",
  },
  "Art.10": {
    module: "AI-systemregister",
    route: "/ai-registry",
    whyMissing:
      "Lara analyserer datakvalitet for hvert AI-system. Registrer AI-systemer med datakilder for at Lara skal kunne vurdere kravet.",
    ctaLabel: "Gå til AI-systemregister",
  },
  "Art.13": {
    module: "AI-systemregister",
    route: "/ai-registry",
    whyMissing:
      "Lara sporer transparenstiltak per AI-system. Fyll ut transparensbeskrivelse på registrerte AI-systemer.",
    ctaLabel: "Gå til AI-systemregister",
  },
  "Art.14": {
    module: "AI-systemregister",
    route: "/ai-registry",
    whyMissing:
      "Lara dokumenterer menneskelig tilsyn per AI-system. Angi tilsynsnivå på registrerte AI-systemer.",
    ctaLabel: "Gå til AI-systemregister",
  },
};

// Fallback per sla_category når spesifikk mapping mangler
export const SLA_CATEGORY_FALLBACK: Record<string, RequirementDataSource> = {
  governance: {
    module: "Dokumenter",
    route: "/admin/documents",
    whyMissing:
      "Lara henter styrings-dokumentasjon (policyer, retningslinjer, beslutninger) fra dokumentmodulen. Last opp relevant dokumentasjon her.",
    ctaLabel: "Gå til Dokumenter",
  },
  identity_access: {
    module: "Systemer",
    route: "/systems",
    whyMissing:
      "Lara henter tilgangsstyring og autentisering fra systemregisteret. Registrer systemene dine og deres tilgangskontroller.",
    ctaLabel: "Gå til Systemer",
  },
  vendor_mgmt: {
    module: "Leverandører",
    route: "/assets",
    whyMissing:
      "Lara analyserer leverandører og tredjeparter. Registrer leverandører og last opp avtaler så Lara kan vurdere kravet.",
    ctaLabel: "Gå til Leverandører",
  },
  incident_mgmt: {
    module: "Avvik",
    route: "/deviations",
    whyMissing:
      "Lara overvåker hendelser og avvik via avviksregisteret. Sett opp avviksrutiner og logg hendelser her.",
    ctaLabel: "Gå til Avvik",
  },
  risk_mgmt: {
    module: "Risiko",
    route: "/business-risks",
    whyMissing:
      "Lara baserer vurderingen på registrert risikobilde. Fyll ut risikoregisteret med scenarier og tiltak.",
    ctaLabel: "Gå til Risiko",
  },
  data_protection: {
    module: "Behandlingsprotokoll",
    route: "/processing-records",
    whyMissing:
      "Lara henter personvernbehandlinger fra ROPA-modulen. Registrer behandlinger med formål, datakategorier og rettsgrunnlag.",
    ctaLabel: "Gå til Behandlingsprotokoll",
  },
  asset_mgmt: {
    module: "Systemer og Leverandører",
    route: "/assets",
    whyMissing:
      "Lara henter asset-oversikt fra system- og leverandørregisteret. Registrer dine assets for at Lara skal kunne vurdere kravet.",
    ctaLabel: "Gå til Assets",
  },
};

/**
 * Returnerer datakilde-info for et compliance-krav, eller null hvis ingen kilde finnes.
 */
export function getRequirementDataSource(
  req: Pick<ComplianceRequirement, "requirement_id" | "framework_id" | "sla_category" | "domain">,
): RequirementDataSource | null {
  // 1. Prøv eksakt match på requirement_id
  if (REQUIREMENT_DATA_SOURCES[req.requirement_id]) {
    return REQUIREMENT_DATA_SOURCES[req.requirement_id];
  }

  // 2. Prøv prefiks "framework:requirement_id"
  const composite = `${req.framework_id}:${req.requirement_id.toLowerCase()}`;
  if (REQUIREMENT_DATA_SOURCES[composite]) {
    return REQUIREMENT_DATA_SOURCES[composite];
  }

  // 3. Fall tilbake til sla_category
  if (req.sla_category && SLA_CATEGORY_FALLBACK[req.sla_category]) {
    return SLA_CATEGORY_FALLBACK[req.sla_category];
  }

  // 4. Domene-fallback
  if (req.domain === "privacy") return SLA_CATEGORY_FALLBACK.data_protection;
  if (req.domain === "security") return SLA_CATEGORY_FALLBACK.governance;
  if (req.domain === "ai") {
    return {
      module: "AI-systemregister",
      route: "/ai-registry",
      whyMissing:
        "Lara henter AI-relatert dokumentasjon fra AI-systemregisteret. Registrer AI-systemene dine for at Lara skal kunne vurdere kravet.",
      ctaLabel: "Gå til AI-systemregister",
    };
  }

  return null;
}
