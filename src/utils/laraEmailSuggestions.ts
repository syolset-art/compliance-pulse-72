import type { ActivityType } from "./vendorActivityData";

export interface LaraEmailSuggestion {
  id: string;
  titleNb: string;
  titleEn: string;
  bodyNb: string;
  bodyEn: string;
  reasonNb: string;
  reasonEn: string;
  theme: "dpa" | "infosec" | "sla" | "okonomi" | "hendelse" | "revisjon" | "generell";
  criticality: "lav" | "medium" | "hoy" | "kritisk";
  level: "operasjonelt" | "taktisk" | "strategisk";
}

export const LARA_EMAIL_SUGGESTIONS: LaraEmailSuggestion[] = [
  {
    id: "lara-dpa",
    titleNb: "Be om oppdatert databehandleravtale (DPA)",
    titleEn: "Request updated Data Processing Agreement (DPA)",
    bodyNb:
      "Hei,\n\nVi gjennomgår vår leverandøroversikt og ser at vår signerte databehandleravtale med dere snart er to år gammel. Kan dere sende oss en oppdatert versjon i tråd med gjeldende GDPR-praksis, inkludert oppdatert subprosessor-liste og overføringsmekanismer?\n\nMvh",
    bodyEn:
      "Hi,\n\nDuring our vendor review we noticed that our signed Data Processing Agreement is approaching two years old. Could you share an updated version aligned with current GDPR practice, including an updated sub-processor list and transfer mechanisms?\n\nBest regards",
    reasonNb: "DPA er forfalt eller mangler oppdatering",
    reasonEn: "DPA is overdue or missing an update",
    theme: "dpa",
    criticality: "hoy",
    level: "taktisk",
  },
  {
    id: "lara-soc2",
    titleNb: "Etterspør gjeldende SOC 2 / ISO 27001-rapport",
    titleEn: "Request current SOC 2 / ISO 27001 report",
    bodyNb:
      "Hei,\n\nFor å oppdatere vår tredjepartsvurdering trenger vi en kopi av siste gjeldende SOC 2 Type II-rapport eller ISO 27001-sertifikat med Statement of Applicability. Kan dere dele dette via en sikker kanal?\n\nMvh",
    bodyEn:
      "Hi,\n\nTo refresh our third-party assessment we need a copy of your current SOC 2 Type II report or ISO 27001 certificate with the Statement of Applicability. Could you share this through a secure channel?\n\nBest regards",
    reasonNb: "Sertifiseringsdokumentasjon mangler eller er utløpt",
    reasonEn: "Certification documentation is missing or expired",
    theme: "infosec",
    criticality: "medium",
    level: "taktisk",
  },
  {
    id: "lara-incident",
    titleNb: "Bekreft varslingsrutiner ved sikkerhetshendelse",
    titleEn: "Confirm incident notification procedures",
    bodyNb:
      "Hei,\n\nKan dere bekrefte hvilken kontaktperson og kanal som skal benyttes ved sikkerhetshendelser eller brudd på personopplysninger som berører oss, samt forventet svartid? Vi oppdaterer beredskapsplanen vår.\n\nMvh",
    bodyEn:
      "Hi,\n\nCould you confirm which contact and channel we should use for security incidents or personal-data breaches affecting us, including your expected response time? We are updating our incident response plan.\n\nBest regards",
    reasonNb: "Hendelsesrutiner er ikke dokumentert",
    reasonEn: "Incident procedures are not documented",
    theme: "hendelse",
    criticality: "medium",
    level: "operasjonelt",
  },
];

export interface EmailTemplate {
  id: string;
  labelNb: string;
  labelEn: string;
  titleNb: string;
  titleEn: string;
  bodyNb: string;
  bodyEn: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-doc-request",
    labelNb: "Forespørsel om dokumentasjon",
    labelEn: "Request for documentation",
    titleNb: "Forespørsel om dokumentasjon",
    titleEn: "Request for documentation",
    bodyNb:
      "Hei,\n\nVi trenger oppdatert dokumentasjon på [tema] for vår leverandøroversikt. Kan dere oversende dette innen [dato]?\n\nMvh",
    bodyEn:
      "Hi,\n\nWe need updated documentation on [topic] for our vendor records. Could you send it by [date]?\n\nBest regards",
  },
  {
    id: "tpl-overdue",
    labelNb: "Påminnelse — forfalt dokumentasjon",
    labelEn: "Reminder — overdue documentation",
    titleNb: "Påminnelse: forfalt dokumentasjon",
    titleEn: "Reminder: overdue documentation",
    bodyNb:
      "Hei,\n\nVi har ikke mottatt etterspurt dokumentasjon innen avtalt frist. Vennligst gi en oppdatert status så snart som mulig.\n\nMvh",
    bodyEn:
      "Hi,\n\nWe have not received the requested documentation by the agreed deadline. Please provide an updated status as soon as possible.\n\nBest regards",
  },
  {
    id: "tpl-incident",
    labelNb: "Hendelsesvarsling",
    labelEn: "Incident notification",
    titleNb: "Hendelsesvarsling",
    titleEn: "Incident notification",
    bodyNb:
      "Hei,\n\nVi ønsker å varsle om en sikkerhetshendelse som kan berøre vår leveranse. Vennligst bekreft mottak og opprett en kontaktperson for videre koordinering.\n\nMvh",
    bodyEn:
      "Hi,\n\nWe would like to notify you of a security incident that may affect our service. Please confirm receipt and assign a point of contact for further coordination.\n\nBest regards",
  },
  {
    id: "tpl-followup",
    labelNb: "Generell oppfølging",
    labelEn: "General follow-up",
    titleNb: "Oppfølging",
    titleEn: "Follow-up",
    bodyNb: "Hei,\n\nVi følger opp tidligere dialog. Kan dere gi oss en oppdatering?\n\nMvh",
    bodyEn: "Hi,\n\nFollowing up on our earlier conversation. Could you provide an update?\n\nBest regards",
  },
];

// Re-export type so consumers can import from this file
export type { ActivityType };
