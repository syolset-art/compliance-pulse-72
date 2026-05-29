## Mål

På `Fakturagrunnlag` skal vi tydelig skille mellom:

1. **Det Mynder fakturerer partneren** — deterministisk, basert på Core-tier + Leverandørmodul + aktiverte regelverk. Dette løper uansett om sluttkunden har akseptert partnerens tilbud eller ikke.
2. **Tilbudet partneren har levert til sluttkunden** — partnerens egen pris, kan komme fra eksternt tilbudssystem, og kan være «sendt», «akseptert» eller ukjent.

Dette gjør at partneren ser hva som koster dem penger hos oss, og hva de selv tar betalt — to forskjellige tall som ikke skal forveksles.

## Endringer i tabellen (`src/pages/MSPInvoices.tsx`)

Kolonnene blir, i rekkefølge:

```text
Kunde │ Core │ Leverandørmodul │ Regelverk │ Brukere │ Mynder kr/mnd │ Tilbud kr/mnd │ Tilbud
```

- **Mynder kr/mnd** (det vi heter «Kr/mnd» i dag): summen av Core + modul + regelverk. Vises som primær tallverdi. Liten hjelpetekst/tooltip: «Dette faktureres partneren av Mynder».
- **Tilbud kr/mnd** (ny): pris partneren har gitt sluttkunden. Under tallet en liten status-pill:
  - `Akseptert` (success) — sluttkunden har bekreftet
  - `Sendt — venter` (muted) — tilbud registrert, ikke bekreftet
  - `Ikke registrert` (warning) — partneren har ikke lagt inn noe tilbud
  Hvis ikke registrert: vis dash («—») i pris-cellen.
- **Tilbud** (erstatter «Avtale»): hvis tilbudsfil finnes → vis filnavn + ikon (samme som dagens lenke). Hvis ikke → en liten «Last opp tilbud»-knapp (UI-only, demo toast).
- Kolonnen «Tilbud sendt» (antall) fjernes — informasjonen flyttes til månedsheaderen og blir overflødig per rad.

«Brukere»-kolonnen beholdes, men flyttes til venstre for pris-kolonnene så de to pris-kolonnene står ved siden av hverandre og er lette å sammenligne.

### Måneds-header

Oppdateres til to tall side-om-side:

```text
Fakturagrunnlag (Mynder)   Tilbudt sluttkunde
   54 280 kr/mnd               72 500 kr/mnd
```

Slik ser partneren sin egen bruttomargin per måned. Hvis tilbudssum er ufullstendig (noen kunder mangler tilbud) vises en liten note: «3 kunder mangler tilbud».

### Topp-summering

«… kr/mnd totalt» splittes på samme måte: «X kr/mnd til Mynder · Y kr/mnd tilbudt sluttkunde».

## Datamodell-endringer (demo-data, samme fil)

`PartnerCustomer` får tre nye felt:

- `offerPriceKr: number | null` — partnerens tilbudspris til sluttkunden, `null` hvis ikke registrert
- `offerStatus: "accepted" | "pending" | "missing"`
- `offerDoc: { id: string; name: string } | null` — erstatter `agreement` semantisk i UI-en (kan beholde gammelt felt mappet over)

`offersSent`-feltet beholdes i data men vises ikke per rad.

## Hvorfor denne UX-en

- Partneren forstår umiddelbart at **Mynder-kolonnen er ikke-forhandlingsbar** — den utløses i det øyeblikk et regelverk aktiveres, uansett om sluttkunde-tilbudet er signert.
- Tilbudskolonnen er partnerens egen verden — de kan registrere pris og status manuelt (eller la den stå tom hvis tilbudet ligger i et eksternt system). Vi maser ikke om signatur; vi viser bare status.
- To kolonner ved siden av hverandre gir partneren et øyeblikkelig margin-bilde uten en egen «Rabatt»-kolonne (som kan bli misvisende når tallene har ulik betydning).

## Tekniske detaljer

- Ingen backend-endringer; alt er demo-data i `MSPInvoices.tsx`.
- Status-pill bruker eksisterende semantiske tokens (`bg-success/10`, `bg-warning/10`, `bg-muted`).
- Tooltip på «Mynder kr/mnd»-header forklarer formelen (Core + modul + regelverk).
- i18n: norsk strenger i tråd med eksisterende side (siden bruker hardkodet `nb-NO` allerede).
