## Mål
Siden `/trust-engine/profile/:assetId` skal føles som en åpen, verifisert og sikker visning av leverandørers Trust Profile — slik kunder/besøkende ser den fra Mynder.no.

## Endringer

### 1. `src/components/trust-center/PublicTrustCenterLayout.tsx`
- **Fjern "Del profilen"** fra sidemenyen (`navItems`) og fjern hele `share`-seksjonen i hovedinnholdet (inkl. lenkekopi, LinkedIn/Facebook/E-post-knapper og tilhørende imports: `Share2`, `Linkedin`, `Facebook`, `Mail`, `Copy`, `toast`).
- **Legg til "Slik ser andre profilen din"-banner** øverst (kun synlig kontekst-banner over header eller rett under) som forklarer: «Dette er den offentlige visningen av Trust Profilen — slik kunder og partnere ser den på Mynder.no.»
- **Verifiserings-badge** ved siden av organisasjonsnavnet/headeren: liten pille med `ShieldCheck` + tekst «Verifisert og kryptert av eier» (tooltip: «Innholdet er signert og bekreftet av profileieren via Mynder Trust Engine.»).
- **Footer (ny komponent i samme fil eller egen `PublicTrustFooter.tsx`)**:
  - Mynder-logo + lenke til `https://mynder.no`
  - Tekst: «Trust Engine drives av Mynder — den europeiske standarden for digital tillit.»
  - Sekundære lenker: Personvern, Vilkår, Kontakt (placeholder `https://mynder.no/...`)
  - Liten `ShieldCheck`-rad: «Alle profiler er publisert frivillig av eieren og verifisert av Mynder.»
  - Copyright © {år} Mynder.

### 2. `src/pages/TrustEngine.tsx` (søkesiden — "tilbake til søk")
- **Fjern "Publisert"-pillen** på hvert resultatkort (Badge med `Shield` + "Publisert" inne i `results.map`).
- **Legg til verifiserings-tillit i hero-seksjonen**: under undertittelen, en rad med 2–3 ikoner+tekst:
  - `ShieldCheck` — «Verifiserte profiler»
  - `Lock` — «Kryptert og signert av eier»
  - `CheckCircle2` — «Frivillig publisert av leverandøren»
- **Liten støttetekst** rett over resultatlisten: «Alle organisasjoner her har selv valgt å publisere sin Trust Profile. Innholdet er kryptert og verifisert.»
- **Footer** — samme footer-komponent som over, gjenbrukes nederst på `/trust-engine`.

### 3. Ny delt footer-komponent
`src/components/trust-center/PublicTrustFooter.tsx` — gjenbrukes på både `TrustEngine.tsx` og `PublicTrustCenterLayout.tsx` for konsistens.

## Designprinsipper
- Bruk eksisterende semantiske tokens (`text-primary`, `border-border`, `bg-muted/30`, `text-success` for verifiseringsmerker).
- Subtile ikoner (`ShieldCheck`, `Lock`, `BadgeCheck`) i primary-fargen.
- Footer: rolig, lys bakgrunn (`bg-card/50 border-t`), kompakt — ikke konkurrer med innholdet.
- Ingen nye avhengigheter.

## Filer som endres
- `src/components/trust-center/PublicTrustCenterLayout.tsx` (fjerne share, legge til banner + verifisert-badge + footer)
- `src/pages/TrustEngine.tsx` (fjerne publisert-pille, tillit-rad i hero, footer)
- `src/components/trust-center/PublicTrustFooter.tsx` (ny)
