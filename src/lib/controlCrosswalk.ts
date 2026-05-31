// Demo-kryssreferanse mellom kontrollpunkter på tvers av regelverk.
// Et tiltak (f.eks. sårbarhetshåndtering) treffer typisk flere regelverk.
// Brukes for å vise "Også: ISO A.8.8, GDPR Art.32" under hvert kontrollpunkt
// i et tilbud. UI-only — ingen scoring/logikk endres.

export interface RelatedControl {
  frameworkId: string;
  frameworkLabel: string;
  controlId: string;
}

type Key = string; // `${frameworkId}::${controlId}` (frameworkId lowercase)

const k = (fw: string, id: string): Key => `${fw.toLowerCase()}::${id}`;

const FW_LABEL: Record<string, string> = {
  nis2: "NIS2",
  iso27001: "ISO 27001",
  gdpr: "GDPR",
  aiact: "EU AI Act",
  dora: "DORA",
  transparency: "Åpenhetsloven",
};

const label = (fw: string) => FW_LABEL[fw.toLowerCase()] ?? fw.toUpperCase();

// Symmetriske par — registreres én gang, eksponeres begge veier.
const PAIRS: Array<[string, string, string, string]> = [
  // [fwA, idA, fwB, idB]

  // NIS2 Art.21 (sikkerhetstiltak) ≈ tekniske/organisatoriske tiltak
  ["nis2", "Art.21", "iso27001", "A.8.8"],
  ["nis2", "Art.21", "iso27001", "A.8.7"],
  ["nis2", "Art.21", "iso27001", "A.5.24"],
  ["nis2", "Art.21", "gdpr", "Art.32"],
  ["nis2", "Art.21", "dora", "Art.5"],

  // NIS2 Art.23 (hendelseshåndtering)
  ["nis2", "Art.23", "iso27001", "A.5.24"],
  ["nis2", "Art.23", "iso27001", "A.5.26"],
  ["nis2", "Art.23", "gdpr", "Art.33"],
  ["nis2", "Art.23", "dora", "Art.17"],

  // NIS2 Art.20 (styring og opplæring)
  ["nis2", "Art.20", "iso27001", "A.5.1"],
  ["nis2", "Art.20", "iso27001", "A.6.3"],
  ["nis2", "Art.20", "aiact", "Art.4"],

  // ISO sikkerhetskopiering / kontinuitet
  ["iso27001", "A.8.13", "nis2", "Art.21"],
  ["iso27001", "A.5.29", "nis2", "Art.21"],
  ["iso27001", "A.5.29", "dora", "Art.5"],

  // GDPR personvern ↔ tredjepart/sikkerhet
  ["gdpr", "Art.28", "nis2", "Art.21"],
  ["gdpr", "Art.28", "dora", "Art.28"],
  ["gdpr", "Art.35", "aiact", "Art.9"],

  // AI Act risikohåndtering
  ["aiact", "Art.9", "iso27001", "A.8.8"],
  ["aiact", "Art.9", "nis2", "Art.21"],
  ["aiact", "Art.10", "gdpr", "Art.5"],

  // Logging og overvåking
  ["iso27001", "A.8.15", "nis2", "Art.21"],
  ["iso27001", "A.8.16", "nis2", "Art.23"],
];

const MAP = new Map<Key, RelatedControl[]>();
for (const [fwA, idA, fwB, idB] of PAIRS) {
  const a: RelatedControl = { frameworkId: fwA, frameworkLabel: label(fwA), controlId: idA };
  const b: RelatedControl = { frameworkId: fwB, frameworkLabel: label(fwB), controlId: idB };
  const keyA = k(fwA, idA);
  const keyB = k(fwB, idB);
  if (!MAP.has(keyA)) MAP.set(keyA, []);
  if (!MAP.has(keyB)) MAP.set(keyB, []);
  MAP.get(keyA)!.push(b);
  MAP.get(keyB)!.push(a);
}

/** Returnerer relaterte kontrollpunkter i andre regelverk. Tom liste hvis ingen. */
export function getRelatedControls(frameworkId: string, controlId: string): RelatedControl[] {
  return MAP.get(k(frameworkId, controlId)) ?? [];
}
