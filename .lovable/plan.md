# Integrasjonspunkter for avvik

I dag har «Live avvik»-banneret på Avviksregister-siden en av/på-bryter og tre hardkodede leverandørnavn (7 Security, Acronis, Arctic Security) uten kobling til Datakilder og agenter. Integrasjonskatalogen (`src/lib/integrationCatalog.ts`) dekker i dag bare oppdagelse av systemer, leverandører, brukere og dokumenter — ikke hendelser/avvik.

Planen gjør avvikskilder til en ekte, styrbar integrasjonstype.

## Hvilke systemer er relevante for kontroll på avvik

Fire naturlige kildekategorier, i prioritert rekkefølge:

1. **Sikkerhetsovervåking (teknisk hendelse → avvik)**
   - 7 Security (MDR) — allerede nevnt i UI-et, gjøres til ekte kilde
   - Acronis Cyber Protect — finnes i katalogen, utvides til også å levere hendelser
   - Microsoft Defender / Sentinel, Arctic Security — planlagt
2. **Sakshåndtering og henvendelser (menneskelig meldt avvik)**
   - Jira Service Management, ServiceNow, Zendesk/Freshservice — planlagt
   - Dedikert e-postinnboks (f.eks. avvik@virksomhet.no) — enkel, høy verdi
3. **Meldekanaler internt**
   - Microsoft Teams / Slack — meld avvik der folk faktisk jobber
   - Mynder Me (ansattapp) — allerede i produktet, kobles som intern kanal
4. **Generisk inngang**
   - Webhook/API-endepunkt med signert nøkkel, for alt som ikke har ferdig kobling

Alle kilder er lese-/mottaksbaserte: Mynder skriver ikke tilbake til fagsystemet.

## Hva som bygges

**1. Ny oppdagelsestype «Avvik»**
- Utvid `DiscoveryType` med `incidents` i `src/lib/integrationCatalog.ts`, med etikett «Avvik og hendelser» (NO) / «Incidents» (EN).
- Ny kategori `incident_source` med etikett «Avvik og hendelser».
- Legg til kildene over i katalogen med riktig `availability` (`available` kun for 7 Security, e-postinnboks og webhook; resten `planned`).
- Nytt filter-pill «Avvik» på Datakilder og agenter (`src/pages/Integrations.tsx`), slik at kildene dukker opp i Kildekart-filteret.

**2. Live avvik kobles til integrasjoner**
- I `src/pages/Deviations.tsx`: erstatt de hardkodede leverandørbadgene med faktiske avvikskilder fra katalogen, med status (Tilkoblet / Ikke tilkoblet / Kommer).
- Bryteren «Live avvik» styrer om innkommende hendelser opprettes som avvik. Er ingen kilde tilkoblet, vises en rolig CTA «Koble til en kilde» som navigerer til `/settings/integrations` med avvik-filteret forhåndsvalgt.
- Behold forklaringsseksjonen (4-stegs flyt) uendret, men oppdater steg 1 til å referere til «tilkoblet kilde» i stedet for «leverandør».

**3. Mottaksregler per kilde (lett, uten ny backend nå)**
- I tilkoblingsdialogen for en avvikskilde: velg standard alvorlighetsgrad, om Lara skal klassifisere automatisk, og hvem som er standard ansvarlig.
- Vises som oppsummering på kildekortet. Lagres lokalt i samme mønster som eksisterende tilkoblingstilstand.

## Teknisk

- Endringer: `src/lib/integrationCatalog.ts` (type, kategori, nye kilder, etiketter), `src/pages/Integrations.tsx` (nytt filter + deep-link-parameter), `src/pages/Deviations.tsx` (kildeliste med status + CTA), `ConnectIntegrationDialog` (mottaksregler), samt `src/locales/nb.json` og `en.json`.
- Ingen databaseendring i dette steget — kildene er katalog- og UI-drevet, på samme måte som dagens integrasjoner. Faktisk mottak av hendelser (webhook-endepunkt + skriving til avvikstabellen) tas som eget steg når en første kilde skal kjøres i pilot.
