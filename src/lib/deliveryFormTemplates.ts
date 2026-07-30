// ────────────────────────────────────────────────────────────────────────────
// Leveranseskjema-maler — strukturerte sjekklister partneren fyller ut når de
// utfører et oppdrag (pentest, kurs, DPIA, risikovurdering, …).
//
// Skjemaet er alternativet til å laste opp et ferdig dokument: når det er
// fylt ut kan Lara autogenerere en leveranserapport som fungerer som bevis.
//
// Demo/prototype: state lagres i localStorage per tilbud (offerId).
// ────────────────────────────────────────────────────────────────────────────

import type { PartnerEvidenceDocType } from "@/lib/partnerEvidence";

export type DeliveryFieldKind = "text" | "textarea" | "date" | "number" | "select" | "checklist";

export interface DeliveryFormField {
  id: string;
  label: string;
  help?: string;
  kind: DeliveryFieldKind;
  placeholder?: string;
  options?: string[];
  /** Kun for kind = "checklist" */
  items?: string[];
  required?: boolean;
}

export interface DeliveryFormStep {
  id: string;
  title: string;
  description?: string;
  fields: DeliveryFormField[];
}

export interface DeliveryFormTemplate {
  id: string;
  label: string;
  /** Hvilken bevistype rapporten registreres som. */
  docType: PartnerEvidenceDocType;
  /** Nøkkelord som brukes til å gjenkjenne tjenesten. */
  keywords: string[];
  steps: DeliveryFormStep[];
}

const PENTEST: DeliveryFormTemplate = {
  id: "pentest",
  label: "Penetrasjonstest",
  docType: "pentest",
  keywords: ["pentest", "penetrasjonstest", "red team", "sårbarhet", "vuln", "sikkerhetstest"],
  steps: [
    {
      id: "scope",
      title: "Omfang",
      description: "Hva ble testet, og når?",
      fields: [
        { id: "scope", label: "Systemer og omfang", kind: "textarea", placeholder: "F.eks. eksternt eksponerte webapplikasjoner og VPN-gateway", required: true },
        { id: "period", label: "Testperiode", kind: "text", placeholder: "F.eks. 3.–7. mars 2026" },
        { id: "method", label: "Metode", kind: "select", options: ["Black box", "Grey box", "White box"] },
      ],
    },
    {
      id: "execution",
      title: "Gjennomføring",
      fields: [
        { id: "standard", label: "Rammeverk brukt", kind: "select", options: ["OWASP ASVS", "PTES", "NIST SP 800-115", "Egen metodikk"] },
        { id: "tester", label: "Utført av", kind: "text", placeholder: "Navn og sertifisering" },
        {
          id: "activities",
          label: "Aktiviteter gjennomført",
          kind: "checklist",
          items: ["Rekognosering", "Sårbarhetsskanning", "Manuell utnyttelse", "Rettighetseskalering", "Retesting av funn"],
        },
      ],
    },
    {
      id: "findings",
      title: "Funn",
      fields: [
        { id: "critical", label: "Kritiske funn", kind: "number", placeholder: "0" },
        { id: "high", label: "Høye funn", kind: "number", placeholder: "0" },
        { id: "medium", label: "Middels funn", kind: "number", placeholder: "0" },
        { id: "summary", label: "Oppsummering av funn", kind: "textarea", placeholder: "Kort beskrivelse av de viktigste funnene", required: true },
      ],
    },
    {
      id: "remediation",
      title: "Tiltak og oppfølging",
      fields: [
        { id: "actions", label: "Anbefalte tiltak", kind: "textarea", placeholder: "Prioriterte tiltak kunden bør gjennomføre" },
        { id: "retest", label: "Retest avtalt", kind: "select", options: ["Ja", "Nei", "Ikke aktuelt"] },
        { id: "nextDate", label: "Neste test", kind: "date" },
      ],
    },
  ],
};

