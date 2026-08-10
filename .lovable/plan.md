# Fakturagrunnlag: skille Mynder-eier og MSP-partner

To ulike fakturagrunnlag med ulikt formål:

- **MSP-partner** (`/msp-invoices`): hva partneren faktureres for, per egen kunde.
- **Mynder (eier)**: alle partnere med deres kunder, pluss direktekunder uten partner, med provisjonssats per partner.

## 1. Partnerens fakturagrunnlag (/msp-invoices)

Kolonnerekkefølge endres slik at abonnementet kommer rett før mva:

```text
Kunde | Aktiverte produkter og regelverk | Abonnement/mnd | Fastpris og etablering | Mva | Total inkl. mva
```

- «Fastpris» og «Etablering» slås sammen til én kolonne med engangsbeløp. Under tallet vises en liten oppdeling (f.eks. «fastpris 25 000 · etablering 5 000») når begge finnes; tom celle («—») når kunden ikke har noen av delene.
- Abonnement/mnd står umiddelbart før mva-kolonnen.
- Mva-sats og etikett følger partnerens innstilling som i dag (mva/VAT/moms).
- Mobilkortene får samme rekkefølge og samme sammenslåtte engangslinje.
- Toppsammendraget beholdes, men «Fastpris / prosjekter» endres til «Engangsbeløp» (fastpris + etablering).

Ingen provisjonsinformasjon vises her — partneren ser kun det de skal betale Mynder.

## 2. Mynders fakturagrunnlag (Eierdashbord → Fakturagrunnlag)

Utvides fra dagens visning:

- **Partnere**: hver partner er en fakturamottaker med sine kunder under seg. Ny kolonne/rad i mottakerkortet: **Partnersats %** — hvor stor andel av abonnementet partneren beholder. Standard 20 %, men satsen er redigerbar per partner direkte i visningen (ikke hardkodet), og lagres lokalt slik at endringen holder seg mellom besøk. Endres satsen, oppdateres provisjonsbeløp og «Å fakturere» umiddelbart.
- Oversiktstabell øverst i partnerseksjonen: Partner | Antall kunder | Abonnement/mnd | Sats % | Provisjon | Å fakturere.
- **Direktekunder**: egen seksjon som i dag, uten provisjon, med eget delsum-kort.
- Nytt nøkkeltall i sammendraget: **Andel direktesalg** (direkte omsetning i prosent av total), ved siden av dagens totaler.
- CSV-eksporten får med kolonnene sats % og provisjon for partnermottakere.

## Teknisk

- `src/pages/MSPInvoices.tsx`: kolonneomorganisering, sammenslått engangskolonne (`fixed + setup`), samme i mobilkort og totalrad.
- `src/components/mynder-admin/invoiceBasis.ts`: provisjonssats leses fra en ny, overstyrbar kilde i stedet for kun `PARTNERS[].commissionPct` — standard 20 % med per-partner-overstyring lagret i localStorage; hjelpere for lesing/skriving og for andel direktesalg. `buildCsv` utvides med sats og provisjon.
- `src/components/mynder-admin/InvoiceBasisView.tsx`: partneroversiktstabell, inline redigering av sats, nytt nøkkeltall for andel direktesalg.
- Ingen databaseendringer; visningene bygger på eksisterende data og demodata.
