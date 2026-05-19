## Mål

"Veiledning fra Mynder" på MSP-kundeprofil (`/msp-dashboard/:customerId`) er i dag nesten en kopi av det kunden ser i sin egen Trust Profile — inkludert full aktivitetslogg og aktivitetsdrevet modenhetsgraf. Det gir partnere som Hult IT og 7Security lite ekstra verdi. Vi tar bort aktivitetsdelen og bygger om innholdet til en **partner-vinklet analyse av kundens modenhet, risiko og tjenestepotensial** — ting kunden ikke ser i sin egen TP.

## Hva fjernes

På fanen `guidance` i `src/pages/MSPCustomerDetail.tsx`:
- `<VendorActivityTab …>` (aktivitetslogg)
- "Modenhetsutvikling drevet av aktiviteter"-kortet med `<MaturityHistoryChart>` (den henger på aktivitetsdata kunden eier)
- `<DomainComplianceWidget hideHeader />` nederst (overlapper med modenhet per kontrollområde og hører hjemme på Trust Profile-fanen)

## Ny struktur på fanen (rekkefølge)

1. **Lara-anbefalingsbanner (beholdes)** — partner-handlinger, ikke kundens egne.
2. **Kunde-snapshot for partner** (nytt kort, `MSPCustomerSnapshotCard`)
   - Overall maturity (vektet) + delta siste 30 dager
   - Risk posture: kritiske gap, åpne avvik kunden ikke vet om
   - Compliance-press: hvilke krav/frister som nærmer seg
   - "Hva kunden ser vs. hva partner ser" — kort tekst som forklarer forskjellen
3. **Modenhet per kontrollområde** (beholdes — `MSPCustomerMaturityCard`)
   - Behold 4-domene visning, men legg på partner-overlay: per domene vis "din dekning som partner" (fra aktiverte tjenester i Tjenestekatalog) sammenlignet med kundens egen modenhet → tydelig gap-bar.
4. **Modenhet per regelverk — partner-perspektiv** (gjenbruker `FrameworkMaturityGrid` med ny prop `partnerView`)
   - Per rammeverk: kundens dekning, partnerens dekning via aktiverte tjenester, restgap i prosent og estimerte timer (henter `hoursByLevel` fra `frameworkCoverageCatalog`).
   - CTA per rad: "Lag tilbud på restgap" → MSPCreateOfferDialog forhåndsutfylt.
5. **Inntekts- og tjenestepotensial** (nytt kort, `MSPCustomerOpportunityCard`)
   - Aggregert: udekkede kontrollpunkter × timepris fra Tjenestekatalog = NOK-potensial.
   - Topp 3 anbefalte neste tjenester (Lara-prioritert ut fra kundens høyeste risiko).
6. **Sikkerhets- og personverninnsikt** (`VendorPrivacyAssessment` + `SecurityServiceGapCard` allerede tilgjengelig)
   - Vises kompakt; viser ting kunden ikke har gjort selv (DPIA mangler, savnet TIA, åpne tredjepartsrisikoer).
7. **Endringslogg fra Mynder** (lett erstatning for aktivitetsloggen)
   - Kun automatiske signaler relevante for partner: "Lara har oppdaget X", "Modenhet i Privacy falt 8% fordi …", "Nytt dokument klassifisert", "Frist på X om 14 dager".
   - Ikke kundens manuelle aktiviteter.

## Hvorfor dette gir partnerverdi

- Partneren får én skjerm som svarer på: *hva sliter kunden med, hva dekker jeg allerede, hva kan jeg selge inn, hva må jeg gjøre nå?*
- Innholdet er bevisst **forskjellig fra kundens egen TP**, så partner ser sin egen forretningsvinkel (gap-til-inntekt), ikke kundens daglige drift.
- Aktivitetsloggen finnes fortsatt på kundens egen TP (uendret), og partneren får i stedet et Mynder-generert "signal-feed".

## Tekniske endringer

Filer som endres:
- `src/pages/MSPCustomerDetail.tsx` — fjerne 3 blokker, sette inn de nye kortene i ny rekkefølge.

Nye filer:
- `src/components/msp/MSPCustomerSnapshotCard.tsx`
- `src/components/msp/MSPCustomerOpportunityCard.tsx`
- `src/components/msp/MSPMynderSignalsFeed.tsx`

Endringer i eksisterende:
- `MSPCustomerMaturityCard` — valgfri prop `partnerCoverageByDomain?: Record<Domain, number>` for sammenligningsbar.
- `FrameworkMaturityGrid` — valgfri prop `partnerView?: boolean` som vis dekning/gap/CTA-kolonne; default uendret.

Dataflyt:
- Partnerdekning per domene/rammeverk hentes fra eksisterende `frameworkCoverageCatalog` + aktiverte tjenester (`useActivatedServices`).
- Signaler hardkodes mot eksisterende demo-seed i første iterasjon (samme mønster som `MSPCustomerMessagesTab`).

Ingen schema- eller backend-endringer.

## Ut av scope

- Endringer på kundens egen Trust Profile (`AssetTrustProfile`).
- Endringer på fanene `Tjenester`, `Meldinger`, `Trust Profile` på MSP-kundeprofilen.
- Nye Supabase-tabeller eller migrasjoner.
