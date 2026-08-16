# Rapporter som generell, dynamisk funksjon

Rapporter ligger i dag under Core-seksjonen i menyen (`/reports` → `/reports/compliance`). Anbefaling: ja — rapportering er en tverrgående funksjon som henter data fra alle moduler, ikke en Core-funksjon. Den flyttes til global navigasjon mellom **Regelverk** og **Meldinger**, og innholdet tilpasses hvilke produkter kunden har aktivert.

## Meny

Rapporter blir et eget punkt med undermeny (samme mønster som Trust Center):

```text
Regelverk
Rapporter
  ├── Samlet modenhet      /reports/compliance
  └── Alle rapporter       /reports/all
Meldinger
Dokument hub
```

- Punktet fjernes fra Core-seksjonen (og fra "Moduler"-fallbacken).
- **Samlet modenhet** er alltid tilgjengelig, uavhengig av moduler — det er standardsiden når man klikker Rapporter.
- Undermenyen holdes åpen når man står på en av underrutene.

## Dynamisk innhold

Rapportsidene leser aktive moduler (samme kilde som menyen bruker: aktiverte produkter/tjenester) og viser kun det som er relevant:

| Aktivert | Vises i Rapporter |
|---|---|
| Alltid | Samlet modenhet (5 kontrollområder + Trust Score) |
| Kun Regelverk | Kontrollområder + status per aktivert regelverk. Ved ett regelverk: fokusert visning av det regelverket |
| Core | Systemer, oppgaver, protokoller/RoPA-rapporter |
| Leverandør | Leverandør- og tredjepartsrapporter |
| Eiendeler | Eiendelsrapporter |
| Avviksregister | Avviksrapport |
| Trust Center | Trust-profil/eksternrapport |

Rapportkort for moduler som ikke er aktivert skjules helt (ingen låste kort/støy).

## Samlet modenhet

Beholder dagens visning på `/reports/compliance` og strammes til å matche referansebildet:

- Kort med tittel "Modenhet per kontrollområde" og "Trust Score NN /100" til høyre.
- Fem kontrollområder i to kolonner, hvert med ikon, navn, nivå (HØY/MIDDELS/LAV i grønn/oransje/rød) og fremdriftslinje.
- Hvert område kan ekspanderes (chevron) for å se hvilke krav som ligger bak.
- Under kortet: regelverksstatus for regelverkene som er i scope.

Fargeterskler følger eksisterende regel: grønn ≥ 75 %, oransje 50–74 %, rød < 50 %.

## Teknisk

- `src/components/Sidebar.tsx`: fjern `nav.reports` fra `coreNav`/`exploreCoreItems`, legg til en `ReportsMenu`-collapsible i `globalNav`-området mellom Regelverk og Meldinger.
- Ruter uendret: `/reports` redirect → `/reports/compliance`, `/reports/all` → `Reports.tsx`, `/reports/compliance` → `ComplianceOverview.tsx`.
- `src/pages/Reports.tsx`: filtrer rapportkort/faner mot aktive moduler via eksisterende `useActivatedServices` / `moduleActivationState`.
- `src/pages/ComplianceOverview.tsx`: rydd i `PILLARS` (duplisert navn "Personvern og datahåndtering" i to av områdene rettes til de fem kanoniske kontrollområdene fra `src/lib/controlAreas.ts`), legg til ekspanderbare rader, og fokusert visning når kun ett regelverk er aktivt.
- Oversettelser for ny undermeny legges i EN/NO-locale-filene.
