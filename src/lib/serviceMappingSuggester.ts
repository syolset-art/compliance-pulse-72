import { FRAMEWORK_CATALOG } from "./frameworkCoverageCatalog";

export type MatchConfidence = "high" | "medium" | "low";

export interface ControlSuggestion {
  frameworkId: string;
  frameworkLabel: string;
  frameworkShortName: string;
  controlId: string;
  controlLabel: string;
  /** Hvor sterkt treff (høyere = bedre). */
  score: number;
  /** Avledet konfidensnivå — styrer UI og forhåndsvalg. */
  confidence: MatchConfidence;
  /** Hvilke nøkkelord traff. */
  matchedTerms: string[];
}

/**
 * Norske nøkkelord per [frameworkId, controlId]. Holdes kort og pragmatisk —
 * matches mot tjenestenavn + beskrivelse for å foreslå mappinger.
 * Suppleres automatisk med kontrollpunktets label + typiske aktiviteter.
 */
const EXTRA_KEYWORDS: Record<string, string[]> = {
  // NIS2
  "nis2:Art.20": [
    "styring", "ledelse", "opplæring", "awareness", "kurs",
    // Roller som ansvarlig sikkerhetsleder dekker ledelsesansvar
    "ciso", "sikkerhetssjef", "sikkerhetsleder", "sikkerhetsansvarlig",
    "informasjonssikkerhetsansvarlig", "informasjonssikkerhetsleder",
    "ciso-as-a-service", "ciso as a service", "virtuell ciso", "vciso",
  ],
  "nis2:Art.21": ["mfa", "patch", "sårbarhet", "kryptering", "tilgangskontroll", "endepunkt", "edr", "sikkerhetstiltak"],
  "nis2:Art.23": ["hendelse", "incident", "varsling", "beredskap", "ir", "csirt"],
  // ISO 27001
  "iso27001:A.5.1": [
    "policy", "policyer", "retningslinjer",
    // Compliance-roller forvalter policy-rammeverket
    "compliance officer", "etterlevelsesansvarlig", "compliance-ansvarlig",
    "compliance lead", "compliance-leder",
  ],
  "iso27001:A.5.4": [
    "ledelse", "ledelsens", "gjennomgang", "styre",
    // CISO / sikkerhetsleder ivaretar ledelsens ansvar for informasjonssikkerhet
    "ciso", "sikkerhetssjef", "sikkerhetsleder", "sikkerhetsansvarlig",
    "informasjonssikkerhetsansvarlig", "informasjonssikkerhetsleder",
    "vciso", "virtuell ciso",
  ],
  "iso27001:A.5.10": ["akseptabel bruk", "bruksregler", "instruks"],
  "iso27001:A.5.15": ["tilgang", "rbac", "iam", "offboarding", "rolle"],
  "iso27001:A.5.24": ["hendelse", "incident response", "ir-plan", "eskalering"],
  "iso27001:A.6.3": ["phishing", "simulering", "awareness", "opplæring", "kurs", "e-læring", "training"],
  "iso27001:A.8.7": ["malware", "skadevare", "antivirus", "edr", "endpoint"],
  "iso27001:A.8.8": ["sårbarhet", "vulnerability", "tenable", "skann", "pentest", "patch"],
  "iso27001:A.8.13": ["backup", "sikkerhetskopi", "restore", "veeam"],
  "iso27001:A.8.16": ["siem", "overvåk", "logg", "soc", "mdr", "xdr", "alarm"],
  // GDPR
  "gdpr:Art.28": ["dpa", "databehandler", "leverandøravtale"],
  "gdpr:Art.30": ["protokoll", "ropa", "behandlingsprotokoll", "behandlingsoversikt"],
  "gdpr:Art.35": ["dpia", "personvernkonsekvens"],
  "gdpr:Art.37": [
    "dpo", "personvernombud", "personvernansvarlig", "personvernrådgiver",
    "personvern-rådgiver", "dpo-as-a-service", "dpo as a service",
    "ekstern dpo", "personvernombud-tjeneste",
  ],
  // AI Act
  "aiact:Art.4": ["ai-kurs", "ai opplæring", "ai litteracy", "ai-litteracy"],
  "aiact:Art.9": ["ai risiko", "ai-risiko", "ai governance"],
  "aiact:Art.10": ["datakvalitet", "treningsdata", "datasett"],
  "aiact:Art.26": ["ai bruk", "ai-bruk", "promptlogg"],
  // DORA
  "dora:Art.5": ["ikt", "rammeverk", "dora"],
  "dora:Art.17": ["hendelse", "major incident", "rapportering"],
  "dora:Art.28": ["tredjepart", "leverandør", "outsourcing"],
  // Åpenhetsloven
  "transparency:§4": ["aktsomhet", "leverandørkjede", "due diligence"],
  "transparency:§5": ["redegjørelse", "åpenhetsrapport"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function tokenize(s: string): string[] {
  return normalize(s).split(/\s+/).filter((t) => t.length >= 3);
}

/** Generiske «kontrollpunkter» som ikke er reelle krav — ren støy i forslagslisten. */
const NOISE_LABELS = new Set([
  "overlapp",
  "overlap",
  "generelt",
  "diverse",
  "annet",
  "trust service criteria",
  "kontrollområder",
  "krav",
]);

function isMeaningfulControlPoint(
  frameworkLabel: string,
  frameworkShortName: string,
  controlId: string,
  controlLabel: string,
): boolean {
  const id = controlId.trim().toLowerCase();
  const label = controlLabel.trim().toLowerCase();
  if (!id || !label) return false;
  if (NOISE_LABELS.has(id) || NOISE_LABELS.has(label)) return false;
  // Label identisk med rammeverksnavnet = ingen reell kobling
  if (label === frameworkLabel.trim().toLowerCase()) return false;
  if (label === frameworkShortName.trim().toLowerCase()) return false;
  // Id og label er samme ord (f.eks. «overlapp › overlapp») = ikke et krav
  if (id === label) return false;
  return true;
}

/** Minste score for at et forslag i det hele tatt vises. */
const MIN_SCORE = 2;

function toConfidence(score: number, phraseHit: boolean, hitCount: number): MatchConfidence {
  if (phraseHit || score >= 5 || hitCount >= 3) return "high";
  if (score >= 3 || hitCount >= 2) return "medium";
  return "low";
}

export function suggestControlPoints(input: {
  name: string;
  description?: string;
}): ControlSuggestion[] {
  const haystack = normalize(`${input.name} ${input.description ?? ""}`);
  const tokens = new Set(tokenize(`${input.name} ${input.description ?? ""}`));
  if (haystack.trim().length < 2) return [];

  const results: ControlSuggestion[] = [];

  FRAMEWORK_CATALOG.forEach((fw) => {
    fw.controlPoints.forEach((cp) => {
      if (!isMeaningfulControlPoint(fw.label, fw.shortName, cp.id, cp.label)) return;

      const keywords = [
        ...(EXTRA_KEYWORDS[`${fw.id}:${cp.id}`] ?? []),
        cp.label,
        ...(cp.typicalActivities ?? []),
      ].map(normalize);

      const matched: string[] = [];
      let score = 0;
      let phraseHit = false;

      keywords.forEach((kw) => {
        if (!kw) return;
        // Phrase match (sterkere)
        if (kw.includes(" ") && haystack.includes(kw)) {
          score += 3;
          phraseHit = true;
          matched.push(kw);
          return;
        }
        // Token match
        if (tokens.has(kw)) {
          score += 2;
          matched.push(kw);
        } else if (kw.length >= 4 && haystack.includes(kw)) {
          score += 1;
          matched.push(kw);
        }
      });

      const uniqueMatches = Array.from(new Set(matched));

      if (score >= MIN_SCORE) {
        results.push({
          frameworkId: fw.id,
          frameworkLabel: fw.label,
          frameworkShortName: fw.shortName,
          controlId: cp.id,
          controlLabel: cp.label,
          score,
          confidence: toConfidence(score, phraseHit, uniqueMatches.length),
          matchedTerms: uniqueMatches.slice(0, 3),
        });
      }
    });
  });

  // Dedupliker på rammeverk + kontrollpunkt (behold sterkeste treff)
  const byKey = new Map<string, ControlSuggestion>();
  for (const r of results) {
    const key = `${r.frameworkId}::${r.controlId}`;
    const existing = byKey.get(key);
    if (!existing || r.score > existing.score) byKey.set(key, r);
  }

  return Array.from(byKey.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
