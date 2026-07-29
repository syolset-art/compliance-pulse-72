/**
 * Match anbefalte regelverk mot partnerens tjenester (både katalog og lagrede
 * tilbud). Formålet i onboarding er å vise partneren hvilke tjenester som
 * "sannsynligvis matcher" kundens antatte regelverkskrav — så de raskt ser om
 * de allerede har tjenester å tilby, eller om det er et gap i katalogen.
 */

import { SERVICE_LIBRARY, type ServiceTemplate } from "@/lib/serviceLibrary";

export interface ServiceMatch {
  templateId: string;
  name: string;
  frameworks: string[]; // frameworkIds som overlapper med anbefalingene
}

/**
 * Returnerer inntil `limit` tjenester fra Mynders standardbibliotek som dekker
 * minst ett av de anbefalte regelverkene. Sortert etter antall dekkede
 * regelverk (flest først).
 */
export function matchServicesToFrameworks(
  recommendedFrameworkIds: string[],
  templates: ServiceTemplate[] = SERVICE_LIBRARY,
  limit = 6,
): ServiceMatch[] {
  const wanted = new Set(recommendedFrameworkIds);
  if (wanted.size === 0) return [];

  const matches: ServiceMatch[] = [];
  for (const t of templates) {
    const hits = t.mappings
      .map((m) => m.frameworkId)
      .filter((id) => wanted.has(id));
    if (hits.length > 0) {
      matches.push({
        templateId: t.id,
        name: t.name,
        frameworks: Array.from(new Set(hits)),
      });
    }
  }

  return matches
    .sort((a, b) => b.frameworks.length - a.frameworks.length)
    .slice(0, limit);
}
