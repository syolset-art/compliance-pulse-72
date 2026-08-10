# Fakturagrunnlag for Mynder (intern eiervisning)

I dag har eierdashbordet (`/mynder-admin`) en partnerkanal- og direktesalgsvisning som viser plan, moduler og MRR per kunde — men ingen fakturagrunnlag. Det finnes ingen linjenivå: hva ble aktivert, når, og hva summerer det seg til på fakturaen Mynder sender til hver partner eller direktekunde.

Denne planen legger til en egen fakturagrunnlag-side for Mynder selv.

## Ny side: Fakturagrunnlag

Ny fane «Fakturagrunnlag» i eierdashbordet, ved siden av Partnerkanal og Direktesalg (samme side, ingen ny rute i menyen).

**Periodevelger øverst:** måned (standard inneværende), med pil frem/tilbake.

**Toppsammendrag for valgt periode**
- Fakturagrunnlag totalt (eks. mva)
- Herav partnerkanal / herav direkte
- Antall fakturamottakere
- Nye aktiveringer i perioden

**To grupper under: Partnere og Direktekunder**

Hver mottaker vises som en sammenleggbar rad (samme uttrykk som dagens partnerkort):

```text
Sopra Steria  MSSP     3 kunder     Nye i mnd: 2     24 700 kr
  └─ Nordic Energy AS
       Mynder Core (inntil 100 systemer)   aktivert 15.01.2024   4 900 kr/mnd
       Leverandørmodul (inntil 150)        aktivert 02.03.2024   2 900 kr/mnd
       NIS2                                 aktivert 11.06.2026   500 kr/mnd   NY
       Sum kunde                                                  8 300 kr/mnd
  └─ ...
  Sum partner før provisjon                                      24 700 kr
  Partnerprovisjon 25 %                                          −6 175 kr
  Å fakturere partner                                            18 525 kr
```

- Linjer med aktiveringsdato i valgt periode merkes «NY».
- Linjer som er avviklet i perioden merkes «Avviklet» og faktureres ut perioden.
- Direktekunder får samme linjevisning, men uten provisjonsrader.

**Handlinger**
- Eksporter (CSV) — hele perioden, én rad per fakturalinje: mottaker, kunde, produkt/regelverk, aktivert dato, månedsbeløp.
- Eksporter per mottaker fra hver rad.

**Mobil:** kortliste med mottaker, sum og antall linjer; linjene vises når kortet åpnes.

## Teknisk

- Ny komponent `src/components/mynder-admin/InvoiceBasisView.tsx`, lagt inn som tredje fane i `src/pages/MynderAdminDashboard.tsx`.
- `src/components/mynder-admin/adminDemoData.ts` utvides med `BillingLine[]` per kunde: `{ id, label, kind: "module" | "framework" | "service", activatedAt, endedAt?, monthlyNok }`. Eksisterende `modules`/`frameworks`/`mrrNok` beholdes, og demolinjene genereres slik at summen matcher `mrrNok`.
- Ny hjelpefil `src/components/mynder-admin/invoiceBasis.ts` med periodefiltrering (`linesForPeriod`), summering per kunde/mottaker og provisjonsberegning fra `PartnerRow.commissionPct`.
- CSV-eksport bygges i klienten og lastes ned som blob — ingen backend.
- Gjenbruker `Table`, `Card`, `Badge` og talluttrykket (`tabular-nums`, «eks. mva») fra partner-fakturagrunnlaget for et likt visuelt språk.

Ingen databaseendringer — visningen bruker eksisterende admin-demodata.
