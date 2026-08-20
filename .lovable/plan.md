# Balansere Bruk og kontekst

Venstre og høyre kort deles etter mening, ikke etter antall.

## Ny fordeling

```text
VENSTRE (pill-kort)          HØYRE (relasjon og bruk)
- Kritikalitet               - GDPR-rolle
- Prioritet                  - Relasjonskategori
- Risikonivå                 - Hva brukes leverandøren til?
```

Venstre kort blir «Vurdering» (3 pills, jevn 2+1-rad). Høyre kort samler relasjonen til leverandøren: hvem vi er i personvernsammenheng, hva slags leverandør det er, og hva de faktisk gjør for oss.

## Hvordan det ser ut

- Høyre kort får to kompakte pill-rader øverst (GDPR-rolle og Relasjonskategori) med samme utseende og utvidbare paneler som i dag, og bruksbeskrivelsen under.
- Lara/Sara-forslag for GDPR-rolle og relasjonskategori beholdes uendret, bare flyttet med.
- Mobil/brett: alt stables i samme rekkefølge — vurdering først, deretter relasjon og bruk.

## Teknisk

- `ContextPillRow.tsx` gjenbrukes for begge kortene (den håndterer allerede ulikt antall elementer).
- `VendorUsageTab.tsx`: del `pillItems` i `assessmentPills` (criticality, priority, risk) og `relationPills` (gdpr, relation). Én felles `openPill`-state så bare ett panel er åpent om gangen.
- `VendorPurposeCard.tsx` får en valgfri `headerSlot`/`topContent`-prop som rendrer relasjonspillene over «Hva brukes leverandøren til?», slik at de ligger i samme kort.
- Ingen endring i datamodell, lagring eller forslagslogikk.
