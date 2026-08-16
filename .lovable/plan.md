# Dokument hub — samlet oversikt over alle dokumenter

Et nytt fast menypunkt **Dokument hub** som samler alle dokumenter kunden har lastet opp, uansett hvor i plattformen de ble lastet opp. Punktet vises alltid, uavhengig av hvilke produkter som er aktivert.

## Hva brukeren får

En side (`/documents`) med:

1. **Toppstripe med nøkkeltall** — totalt antall dokumenter, hvor mange som påvirker score for aktiverte regelverk, hvor mange som er utløpt eller nær utløp, og hvor mange som mangler eier/type.
2. **Filterlinje** (kompakt, samme stil som regelverkslisten):
   - Kilde/modul: Trust Center, Leverandørmodul, Regelverk, Arbeidsområder, Eiendeler, Annet
   - Dokumenttype: policy, DPA/avtale, revisjonsrapport, sertifisering, bevis, øvrig
   - Lastet opp av (person)
   - Status: gjeldende, venter, utløper snart, utløpt, erstattet
   - Egen pille: **Påvirker score** — viser kun dokumenter som er koblet som bevis til krav i regelverk kunden har aktivert
   - Fritekstsøk på filnavn/visningsnavn
3. **Dokumentliste** — én kompakt rad per dokument: navn, typepille, modul-pille med lenke tilbake til opprinnelsesstedet (leverandørprofil, kravside, arbeidsområde, Trust Center), opplaster, dato, statuspille, og grønn hake når dokumentet teller som bevis.
4. **Gruppering** — velgbar mellom «Etter modul», «Etter dokumenttype» og «Etter opplaster» (popover, som i regelverksvisningen).
5. **Detaljpanel** ved klikk: metadata, hvilke krav/regelverk dokumentet dekker, og lenke til konteksten der det ble lastet opp.

Hub-en er lesende og navigerende. Opplasting skjer fortsatt i sin kontekst; hub-en viser hvor.

## Teknisk

- Ny fil `src/lib/documentHub.ts`: felles `HubDocument`-type og normalisering av de fire eksisterende kildene:
  - `vendor_documents` → modul «Leverandør» når `asset_id` peker på en leverandør, «Trust Center» når det er self-asset
  - `framework_documents` → modul «Regelverk» (har `framework_id`)
  - `work_area_documents` → modul «Arbeidsområder»
  - `uploaded_documents` → modul «Annet»
  Normaliserer navn, type, opplaster, dato, status og bygger `sourceRoute` for tilbakelenke.
- Ny hook `src/hooks/useDocumentHub.ts`: henter alle fire tabellene parallelt med react-query og slår dem sammen.
- Score-kobling: gjenbruker eksisterende bevis-/dekningslogikk (`src/lib/complianceDocumentCoverage.ts`, `src/lib/documentStatus.ts`, `src/lib/documentCompliance.ts`) for å avgjøre om et dokument er aktivt bevis mot et krav i et aktivert regelverk. Ingen ny score-beregning innføres.
- Ny side `src/pages/DocumentHub.tsx` + rute `/documents` i `src/App.tsx`.
- `src/components/Sidebar.tsx`: nytt toppnivå-punkt «Dokument hub» / «Document hub» (ikon `FolderOpen`), plassert rett etter Regelverk/Meldinger i den globale seksjonen, uten tilgangsbetingelser.
- i18n-nøkler for NB/EN legges til i eksisterende locale-filer.

Ingen databaseendringer, ingen endring i eksisterende opplastingsflyter eller scoring.
