## Bakgrunn

På `/vendors` viser `VendorLaraInsightsPanel` Laras forslag til oppfølging av leverandører. Hvert kort har i dag tre knapper:

- **Be Lara håndtere det** → Lara sender forespørsel automatisk (`onSendRequest`).
- **Åpne leverandøren** → navigerer bort til leverandørprofilen.
- **Utsett / Avvis** → snooze 7 dager / arkiv.

Knappen "Åpne leverandøren" gir lite verdi her — den tar brukeren ut av plan-flyten. Brukeren ønsker i stedet en **Review**-handling: åpne en dialog som viser detaljene i planen Lara har laget, og la brukeren bestemme om Lara skal utføre, eller om oppgaven skal gjøres manuelt.

## Ny flyt

Erstatt knappen "Åpne leverandøren" med **"Se gjennom planen"** (Review). Klikket åpner en ny dialog `LaraPlanReviewDialog` som viser:

1. **Hva Lara har sett** (insight + alvorlighet + kategori).
2. **Hva Lara foreslår å gjøre** — detaljert plan-tekst utledet fra `requestType` / `categoryKey`:
   - `missing_dpa` → "Sender forespørsel om signert databehandleravtale med standardvedlegg."
   - `renewal` → "Ber leverandør laste opp oppdaterte sertifikater / fornyet avtale."
   - `assessment` → "Sender risikovurderings-spørreskjema og kjører Lara-analyse på svar."
   - `inbox` → "Behandler innkomne dokumenter i Lara-innboksen og oppdaterer profilen."
   - `review` → "Kjører periodisk gjennomgang og setter ny review-dato 12 mnd frem."
3. **Forventet resultat** (kort liste: e-post sendt, oppgave logget, profil oppdatert).
4. **Berørt leverandør** (navn + meta).

Dialogen har tre handlinger:

- **Godkjenn** (primary) → samme som dagens "Be Lara håndtere det": kaller `onSendRequest([vendor.id], requestType, categoryKey)`, viser toast "Lara er i gang", lukker dialog, går videre til neste oppgave i planen.
- **Avvis og gjør manuelt** → lager en **manuell aktivitet** på innlogget bruker via `useUserTasks().createTask` med:
   - `title`: "Manuell oppfølging: {vendor.name}"
   - `description`: Laras insight + foreslått handling (slik at brukeren vet hva som skal gjøres)
   - `priority`: utledet av `severity` (critical→0, high→1, medium→2)
   - `related_vendor_id`: vendor.id (hvis kolonnen finnes — ellers kun i description)
   - Marker forslaget som dismissed slik at det ikke dukker opp igjen.
   - Toast: "Lagt til som din egen aktivitet — du finner den under Activity".
- **Lukk** → bare lukker dialogen, ingen endring.

Knappen "Åpne leverandøren" beholdes ikke. Brukeren kan fortsatt navigere til leverandøren fra leverandørnavnet i kortet (legges til som lenke hvis ikke allerede).

## Filer som endres

- `src/components/vendor-dashboard/VendorLaraInsightsPanel.tsx`
  - Bytt "Åpne leverandøren"-knappen til "Se gjennom planen".
  - Åpne ny `LaraPlanReviewDialog` med `current` task.
  - Gjør leverandørnavnet (`h4`) klikkbart som lenke til `/assets/{vendor.id}`.
- `src/components/vendor-dashboard/LaraPlanReviewDialog.tsx` (ny)
  - Presentational dialog (shadcn `Dialog`) som tar `task`, `onApprove`, `onRejectManual`, `onClose`.
  - Inneholder mapping fra `requestType`/`categoryKey` til plan-beskrivelse og forventet resultat (lokal konstant `PLAN_DETAILS`).
- Bruker eksisterende `useUserTasks` hook for manuell aktivitet — ingen DB-migrasjon.

## Ut av scope

- Ingen endringer i hvordan `onSendRequest` faktisk sender forespørsel.
- Ingen endringer i seeding, severity-logikk eller snooze/dismiss-flyt.
- Lignende panel i `DashboardLaraRecommendation` og `LaraRecommendationBanner` røres ikke i denne runden (kan gjenbruke dialogen senere).
