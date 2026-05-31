// Catalog of common vendors used to power autosuggest + access/DPA defaults
// in the Trust Profile activation wizard.

export type VendorDpaType =
  | "standard" // standard DPA published by vendor — customer does not sign individually
  | "individual" // customer typically signs their own DPA with the vendor
  | "none"; // no personal data processing → DPA usually not relevant

export type VendorSuggestion = {
  name: string;
  category: string;
  /** Examples of what the vendor typically gets access to — user can override. */
  suggestedAccess: string[];
  dpaType: VendorDpaType;
  /** Short note shown in the DPA section for this vendor. */
  dpaNote?: string;
};

export const VENDOR_CATALOG: VendorSuggestion[] = [
  {
    name: "Microsoft 365",
    category: "Produktivitet / skylagring",
    suggestedAccess: ["E-post", "Dokumenter", "Kalender", "Teams-samtaler"],
    dpaType: "standard",
    dpaNote:
      "Microsoft tilbyr en standard databehandleravtale (Microsoft Products and Services DPA) som gjelder automatisk for alle kunder. Egen signert avtale er normalt ikke nødvendig.",
  },
  {
    name: "Google Workspace",
    category: "Produktivitet / skylagring",
    suggestedAccess: ["E-post", "Dokumenter", "Kalender", "Drive-filer"],
    dpaType: "standard",
    dpaNote:
      "Google Workspace har en standard databehandleravtale som aksepteres digitalt i adminkonsollen. Egen signert avtale er normalt ikke nødvendig.",
  },
  {
    name: "Amazon Web Services (AWS)",
    category: "Skyinfrastruktur",
    suggestedAccess: ["Kundedata", "Applikasjonsdata", "Backups"],
    dpaType: "standard",
    dpaNote: "AWS har en standard GDPR-DPA som gjelder automatisk for alle kunder.",
  },
  {
    name: "Microsoft Azure",
    category: "Skyinfrastruktur",
    suggestedAccess: ["Kundedata", "Applikasjonsdata", "Backups"],
    dpaType: "standard",
    dpaNote: "Dekkes av Microsoft Products and Services DPA.",
  },
  {
    name: "Slack",
    category: "Kommunikasjon",
    suggestedAccess: ["Interne meldinger", "Delte filer"],
    dpaType: "standard",
  },
  {
    name: "Dropbox",
    category: "Skylagring",
    suggestedAccess: ["Dokumenter", "Delte mapper"],
    dpaType: "standard",
  },
  {
    name: "Tripletex",
    category: "Regnskap / lønn",
    suggestedAccess: ["Regnskapsdata", "Fakturaer", "Lønnsdata"],
    dpaType: "individual",
  },
  {
    name: "Fiken",
    category: "Regnskap",
    suggestedAccess: ["Regnskapsdata", "Fakturaer"],
    dpaType: "individual",
  },
  {
    name: "Visma eAccounting",
    category: "Regnskap",
    suggestedAccess: ["Regnskapsdata", "Fakturaer"],
    dpaType: "individual",
  },
  {
    name: "Visma Lønn",
    category: "Lønn / HR",
    suggestedAccess: ["Lønnsdata", "Personopplysninger ansatte"],
    dpaType: "individual",
  },
  {
    name: "PowerOffice Go",
    category: "Regnskap",
    suggestedAccess: ["Regnskapsdata", "Fakturaer"],
    dpaType: "individual",
  },
  {
    name: "HubSpot",
    category: "CRM / markedsføring",
    suggestedAccess: ["Kundedata", "E-postlister"],
    dpaType: "standard",
  },
  {
    name: "Salesforce",
    category: "CRM",
    suggestedAccess: ["Kundedata", "Salgsdata"],
    dpaType: "standard",
  },
  {
    name: "Mailchimp",
    category: "E-postmarkedsføring",
    suggestedAccess: ["E-postlister", "Kontaktinfo"],
    dpaType: "standard",
  },
  {
    name: "Zendesk",
    category: "Kundeservice",
    suggestedAccess: ["Supporthenvendelser", "Kundedata"],
    dpaType: "standard",
  },
  {
    name: "Intercom",
    category: "Kundeservice / chat",
    suggestedAccess: ["Brukerdialog", "Kontaktinfo"],
    dpaType: "standard",
  },
  {
    name: "GitHub",
    category: "Utvikling / kode",
    suggestedAccess: ["Kildekode", "Issue tracker"],
    dpaType: "standard",
  },
  {
    name: "Atlassian (Jira / Confluence)",
    category: "Prosjekt / dokumentasjon",
    suggestedAccess: ["Prosjektdata", "Intern dokumentasjon"],
    dpaType: "standard",
  },
  {
    name: "Notion",
    category: "Dokumentasjon",
    suggestedAccess: ["Intern dokumentasjon", "Notater"],
    dpaType: "standard",
  },
  {
    name: "Figma",
    category: "Design",
    suggestedAccess: ["Designfiler"],
    dpaType: "standard",
  },
  {
    name: "Zoom",
    category: "Videomøter",
    suggestedAccess: ["Møteopptak", "Deltakerinfo"],
    dpaType: "standard",
  },
  {
    name: "Stripe",
    category: "Betaling",
    suggestedAccess: ["Betalingsdata", "Kundedata"],
    dpaType: "standard",
  },
  {
    name: "Vipps",
    category: "Betaling",
    suggestedAccess: ["Betalingsdata", "Kundedata"],
    dpaType: "individual",
  },
  {
    name: "Adobe Creative Cloud",
    category: "Design",
    suggestedAccess: ["Designfiler", "Mediainnhold"],
    dpaType: "standard",
  },
  {
    name: "LinkedIn",
    category: "Markedsføring / rekruttering",
    suggestedAccess: ["Annonseringsdata", "Kandidatdata"],
    dpaType: "standard",
  },
];

export function findVendorSuggestions(query: string, limit = 6): VendorSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return VENDOR_CATALOG.slice(0, limit);
  return VENDOR_CATALOG.filter(
    (v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q),
  ).slice(0, limit);
}

export function findVendorByName(name: string): VendorSuggestion | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return VENDOR_CATALOG.find((v) => v.name.toLowerCase() === q);
}

/** Generic access-scope chips used as quick-pick when no vendor is selected. */
export const GENERIC_ACCESS_OPTIONS = [
  "E-post",
  "Dokumenter",
  "Kundedata",
  "Personopplysninger ansatte",
  "Regnskapsdata",
  "Lønnsdata",
  "Betalingsdata",
  "Kildekode",
  "Backups",
];
