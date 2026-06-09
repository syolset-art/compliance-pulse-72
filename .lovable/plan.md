## Mål
På Trust Profile: erstatt boksen "Sammendrag" (4 talloppsummeringer) med "Etterlevelse" (regelverk/krav virksomheten følger), og bruk plassen i hero-banneret (der Etterlevelse ligger nå) til en kort beskrivelse av virksomheten.

## Endringer

### 1) `src/components/trust-center/profile/TrustProfileHero.tsx`
- Fjern hele "Compliance frameworks"-boksen (linje 161–194) under firmanavnet.
- Erstatt den med en tekstblokk som viser `description` (virksomhetsbeskrivelse):
  - Bruk samme avstand (`mt-5`), uten kort/border — ren brødtekst i `text-sm text-muted-foreground leading-relaxed`, maks ~3 linjer (line-clamp-3) for å holde hero kompakt.
  - Tom tilstand: liten kursiv tekst "Ingen beskrivelse lagt til ennå" / "No description added yet" (kun synlig for eier — props finnes ikke ennå, så vis bare når `description` finnes; ellers vis ingenting for å unngå rot).
- Behold props uendret (`frameworks`, `isStandard` blir ubrukte her — fjernes fra hero-bruken, men beholdes i interfacet for nå for å unngå bredere refaktor; alternativt fjernes hvis ingen andre kallsteder bruker dem).

### 2) `src/pages/TrustCenterProfile.tsx`
- I "Summary"-seksjonen (linje 838–857):
  - Endre overskrift fra "Sammendrag/Summary" til "Etterlevelse/Compliance".
  - Bytt ikon fra `Zap` til `Scale` (eller `BookCheck`) for å matche regelverk-semantikken.
  - Erstatt 4-kolonners stats-grid med en pille-liste over `recognizedFrameworks` (samme datakilde som hero brukte), med samme fargelogikk som `frameworkChipClass` i hero. Hver pille viser ikon (BookCheck for standard, Scale ellers) + navn, klikk scroller til `#tc-section-maturity`.
  - Tom tilstand: "Ingen regelverk publisert ennå" / "No frameworks published yet".
- Sjekk om samme "Sammendrag"-blokk gjentas rundt linje 1971 (i en annen render-gren) og oppdater tilsvarende der.

### 3) Datasamsvar
- `recognizedFrameworks` brukes allerede i Summary-blokken (count). Gjenbruk listen direkte for pillene.
- `frameworkChipClass` flyttes til en liten delt helper i `src/lib/frameworkChipClass.ts` slik at både hero (hvis senere) og profil-siden kan bruke den uten duplisering.

## Resultat
- Hero under firmanavn: kort virksomhetsbeskrivelse.
- Lenger ned på siden (der "Sammendrag" var): "Etterlevelse / Compliance" med klikkbare regelverk-piller som scroller til modenhetsseksjonen.
- Ingen endringer i datamodell eller backend.