const TRAINING: DeliveryFormTemplate = {
  id: "training",
  label: "Kurs og opplæring",
  docType: "other",
  keywords: ["kurs", "opplæring", "awareness", "bevissthet", "phishing", "trening", "e-læring"],
  steps: [
    {
      id: "content",
      title: "Innhold",
      fields: [
        { id: "title", label: "Kursets tittel", kind: "text", placeholder: "F.eks. Sikkerhetsbevissthet for ansatte", required: true },
        { id: "topics", label: "Temaer dekket", kind: "checklist", items: ["Phishing", "Passord og MFA", "Datahåndtering", "Hendelsesrapportering", "Fysisk sikkerhet", "GDPR-grunnlag"] },
        { id: "format", label: "Format", kind: "select", options: ["Klasserom", "Digitalt webinar", "E-læring", "Kombinasjon"] },
      ],
    },
    {
      id: "participation",
      title: "Deltakelse",
      fields: [
        { id: "date", label: "Gjennomført", kind: "date", required: true },
        { id: "invited", label: "Antall inviterte", kind: "number", placeholder: "0" },
        { id: "completed", label: "Antall fullført", kind: "number", placeholder: "0" },
        { id: "instructor", label: "Kursholder", kind: "text" },
      ],
    },
    {
      id: "result",
      title: "Resultat",
      fields: [
        { id: "score", label: "Gjennomsnittlig testresultat (%)", kind: "number", placeholder: "0" },
        { id: "notes", label: "Observasjoner", kind: "textarea", placeholder: "Hva bør følges opp neste runde?" },
        { id: "nextDate", label: "Neste gjennomføring", kind: "date" },
      ],
    },
  ],
};

const DPIA: DeliveryFormTemplate = {
  id: "dpia",
  label: "DPIA / personvernvurdering",
  docType: "dpia",
  keywords: ["dpia", "personvern", "gdpr", "privacy", "behandling", "ropa"],
  steps: [
    {
      id: "processing",
      title: "Behandlingen",
      fields: [
        { id: "activity", label: "Behandlingsaktivitet", kind: "text", required: true },
        { id: "purpose", label: "Formål og rettslig grunnlag", kind: "textarea", required: true },
        { id: "categories", label: "Kategorier personopplysninger", kind: "checklist", items: ["Alminnelige", "Særlige kategorier", "Barn", "Straffbare forhold", "Lokasjonsdata"] },
      ],
    },
    {
      id: "risk",
      title: "Risikovurdering",
      fields: [
        { id: "risks", label: "Identifiserte risikoer", kind: "textarea", required: true },
        { id: "level", label: "Restrisiko", kind: "select", options: ["Lav", "Middels", "Høy"] },
      ],
    },
    {
      id: "measures",
      title: "Tiltak",
      fields: [
        { id: "measures", label: "Risikoreduserende tiltak", kind: "textarea" },
        { id: "dpoConsulted", label: "Personvernombud konsultert", kind: "select", options: ["Ja", "Nei", "Ikke oppnevnt"] },
        { id: "reviewDate", label: "Neste gjennomgang", kind: "date" },
      ],
    },
  ],
};

const RISK: DeliveryFormTemplate = {
  id: "risk_assessment",
  label: "Risikovurdering",
  docType: "risk_assessment",
  keywords: ["risiko", "risk", "vurdering", "tprm", "leverandørvurdering"],
  steps: [
    {
      id: "scope",
      title: "Omfang",
      fields: [
        { id: "scope", label: "Hva er vurdert", kind: "textarea", required: true },
        { id: "method", label: "Metodikk", kind: "select", options: ["ISO 27005", "NIST RMF", "Egen modell"] },
        { id: "date", label: "Gjennomført", kind: "date" },
      ],
    },
    {
      id: "findings",
      title: "Risikobilde",
      fields: [
        { id: "high", label: "Antall høye risikoer", kind: "number", placeholder: "0" },
        { id: "summary", label: "Oppsummering", kind: "textarea", required: true },
      ],
    },
    {
      id: "treatment",
      title: "Håndtering",
      fields: [
        { id: "plan", label: "Tiltaksplan", kind: "textarea" },
        { id: "owner", label: "Ansvarlig hos kunden", kind: "text" },
        { id: "reviewDate", label: "Neste gjennomgang", kind: "date" },
      ],
    },
  ],
};

