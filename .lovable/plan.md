## Mål
På «Alle»-fanen skal informasjonen som i dag ligger skjult i info-tooltipen bak Sparkles-ikonet være synlig på siden, slik at partneren umiddelbart forstår hva de ser og at de kan tilpasse/legge til egne tjenester.

## Endring i `src/components/msp/MSPServiceCatalogTab.tsx`

Legg til en liten, subtil header-blokk øverst i `<TabsContent value="alle">` (rett før «Foreslåtte tjenester»-section), ca. slik:

```
Mynders tjenestekatalog
Dette er tjenester du som partner kan tilby kundene dine. Lara foreslår
tjenester basert på partnerprofilen din – du kan tilpasse hvilke som vises,
eller beskrive dine egne tjenester og legge dem til i din katalog.
```

- Én tittel (`text-sm font-medium`) + én kort forklaring (`text-xs text-muted-foreground`, maks 2 linjer).
- Ingen kort/ramme – holdes flat og stram, i tråd med Apple-minimal-stilen.
- Plassering: rett under `TabsList`, over knappene «La Lara foreslå tjenester» / «Beskriv egen tjeneste».

## Følgeendring
- Tooltip-innholdet bak Sparkles-ikonet kortes ned til bare «Se og rediger tjenesteprofilen din» (tittel), siden den lengre forklaringen nå står synlig på siden – unngår duplisert tekst.
- Ingen andre komponenter berøres. Ingen logikk-endring.

## Verifisering
- Visuell sjekk i preview på `/msp-services` → fane «Alle»: header synlig, tooltip forkortet, layout uendret ellers.
