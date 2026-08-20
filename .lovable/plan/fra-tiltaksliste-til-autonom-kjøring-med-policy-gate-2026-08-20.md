# Fra tiltaksliste til autonom kjøring med policy-gate

## Problemet

"Anbefalte tiltak" på leverandørprofilen er i dag en liste med 8 like store tiltak, hver med egen knapp. Brukeren må lese alt og bestemme alt. Det bryter med Mynders AI-policy: kjent autonominivå per handling, automatisk utførelse som standard, og menneskelig godkjenning kun der handlingen er kritisk eller irreversibel.

## Ny modell: autonominivå per tiltak

Hvert tiltak får et fast, kjent autonominivå (samme tre nivåer som ellers i Mynder):

| Nivå | Betydning | Eksempler på leverandørtiltak |
| --- | --- | --- |
| Automatisk | Lara utfører selv og logger. Vises aldri som oppgave. | Hent inn grunnlag fra offentlige kilder, foreslå GDPR-rolle, foreslå risikonivå, kartlegg underleverandører |
| Assistert | Lara gjør ferdig utkastet, du godkjenner før det sendes/iverksettes | Be om databehandleravtale, be om ISO 27001-sertifikat, be om overføringsgrunnlag utenfor EØS |
| Manuell | Krever menneskelig skjønn/beslutning | Sett kritikalitet, godkjenn avvik med rettslig konsekvens |

Standard: alt som er `automatisk` kjøres uten å spørre. Bare `assistert` (utgående kommunikasjon til leverandør) og `manuell` (brukerens skjønn) havner foran brukeren — og maks de kritiske av dem.

## Ny visning på leverandørprofilen

Erstatt listen med ett rolig kort, maks ~4 linjer:

1. **Statuslinje:** "Lara har håndtert 5 av 8 punkter — se logg." Ett klikk åpner logg, ingen handling kreves.
2. **Én beslutning av gangen:** kun det høyest prioriterte punktet som faktisk krever brukeren, vist som én linje med kort begrunnelse og én primærknapp (Godkjenn / Sett kritikalitet). Neste punkt kommer først når dette er ryddet.
3. **Fotnote:** "2 flere venter på deg" som lenke til full liste (eksisterende visning beholdes som "se alle", ikke som standard).

Ingen tiltak forsvinner — de flyttes bare fra brukerens hode til Laras logg.

## Teknisk

- `src/lib/vendorNextSteps.ts`: bytt `owner: "lara" | "user"` med `autonomy: "automatic" | "assisted" | "manual"` (behold `owner` avledet for bakoverkompatibilitet). Sett nivå per `actionKey` etter tabellen over; `framework_action` får `assisted` når den innebærer utgående forespørsel, `automatic` når den kun er intern registrering. Gjenbruk `LARA_AUTONOMY_LABELS` fra `src/lib/laraWorkQueue.ts` som eneste kilde til etiketter.
- Ny helper `splitByAutonomy(steps)` → `{ autoHandled, needsApproval, needsDecision }`.
- `src/components/asset-profile/guidance/VendorNextStepsCard.tsx`: skrives om til statuslinje + ett aktivt beslutningspunkt + fotnote. Full liste flyttes bak "Se alle tiltak" (eksisterende `onShowAll`).
- `src/components/asset-profile/MynderGuidanceTab.tsx`: kjør `autoHandled`-stegene via eksisterende `runNextStep` ved innlasting (én gang per leverandør, med logglinje), i stedet for å vente på "Kjør Laras forslag".
- Ingen backend-endring i denne omgangen; autonominivå er statisk i `vendorNextSteps.ts`. Farger via eksisterende tokens, norsk/engelsk via eksisterende i18n-mønster.
