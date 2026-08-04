# Kundetabell: rette kolonneoverskrifter + salgbare anbefalinger

## Problem

I kundetabellen på partner-dashbordet blir "Kunde"-kolonnen strukket ut, så overskriften "Kunde" havner langt fra "Land". Overskriftene har også litt ulik styling (sorteringsknapp vs. filterknapp vs. tooltip-tekst), som gir ujevn linje.

## Slik blir det

**1. Rette overskrifter**
- Alle overskriftene bruker samme skriftstørrelse, vekt og høyde, og står på samme grunnlinje.
- "Kunde" får en fast, moderat bredde slik at den ikke strekkes ut; overskuddsplassen går til den nye kolonnen.
- "Modenhet" står fortsatt høyrejustert.

**2. Ny kolonne: "Anbefalte produkter og tjenester"**
Plasseres rett etter Regelverk, med opptil 3 klikkbare forslag per kunde, for eksempel:
- Regelverk som bør aktiveres (f.eks. "Aktiver NIS2")
- "Modenhetsvurdering" når kunden mangler score
- "Penetrasjonstest" ved ISO 27001 eller moden nok kunde
- "Mynder Core" når kunden ikke har grunnmodulen
- "Leverandørmodul" for kunder med mange leverandører / kritisk bransje

Klikk på et forslag markerer det (uten å åpne kunden), og når minst ett er valgt dukker en liten "Tilbud (n)"-knapp opp i cellen. Den åpner tilbudsdialogen ferdig utfylt med kunde og de valgte punktene som oppgaver. Ett enkelt klikk på "Tilbud" med kun én markering går rett til tilbudet — maks to klikk fra tabell til tilbud.

Kolonnen kan skrus av/på i "Kolonner"-menyen som de andre, og skjules automatisk på små skjermer.

## Teknisk

- `src/pages/MSPDashboard.tsx`:
  - Legg `recommendations` inn i `ColumnKey`-typen, `COLUMN_LABELS`, `COLUMN_ORDER` (etter `frameworks`) og `COLUMN_MIN_BP` (1024). Bump `COLUMN_STORAGE_KEY` til `_v3` så eksisterende brukere får kolonnen synlig.
  - Ny helper `deriveOfferSuggestions(c)` som returnerer `{ id, label, kind: "framework" | "service" | "module", hours }` basert på `recommended_frameworks`, `active_frameworks`, `compliance_score`, `industry` og `subscription_plan`.
  - Ny lokal state `offerSelection: Record<customerId, string[]>` og `offerFor: customer | null`.
  - Ny celle rendrer chips (`Badge` som `button`, `stopPropagation`) med valgt/uvalgt-tilstand via `bg-primary/10 border-primary/40` vs. `bg-muted`.
  - Render `MSPCreateOfferDialog` nederst i siden med `customerId`, `customerName`, `serviceTitle`, `offeredServiceNames` og `defaultTasks` bygget fra valgte forslag (samme mønster som `MSPOpportunities.tsx`).
  - Normaliser `TableHead`-innholdet: felles `inline-flex items-center gap-1.5 text-sm font-medium h-8`; sett `w-[200px]` på kunde-kolonnen og `min-w-[220px]` på den nye kolonnen.
- Ingen backend-endringer; anbefalingene utledes i frontend fra eksisterende kundedata.
