export const OFFER_VARIABLES = [
  { key: "kontaktnavn", labelNo: "Kontaktnavn", labelEn: "Contact name", demo: "Kari" },
  { key: "avsender_navn", labelNo: "Avsender navn", labelEn: "Sender name", demo: "Ola Nordmann" },
  { key: "avsender_selskap", labelNo: "Avsender selskap", labelEn: "Sender company", demo: "Nordlys Sikkerhet AS" },
  { key: "mottaker_selskap", labelNo: "Mottaker selskap", labelEn: "Recipient company", demo: "DIPS Arena AS" },
  { key: "tilbud_pdf", labelNo: "Tilbud PDF", labelEn: "Proposal PDF", demo: "Tilbud-DIPS-Arena.pdf" },
] as const;

export type OfferVariableKey = (typeof OFFER_VARIABLES)[number]["key"];

export const OFFER_DEMO_VARS: Record<string, string> = Object.fromEntries(
  OFFER_VARIABLES.map((v) => [v.key, v.demo]),
);

export function substituteVars(text: string, vars: Record<string, string>): string {
  if (!text) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
