# Dokument hub: vis alt som faktisk er lastet opp

## Hva analysen viser

Jeg har sjekket databasen og koden bak Dokument hub og Regelverk.

Dokumenter som finnes i dag (og som hub-en allerede henter):

| Kilde | Antall |
|---|---|
| Leverandør- og egne dokumenter (`vendor_documents`) | 69 (42 på leverandører, 27 på egen organisasjon) |
| Arbeidsområde-dokumenter | 1 |
| Andre opplastede dokumenter | 2 |
| Regelverksdokumenter (`framework_documents`) | 0 |
| **Totalt tilgjengelig** | **72** |

Typene fordeler seg på DPA (15), ISO 27001 (12), SOC 2 (6), policy (6), sertifisering (5), pentest (3), DPIA, NDA, hendelseshåndtering, personvernerklæring m.m. Datoene går fra mai 2025 til mai 2026.

Årsaken til at ingenting fra Regelverk dukker opp i hub-en:

- Bevis som lastes opp/knyttes til et krav inne i Regelverk lagres kun i komponentens lokale React-state (`FrameworkRequirementsList` + `AttachEvidenceDialog`). Ingenting skrives til databasen, så det forsvinner ved refresh og finnes ikke for Dokument hub.
- Dialogen som laster opp dokumenter på selve regelverket (`FrameworkDocumentsDialog`) skriver riktig til `framework_documents`, men den tabellen er tom — ingen har brukt den flyten ennå.
- Koblingen «Påvirker score» i hub-en beregnes i dag kun ut fra `vendor_documents`, ikke fra faktiske krav-koblinger.

## Hva jeg foreslår å gjøre

1. **Persistere bevis fra Regelverk.** Når et dokument lastes opp og knyttes til et krav, lagres filen i storage og en rad i `vendor_documents` (knyttet til egen organisasjon), pluss en koblingsrad krav ↔ dokument med Laras dekningsgrad (0 / 0.5 / 1) og hvilke artikler den dekker.
2. **Lese tilbake ved innlasting.** Regelverkslisten henter lagrede bevis og dekningsgrad ved oppstart i stedet for å generere dem lokalt, slik at status og modenhet overlever refresh.
3. **Vise regelverks-bevis i Dokument hub.** Hub-en får «Regelverk» som modul-kilde, viser hvilke regelverk og krav dokumentet dekker, og «Påvirker score» baseres på de faktiske krav-koblingene.
4. **Seede eksisterende dokumenter mot krav (valgfritt).** De 27 egne dokumentene (personvernerklæring, sikkerhetspolicy, DPIA, hendelseshåndtering osv.) kan kjøres gjennom Laras analyse én gang slik at hub-en og modenheten viser reell dekning fra dag én.

## Teknisk

- Ny tabell `requirement_evidence` (`framework_id`, `requirement_id`, `document_id` → `vendor_documents`, `covered_articles jsonb`, `coverage_ratio numeric`, `created_by`), med GRANT + RLS scoped til innlogget bruker.
- `AttachEvidenceDialog`: last opp til storage-bucket `vendor-documents`, insert i `vendor_documents`, deretter insert i `requirement_evidence` med resultatet fra `analyze-evidence-coverage`.
- `FrameworkRequirementsList`: initier `uiStates` fra lagrede rader via en ny hook `useRequirementEvidence(frameworkId)` i stedet for kun `generateUiStates`.
- `useDocumentHub` / `documentHub.ts`: ta med `requirement_evidence` i parallell-hentingen, sett modul `regulation` for koblede dokumenter, og bygg `scoreDocIds` fra disse radene.