const BCP: DeliveryFormTemplate = {
  id: "bcp",
  label: "Beredskap og kontinuitet",
  docType: "bcp",
  keywords: ["beredskap", "kontinuitet", "bcp", "backup", "dr", "gjenoppretting", "hendelse", "incident"],
  steps: [
    {
      id: "plan",
      title: "Plan",
      fields: [
        { id: "scope", label: "Omfang av planen", kind: "textarea", required: true },
        { id: "rto", label: "RTO", kind: "text", placeholder: "F.eks. 4 timer" },
        { id: "rpo", label: "RPO", kind: "text", placeholder: "F.eks. 1 time" },
      ],
    },
    {
      id: "test",
      title: "Test og øvelse",
      fields: [
        { id: "date", label: "Øvelse gjennomført", kind: "date" },
        { id: "type", label: "Type øvelse", kind: "select", options: ["Skrivebordsøvelse", "Delvis gjenoppretting", "Full failover"] },
        { id: "result", label: "Resultat", kind: "textarea", required: true },
      ],
    },
    {
      id: "followup",
      title: "Oppfølging",
      fields: [
        { id: "gaps", label: "Avvik og forbedringer", kind: "textarea" },
        { id: "nextDate", label: "Neste øvelse", kind: "date" },
      ],
    },
  ],
};

const AUDIT: DeliveryFormTemplate = {
  id: "audit",
  label: "Revisjon og sertifiseringsløp",
  docType: "audit_report",
  keywords: ["revisjon", "audit", "iso", "soc 2", "soc2", "sertifisering", "gap-analyse"],
  steps: [
    {
      id: "scope",
      title: "Omfang",
      fields: [
        { id: "standard", label: "Standard", kind: "text", placeholder: "F.eks. ISO/IEC 27001:2022", required: true },
        { id: "scope", label: "Revisjonsomfang", kind: "textarea", required: true },
        { id: "date", label: "Gjennomført", kind: "date" },
      ],
    },
    {
      id: "findings",
      title: "Funn",
      fields: [
        { id: "major", label: "Store avvik", kind: "number", placeholder: "0" },
        { id: "minor", label: "Mindre avvik", kind: "number", placeholder: "0" },
        { id: "summary", label: "Oppsummering", kind: "textarea", required: true },
      ],
    },
    {
      id: "followup",
      title: "Oppfølging",
      fields: [
        { id: "plan", label: "Korrigerende tiltak", kind: "textarea" },
        { id: "nextDate", label: "Neste revisjon", kind: "date" },
      ],
    },
  ],
};

const OPERATIONS: DeliveryFormTemplate = {
  id: "operations",
  label: "Drift og sikkerhetstjeneste",
  docType: "other",
  keywords: ["mdr", "soc", "edr", "overvåking", "drift", "mfa", "iam", "pam", "dlp", "e-post", "cspm", "patch"],
  steps: [
    {
      id: "setup",
      title: "Etablering",
      fields: [
        { id: "scope", label: "Hva er satt opp", kind: "textarea", placeholder: "Systemer, enheter og dekning", required: true },
        { id: "startDate", label: "Driftsatt", kind: "date" },
        { id: "coverage", label: "Dekning", kind: "select", options: ["24/7", "Kontortid", "Ad hoc"] },
      ],
    },
    {
      id: "controls",
      title: "Kontroller aktivert",
      fields: [
        { id: "controls", label: "Aktiverte kontroller", kind: "checklist", items: ["Logginnsamling", "Varsling", "Automatisk respons", "Månedlig rapport", "Periodisk gjennomgang"] },
        { id: "notes", label: "Kommentar", kind: "textarea" },
      ],
    },
    {
      id: "evidence",
      title: "Dokumentasjon",
      fields: [
        { id: "reportCadence", label: "Rapporteringsfrekvens", kind: "select", options: ["Månedlig", "Kvartalsvis", "Halvårlig"] },
        { id: "contact", label: "Driftsansvarlig", kind: "text" },
      ],
    },
  ],
};

