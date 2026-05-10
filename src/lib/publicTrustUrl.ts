/**
 * Sentralisert public base URL for Trust Profile-lenker (badge, deling, kopier-lenke).
 *
 * Public URL-format: `https://trust.mynder.no/{slug}` (i dag .no, .io på sikt).
 * Override via `VITE_PUBLIC_TRUST_BASE` ved behov (f.eks. staging/preview).
 *
 * All public URL-bygging skal gå via `buildPublicTrustUrl()` — ikke hardkod domener i komponenter.
 */
export const PUBLIC_TRUST_BASE: string =
  (import.meta.env.VITE_PUBLIC_TRUST_BASE as string | undefined) ??
  "https://trust.mynder.no";

/**
 * Lager en URL-vennlig slug fra et navn, med valgfri unik suffix-kode
 * (f.eks. siste 4 siffer av org.nr) for å unngå kollisjon mellom like navn.
 */
export function buildSlug(name: string, uniqueCode?: string): string {
  const base = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9æøå\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const suffix = uniqueCode ? `-${uniqueCode.replace(/\s/g, "").slice(-4)}` : "";
  return `${base}${suffix}`;
}

/**
 * Bygger full public URL til en Trust Profile basert på slug.
 * `ref` legges på som query-param for fremtidig click-tracking (f.eks. badge-shield).
 */
export function buildPublicTrustUrl(slug: string, ref?: string): string {
  const base = `${PUBLIC_TRUST_BASE}/${slug}`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
