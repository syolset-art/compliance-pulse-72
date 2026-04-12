

# TPRM-status i leverandørprofilen — anbefaling

## Vurdering

TPRM (Third-Party Risk Management) status handler om **vår oppfølging av leverandøren** — altså ting som:
- Siste gjennomgang / due diligence-dato
- Status på DPA, SLA, risikovurdering
- Neste planlagte revisjon
- Overordnet TPRM-status (Godkjent / Under vurdering / Krever handling)

Dette er **intern kontekst** — det handler om hva *vi* gjør med leverandøren, ikke hva leverandøren selv leverer.

## Anbefaling: Plasser TPRM-status i **«Bruk & kontekst»**-fanen

Pedagogisk begrunnelse:

1. **«Veiledning fra Mynder»** = AI-drevet innsikt og modenhetsvurdering. TPRM-status er ikke veiledning, det er faktastatus.
2. **«Bruk & kontekst»** er allerede merket som «vår organisasjon» — TPRM-status er nettopp *vår* håndtering av leverandøren. Det er naturlig å se «hvordan bruker vi denne leverandøren» sammen med «hvordan følger vi dem opp».
3. Alternativet «Revisjon» overlapper tematisk, men revisjon er én aktivitet innenfor TPRM. TPRM-status er bredere og bør være synlig uten å måtte lete i en revisjonsfane.

## Teknisk plan

1. **Opprett `VendorTPRMStatus.tsx`** — ny komponent med:
   - Overordnet TPRM-status badge (Godkjent / Under vurdering / Krever handling)
   - Siste due diligence-dato og neste planlagte revisjon
   - DPA-status, SLA-status, risikovurdering-status (kompakte statuslinjer)
   - Ansvarlig person

2. **Integrer i `VendorUsageTab.tsx`** — legg TPRM-statuspanelet som en egen seksjon øverst eller like under brukskonteksten, med overskriften «TPRM-status» og et Shield-ikon.

3. **Datakilde**: Hent fra eksisterende `assets`-metadata og `vendor_documents` for DPA/SLA-status, samt `tasks` for oppfølgingspunkter.

