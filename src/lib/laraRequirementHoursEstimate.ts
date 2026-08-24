/**
 * Lara-estimat for rådgivningstimer per krav.
 *
 * Brukes i partnerens salgspotensial-kort: i stedet for et fast antall timer
 * per krav kan Lara anslå hvor lang tid hvert enkelt krav typisk tar å
 * implementere for en mellomstor virksomhet. Resultatet caches i localStorage
 * per regelverk og ugyldiggjøres hvis kravtallet endres.
 */

import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "msp.salesPotential.aiHours";

export interface RequirementHoursEntry {
  reqId: string;
  hours: number;
  rationale: string;
}

export interface FrameworkHoursEstimate {
  totalHours: number;
  perReq: RequirementHoursEntry[];
  requirementCount: number;
  estimatedAt: string;
}

export type RequirementHoursCache = Record<string, FrameworkHoursEstimate>;

export function readRequirementHoursCache(): RequirementHoursCache {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as RequirementHoursCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: RequirementHoursCache) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage kan være full — estimatet brukes da kun i minnet */
  }
}

/** Hent bufret estimat hvis det finnes og kravtallet fortsatt stemmer. */
export function getCachedEstimate(
  frameworkId: string,
  requirementCount: number,
): FrameworkHoursEstimate | null {
  const entry = readRequirementHoursCache()[frameworkId];
  if (!entry || entry.requirementCount !== requirementCount) return null;
  return entry;
}

/**
 * Kjør Lara-estimat for ett regelverk. Kaster Error med brukervennlig melding
 * ved 429/402/5xx slik at UI kan vise den direkte.
 */
export async function estimateRequirementHours(
  frameworkId: string,
  frameworkName: string,
  requirements: { id: string; name: string }[],
  language: "no" | "en" = "no",
): Promise<FrameworkHoursEstimate> {
  const { data, error } = await supabase.functions.invoke("estimate-requirement-hours", {
    body: {
      framework_name: frameworkName,
      language,
      requirements: requirements.slice(0, 150).map((r) => ({ id: r.id, name: r.name })),
    },
  });

  if (error) {
    // Supabase-klienten legger respons-body på error.context ved ikke-2xx.
    let message = "Kunne ikke hente estimat fra Lara. Prøv igjen senere.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error && typeof body.error === "string") message = body.error;
    } catch {
      /* behold standardmeldingen */
    }
    throw new Error(message);
  }

  const estimates: RequirementHoursEntry[] = Array.isArray(data?.estimates)
    ? data.estimates
    : [];
  if (estimates.length === 0) {
    throw new Error("Lara ga ingen estimater. Prøv igjen.");
  }

  const totalHours = estimates.reduce((sum, e) => sum + (e.hours || 0), 0);
  const result: FrameworkHoursEstimate = {
    totalHours: Math.round(totalHours * 4) / 4,
    perReq: estimates,
    requirementCount: requirements.length,
    estimatedAt: new Date().toISOString(),
  };

  const cache = readRequirementHoursCache();
  cache[frameworkId] = result;
  writeCache(cache);
  return result;
}
