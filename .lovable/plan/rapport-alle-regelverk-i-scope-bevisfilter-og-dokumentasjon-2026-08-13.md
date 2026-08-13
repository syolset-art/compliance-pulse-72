# Rapport: alle regelverk i scope, bevisfilter og dokumentasjon per kontrollområde

Rapporten som lastes ned fra `/reports/compliance` skal dekke alle aktive regelverk, bruke de tre reelle statusene, la brukeren filtrere krav på med/uten bevis, og vise hvilken dokumentasjon som er knyttet til hvert kontrollområde.

## Slik blir det

**1. Alle regelverk i scope er med**
- I nedlastingsdialogen forhåndsvelges alle aktive regelverk (som i dag), men "Inkluder alle krav per regelverk" blir slått på som standard, slik at kravene faktisk følger med i PDF-en.
- Kravlisten hentes for hvert valgte regelverk, også for regelverk som ligger i tilleggssettet.

**2. Riktige statuser (tre stykker)**
Dagens rapport bruker "Oppfylt / Delvis / Ikke oppfylt". Dette byttes til modellen brukeren faktisk velger i Manuell dokumentering:
- Ja, dette oppfylles
- Ikke påbegynt
- Ikke relevant (tas med i datagrunnlaget, men vises ikke som egen kolonneverdi i sammendraget — kravene filtreres bort fra oppfyllelsesgraden siden virksomheten selv har valgt det)

Sammendrag og prosent regnes som oppfylte krav delt på relevante krav (ikke-relevante trekkes ut), og dette forklares i én setning i rapporten.

**3. Filter på bevis**
Ny valgmulighet i nedlastingsdialogen: "Krav som skal inkluderes"
- Alle besvarte krav (standard)
- Kun krav med bevis
- Kun krav uten bevis

Kravtabellen får en egen kolonne "Bevis" som viser antall vedlegg (eller "Mangler"), og filteret styrer hvilke rader som skrives ut.

**4. Dokumentasjon per kontrollområde**
Ny seksjon i PDF-en: "Dokumentasjon per kontrollområde". For hvert av de fem kontrollområdene listes:
- dokumentnavn / bevistype
- hvilket regelverk og krav det er knyttet til
- status på beviset (opplastet, agent-bekreftet, mangler)

Kontrollområdene er de samme fem som i regelverksvisningen, via `toCanonicalArea`.

## Teknisk

- `src/components/reports/DownloadReportDialog.tsx`: nytt `evidenceFilter`-valg (alle / med bevis / uten bevis), `includeRequirements` default `true`, sender valget videre til generatoren.
- `src/components/reports/generateFullComplianceReport.ts`:
  - erstatt `getStatusLabel` med en statusmodell basert på `src/lib/requirementStatusModel.ts` (mappet til de tre etikettene), og et deterministisk bevisantall per krav slik prototypen bruker ellers.
  - filtrer kravrader på `evidenceFilter`, legg til "Bevis"-kolonne.
  - ny seksjon som grupperer bevis per kontrollområde via `toCanonicalArea` fra `src/lib/controlAreas.ts` og forventet dokumentasjon fra `src/lib/frameworkEvidenceExpectations.ts`.
  - oppdater sammendragsteksten til ny statusmodell.
- Samme statuskart gjenbrukes i `src/components/regulations/ExportCompliancePdf.ts` så enkeltregelverk-eksporten er konsistent.

Merk: bevis registrert i regelverksvisningen ligger foreløpig kun i komponent-state (ikke lagret i databasen), så rapporten bruker samme deterministiske prototypedata som resten av flyten. Å persistere bevis er en egen jobb.
