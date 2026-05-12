export interface ServiceFrameworkMapping {
  frameworkId: string;
  frameworkLabel: string;
  controlIds: string[];
}

export interface PartnerService {
  id: string;
  name: string;
  description: string;
  /** Standard sjekklistepunkter som kopieres inn på en leveranse. */
  defaultChecklist: string[];
  /** Hvilke regelverkskontroller tjenesten treffer. */
  frameworkMappings: ServiceFrameworkMapping[];
}

/**
 * Partnerens egen tjenestekatalog.
 * Mynder leverer regelverkene — partneren legger inn sine tjenester her,
 * og Lara viser hvordan de treffer kontrollpunkter på tvers av rammeverk.
 */
export const PARTNER_SERVICES: PartnerService[] = [
  {
    id: "awareness",
    name: "Awareness-program",
    description:
      "Løpende sikkerhetsbevissthetsprogram med phishing-simuleringer, e-læring og rapportering.",
    defaultChecklist: [
      "Kick-off med kunde",
      "Phishing-simulering Q1",
      "E-læringsmodul utrullet",
      "Rapport sendt til kunde",
      "Oppfølgingsmøte",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.6.3", "A.5.10"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20"] },
    ],
  },
  {
    id: "pentest",
    name: "Penetrasjonstest",
    description:
      "Årlig ekstern test av applikasjoner og infrastruktur, med rapport og re-test av funn.",
    defaultChecklist: [
      "Scoping og forberedelse",
      "Test gjennomført",
      "Rapport levert",
      "Re-test av funn",
      "Sluttmøte med kunde",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.8", "A.8.29"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
  },
  {
    id: "iso-readiness",
    name: "ISO 27001-klargjøring",
    description:
      "Strukturert leveranse for å gjøre kunden klar til ISO 27001-sertifisering.",
    defaultChecklist: [
      "Gap-analyse",
      "Policy- og dokumentpakke",
      "Risikovurdering",
      "Internrevisjon",
      "Ledelsesgjennomgang",
    ],
    frameworkMappings: [
      {
        frameworkId: "iso27001",
        frameworkLabel: "ISO 27001",
        controlIds: ["A.5.1", "A.5.9", "A.6.3", "A.8.8"],
      },
    ],
  },
  {
    id: "ai-governance",
    name: "AI Governance-rammeverk",
    description:
      "Kartlegging av AI-bruk, klassifisering og policy-oppsett mot AI Act.",
    defaultChecklist: [
      "Kartlegging av AI-bruk",
      "Risikoklassifisering",
      "Policy-oppsett",
      "Rutiner for menneskelig tilsyn",
    ],
    frameworkMappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.9", "Art.14"] },
    ],
  },
];

export function getService(id: string): PartnerService | undefined {
  return PARTNER_SERVICES.find(s => s.id === id);
}