const GENERIC: DeliveryFormTemplate = {
  id: "generic",
  label: "Generell leveranse",
  docType: "other",
  keywords: [],
  steps: [
    {
      id: "scope",
      title: "Hva ble levert",
      fields: [
        { id: "scope", label: "Beskrivelse av leveransen", kind: "textarea", required: true },
        { id: "date", label: "Fullført", kind: "date" },
        { id: "responsible", label: "Utført av", kind: "text" },
      ],
    },
    {
      id: "result",
      title: "Resultat",
      fields: [
        { id: "result", label: "Resultat og observasjoner", kind: "textarea", required: true },
        { id: "actions", label: "Anbefalte neste steg", kind: "textarea" },
      ],
    },
  ],
};

export const DELIVERY_FORM_TEMPLATES: DeliveryFormTemplate[] = [
  PENTEST,
  TRAINING,
  DPIA,
  RISK,
  BCP,
  AUDIT,
  OPERATIONS,
  GENERIC,
];

/** Gjenkjenn riktig skjema-mal ut fra tilbudsnavn og tjeneste-IDer. */
export function pickDeliveryFormTemplate(input: {
  name?: string;
  templateIds?: string[];
}): DeliveryFormTemplate {
  const haystack = [input.name ?? "", ...(input.templateIds ?? [])]
    .join(" ")
    .toLowerCase();
  for (const t of DELIVERY_FORM_TEMPLATES) {
    if (t.keywords.some((k) => haystack.includes(k))) return t;
  }
  return GENERIC;
}

export function getDeliveryFormTemplate(id: string): DeliveryFormTemplate {
  return DELIVERY_FORM_TEMPLATES.find((t) => t.id === id) ?? GENERIC;
}

// ---------- Persistens (demo) ----------

export type DeliveryFieldValue = string | string[];

export interface DeliveryFormState {
  templateId: string;
  /** fieldId -> verdi */
  values: Record<string, DeliveryFieldValue>;
  /** stepId -> true når partneren har merket steget som ikke aktuelt */
  skipped: Record<string, boolean>;
  updatedAt: string;
}

const KEY = (offerId: string) => `msp.delivery-form.${offerId}`;
const EVENT_NAME = "msp:delivery-form-changed";

export function loadDeliveryForm(offerId: string): DeliveryFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(offerId));
    return raw ? (JSON.parse(raw) as DeliveryFormState) : null;
  } catch {
    return null;
  }
}

export function saveDeliveryForm(offerId: string, state: DeliveryFormState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY(offerId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeDeliveryForms(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

function hasValue(v: DeliveryFieldValue | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}

/** Antall steg som er ferdig (alle påkrevde felt fylt) eller merket ikke aktuelt. */
export function deliveryFormProgress(
  template: DeliveryFormTemplate,
  state: DeliveryFormState | null,
): { done: number; total: number; complete: boolean } {
  const total = template.steps.length;
  if (!state) return { done: 0, total, complete: false };
  let done = 0;
  for (const step of template.steps) {
    if (state.skipped[step.id]) {
      done++;
      continue;
    }
    const required = step.fields.filter((f) => f.required);
    const checkAgainst = required.length > 0 ? required : step.fields;
    const filled = checkAgainst.some((f) => hasValue(state.values[f.id]));
    const allRequired = required.every((f) => hasValue(state.values[f.id]));
    if (filled && allRequired) done++;
  }
  return { done, total, complete: done === total };
}
