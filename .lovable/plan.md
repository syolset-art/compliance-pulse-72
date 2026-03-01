

## Vurdering: Dashbordet for Compliance-ansvarlig

### Nåværende struktur (topp til bunn)
```text
1. Onboarding / Compliance Roadmap
2. DomainComplianceWidget  ← domeneoversikt med sjekkliste-preview
3. StatusOverviewWidget    ← nesten identisk domeneoversikt
4. ActionPriorityWidget    ← hendelser + manuelle krav + oppgaver
5. SLAWidget               ← 3 SLA-kategorier med %
6. Mini-widgets 2x2        ← Aktivitet, Leverandørkjeden, Månedsoppgaver, Trust Profil
7. ComplianceSummaryCards   ← Tredjeparter, ROPA, Systemer, Organisasjon
```

### Identifiserte problemer

**1. Dobbeltvisning av domenefremdrift**
`DomainComplianceWidget` og `StatusOverviewWidget` viser begge personvern/sikkerhet/AI med prosentbar. En compliance-ansvarlig som logger inn ser de samme tallene to ganger rett etter hverandre. Dette skaper forvirring, ikke klarhet.

**2. SLA-widget gir lav merverdi i nåværende form**
Viser kun 3 kategorier (systemer/organisasjon/roller) som allerede dekkes av StatusOverview. Tar mye plass for lite innsikt.

**3. Mini-widget-grid har irrelevant innhold**
- "Trust Profil: 12 visninger" er en hardkodet demo-verdi uten reell informasjon
- "Leverandørkjeden" viser siste 3 oppdateringer uten kontekst om risiko
- "Månedens oppgaver" teller requirement_status, ikke faktiske oppgaver

**4. Mangel på "morgensjekk"-informasjon**
En compliance-ansvarlig trenger ved innlogging: Hva har endret seg? Hva forfaller snart? Hvilke risikoer er ubehandlet? Dashbordet mangler en tydelig tidslinje/forfallsvisning.

**5. ComplianceSummaryCards er gjemt nederst**
De fire strategiske kortene (Tredjeparter, ROPA, Systemer, Organisasjon) gir god oversikt, men er plassert helt nederst der brukeren kanskje aldri scroller.

---

### Plan: Strømlinjeforme dashbordet for compliance-ansvarlig

#### Endring 1: Fjern StatusOverviewWidget fra dashbordet
`DomainComplianceWidget` dekker allerede domenefremdrift med sjekkliste-preview. Fjern duplikatet.

#### Endring 2: Flytt ComplianceSummaryCards opp — rett etter DomainComplianceWidget
Disse fire kortene (Tredjeparter, ROPA, Systemer, Organisasjon) gir compliance-ansvarlig den strategiske oversikten som forventes tidlig.

#### Endring 3: Fjern SLAWidget fra dashbordet
Dataen dekkes allerede av DomainComplianceWidget og ComplianceSummaryCards. Reduserer støy.

#### Endring 4: Erstatt mini-widget-grid med to relevante widgets
Behold `RecentActivityWidget` og `MonthlyTasksWidget`. Fjern `TrustProfileViewsWidget` (hardkodet demo-tall) og `SupplyChainChangesWidget` (lav verdi her — finnes allerede i leverandørstyringen).

#### Ny rekkefølge
```text
1. Onboarding / Compliance Roadmap
2. DomainComplianceWidget           ← hovedwidget med domener + sjekkliste
3. ComplianceSummaryCards           ← 4 strategiske kort (flyttet opp)
4. ActionPriorityWidget             ← hendelser + krav + oppgaver
5. Mini-widgets 1x2                 ← Aktivitet + Månedsoppgaver
```

### Filer

| Fil | Endring |
|---|---|
| `src/pages/Index.tsx` | Fjern `StatusOverviewWidget`, `SLAWidget`, `SupplyChainChangesWidget`, `TrustProfileViewsWidget`. Flytt `ComplianceSummaryCards` opp. Juster grid til 1x2. |

