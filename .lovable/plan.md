

# Dashboard 1.0 -- Fire nye mini-widgets

Legger til fire kompakte, intuitive widgets mellom ActionPriorityWidget og ComplianceSummaryCards pa dashbordet.

## Nye widgets

### 1. RecentActivityWidget -- "Siste aktivitet"
Viser hvem som sist var inne og hva de gjorde. Kompakt kort med avatar/initialer, navn, handling og tidspunkt. Henter fra `requirement_status` (sist oppdatert), `maturity_milestones` (sist oppnadd) og `system_incidents` (sist oppdatert). Viser de 3 siste hendelsene.

### 2. SupplyChainChangesWidget -- "Endringer i leverandorkjeden"
Viser nylige endringer blant leverandorer -- nye leverandorer lagt til, endret risikoniva, manglende DPA. Henter fra `assets` (vendor-typer) sortert pa `updated_at` DESC, viser de 3 siste endringene med ikon og tidspunkt.

### 3. MonthlyTasksWidget -- "Manedens oppgaver"
Viser hvor mange oppgaver som er utfort denne maneden vs. gjenstående. Enkel progress-bar med tall. Henter fra `requirement_status` og `tasks` der `updated_at` er innevarende maned. Viser "X av Y utfort" med en grønn hake eller advarselsikon.

### 4. TrustProfileViewsWidget -- "Trust Profil visninger"
Viser antall som har sett brukerens Trust Profil, med mulighet for a dele via "Mynder Trust Engine" (offisiell) eller utvalgte grupper. Krever en ny databasetabell `trust_profile_views` for a logge visninger. I forste versjon vises demo-data med et tall og en CTA for a dele profilen bredere.

## Layout

Plasseres som et 2x2 grid (pa desktop) / stack (mobil) mellom SLAWidget og ComplianceSummaryCards:

```text
+-------------------------+-------------------------+
| Siste aktivitet         | Leverandorkjede-endringer|
+-------------------------+-------------------------+
| Manedens oppgaver       | Trust Profil visninger   |
+-------------------------+-------------------------+
```

## Filer

1. **Ny: `src/components/widgets/RecentActivityWidget.tsx`** -- Kompakt liste med 3 siste handlinger fra ulike tabeller
2. **Ny: `src/components/widgets/SupplyChainChangesWidget.tsx`** -- Nylige leverandorendringer
3. **Ny: `src/components/widgets/MonthlyTasksWidget.tsx`** -- Progresjon for innevarende maned
4. **Ny: `src/components/widgets/TrustProfileViewsWidget.tsx`** -- Visninger + delings-CTA
5. **Endret: `src/pages/Index.tsx`** -- Importerer og plasserer de fire widgetene i dashboardContent

## Tekniske detaljer

### RecentActivityWidget
- Tre separate Supabase-sporringer: `requirement_status` (ORDER BY updated_at DESC LIMIT 3), `maturity_milestones` (ORDER BY achieved_at DESC LIMIT 3), `system_incidents` (ORDER BY last_updated DESC LIMIT 3)
- Merger og sorterer pa tidspunkt, viser topp 3
- Viser handling som "Fullforte krav", "Oppnadd milepael", "Oppdaterte hendelse" med relativ tid (date-fns formatDistanceToNow)

### SupplyChainChangesWidget
- Henter `assets` med `asset_type IN ('vendor','sub_processor')` ORDER BY `updated_at` DESC LIMIT 5
- Sammenligner `created_at` vs `updated_at` for a skille mellom "Ny leverandor" og "Oppdatert"
- Viser ikon, leverandornavn og tidspunkt

### MonthlyTasksWidget
- Henter `requirement_status` der `completed_at` er i innevarende maned (>= forste dag i mnd)
- Teller fullforte vs. totalt antall krav
- Viser progress bar og "X av Y utfort denne maneden"
- Gronn checkmark hvis alle er utfort, oransje advarsel hvis under 50%

### TrustProfileViewsWidget
- Henter `assets` med `asset_type = 'self'` for a sjekke `publish_mode`
- I forste versjon: demo/mock visningsdata (antall visninger siste 30 dager)
- Viser: visningsantall, publiseringsstatus, og en knapp "Del via Mynder Trust Engine" som lenker til asset-profilen
- Senere: ny tabell `trust_profile_views` for ekte sporring

