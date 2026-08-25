# Filter på Mynders fem kontrollområder i «Opprett tjenestepakke»

## Mål

I sheetet der partneren bygger en tjenestepakke skal det ligge et filter øverst i kravlisten, slik at man kan vise kun krav som hører til ett eller flere av Mynders fem kontrollområder: Styring og ansvar, Drift og sikkerhet, Identitet og tilgang, Personvern og datahåndtering, Tredjepart og verdikjede.

## Hva som bygges

1. **Filterrad** i samme rad som hjelpeteksten «Fjern haken på krav du ikke vil levere på …» og «Legg til aktivitet»: fem klikkbare piller med områdeikon og navn (samme uttrykk som eksisterende områdepiller i plattformen), pluss «Alle».
2. **Flervalg.** Ingen valgt = vis alt. Én eller flere valgt = vis kun oppgaver som treffer minst ett valgt område. Teller per pille viser antall oppgaver i området.
3. **Grupperingen beholdes** (Fysiske/Organisatoriske/Personell/Teknologiske kontroller, sammenleggbare og lukket som standard). Tomme grupper skjules når filteret ikke gir treff.
4. **Sluttsummen påvirkes ikke av filteret** — filtrering er kun visning. Krav man fjerner haken på er fortsatt det som styrer summen. Dette forklares i et info-ikon på filterraden.
5. **Egne aktiviteter** (kategorien «Egne aktiviteter») vises alltid, uansett filter, siden de ikke er knyttet til et kontrollområde.

## Teknisk

- `src/components/msp/MSPFrameworkTaskPackageSheet.tsx`: ny `areaFilter`-state (`Set<ControlAreaKey>`), filtrering før `grouped`-useMemo, ny liten filterkomponent-rad.
- Kravdata: utvid select i `compliance_requirements`-queryen med `sla_category`, og `RequirementRow` i `src/lib/frameworkTaskPackage.ts` med `sla_category?: string | null`.
- `buildFrameworkTasks` får med `controlAreas: ControlAreaKey[]` per oppgave (en oppgave kan dekke flere krav og dermed flere områder), utledet med `toCanonicalArea(row.sla_category)` fra `src/lib/controlAreas.ts`.
- Fallback når `sla_category` mangler (bl.a. baseline-rader fra `frameworkRequirementBaseline.ts`): map ISO-kategorien via en liten tabell (organizational/legal → governance, technological → operations, physical → operations, people → identityAccess), ellers `governance`.
- Ingen databaseendringer.
