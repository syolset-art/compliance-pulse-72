import { FRAMEWORK_CATALOG } from "./frameworkCoverageCatalog";

export interface ControlSuggestion {
  frameworkId: string;
  frameworkLabel: string;
  frameworkShortName: string;
  controlId: string;
  controlLabel: string;
  /** Hvor sterkt treff (høyere = bedre). */
  score: number;
  /** Hvilke nøkkelord traff. */
  matchedTerms: string[];
}

/**
 * Norske nøkkelord per kontrollpunkt. Holdes kort og pragmatisk —
 * matches mot tjenestenavn + beskrivelse for å foreslå mappinger.
 * Suppleres automatisk med kontrollpunktets label + typiske aktiviteter.
 */
const EXTRA_KEYWORDS: Record<string, string[]> = {
  // NIS2
  "Art.20": ["styring", "ledelse", "opplæring", "awareness", "kurs"],
  "Art.21": ["mfa", "patch", "sårbarhet", "kryptering", "tilgangskontroll", "endepunkt", "edr", "sikkerhetstiltak"],
  "Art.23": ["hendelse", "incident", "varsling", "beredskap", "ir", "csirt"],
  // ISO 27001
  "A.5.1": ["policy", "policyer", "retningslinjer"],
  "A.5.4": ["ledelse", "ledelsens", "gjennomgang", "styre"],
  "A.5.10": ["akseptabel bruk", "bruksregler", "instruks"],
  "A.5.15": ["tilgang", "rbac", "iam", "offboarding", "rolle"],
  "A.5.24": ["hendelse", "incident response", "ir-plan", "eskalering"],
  "A.6.3": ["phishing", "simulering", "awareness", "opplæring", "kurs", "e-læring", "training"],
  "A.8.7": ["malware", "skadevare", "antivirus", "edr", "endpoint"],
  "A.8.8": ["sårbarhet", "vulnerability", "tenable", "skann", "pentest", "patch"],
  "A.8.13": ["backup", "sikkerhetskopi", "restore", "veeam"],
  "A.8.16": ["siem", "overvåk", "logg", "soc", "mdr", "xdr", "alarm"],
  // GDPR
  "Art.28": ["dpa", "databehandler", "leverandøravtale"],
  "Art.30": ["protokoll", "ropa", "behandlingsprotokoll", "behandlingsoversikt"],
  "Art.35": ["dpia", "personvernkonsekvens"],
  "Art.37": ["dpo", "personvernombud"],
  // AI Act
  "Art.4": ["ai-kurs", "ai opplæring", "ai litteracy", "ai-litteracy"],
  "Art.9": ["ai risiko", "ai-risiko", "ai governance"],
  "Art.10": ["datakvalitet", "treningsdata", "datasett"],
  "Art.26": ["ai bruk", "ai-bruk", "promptlogg"],
  // DORA
  "Art.5": ["ikt", "rammeverk", "dora"],
  "Art.17": ["hendelse", "major incident", "rapportering"],
  "Art.28": ["tredjepart", "leverandør", "outsourcing"],
  // Åpenhetsloven
  "§4": ["aktsomhet", "leverandørkjede", "due diligence"],
  "§5": ["redegjørelse", "åpenhetsrapport"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function tokenize(s: string): string[] {
  return normalize(s).split(/\s+/).filter((t) => t.length >= 3);
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
      const keywords = [
        ...(EXTRA_KEYWORDS[cp.id] ?? []),
        cp.label,
        ...(cp.typicalActivities ?? []),
      ].map(normalize);

      const matched: string[] = [];
      let score = 0;

      keywords.forEach((kw) => {
        if (!kw) return;
        // Phrase match (sterkere)
        if (kw.includes(" ") && haystack.includes(kw)) {
          score += 3;
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

      if (score > 0) {
        results.push({
          frameworkId: fw.id,
          frameworkLabel: fw.label,
          frameworkShortName: fw.shortName,
          controlId: cp.id,
          controlLabel: cp.label,
          score,
          matchedTerms: Array.from(new Set(matched)).slice(0, 3),
        });
      }
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}
