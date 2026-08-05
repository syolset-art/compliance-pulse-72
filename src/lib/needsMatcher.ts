// Behovsanalyse-matcher: finn hvilke kunder som matcher et sett regelverk.
// Deterministisk demo-logikk (localStorage + regelbasert anbefaler).

import { recommendFrameworks } from "@/lib/regulationRecommender";

const FW_STORAGE_PREFIX = "msp.customer.activatedFrameworks.";

export interface CustomerFrameworkMatch {
  customer: any;
  customerId: string;
  customerName: string;
  /** Valgte regelverk kunden allerede har aktivert */
  activatedIds: string[];
  /** Valgte regelverk som er anbefalt, men ikke aktivert */
  recommendedIds: string[];
  /** activated + recommended */
  matchCount: number;
}

export function loadActivatedFrameworkIds(customerId: string, fallback: string[] = []): string[] {
  try {
    const raw = localStorage.getItem(FW_STORAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === "string") return parsed as string[];
        return (parsed as Array<{ id: string }>).map((r) => r.id);
      }
    }
  } catch {}
  return fallback;
}

function customerActivated(c: any): string[] {
  const inline: string[] = Array.isArray(c?.active_frameworks)
    ? c.active_frameworks
    : Array.isArray(c?.frameworks)
      ? c.frameworks
      : [];
  return loadActivatedFrameworkIds(c?.id ?? "", inline);
}

function customerRecommended(c: any): string[] {
  try {
    return recommendFrameworks({
      countryCode: c?.country_code || "NO",
      industryCode: c?.industry_code ?? null,
      industryLabel: c?.industry ?? null,
      employees: c?.employees ?? null,
      businessDescription: c?.business_description ?? null,
    }).map((r) => r.frameworkId);
  } catch {
    return [];
  }
}

export function matchCustomersToFrameworks(
  customers: any[],
  frameworkIds: string[],
  minMatches = 1,
): CustomerFrameworkMatch[] {
  if (frameworkIds.length === 0) return [];
  const selected = new Set(frameworkIds);

  return customers
    .map((c) => {
      const activated = customerActivated(c).filter((id) => selected.has(id));
      const activatedSet = new Set(activated);
      const recommended = customerRecommended(c).filter(
        (id) => selected.has(id) && !activatedSet.has(id),
      );
      return {
        customer: c,
        customerId: c.id,
        customerName: c.customer_name || "Ukjent kunde",
        activatedIds: activated,
        recommendedIds: recommended,
        matchCount: activated.length + recommended.length,
      };
    })
    .filter((m) => m.matchCount >= minMatches)
    .sort(
      (a, b) =>
        b.recommendedIds.length - a.recommendedIds.length ||
        b.matchCount - a.matchCount ||
        a.customerName.localeCompare(b.customerName, "nb-NO"),
    );
}
