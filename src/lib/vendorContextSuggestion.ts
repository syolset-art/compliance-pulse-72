// Regelbasert kontekstforslag (v1) for leverandører.
// Lara utleder bruksformål, GDPR-rolle og kritikalitet fra det vi vet om leverandøren.

export interface UsageTagDef {
  value: string;
  labelNb: string;
  labelEn: string;
  /** Nøkkelord som matcher mot bransje/beskrivelse */
  keywords: string[];
  gdprRole?: "databehandler" | "underdatabehandler" | "ingen_persondata";
  criticality?: "low" | "medium" | "high" | "critical";
}

export const USAGE_TAGS: UsageTagDef[] = [
  { value: "hr_payroll", labelNb: "Lønn og HR", labelEn: "Payroll & HR", keywords: ["lønn", "payroll", "hr", "personal", "ansatt", "recruit", "rekrutter"], gdprRole: "databehandler", criticality: "high" },
  { value: "it_operations", labelNb: "IT-drift", labelEn: "IT operations", keywords: ["it-drift", "drift", "managed", "msp", "infrastruktur", "hosting", "server", "network", "it operations", "operations", "utvikling", "development", "it-tjenester"], gdprRole: "databehandler", criticality: "critical" },
  { value: "accounting", labelNb: "Regnskap", labelEn: "Accounting", keywords: ["regnskap", "accounting", "faktura", "invoice", "økonomi", "finance"], gdprRole: "databehandler", criticality: "high" },
  { value: "marketing", labelNb: "Markedsføring", labelEn: "Marketing", keywords: ["markedsfør", "marketing", "kampanje", "newsletter", "nyhetsbrev", "annonse", "ads"], gdprRole: "databehandler", criticality: "medium" },
  { value: "crm", labelNb: "Kundedata / CRM", labelEn: "Customer data / CRM", keywords: ["crm", "kunde", "customer", "salg", "sales", "pipeline"], gdprRole: "databehandler", criticality: "high" },
  { value: "cloud_storage", labelNb: "Skylagring", labelEn: "Cloud storage", keywords: ["lagring", "storage", "backup", "sky", "cloud", "arkiv", "saas"], gdprRole: "databehandler", criticality: "high" },
  { value: "support", labelNb: "Support", labelEn: "Support", keywords: ["support", "helpdesk", "service desk", "kundeservice", "ticket"], gdprRole: "databehandler", criticality: "medium" },
  { value: "security", labelNb: "Sikkerhet", labelEn: "Security", keywords: ["sikkerhet", "security", "soc", "edr", "antivirus", "overvåk", "pentest"], gdprRole: "databehandler", criticality: "critical" },
  { value: "consulting", labelNb: "Rådgivning", labelEn: "Consulting", keywords: ["rådgiv", "consult", "advokat", "legal", "revisjon", "audit"], gdprRole: "ingen_persondata", criticality: "medium" },
  { value: "other", labelNb: "Annet", labelEn: "Other", keywords: [], criticality: "low" },
];

export function usageTagLabel(value: string, isNb: boolean): string {
  const tag = USAGE_TAGS.find((t) => t.value === value);
  if (!tag) return value;
  return isNb ? tag.labelNb : tag.labelEn;
}

export interface VendorContextInput {
  vendorName?: string | null;
  vendorCategory?: string | null;
  description?: string | null;
  usagePurpose?: string | null;
  usageTags?: string[] | null;
  hasPrivacyPolicy?: boolean | null;
  sensitive?: boolean | null;
}

export interface VendorContextSuggestion {
  /** Foreslåtte bruksformål-tagger (verdier fra USAGE_TAGS) */
  usageTags: string[];
  /** Kort setning som beskriver hva leverandøren brukes til */
  usageTextNb: string;
  usageTextEn: string;
  gdprRole: "databehandler" | "underdatabehandler" | "ingen_persondata" | null;
  criticality: "low" | "medium" | "high" | "critical";
  /** Hvilke kilder forslaget bygger på */
  sources: Array<"category" | "privacyPolicy" | "description" | "usage">;
  reasonsNb: string[];
  reasonsEn: string[];
}

const CRIT_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function suggestVendorContext(input: VendorContextInput): VendorContextSuggestion {
  const haystack = [input.vendorCategory, input.description, input.usagePurpose, input.vendorName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const sources: VendorContextSuggestion["sources"] = [];
  if (input.vendorCategory) sources.push("category");
  if (input.hasPrivacyPolicy) sources.push("privacyPolicy");
  if (input.description) sources.push("description");
  if (input.usagePurpose || (input.usageTags && input.usageTags.length > 0)) sources.push("usage");

  const matched = USAGE_TAGS.filter(
    (t) => t.keywords.length > 0 && t.keywords.some((k) => haystack.includes(k))
  );

  const selected = matched.length > 0 ? matched : [];
  const usageTags = selected.map((t) => t.value);

  let criticality: "low" | "medium" | "high" | "critical" = "medium";
  for (const t of selected) {
    if (t.criticality && CRIT_RANK[t.criticality] > CRIT_RANK[criticality]) criticality = t.criticality;
  }
  if (input.sensitive && CRIT_RANK[criticality] < CRIT_RANK.high) criticality = "high";

  let gdprRole: VendorContextSuggestion["gdprRole"] = null;
  if (selected.some((t) => t.gdprRole === "databehandler")) gdprRole = "databehandler";
  else if (selected.length > 0 && selected.every((t) => t.gdprRole === "ingen_persondata")) gdprRole = "ingen_persondata";
  if (input.hasPrivacyPolicy && !gdprRole) gdprRole = "databehandler";

  const reasonsNb: string[] = [];
  const reasonsEn: string[] = [];
  if (input.vendorCategory) {
    reasonsNb.push(`Bransje: ${input.vendorCategory}`);
    reasonsEn.push(`Industry: ${input.vendorCategory}`);
  }
  if (input.hasPrivacyPolicy) {
    reasonsNb.push("Personvernerklæring er registrert");
    reasonsEn.push("Privacy policy is registered");
  }
  if (input.description) {
    reasonsNb.push("Beskrivelse av hva leverandøren utfører");
    reasonsEn.push("Description of what the vendor performs");
  }
  if (input.sensitive) {
    reasonsNb.push("Sensitive personopplysninger er registrert");
    reasonsEn.push("Sensitive personal data registered");
  }
  if (reasonsNb.length === 0) {
    reasonsNb.push("Lite informasjon registrert – forslaget er konservativt");
    reasonsEn.push("Little information registered – suggestion is conservative");
  }

  const labelsNb = selected.map((t) => t.labelNb);
  const labelsEn = selected.map((t) => t.labelEn);

  return {
    usageTags,
    usageTextNb: labelsNb.length
      ? `Brukes til ${labelsNb.join(", ").toLowerCase()}.`
      : "Vi finner ikke nok informasjon til å foreslå bruksformål ennå.",
    usageTextEn: labelsEn.length
      ? `Used for ${labelsEn.join(", ").toLowerCase()}.`
      : "Not enough information to suggest a purpose yet.",
    gdprRole,
    criticality,
    sources,
    reasonsNb,
    reasonsEn,
  };
}
