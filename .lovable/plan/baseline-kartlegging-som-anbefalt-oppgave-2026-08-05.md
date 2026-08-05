# Baseline-kartlegging som anbefalt oppgave

## Mål
På fanen «Veiledning fra Mynder» skal baseline-kartlegging ikke lenger være et eget stort kort. Den skal i stedet være én anbefalt oppgave inne i «Lara har en anbefaling til deg».

## Endringer

1. **Fjern baseline-kortet** i veiledningsfanen
   - Hele kortet med tittel, «x/y besvart», «Valgfritt», Trust Score-tallet og knappen «Start modenhetsvurdering» tas bort.
   - Rutenettet med Styring og ansvar / Drift og sikkerhet / Identitet og tilgang / Personvern / Tredjepart og prosentene fjernes fra denne fanen.

2. **Én anbefalt oppgave i Lara-banneret**
   - Dagens oppgave «Fullfør innledende vurdering» erstattes av «Baseline-kartlegging» med kort forklaring («Kartlegg modenhet sammen med kunden — grunnlaget for Trust Profile og gap-analyse»).
   - Knappen åpner baseline-skjemaet direkte (samme drawer som knappen gjorde før), i stedet for å bytte fane.
   - Oppgaven vises kun så lenge baseline ikke er fullført, og framgang (x/y besvart) vises som en kort tekst i oppgaven i stedet for eget kort.

3. Resten av fanen (Regelverk-status, tjenestesøk) står uendret.

## Teknisk
- `src/pages/MSPCustomerDetail.tsx`: slett baseline-`Card`-blokken i `TabsContent value="guidance"`; oppdater oppgaveobjektet i `tasks`-arrayet (linje ~217) til baseline-oppgaven med `onClick: () => setBaselineDrawer({ open: true, review: false, mode: "meeting" })`.
- Behold `MATURITY_AREAS`/`areaProgress` kun hvis de fortsatt brukes til framgangsteksten; ellers fjern ubrukt kode og importer.
