// Country / jurisdiction code per framework. Tiny labels: NO, EU, US, INT.
// "INT" = international standard (ISO etc.)
export type FrameworkJurisdiction = "NO" | "EU" | "US" | "INT";

const COUNTRY_MAP: Record<string, FrameworkJurisdiction> = {
  gdpr: "EU",
  personopplysningsloven: "NO",
  iso27001: "INT",
  iso27701: "INT",
  nis2: "EU",
  normen: "NO",
  nsm: "NO",
  soc2: "US",
  dora: "EU",
  cra: "EU",
  "ai-act": "EU",
  iso42001: "INT",
  iso42005: "INT",
  "ai-ethics": "INT",
  iso9001: "INT",
  iso14001: "INT",
  iso45001: "INT",
  internkontroll: "NO",
  arbeidsmiljoloven: "NO",
  apenhetsloven: "NO",
  hms: "NO",
  bokforingsloven: "NO",
  hvitvasking: "NO",
  csrd: "EU",
};

export function getFrameworkJurisdiction(id?: string | null): FrameworkJurisdiction {
  if (!id) return "INT";
  const key = id.toLowerCase();
  if (COUNTRY_MAP[key]) return COUNTRY_MAP[key];
  // Heuristic fallbacks
  if (key.startsWith("iso")) return "INT";
  if (key.startsWith("nis") || key.startsWith("eu-") || key.includes("gdpr") || key.includes("dora") || key.includes("csrd") || key.includes("cra")) return "EU";
  if (key.includes("soc") || key.includes("hipaa") || key.includes("ccpa") || key.includes("nist")) return "US";
  return "NO";
}
