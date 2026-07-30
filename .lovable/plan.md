## Problem

I kundeveiviseren (steg 2, «Bekreft») står det alltid «Bekreft at nettadressen stemmer.» under nettside-feltet — også når feltet er tomt fordi verken virksomhetsregisteret eller Lara fant en nettside. Det er misvisende: det finnes ingen adresse å bekrefte.

Dagens flyt gjør allerede riktig oppslag: navn/org.nr → offisielt virksomhetsregister (hovedenhet, deretter underenheter) for org.nr, bransje, ansatte, adresse og hjemmeside → AI-fallback for bransje/nettside → forsøk på å finne personvernerklæring. Det som mangler er ærlig tilbakemelding når kartleggingen ikke gir treff.

## Endringer (kun tekst/tilstand i `AddMSPCustomerDialog.tsx`)

Hjelpeteksten under nettside-feltet blir tilstandsstyrt:

| Tilstand | Tekst |
|---|---|
| Funnet i virksomhetsregisteret | «Hentet fra virksomhetsregisteret – bekreft eller endre» |
| Foreslått av Lara (AI) | Sparkles + «Foreslått av Lara – bekreft eller endre» |
| Ingen treff (feltet tomt) | Info-ikon + «Vi fant ingen nettside for virksomheten – du kan legge den inn nå eller senere.» |
| Partner har skrevet inn selv | «Lagt inn manuelt.» |

Samme mønster brukes allerede for personvernerklæring; teksten der justeres til å være tydelig på at den kan legges inn senere: «Fant ingen personvernerklæring – du kan legge den inn nå eller senere.»

I tillegg:
- Skill `websiteSource` mellom `brreg` og `ai_suggested` korrekt (i dag settes `ai_suggested` når bransjen kom fra AI, selv om nettsiden kom fra registeret).
- Når nettside ikke ble funnet: ikke tving «Har ikke nettside» — behold «Ja, har nettside» med tomt felt, slik at partneren kan fylle inn senere fra kundekortet.
- Tooltip-teksten oppdateres slik at den beskriver hele kjeden: register → nettside → personvernerklæring, og at manglende data kan fylles inn manuelt senere.

Ingen endringer i datamodell, lagring eller edge functions.
