# Sara på «Dokumentasjon og bevis»

Siden krever i dag manuell opplasting. Sara (den lokale compliance-agenten) kan hente dokumentasjonsunderlaget automatisk, men det finnes ingen inngang til henne herfra.

## Ny oppførsel

**Hvis Sara ikke er installert**
Et rolig, smalt kort øverst på siden (under overskriften), i samme stil som agentkortet på Datakilder og agenter:
- Tittel: «Slipp å laste opp dokumentasjon manuelt»
- Tekst: Sara kjører lokalt hos dere, finner dokumentasjonen i deres egne kilder og sender kun bekreftelse på at den finnes — selve dokumentet forlater aldri huset.
- Knapp: «Installer Sara» som åpner den eksisterende Sara-onboardingdialogen.
- Diskret «Ikke nå»-lenke som skjuler kortet (lagres lokalt).
I tillegg får sideoverskriften en «Installer Sara»-knapp ved siden av «Legg til».

**Hvis Sara er installert**
Kortet erstattes av en tynn statuslinje: Sara-ikon + «Sara henter dokumentasjon automatisk» og, når det finnes nye funn, «X nye underlag fra Sara» med lenke «Se aktivitet» som åpner den eksisterende aktivitetsloggen. «Installer Sara»-knappen i headeren vises ikke.

**Merking av kilde i listene**
Dokumentasjon som kommer fra Sara merkes med Sara-ikonet i dokumentlisten (i stedet for filikonet), slik som allerede gjøres i kravlisten, med tooltip «Hentet av Sara – lokal agent».

Norsk og engelsk.

## Teknisk

- Ny `src/components/agents/SaraEvidencePromo.tsx`: kortet + statuslinjen, bruker `useSaraAgent()`, `SaraOnboardingDialog`, `SaraActivityLogDialog`, `SaraIcon`. Skjul-valg i `localStorage` (`mynder.sara.evidencePromo.dismissed`).
- `src/pages/TrustCenterEvidence.tsx`: rendre komponenten rett under headeren, og legge «Installer Sara»-knapp i handlingsraden når `installed === false`.
- Kildemerking: dokumenter regnes som Sara-hentet når filstien/kilden indikerer agenten (samme `docSourceOf`-mønster som i `FrameworkRequirementsList`); ingen skjemaendring nå — vi leser eksisterende felt.
- Ingen databaseendringer, ingen ny backend.
