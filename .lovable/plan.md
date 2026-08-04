# Avvik på leverandør — registrering, oversikt og scorepåvirkning

Grunnlag: Styrende dokumenter i Notion, oppdatert 04.08.2026 — «Mynder Score Model (v1)» (R4 bevis/signaler, R5 hendelseslogikk) og playbooken «Avvik som signal». Reglene derfra som styrer dette arbeidet:

- Et avvik er et signal som bryter forutsetningen bak kontrollen. Berørte krav settes til null så lenge avviket er åpent. Dokumentasjonen slettes ikke, men kravet regnes ikke som oppfylt.
- Avviket genererer oppgaver til navngitt ansvarlig, og brukeren varsles.
- Et avvik kan bare lukkes av et navngitt menneske, med begrunnelse og eventuelt nytt bevis. Ved lukking gjenoppbygges kravstatus fra grunnlaget.
- Både fallet og gjenopprettingen skal være synlig i historikken.
- Åpne avvik er interne. De vises ikke utad i Trust Profile.
- Agentoppdagede avvik skal aldri sette krav til null før et menneske har bekreftet at avviket gjelder denne kunden.

## 1. Registrere avvik på en leverandør

På leverandørprofilen (fanen «Revisjon og risiko») legges en tydelig knapp **Registrer avvik**. Dialogen har:

- Tittel, beskrivelse, kategori, alvorlighetsgrad, oppdaget dato, frist.
- Navngitt ansvarlig (påkrevd — det er ansvarlig for oppgavene avviket genererer).
- Kilde: registrert av oss, meldt av leverandøren, eller oppdaget av agent.
- Laras forslag til berørte kontrollområder og krav, som brukeren bekrefter eller justerer. Ingenting settes til null før bekreftelse.

Etter lagring: oppgaver opprettes til ansvarlig, brukeren varsles, og berørte krav merkes som ikke oppfylt med forklaring «Avvik åpent — dokumentasjon beholdt».

## 2. Avvik leverandøren har registrert selv

Tre innganger, alle merket med kildebadge på leverandørprofilen:

- **Selvrapportert** — avvik leverandøren har publisert på sin egen Trust Profile. Vises som «Meldt av leverandøren» med dato og lenke til kilden. Utløser oppgaver hos oss, men bekreftes av bruker før kravene settes til null.
- **Agentoppdaget** — fra eksisterende integrasjonsflyt (7 Security / Lara-innboks). Ligger som «Til bekreftelse» inntil et menneske godkjenner.
- **Registrert av oss** — manuell registrering fra punkt 1.

## 3. Samlet oversikt over leverandører med avvik

Avviksregisteret får en fane **Leverandøravvik** med:

- Tabell gruppert per leverandør: antall åpne avvik, høyeste alvorlighetsgrad, eldste åpne avvik, ansvarlig, berørte kontrollområder.
- Filtre på status, alvorlighetsgrad, kilde og kritikalitet på leverandøren.
- Klikk går til leverandørens avviksliste.
- Eksport/rapport av oversikten.

I leverandørlisten legges en diskret indikator (antall åpne avvik) og et filter «Har åpne avvik».

**Modulgating:** Registrering av avvik på en leverandør fungerer med leverandørmodulen alene. Selve avviksregisteret, den samlede oversikten og rapporten krever at Avvikshåndtering er aktivert under Mynder Core. Har brukeren ikke modulen, vises et rolig kort med hva oversikten gir og en knapp for å aktivere — ingen tall lekkes.

## 4. Scorepåvirkning

- Åpne avvik nullstiller de bekreftede berørte kravene. Kontrollområdene beregnes videre med gjeldende faste vekter (Leverandører 10 %), så utslaget følger dagens modell uten ny vekting.
- Kritikalitet påvirker ikke score i fase 1 — den brukes til prioritering og filtrering.
- Score forklares i UI: «X krav er satt til null fordi det er registrert et åpent avvik på leverandør Y».
- Lukking av avviket gjenoppretter kravstatusen fra underliggende dokumentasjon, og både fall og gjenoppretting legges i scorehistorikken.
- Ingenting av dette vises i offentlig Trust Profile.

## Teknisk

Database (migrasjon på `system_incidents` eller ny koblingstabell):

- `asset_id` (leverandør/asset avviket gjelder), `source` utvides med `vendor_self` og `manual`.
- `confirmed_by` / `confirmed_at` for menneskelig bekreftelse av agent- og selvrapporterte avvik.
- `closed_by`, `closed_at`, `close_reason`, `close_evidence_document_id`.
- Ny tabell `deviation_requirement_impacts` (deviation_id, requirement_id, control_area, status active/restored) som holder mappingen avvik → krav. Denne mappingen finnes ikke i dag og er kjernen i arbeidet.
- Ny tabell `score_history_events` for fall og gjenoppretting, slik at historikken kan vises.
- GRANT + RLS på alle nye tabeller.

Frontend:

- `RegisterVendorDeviationDialog` på leverandørprofilen, gjenbruker `useDeviationAgent` for Lara-forslag.
- Utvidelse av `IncidentManagementTab` med kildebadger, bekreftelsesflyt og lukkedialog med begrunnelse.
- Ny fane `VendorDeviationsTab` i `Deviations.tsx` med aggregering per leverandør.
- Scoreberegning: nullstilling av krav med aktivt avviksavtrykk legges inn i `scoringEngine`/kravstatus, med forklaringstekst i eksisterende «hvorfor»-visning.
- Modulgate via `moduleActivationState` for register og rapport.

## Åpent

Playbooken lister beslutninger som ikke er tatt (gradering etter kritikalitet, hvem som kan lukke, hvilke registre som overvåkes). Denne implementasjonen følger «sett til null»-regelen som er besluttet, og lar gradering ligge til den er avklart.
