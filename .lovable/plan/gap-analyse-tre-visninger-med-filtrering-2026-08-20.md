# Gap-analyse: tre visninger med filtrering

Gap-analysen på leverandørprofilen beholder %-samsvar øverst, men får en visningsvelger slik at du kan se det samme resultatet på tre måter.

## Slik blir det

Øverst (uendret): samsvarsprosent, fargebåndet og tellerne oppfylt / delvis / mangler.

Rett under kommer en segmentert velger:

```text
[ Gap ]  [ Dokumentasjon ]  [ Regelverk ]
```

**1. Gap (standard, som i dag)**
Lara-kortet og gap-kortene med risiko, forslag og handlinger — ingen endring.

**2. Dokumentasjon (tabellvisning)**
Tabell med én rad per krav:

| Krav | Status | Dokumentasjon | Opprinnelse | Handling |
|---|---|---|---|---|
| Krav-ID + navn | Oppfylt / Delvis / Mangler | dokumentnavn, eller «Mangler» | Intern / Ekstern / Lara-funn | Be om dokumentasjon / Last opp |

Over tabellen: filterpiller **Alle · Har dokumentasjon · Mangler dokumentasjon**, pluss søk på kravnavn. Tabellen er standardvisningen når du filtrerer på dokumentasjon.

**3. Regelverk**
Samme kravliste-visning som under Regelverk-siden (bildet): kravene gruppert i seksjoner «Ikke oppfylt / Delvis / Oppfylt», med statuspiller, ekspanderbare rader og dokumentvedlegg per krav — men fylt med leverandørens gap-resultat, ikke egen virksomhets status. Filterpillene på toppen (Mangler, Delvis, Oppfylt, Alle) styrer hva som vises.

## Teknisk

- `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx`: ny `view`-state (`gap` | `docs` | `requirements`), segmentert velger under score-kortet. Eksisterende gap-innhold flyttes bak `view === "gap"`.
- Ny `src/components/asset-profile/gap/GapDocumentationTable.tsx`: tabell bygget på `latest.results` (`GapItem.evidence`, `status`, `name`). Filter «har / mangler» avledes av om `evidence` er tom. Opprinnelse gjenbruker `resolveDocOrigin`/`docOriginLabel` fra `src/lib/vendorDocumentSource.ts`.
- Ny `src/components/asset-profile/gap/GapRequirementsView.tsx`: gjenbruker det visuelle mønsteret fra `FrameworkRequirementsList` (statusgrupper, piller, ekspanderbare rader), men tar gap-resultatet som datakilde og slår opp kravtekst via `getRequirementsByFramework(framework)` på `requirement_id`. `FrameworkRequirementsList` selv endres ikke, siden den viser egen virksomhets status og har eget databaseoppslag.
- Alle nye strenger tospråklige (nb/en), statusfarger fra eksisterende tokens (success/warning/destructive).
