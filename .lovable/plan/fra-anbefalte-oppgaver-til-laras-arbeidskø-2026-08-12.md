# Fra "Anbefalte oppgaver" til Laras arbeidskø

## Vurdering av dagens widget

Widgeten er i dag en passiv liste: den forteller hvem som har flest regelverk og hva partneren *burde* gjøre ("Fullfør risikovurdering"). Alt arbeid ligger fortsatt hos mennesket. Det er et klassisk dashboard-mønster, ikke et agentisk.

Et agentisk-native produkt snur premisset: agenten har allerede gjort jobben, og widgeten er stedet du **godkjenner, avviser eller overstyrer** — ikke stedet du får en huskeliste.

## Hva vi bygger i stedet

Erstatt `NeedsFollowUpWidget` med **"Laras arbeidskø"** med tre soner:

1. **Gjort automatisk** (én linje, kollapset): "Lara har oppdatert 12 modenhetsscorer og hentet 4 personvernerklæringer i natt." Bygger tillit til at agenten faktisk jobber.
2. **Venter på deg** (hovedinnholdet, maks 3 kort): utkast Lara har laget ferdig og som trenger et menneskelig ja.
   - Hvert kort: kunde → hva Lara har gjort → hvorfor (kort begrunnelse) → knappene **Godkjenn** / **Se utkast** / **Avvis**.
   - Eksempler: "Tilbud på risikovurdering til Bergen Energi er klart (18 900 kr)", "Purring til Nordvik Helse om 4 leverandører er skrevet", "Fjord Logistikk har vært stille i 2 uker — Lara foreslår oppfølgingsmøte".
3. **Blokkert** (kun når relevant): "Lara mangler tilgang/data hos X" med én CTA for å løse det.

Nederst: "Se hele køen" → eksisterende `/msp-partner/widget/needs-follow-up`, som utvides til samme kø-format med filtre (Venter / Gjort / Avvist).

Sekundært: en liten **autonominivå-velger** (Automatisk / Assistert / Manuell) i widgetens meny, i tråd med Mynders tre autonominivåer — så partneren kan la Lara sende rutinepurringer selv, men holde tilbud på godkjenning.

## Hvorfor dette er mer agentisk

- Enhet for arbeid er et **utkast fra agenten**, ikke en oppgave til mennesket.
- Standardhandlingen er **godkjenning på ett klikk**, ikke navigasjon til en side hvor arbeidet begynner.
- Agenten viser **begrunnelse og kilde** per forslag (aktivitetslogg, regelverk, modenhet), så tilliten er etterprøvbar.
- Widgeten viser **hva som allerede er gjort uten deg** — det er det som skiller agentisk fra dashboard.

## Teknisk

- Ny komponent `src/components/msp/LaraWorkQueueWidget.tsx` erstatter `NeedsFollowUpWidget` i `src/pages/MSPPartnerDashboard.tsx`.
- Ny prototypedatamodell i `src/lib/laraWorkQueue.ts`: `{ id, customer, action, rationale, source, value?, state: "pending" | "auto-done" | "blocked", autonomy }` med demo-data avledet fra dagens tre kunder.
- Godkjenn/avvis oppdaterer lokal state og gir toast + linje i aktivitetsloggen (`ActivityLogWidget`), ingen backend-endring i denne omgangen.
- Norsk/engelsk via eksisterende i18n-mønster; farger via eksisterende tokens (`recommend`, `warning`, `destructive`) — ingen hardkodede farger.
- Mobiltilpasset: kortene stables, knappene blir fullbredde under sm.
