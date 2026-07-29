// ────────────────────────────────────────────────────────────────────────────
// Oppslag av beskrivelser for tjenestenavn brukeren skriver inn.
// Brukes i ServiceCoverageSearch slik at partneren slipper å skrive selv,
// men kan redigere fritt.
// ────────────────────────────────────────────────────────────────────────────
import { SERVICE_LIBRARY } from "./serviceLibrary";

interface Entry {
  /** Nøkkelord (lowercase) som skal treffe */
  keys: string[];
  description: string;
}

/**
 * Kuraterte beskrivelser for vanlige tjenester som ikke nødvendigvis
 * finnes i SERVICE_LIBRARY. Rekkefølgen er ikke viktig — vi velger
 * beste treff basert på antall matchende ord.
 */
const CURATED: Entry[] = [
  {
    keys: ["pentest", "penetrasjonstest", "penetration test"],
    description:
      "Kontrollert angrepstest av utvalgte systemer og applikasjoner for å avdekke sårbarheter, med rapport, risikoklassifisering og anbefalte tiltak.",
  },
  {
    keys: ["sårbarhetsscanning", "vulnerability scan", "vulnerability scanning"],
    description:
      "Periodisk automatisert scanning av eksponerte tjenester og endepunkter for kjente sårbarheter, med prioritert tiltaksliste.",
  },
  {
    keys: ["mfa", "flerfaktor", "multifaktor", "totrinns"],
    description:
      "Innføring og drift av flerfaktor-autentisering for kritiske brukere og systemer, inkludert policy, utrulling og oppfølging.",
  },
  {
    keys: ["backup", "sikkerhetskopi", "sikkerhetskopiering"],
    description:
      "Sikkerhetskopiering av data og systemer med definerte gjenopprettingsmål (RPO/RTO), inkludert overvåking og periodisk gjenopprettingstest.",
  },
  {
    keys: ["awareness", "opplæring", "sikkerhetsopplæring", "phishing"],
    description:
      "Sikkerhetsopplæring for ansatte med phishing-simuleringer, mikrokurs og rapportering på gjennomføring og risiko.",
  },
  {
    keys: ["dpo", "personvernombud"],
    description:
      "Personvernombud som tjeneste (DPO-as-a-service): rådgivning, behandlingsoversikt, DPIA-støtte og dialog med tilsynsmyndighet.",
  },
  {
    keys: ["ciso", "sikkerhetsansvarlig", "virtual ciso", "vciso"],
    description:
      "vCISO-tjeneste med strategisk sikkerhetsledelse, risikostyring, policyarbeid og ledelsesrapportering.",
  },
  {
    keys: ["mdr", "managed detection", "detection and response"],
    description:
      "Døgnkontinuerlig deteksjon og respons på trusler mot endepunkter, identiteter og skytjenester, med håndtering av hendelser.",
  },
  {
    keys: ["soc", "security operations"],
    description:
      "Security Operations Center med overvåking, korrelering av hendelser og eskalering til definert responsteam.",
  },
  {
    keys: ["siem", "log management"],
    description:
      "Sentralisert innsamling og korrelering av logger fra kritiske systemer med regelverk for varsling og etterforskning.",
  },
  {
    keys: ["edr", "endpoint detection"],
    description:
      "Endpoint Detection & Response på klienter og servere med sanntidsdeteksjon, isolering og etterforskning.",
  },
  {
    keys: ["patch", "patching", "oppdatering"],
    description:
      "Styrt patch-forvaltning av operativsystem og tredjepartsprogramvare med testregime, tidsvinduer og statusrapportering.",
  },
  {
    keys: ["ropa", "behandlingsprotokoll"],
    description:
      "Etablering og vedlikehold av behandlingsprotokoll (ROPA) med gjennomgang av databehandlere, formål og lovlig grunnlag.",
  },
  {
    keys: ["dpia", "personvernkonsekvens"],
    description:
      "DPIA / vurdering av personvernkonsekvenser for høyrisiko-behandlinger, med tiltaksplan og oppfølging.",
  },
  {
    keys: ["iso 27001", "iso27001", "isms"],
    description:
      "Etablering og drift av styringssystem for informasjonssikkerhet (ISMS) tilpasset ISO/IEC 27001, inkludert risikovurdering og internrevisjon.",
  },
  {
    keys: ["nis2", "beredskap"],
    description:
      "Forberedelse og etterlevelse av NIS2 med risikostyring, hendelseshåndtering, leverandørkontroll og rapporteringsrutiner.",
  },
  {
    keys: ["gdpr", "personvern"],
    description:
      "GDPR-etterlevelse med behandlingsoversikt, databehandleravtaler, avvikshåndtering og rutiner for de registrertes rettigheter.",
  },
  {
    keys: ["risikovurdering", "risk assessment"],
    description:
      "Strukturert risikovurdering av virksomhet, systemer eller leverandører med tiltaksplan og oppfølging over tid.",
  },
  {
    keys: ["leverandør", "vendor", "third party", "tredjepart"],
    description:
      "Leverandøroppfølging med kartlegging, risikoklassifisering, kontraktsgjennomgang og løpende revurdering.",
  },
  {
    keys: ["hendelse", "incident", "beredskap", "øvelse"],
    description:
      "Hendelseshåndtering og beredskapsøvelser med definerte roller, kommunikasjonsplan og etterarbeid.",
  },
  {
    keys: ["m365", "microsoft 365", "office 365"],
    description:
      "Herding og drift av Microsoft 365 med policy for identitet, e-post, deling og enhetsstyring i tråd med anerkjente rammeverk.",
  },
  {
    keys: ["entra", "azure ad", "identitet", "identity"],
    description:
      "Identitets- og tilgangsstyring i Entra ID / Azure AD med rolle- og tilgangsmodell, betinget tilgang og periodisk resertifisering.",
  },
  {
    keys: ["kryptering", "encryption"],
    description:
      "Kryptering av data i hvile og i transitt med nøkkelforvaltning og dokumentasjon av kryptografiske valg.",
  },
  {
    keys: ["dlp", "data loss"],
    description:
      "Data Loss Prevention på e-post, endepunkt og skytjenester for å hindre utilsiktet spredning av sensitiv informasjon.",
  },
];

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * Finner beste tilgjengelige beskrivelse for et tjenestenavn.
 * Rekkefølge:
 *  1) Kuratert nøkkelord-treff (curated dictionary)
 *  2) Beste navn-treff i SERVICE_LIBRARY (shortDescription)
 *  3) undefined (partneren skriver selv)
 */
