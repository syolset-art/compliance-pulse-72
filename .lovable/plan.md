# Fakturagrunnlag bygget på faktiske kunder

Fakturagrunnlaget viser i dag hardkodede demokunder med kolonner for tilbud og tilbudsdokument. Det skal i stedet speile kundeoversikten og vise hva som faktisk er aktivert per kunde, hva det koster per måned, og hvilke fastprisleveranser som kommer i tillegg.

## Slik blir siden

**Toppsammendrag**
- Antall kunder med aktivt abonnement
- Totalt abonnement per måned (eks. mva)
- Fastpris/prosjekter i perioden (eks. mva)
- Knapper: Eksporter og Innstillinger (uendret)

**Kundetabell (samme uttrykk som kundeoversikten)**

| Kunde | Aktiverte produkter | Aktiverte regelverk | Tjenester | Abonnement/mnd | Fastpris |
|---|---|---|---|---|---|

- Kunde: navn + land/bransje som sekundærlinje, klikkbar til kundekortet
- Aktiverte produkter/regelverk/tjenester: samme pill-stil som «Aktivert»-kolonnen i kundeoversikten
- Abonnement/mnd: sum av aktive moduler og betalte regelverk
- Fastpris: sum av leverte fastprisposter fra kundens tilbud, ellers «—»
- Bunnrad med totalsum

**Mobil:** kortliste per kunde med de samme feltene, ikke tabell.

Kunder uten aktive produkter vises nederst med «Ingen aktive abonnement».

## Teknisk

- `src/pages/MSPInvoices.tsx` skrives om: fjerner demo-arrayet `customers` og henter ekte kunder med samme `msp_customers`-spørring som `MSPDashboard.tsx`.
- Månedsbeløp og linjer hentes fra `customerLicenseSummary(c)` i `src/lib/offerSuggestions.ts` (gir `monthly`, `lines`, `billedToDate`).
- Aktiverte elementer hentes fra `deriveActivatedFrameworks(c)`, `deriveActivatedProducts(c)` og `deriveActiveServices(c)`.
- Fastpris hentes fra `getOffersForCustomer(c.id)` i `src/lib/customerOffers.ts` — poster med engangs-/etableringsbeløp på leverte tilbud.
- Tabellen bruker `Table`-komponentene og `Badge`-stilen fra kundeoversikten for likt uttrykk.
- Gruppering per opprettelsesmåned utgår; sortering blir på abonnementsbeløp synkende.

Ingen databaseendringer.
