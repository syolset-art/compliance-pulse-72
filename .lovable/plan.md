# Hvorfor koble på egen agent — profesjonell infokilde

BYOA-seksjonen forklarer i dag *hva* du kan gjøre, men ikke *hvorfor det er smart* eller *om det er trygt*. Vi legger til en skikkelig kunnskapskilde som svarer på verdi, friksjon, forenkling av compliance-arbeid, sikkerhet og tilgangsstyring — skrevet for ikke-tekniske beslutningstakere.

## Hvor det ligger

Knappen «Hva agenten får se» i BYOA-toppseksjonen erstattes av **«Hvorfor og hvordan»**, som åpner en bred sidepanel (drawer) fra høyre. Dagens utvidbare verktøyliste flyttes inn i panelet, så toppseksjonen forblir ren. Panelet åpnes også fra et diskret «Er dette trygt?»-lenke i veiviserens steg 2 (der du lager koden), der spørsmålet faktisk oppstår.

## Innhold i panelet

Fire seksjoner med navigasjon øverst:

**1. Verdien — hvorfor koble på din egen agent**
- Du jobber der du allerede er (Claude/ChatGPT), ikke i enda et system.
- Spørsmål som «hvilke leverandører mangler databehandleravtale?» besvares på sekunder i stedet for å klikke gjennom skjermbilder.
- Agenten din kjenner konteksten din fra før — Mynder gir den fakta å svare ut fra i stedet for gjetning.

**2. Friksjonen vi fjerner**
Kort før/etter-liste i klartekst:

```text
Før                                  Med egen agent
Logg inn, finn riktig modul, filtrer  Still spørsmålet
Kopiér status inn i et notat          Agenten skriver oppsummeringen
Husk å opprette oppfølging            Agenten oppretter aktiviteten
Ingen visste hva som manglet          Dekningsgrad på forespørsel
```

**3. Slik forenkler det compliance-arbeidet**
Tre konkrete scenarier, ett avsnitt hver: forberedelse til revisjon, ny leverandør inn, ukentlig status uten rapportjobb. Hvert scenario viser en eksempelsetning brukeren kan lime inn i agenten sin.

**4. Sikkerhet — er dette trygt?**
Spørsmål-og-svar-format, ærlig og konkret:
- *Hva får agenten se?* Kun det du selv har tilgang til i Mynder. Verktøylisten vises her med tydelig merking lese vs. skrive (kun oppretting av aktivitet endrer noe). Ingenting kan slettes.
- *Hvordan skjer tilgangsstyringen?* Din personlige kode knyttes til din bruker og din organisasjon. Rollen din i Mynder bestemmer hva som svares ut — koden gir aldri mer enn du selv har.
- *Hvor lagres koden?* Bare en kryptografisk hash lagres hos oss; klarteksten vises én gang. Mister du den, lager du en ny.
- *Kan jeg trekke den tilbake?* Ja, når som helst — tilgangen opphører umiddelbart.
- *Sendes dokumentene mine til agentleverandøren?* Nei. Agenten får svar og statusdata, ikke filer.
- *Kan noen andre bruke koden min?* Bare den som har koden. Behandle den som et passord, og lag én kode per klient så du kan trekke tilbake enkeltvis.

Nederst en tillitsgrense-boks i samme format som ellers på siden («Blir hos deg» / «Sendes til Mynder»).

## Teknisk

- Ny `src/components/integrations/ByoaWhyDrawer.tsx` — Sheet (side="right", bred), seksjoner med ankernavigasjon; gjenbruker `MCP_EXPOSED_TOOLS` fra `src/lib/mcpAgentConnections.ts` til verktøylisten.
- Tekstinnhold i `src/lib/byoaFaq.ts` som strukturerte data (seksjoner, Q&A, scenarier) med nb/en, slik at både panelet og eventuelle senere hjelpetekster bruker samme kilde.
- `ByoaAgentHero.tsx`: bytt `showTools`-toggle mot åpning av panelet; fjern det inline utvidbare feltet.
- `ByoaConnectWizard.tsx`: legg inn lenke «Er dette trygt?» i steg 2 som åpner samme panel.
- Ingen databaseendringer, ingen endring i hva MCP-endepunktet faktisk gir tilgang til.
