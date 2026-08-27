# Mynder Admin-modus: partnere, avtaler, fakturagrunnlag og prosjekter

Målet er ett internt dashbord for Mynder (kun grunnleggere/ledelse) hvor dere har full kontroll på partnere, prosentsatser, avtaler, fakturaer, egne sluttkunder (MCP-produkter) og prosjekter. Samtidig låses partnerens egen mulighet til å endre prosentsatsen.

## 1. Partneren mister redigeringsretten

På partnerens side `/msp-billing` blir kortet «Partneravtale» skrivebeskyttet:
- Prosentsats, avtalens startdato og avtalereferanse vises som lesefelter.
- Kort forklaring: «Partnerandelen er avtalt med Mynder og kan ikke endres her. Ta kontakt med Mynder for endringer.»
- Regnestykket (din andel / Mynder fakturerer deg) beholdes uendret.
- Feltene fjernes fra lagringen partneren sender inn.

## 2. Mynder Admin-modus (utvidelse av `/mynder-admin`)

Eksisterende eierdashbord bygges ut med tydelig «Admin-modus»-merking og nye arkfaner:

```text
Eierdashbord (Mynder Admin)
├─ Partnere            (ny)   – alle partnere, sats, avtale, historikk
├─ Fakturagrunnlag     (finnes) – vårt grunnlag mot partnere
├─ Fakturaer           (ny)   – sendte fakturaer til partnere + historikk
├─ Direktekunder       (finnes) – utvides med MCP-produkter
└─ Prosjekter          (ny)   – kundeprosjekter med periode og pris
```

### Partnere
Tabell med: partner, type, land, antall kunder, MRR, **partnerandel %**, avtalestatus og siste endring. Klikk på en rad åpner et panel med:
- Redigering av partnerandel (kun Mynder), med begrunnelse og virkningsdato.
- **Avtalehistorikk**: hver satsendring logges med dato, gammel/ny sats, hvem som endret og notat.
- **Partneravtale-verifisering**: ikke et dokument i UI, men en status «Avtale verifisert av agent» med dato, hvem/hva som verifiserte, og en lenke «Åpne partneravtale» til ekstern URL. Ikke-verifisert vises tydelig som mangel.

### Fakturaer til partnere
Liste per partner og periode: periode, abonnementsgrunnlag, partnerandel, beløp fakturert av Mynder, status (kladd/sendt/betalt) og dato. Utvidbar rad viser månedshistorikk. Filtrering på partner og år, samt eksport.

### Direktekunder og MCP-produkter
Direktesalg-visningen utvides med kolonne for tilkoblede MCP-produkter:
- **Mynder Regulation** (aktiv)
- **Canvas Regulation** (kontinuerlig compliance på aktiverte produkter — merkes «kommer»)
Viser tilkoblingsstatus og når kunden koblet seg til.

### Prosjekter
Nytt register over prosjekter Mynder kjører mot kunder: kunde, prosjektnavn, tilknyttet avtale, startdato, sluttdato, pris, status (planlagt/pågår/levert) og ansvarlig. Sum av prosjektinntekter vises i toppen sammen med MRR.

## 3. Tilgang

Samme vakt som i dag: kun `super_admin` og `daglig_leder` (dere to). Ingen partner- eller kunderolle får tilgang.

## Teknisk

- Ny tabell `partner_agreements` (partner, share_pct, gyldig fra/til, avtale-URL, verifisert av agent + tidspunkt, notat) og `partner_agreement_events` for historikk — begge med GRANTs og RLS som kun tillater `super_admin`/`daglig_leder`.
- Ny tabell `mynder_projects` (kunde, navn, start, slutt, pris, status, ansvarlig) med samme RLS-mønster.
- Partnerfakturaer bygges i første omgang på eksisterende `msp_invoices`/abonnementsgrunnlag; mangler data, vises tydelig nøytrale demo-/tomtilstander framfor oppdiktede tall.
- `msp_billing_settings.partner_share_pct` blir kilden partneren leser, men skrives kun fra admin.
- Nye komponenter under `src/components/mynder-admin/`: `PartnersView.tsx`, `PartnerAgreementPanel.tsx`, `PartnerInvoicesView.tsx`, `MynderProjectsView.tsx`; `MynderAdminDashboard.tsx` får de nye arkfanene.
