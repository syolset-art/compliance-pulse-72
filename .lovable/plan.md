## Kontekst
Dette er en prototype for utviklere. Dagens domene er `mynder.no`, fremtidig `mynder.io`. Badge-snippet i `TrustProfilePublishing.tsx` peker i dag på en oppdiktet URL (`trust.mynder.com/{slug}`) som ikke ruter noe sted. Vi trenger en løsning som:

1. Faktisk fungerer i prototypen (lenken åpner riktig profil).
2. Er enkel å bytte fra `.no` til `.io` senere uten å endre komponentkode.
3. Gjør det tydelig for utviklere hvordan dette skal implementeres i prod.

## Endringer

### 1. Sentralisert public base URL
Ny fil `src/lib/publicTrustUrl.ts`:
- Eksporterer `PUBLIC_TRUST_BASE` som leses fra `import.meta.env.VITE_PUBLIC_TRUST_BASE`, med fallback til `window.location.origin` (slik at prototypen "bare funker" i preview/lokalt).
- Eksporterer hjelpefunksjon `buildPublicTrustUrl(assetId)` som returnerer `${PUBLIC_TRUST_BASE}/trust-engine/profile/${assetId}`.
- Kort JSDoc-kommentar som forklarer at prod bytter `VITE_PUBLIC_TRUST_BASE` fra `https://mynder.no` til `https://mynder.io` når domenet migreres, og at en evt. fremtidig `trust.mynder.io`-subdomene bare endres her.

### 2. Oppdater `src/components/asset-profile/TrustProfilePublishing.tsx`
- Fjern hardkodet `trust.mynder.com/${slug}`.
- Bruk `buildPublicTrustUrl(assetId)` for både visnings-URL, kopier-til-utklippstavle og badge-snippets (alle tre varianter: shield, minimal, banner).
- Legg til `?ref=badge-{type}` query-parameter på badge-lenker for fremtidig click-tracking (rent kosmetisk i prototypen, men viser intensjonen).
- Behold `slug`-logikken som dokumentasjon men ikke bruk den i URL ennå (prototypen ruter på assetId). Legg til en kort kommentar: "TODO prod: bytt til slug-basert ruting når public router støtter det."

### 3. Oppdater `src/pages/TrustCenterProfile.tsx`
- Samme: bruk `buildPublicTrustUrl(asset.id)` i den publiserte tilstanden (URL-raden + "Open public profile"-knappen).

### 4. Liten utviklernotat-banner
I "Website Badge"-fanen, legg til en diskret `text-xs text-muted-foreground` linje under code-snippet:
> "Prototype: lenke peker på `{base}/trust-engine/profile/{assetId}`. I prod byttes basis-URL til `mynder.io` via `VITE_PUBLIC_TRUST_BASE`."

Dette gjør det åpenbart for utviklere som leser koden hva som er prototype-oppførsel vs. prod-intensjon.

## Filer
- ny: `src/lib/publicTrustUrl.ts`
- endre: `src/components/asset-profile/TrustProfilePublishing.tsx`
- endre: `src/pages/TrustCenterProfile.tsx`

## Ikke i scope
- Faktisk routing av `mynder.no/...` eller `trust.mynder.io/...` til app (krever DNS/hosting-oppsett).
- Click-tracking endpoint (kun query-param plasseholder).
- Slug-basert public routing (krever ny route + asset-lookup på slug).
