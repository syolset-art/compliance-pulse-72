# Tydelig «koble på deg selv» — hvor skal det ligge?

I dag finnes tilkobling to steder: `Innstillinger > Integrasjoner` (full katalog med kobledialog) og `Innstillinger > MCP-agentkoblinger`. Systemoppdagelse i modulen støtter kun Acronis. Kunden må altså lete i innstillinger for å skjønne at Lara kan koble seg på Microsoft 365, Notion o.l.

Forslaget: behold Integrasjoner som eneste «hjem», men gjør inngangene synlige akkurat der brukeren merker at data mangler.

## Hvor det skal vises

1. **Innstillinger > Integrasjoner (hjemmet).**
   Ryddes i tre grupper: *Tilkoblet*, *Klar til å koble på* (Acronis + Microsoft 365, Google Workspace, Notion, Slack som «kommer snart»-oppføringer merket tydelig), og *Egne agenter (MCP)*. Hvert kort sier hva Lara henter og hva den ikke gjør.

2. **Tomtilstander i modulene.**
   Systemer, Leverandører og Eiendeler: når listen er tom eller nesten tom, vises en linje «Slipp Lara til kildene dine» med to knapper — «Koble til kilde» og «Legg til manuelt». Dette er den viktigste plasseringen.

3. **«Oppdag systemer»-dialogen.**
   Under Acronis vises en kort liste over kilder som kommer, med «Gi beskjed når klar». Ingen falske tilkoblinger.

4. **Laras arbeidskø / dashbord.**
   Ett kort maks: «Lara mangler kilder — koblede kilder gir automatisk kartlegging», med lenke til Integrasjoner. Vises kun når ingen kilde er tilkoblet.

5. **Dokumentasjon/bevis.**
   Der bevis mangler: liten lenke «Hent automatisk fra en tilkoblet kilde» som peker til Integrasjonene.

## Hva «koble på» skal kommunisere

Samme tre punkter overalt: kun lesetilgang, ingenting legges til registeret uten godkjenning, tilgang kan trekkes når som helst. Dette finnes allerede i kobledialogen og gjenbrukes som kort hover-tekst på inngangene.

## Teknisk

- `src/lib/integrationCatalog.ts`: legg til `availability: "available" | "planned"` per integrasjon; Acronis = available, resten planned. Notion legges til i katalogen.
- Nytt delkomponent `src/components/integrations/ConnectSourcesCallout.tsx` — gjenbrukbar linje/kort med tekst + knapper, brukt i tomtilstander, dashbord-kort og bevis-visning.
- Ny hook `useConnectedSources()` (localStorage, samme mønster som `useActivatedServices`) som svarer på «finnes minst én aktiv kilde?» slik at inngangene skjules når kunden allerede er koblet på.
- `src/pages/Integrations.tsx` grupperes; planned-kort får deaktivert knapp + «Gi beskjed»-tilstand.
- `DiscoverSystemsDialog.tsx` får planned-liste under Acronis.
- Ingen databaseendringer; norsk/engelsk via eksisterende mønster.
