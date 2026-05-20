# Land/jurisdiksjon-velger på Regulations

I dag vises regelverk for ett land (default). Vi lar brukeren utvide til flere land via en lett "Ekspansjon"-flyt, med støtte for et kuratert sett land. Andre land = support-forespørsel.

## Omfang
- Side: `src/pages/Regulations.tsx`
- Nye komponenter under `src/components/regulations/`:
  - `CountryScopeBar.tsx` – chip-rad med aktive land + knapp "Endre land"
  - `CountryScopeDialog.tsx` – dialog med 3 steg (modus → land → filterspørsmål → forslag)
  - `RequestCountrySupportDialog.tsx` – sender forespørsel for ikke-støttede land

## Støttede land (fase 1)
Norge (default), Sverige, Nederland, Australia, Storbritannia. Andre = "Be om støtte" (leveres på noen dager).

## UX-flyt
1. På Regulations vises en `CountryScopeBar` øverst:
   - Chips: "🇳🇴 Norge" (default) + evt. lagt til land
   - Knapp: "Endre land" → åpner `CountryScopeDialog`
2. Dialog steg 1 – Modus:
   - "Kun ett land" / "Flere land (ekspansjon)"
3. Dialog steg 2 – Velg land:
   - Chips for støttede land + "+ Legg til land" (åpner `RequestCountrySupportDialog` for ikke-støttede)
   - Lara-hint: "Foreslår regelverk basert på valgene"
4. Dialog steg 3 – Filterspørsmål (kun for "Flere land"):
   - "Behandler dere helseopplysninger?" Ja/Nei
   - "Betalingstjenester eller finansiell rådgivning?" Ja/Nei
   - "Kritisk infrastruktur (energi, transport, telekom)?" Ja/Nei
   - "Hopp over" og "Vis forslag →"
5. Resultat: dialogen returnerer foreslåtte framework-id-er; eksisterende `FrameworkChipSelector`/aktiveringsflyt brukes for å skru dem på. Ingen endring i datamodell.

## Forslagslogikk (frontend-only)
Mapping land → framework-ids fra `frameworkDefinitions.ts`:
- NO: gdpr, nis2, personopplysningsloven
- SE: gdpr, nis2
- NL: gdpr, nis2
- UK: uk-gdpr, dpa-2018
- AU: privacy-act, apra-cps234
+ alltid: iso27001, ai-act hvis allerede aktivt
Boolske svar legger til: helse→hipaa-lignende/helseregister-krav, betaling→psd2/pci-dss, kritisk infra→nis2 (forsterket)

Bruker eksisterende `frameworks` array; ukjente id-er filtreres bort.

## Persistering
- Lagres som user-preference i localStorage (`regulations.countryScope`), evt. senere i `profiles.metadata`. Ingen DB-migrasjon i denne iterasjonen.

## Ut av omfang
- Faktisk endring av aktive frameworks (bruker eksisterende dialog)
- Backend for support-request (logges via toast + console; eventuelt enkel `support_requests` insert kan legges til senere)
- Endringer i andre sider enn Regulations

## Designnoter
- Apple-minimal, semantiske tokens, primær lilla
- Landchips: liten flagg-emoji + ISO-kode badge
- Dialog matcher stil i opplastet referansebilde (steg 2 av 3, "Vis forslag" CTA)
