# Regelverk-siden: fra SaaS-dashbord til agentisk arbeidsflate

Siden er i dag bygget som et klassisk SaaS-dashbord: tittel + "Endre regelverk"-knapp, en sammendragsboks med prosentbar, filterknapper (Alle / Kategori / Land), chip-velger, detaljkort, historikkgraf og til slutt kravlisten. Brukeren må selv finne ut hva som er neste steg.

Målet er at siden åpner med Laras vurdering og forslag til handling, og at alt konfigurasjonspreget (filtre, chips, statistikk) trekkes ned eller skjules bak progressive avsløringer.

## Slik skal siden se ut

```text
┌──────────────────────────────────────────────┐
│ Lara-linje: "Jeg har gått gjennom 7 regelverk│
│ i natt. 12 krav er bekreftet automatisk,     │
│ 3 venter på din godkjenning."   [Se gjennom] │
├──────────────────────────────────────────────┤
│ Laras arbeidskø (maks 3 kort)                │
│ • Godkjenn bevis – GDPR art. 30   [Åpne]     │
│ • Bekreft status – NIS2 §12       [Åpne]     │
│ • Mangler grunnlag – ISO 27001    [Åpne]     │
├──────────────────────────────────────────────┤
│ Dine regelverk (rolige rader, ikke chips)    │
│ GDPR      68 %  ▓▓▓▓▓░░  Lara følger 4 krav  │
│ NIS2      41 %  ▓▓░░░░░  Venter på deg: 6    │
├──────────────────────────────────────────────┤
│ Detalj for valgt regelverk (som i dag)       │
└──────────────────────────────────────────────┘
```

## Endringer

1. **Agentisk topplinje (ny komponent)** — erstatter dagens tittelrad + prosent-sammendrag. Viser hva Lara har gjort siden sist (antall krav analysert, bekreftet, hva som venter), skrevet i første person og kort. Statusprosenten vises som en diskret tall-linje, ikke som stor progress-boks. "Endre regelverk" flyttes til en diskret meny til høyre.

2. **Laras arbeidskø på regelverk-nivå (ny komponent)** — maks tre kort: godkjenn bevis, bekreft foreslått status, manglende grunnlag. Hvert kort har én primærhandling som åpner eksisterende dialog/arbeidsvindu (samme mønster som arbeidskøen på dashbordet). Ingen kø = en rolig "alt er i orden"-linje.

3. **Regelverkslisten i stedet for chips + filterknapper** — rolige rader med navn, modenhet og en kort agent-status ("Lara følger opp 4 krav" / "6 venter på deg"). Kategori- og land-filtre samles i én diskret filterknapp som bare vises når man har mer enn et par regelverk. Chip-velgeren og "Alle/Kategori/Land"-knappene fjernes fra hovedflaten.

4. **Historikkgrafen dempes** — flyttes inn i detaljvisningen som en sammenleggbar seksjon ("Hva har skjedd"), slik at grafen ikke tar plass før man har valgt et regelverk.

5. **Språk og mikrotekst** — erstatt dashbord-språk ("Velg et regelverk eller en standard for å se status") med agent-språk ("Lara holder oversikt over regelverkene dine. Her er det hun trenger deg til."). Hover-forklaringer beholdes der de finnes i dag.

6. **Bevegelse** — samme diskrete stagger-inn-animasjon som brukes på leverandørdashbordet, slik at Lara-linje, arbeidskø og liste ruller inn i rekkefølge.

## Teknisk

- Ny `src/components/regulations/LaraRegulationsHeader.tsx` (agentisk topplinje) og `src/components/regulations/RegulationsWorkQueue.tsx` (arbeidskø), begge presentasjonskomponenter som får data via props fra `Regulations.tsx`.
- Køelementene utledes deterministisk fra eksisterende data: `getRequirementsByFramework` / `ALL_ADDITIONAL_REQUIREMENTS`, `agentConfirmedRequirementIds` og `demoUiStateFor` — samme kilder som `FrameworkRequirementsList` bruker, så tallene stemmer overens.
- Gjenbruker mønsteret fra `src/lib/laraWorkQueue.ts` for korttyper og begrunnelser.
- `ActiveFrameworksSummary` og `FrameworkChipSelector` erstattes på denne siden av en ny rolig `FrameworkOverviewList`; komponentene beholdes for andre bruksteder.
- `ComplianceHistoryChart` pakkes i en collapsible i detaljvisningen.
- Kun frontend/presentasjon. Ingen endringer i datamodell, status-logikk eller backend. Alle farger via eksisterende semantiske tokens.
