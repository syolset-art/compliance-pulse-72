## Mål

Gjøre "Pågående oppdrag" (Leveranser-fanen) mye enklere for partneren: gjøre hvert oppdrag om til et strukturert skjema (checklist) kunden/partneren fyller ut steg for steg, med mulighet til å laste opp ferdig dokument som snarvei, eller autogenerere en rapport til slutt som bevis som løfter kundens modenhet.

## Ny brukerflyt

For hvert tilbud som er akseptert (og dermed et pågående oppdrag):

1. Partneren åpner oppdraget → et rent "leveranseskjema" i drawer/side-panel.
2. Toppen viser hva oppdraget er (pentest / kurs / DPIA / …), hvilke regelverk/krav det skal dekke, og en progress-bar.
3. Én av to arbeidsmåter — partneren velger:
   - **Last opp ferdig dokument** (snarvei): pentestrapport, kursbevis, DPIA e.l. → Lara analyserer, foreslår mapping mot regelverk/krav, partner bekrefter → oppdraget markeres levert.
   - **Fyll ut skjema** (guided): en enkel sjekkliste tilpasset tjenestetypen (f.eks. pentest: scope, metode, funn, tiltak; kurs: deltakere, dato, tema, resultat). Hvert steg kan hoppes over eller merkes "ikke aktuelt".
4. Når skjemaet er fullført → knapp "Generer rapport". Lara lager en PDF-rapport basert på skjemadataene som blir bevis knyttet til kravene.
5. Rapport/dokument sendes til kunden. Kundens modenhet oppdateres automatisk på de dekkede kravene.

## Endringer i UI

**Ny fane-tilstand (`CustomerDeliveriesTab.tsx`)**
- Rydd opp: én liste med "Pågående oppdrag" øverst, "Fullførte leveranser" nedenfor. Bort med den nåværende blandingen av draft/sent/delivered i én rotete liste.
- Hvert oppdragskort viser: tjenestenavn, tjenestetype-ikon, regelverk-chips, progress ("3 av 6 steg"), CTA "Åpne oppdrag".

**Nytt: `DeliveryWorkspaceDrawer.tsx` (erstatter dagens `CompleteDeliveryDialog` for aktive oppdrag)**
- Header: tjenestenavn, regelverk-chips, progress-bar, status.
- To store valg øverst (tabs eller kort):
  - **"Jeg har allerede dokumentet"** — dra-og-slipp opplasting. Kjører eksisterende Lara-analyse → foreslått mapping → bekreft → ferdig.
  - **"Fyll ut skjema"** — trinnvis skjema (se neste punkt). Auto-lagres.
- Bunn: "Generer rapport & marker levert" (aktiveres når nok av skjemaet er fylt, eller dokument er lastet opp).

**Nytt: `deliveryFormTemplates.ts`**
- Definerer sjekkliste-maler per tjenestetype (pentest, security_training, dpia, risk_assessment, bcp, audit, generic).
- Hver mal: liste av steg med `{ id, label, help, kind: "text"|"textarea"|"date"|"checkbox"|"upload"|"select", options?, required? }`.
- Brukes til å rendre `DeliveryFormStepper.tsx`.

**Nytt: `DeliveryFormStepper.tsx`**
- Enkel vertikal stepper. Auto-lagre til localStorage per offer-id.
- "Hopp over" / "ikke aktuelt" på hvert steg.

**Rapportgenerering**
- Utvid `deliveryReports.ts` med `generateReportFromForm(offer, formData)` som produserer en strukturert rapport (bruker eksisterende `DeliveryReport.tsx` som visning + eksisterende PDF-eksport-stil).

**Modenhetsløft**
- Beholder eksisterende impact-logikk i `CompleteDeliveryDialog` — flyttes inn i drawer-en. Når leveransen ferdigstilles: samme mapping av kontroller → +% modenhet, samme `evidenceIds`-kobling.

## Tekniske detaljer

- Fjerner ikke `OngoingDeliveriesList.tsx` (brukes andre steder), men `CustomerDeliveriesTab.tsx` bruker det ikke lenger direkte. Aktive oppdrag åpnes gjennom drawer-en i stedet for eksisterende `CompleteDeliveryDialog` (som beholdes for å ikke bryte andre call-sites, men er ikke lenger primær CTA).
- Skjemastate lagres i localStorage under `msp.delivery-form.<offerId>` for demo-persistens (samme mønster som `partnerEvidence.ts`).
- Fil-opplasting bruker eksisterende `PartnerEvidenceUploadDialog`-flyt (dra-og-slipp + Lara-mapping) — gjenbrukes i "Jeg har dokumentet"-grenen.
- Ingen DB-endringer. Alt er frontend/demo-lag.
- i18n: alle nye strings i norsk (matcher eksisterende tab).

## Filer

Nye:
- `src/components/msp/deliveries/DeliveryWorkspaceDrawer.tsx`
- `src/components/msp/deliveries/DeliveryFormStepper.tsx`
- `src/lib/deliveryFormTemplates.ts`

Endres:
- `src/components/msp/deliveries/CustomerDeliveriesTab.tsx` — splitte i "Pågående" og "Fullførte", åpne ny drawer.
- `src/lib/deliveryReports.ts` — `generateReportFromForm(...)`.
- `src/components/msp/deliveries/DeliveryReport.tsx` — vise skjemadata-seksjoner når rapporten er generert fra skjema.

## Utenfor scope

- Backend-persistens (fortsatt localStorage-demo).
- Kundens egen visning av skjemaet — dette er partnerside.
- Ny e-postmal for sending — bruker eksisterende `SendDeliveryReportDialog`.
