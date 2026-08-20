# Live avvik med Sara (lokal agent)

Utvid "Live avvik"-kortet i Avviksregisteret slik at det også dekker tilfellet der kunden har installert Sara lokalt i egen infrastruktur. Ingen ny backend — visningen bygger på eksisterende Sara-status, integrasjonskatalogen og aktiverte regelverk.

## Hva brukeren skal se

**Når Sara ikke er installert:** dagens kort uendret (skykilder: overvåking, sakssystem, meldekanal), pluss en rolig linje om at avvik også kan fanges opp lokalt med Sara, med lenke til Datakilder og agenter.

**Når Sara er installert:** kortet får et eget Sara-panel med fire deler:

1. **Scope — hva Sara er koblet til**
   Åpen liste over systemene Sara overvåker hos kunden, med status og sist kjørt. Alt som ikke er tilkoblet vises som "utenfor scope", slik at det aldri er tvil om hva Sara faktisk ser. Egen linje: "Sara ser kun det som er listet her."

2. **Hvilke avvikstyper som fanges opp**
   Kun avvikstyper som er pålagt av regelverk kunden har aktivert. Hver type vises med kravreferanse, f.eks.:
   - Brudd på personopplysningssikkerhet (GDPR art. 33) — 72-timers frist
   - Hendelse i vesentlig tjeneste (NIS2) — varslingsplikt
   - Leverandøravvik / manglende databehandleravtale (GDPR art. 28)
   - Alvorlig hendelse i AI-system (AI Act, når aktivert)
   - Avvik på sikkerhetskontroll (ISO 27001, når aktivert)
   Er et regelverk ikke aktivert, vises typen ikke. En kort forklaring sier at Sara ikke rapporterer avvik utenfor det pålagte.

3. **Flyt: fra funn til eier**
   Firetrinns visning: Sara oppdager lokalt → klassifiseres mot aktivert regelverk → avvik opprettes i registeret → tildeles automatisk eier av det respektive systemet. Kritisk alvorlighet gir i tillegg SMS til eier (kun der varsling er pålagt), med frist synlig.

4. **Personverngrense**
   Samme prinsipp som i Bruk og kontekst: kun metadata (systemidentifikator, tidspunkt, kravreferanse, alvorlighet, hash) sendes til Mynder — aldri innhold, personopplysninger eller logger.

Under kortet, når Sara er aktiv: en kompakt liste med de siste avviksfunnene fra Sara (system, kravreferanse, alvorlighet, foreslått eier, status), slik at det er tydelig hva som faktisk har skjedd automatisk.

## Teknisk

- Ny `src/lib/saraDeviationScope.ts`: overvåkede systemer (demodata basert på eksisterende systemliste), avvikstyper med kravreferanse + hvilket rammeverk som utløser dem, og en funksjon som filtrerer typene mot aktiverte rammeverk (`selected_frameworks`, samme mønster som `useMaturityScore`).
- Ny `src/components/deviations/SaraLiveDeviationsPanel.tsx` med underdeler for scope, avvikstyper, flyt og personverngrense. Gjenbruker `SaraIcon` og stilen fra `SaraMappedContextView`/`SaraPrivacyBoundaryCard`.
- `src/pages/Deviations.tsx`: leser `useSaraAgent()`; rendrer Sara-panelet inne i "Live avvik"-kortet når `installed`, ellers dagens innhold + hint-lenke til `/settings/integrations`.
- Eier-tildeling og SMS vises som konfigurert regel i UI (hvem som er eier, når SMS utløses) — ingen faktisk SMS-utsending bygges nå.
- Norsk og engelsk tekst via eksisterende `isNb`-mønster på siden.

## Ikke nå

Ingen faktisk SMS-integrasjon, ingen nye datakilder for Sara utover det som allerede er i katalogen, ingen periodisk kjøring.
