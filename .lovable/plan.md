# Kompakt kartlegging + tydelig forhåndsutfylling

## Mål
1. Når brukeren har oppgitt hjemmeside, skal steg 3 vise tydelig hva Lara har forhåndsutfylt fra kartleggingen.
2. Selve kartleggingsanimasjonen (steg 2) skal være en kompakt prosessindikator — ikke en stor liste som tar over hele siden.

## Endringer

### 1. Steg 2 — kompakt prosessvisning (`ScanStep`)
Erstatt dagens store kort + liste over alle findings med en liten, rolig progress-stripe:

- Ett enkelt kort (én linje høyt) med:
  - Lara-avatar / spinner til venstre, som blir grønt hak når ferdig
  - Status-tekst: «Lara kartlegger {domene}…» → «Ferdig — fant {n} områder»
  - Tynn progress-bar under teksten
- Under kortet: én roterende mikrolinje som viser hva som skannes akkurat nå (bytter hvert ~600 ms blant findings: «Henter personvernerklæring…», «Ser etter sikkerhetskontakt…», «Sjekker underleverandører…»). Vises som liten muted tekst med en liten ikonprikk — ikke som kort.
- Når skanning er ferdig: erstatt mikrolinjen med én kort oppsummeringslinje: «Fant {found} områder · {missing} mangler — alt er forhåndsutfylt i neste steg.»
- Fjern: den fulle findings-listen og det store success-kortet.
- Beholdes: samme `revealed/progress`-state og `SCAN_STEPS_MS` (driver bare animasjonen, ikke en lang liste).

Resultat: steg 2 tar ~120 px loddrett i stedet for å fylle hele dialogen.

### 2. Steg 3 — synliggjør forhåndsutfylling (`ConfirmStep`)
Forhåndsutfylling skjer allerede i `useEffect` etter scan (linje 275-311), men brukeren ser ikke at feltene er forhåndsutfylt. Legg til:

- Banner øverst (kun når `hasWebsite === "yes"` og scan finnes): liten Lara-stripe — «Lara fylte ut dette fra {domene}. Endre det du vil.» Skjules ved `hasWebsite === "no"`.
- Per felt som er prefilled fra scan: liten muted hint under feltet — «Fra {kilde}» (f.eks. «Fra personvernerklæring», «Fra kontaktside»). Bruk `laraSources` (finnes allerede) — vi mapper inn kilder for beskrivelse, kontakter, personvern.
- Liten Sparkles-ikon-badge på label når feltet kommer fra Lara, så brukeren ser hva som er auto-fylt vs. tomt.
- Når `hasWebsite === "no"`: feltene er tomme, ingen banner, ingen «Fra …»-hint — vanlig manuell utfylling.

### 3. Props til `ConfirmStep`
Send inn `hasWebsite`, `website` og et lite `prefillSources`-objekt (avledet fra `scan` + `laraSources` i parent) slik at komponenten vet hva som kom fra Lara per felt.

## Filer som endres
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`
  - Skrive om `ScanStep` (linje ~1012-1078) til kompakt variant
  - Utvide `ConfirmStep` (linje ~1093-1143) med banner + per-felt «Fra …»-hint og Sparkles-badge
  - Sende `hasWebsite`, `website`, `scan` (eller avledet sources-map) som props til `ConfirmStep` (rundt linje 559)

Ingen endringer i `demoTrustActivation`, `vendorCatalog` eller andre filer.
