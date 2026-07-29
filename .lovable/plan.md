# Transparens: AI-generert kobling mellom tjenester og krav

Alle koblinger mellom tjenester (oppgaver) og regelverk/artikler/krav er foreslått av en AI-agent (Lara) basert på nøkkelord og kontrollpunktbeskrivelser. De er ikke verifisert av mennesker, og forholdet er ikke 1:1 — én tjeneste kan dekke flere krav, og ett krav kan dekkes helt, delvis eller sammen med andre tiltak. Dette må kommuniseres tydelig, men elegant, der koblingen faktisk vises.

## Hvor det skal formidles

Fire overflater viser AI-koblinger og trenger konsistent transparens:

1. **`ServiceCoverageSearch.tsx`** — søkeresultattabellen (Regelverk / Krav / Kontrollpunkt / Treff)
2. **`MSPServiceCatalogTab.tsx`** — «Alle»-fanens header og «Mine»-liste når en tjeneste viser antall koblede krav
3. **`ServiceTableRow.tsx` / kravlister på tjenestekortet** — når brukeren utvider en tjeneste og ser koblede kontrollpunkter
4. **`CustomerRecommendationsPanel.tsx` / `MSPMaturityServiceMatrix.tsx`** — når anbefalte tjenester matches mot kundens regelverk

## Løsning

### 1. Én gjenbrukbar komponent
Ny `src/components/msp/AiMappingDisclosure.tsx`:
- **Variant `inline`** — liten `Sparkles` + tekst «AI-forslag» med `Tooltip`/`HoverCard` som forklarer i én-to setninger.
- **Variant `banner`** — subtil linje øverst i seksjoner: liten ikon + «Forslag fra Lara — ikke verifisert av menneske. Én tjeneste kan dekke flere krav, og ett krav kan kreve flere tiltak.» Med «Les mer»-lenke som åpner en `Popover` med lengre forklaring.
- **Variant `icon`** — kun `Info`-ikon med tooltip, for kompakte steder (tabellheader).

Tekst (norsk, kort):
> «Koblingene mellom tjenester og krav er foreslått av Lara basert på beskrivelser og nøkkelord. De er ikke verifisert av mennesker, og forholdet er ikke 1:1 — én tjeneste kan dekke flere krav, og ett krav kan kreve flere tiltak. Kvalitetssikre før tilbud sendes.»

Engelsk versjon speiles for i18n-kompatibilitet (om nøkler brukes).

### 2. Plassering
- **`ServiceCoverageSearch.tsx`**: `banner`-variant rett over resultattabellen når det finnes treff. `icon`-variant i «Treff»-kolonnens header som ekstra kontekst.
- **`MSPServiceCatalogTab.tsx`** («Alle»-fanen): `banner`-variant i den eksisterende infoblokken «Velg tjenester til din katalog» — utvid teksten med AI-disclaimer.
- **`MSPServiceCatalogTab.tsx`** («Mine»-fanen): `icon`-variant ved siden av kolonneoverskriften «Tjeneste» eller i tellen «X koblede krav» på hver rad.
- **`ServiceTableRow.tsx`** (utvidet visning av koblede kontrollpunkter): `inline`-variant øverst i listen med kravene.
- **`CustomerRecommendationsPanel.tsx` / `MSPMaturityServiceMatrix.tsx`**: `banner`-variant øverst — matchen mot kundens regelverk er også AI-basert.

### 3. Visuell stil
- Bruk `Sparkles` (Lara-ikon) + `Info` konsistent — matcher eksisterende Lara-mønster.
- `text-muted-foreground text-xs` for banner-tekst, ingen boks/border — hold det luftig.
- Tooltip/Popover: `max-w-xs`, samme innhold uansett variant.

## Utenfor scope
- Ingen endring i selve matchings-algoritmen.
- Ingen ny «verifiser kobling»-flyt (kan foreslås senere hvis ønsket).
- Ingen endringer på kundeside — kun MSP-partnerflaten.