export function lookupServiceDescription(name: string): string | undefined {
  const q = name.trim().toLowerCase();
  if (q.length < 2) return undefined;
  const qTokens = tokens(q);
  if (qTokens.length === 0) return undefined;

  // 1) Curated
  let bestCurated: { score: number; description: string } | null = null;
  for (const entry of CURATED) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.split(" ").length * 3;
      else {
        const keyTokens = tokens(key);
        const matched = keyTokens.filter((t) => qTokens.includes(t)).length;
        if (matched > 0) score += matched;
      }
    }
    if (score > 0 && (!bestCurated || score > bestCurated.score)) {
      bestCurated = { score, description: entry.description };
    }
  }
  if (bestCurated && bestCurated.score >= 2) return bestCurated.description;

  // 2) SERVICE_LIBRARY name-match
  let bestLib: { score: number; description: string } | null = null;
  for (const tpl of SERVICE_LIBRARY) {
    const libTokens = tokens(tpl.name);
    const matched = libTokens.filter((t) => qTokens.includes(t)).length;
    if (matched === 0) continue;
    const score = matched + (tpl.name.toLowerCase().includes(q) ? 3 : 0);
    if (!bestLib || score > bestLib.score) {
      bestLib = { score, description: tpl.shortDescription };
    }
  }
  if (bestLib && bestLib.score >= 2) return bestLib.description;

  // 3) Fallback to curated even with weak score
  if (bestCurated) return bestCurated.description;
  return undefined;
}
