/**
 * Sentralisert public base URL for Trust Profile-lenker (badge, deling, kopier-lenke).
 *
 * Prototype: faller tilbake til `window.location.origin` slik at lenker funker i preview/lokalt.
 * Prod: sett `VITE_PUBLIC_TRUST_BASE` til f.eks. `https://mynder.no` i dag,
 *       og bytt til `https://mynder.io` (eller `https://trust.mynder.io`) når domenet migreres.
 *
 * All public URL-bygging skal gå via `buildPublicTrustUrl()` — ikke hardkod domener i komponenter.
 */
export const PUBLIC_TRUST_BASE: string =
  (import.meta.env.VITE_PUBLIC_TRUST_BASE as string | undefined) ??
  (typeof window !== "undefined" ? window.location.origin : "https://mynder.no");

/**
 * Bygger full public URL til en Trust Profile.
 * TODO prod: bytt til slug-basert ruting når public router støtter det
 * (f.eks. `${PUBLIC_TRUST_BASE}/t/${slug}`).
 */
export function buildPublicTrustUrl(assetId: string, ref?: string): string {
  const base = `${PUBLIC_TRUST_BASE}/trust-engine/profile/${assetId}`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
