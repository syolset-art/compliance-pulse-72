# Første modenhetsbilde fra Laras kartlegging

Kortet «Modenhet per kontrollområde» på Veiledning-fanen står i dag på 0 % for alle områder helt til noen svarer ut baseline. Det skal aldri være helt tomt når vi allerede fant noe om kunden under onboarding.

## Hva som endres

**1. Startpunkt fra kartleggingen**
Det vi fant da kunden ble lagt til — personvernerklæring, hjemmeside, anbefalte regelverk fra offentlig register — brukes som et første, forsiktig utgangspunkt for modenhet. Fant vi en publisert personvernerklæring, gir det utslag på Styring og ansvar og Personvern og datahåndtering, slik at partneren ser hvordan funnet faktisk treffer kontrollområdene.

Kortet får en liten kildepille som sier hvor tallene kommer fra: «Startpunkt fra Laras kartlegging» så lenge ingen baseline-svar er registrert, og «Estimert fra baseline-svar» så snart partneren har begynt å svare.

Under funnet vises én linje av typen: «Personvernerklæring funnet på kundens nettsted → teller på Styring og ansvar og Personvern.»

**2. Superenkel forklaring av hvordan modenhet øker**
Én kort setning i kortet, ikke en tekstblokk:
«Modenhet øker for hvert krav som fylles opp innenfor regelverkene kunden har aktivert.»
Info-ikonet beholder dagens dypere forklaring om Mynders scoringsmodell (v1) og vektingen.

**3. Salgsvinkelen for partneren**
En diskret linje nederst i kortet, over lenken til Trust Profile:
«Du hever kundens modenhet ved å levere egne tjenester som dekker kravene i aktiverte regelverk — og ved å aktivere Mynder-produkter.»
Med to snarveier: «Se anbefalte tjenester» (scroller til anbefalingskortet) og «Aktiver regelverk» (kundens Regelverk-fane).

**4. Ingen falsk presisjon**
Startpunktet merkes tydelig som estimat og overstyres i det øyeblikket partneren svarer på baseline-spørsmål. Ingen tall dikter opp uten et konkret funn i bunn.

## Teknisk

- `src/lib/trustMaturityQuestions.ts`: gjenbruk eksisterende `deriveDefaultAnswers` / `deriveLaraSources` (finnes, men er ikke i bruk i MSP-flyten) som kilde for startpunktet.
- Nytt lite hook/utility som leser kundens onboarding-funn: `privacy_policy_url` fra self-asset-ens `metadata` (settes i `AddMSPCustomerDialog`), samt `url` og `recommended_frameworks` fra `msp_customers`.
- `src/hooks/useCustomerBaseline.ts`: eksponer `hasAnyAnswer` slik at kortet vet om det skal vise startpunkt eller reelle svar. Startpunktet skrives ikke til localStorage — det er kun visning inntil partneren svarer.
- `src/components/msp/guidance/CustomerMaturityMirrorCard.tsx`: ny kildepille, forklaringslinje, funnlinje og salgslinje med de to snarveiene. Bandfarger og scoringsmodell-tooltip beholdes som i dag.
- `src/pages/MSPCustomerDetail.tsx`: send inn funn-data og callbacks for de to snarveiene.
- Ingen databaseendringer.
