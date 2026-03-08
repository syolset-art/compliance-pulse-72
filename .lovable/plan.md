

## Plan: Oppdater fokusområder til ny 4-delt struktur

### Nåværende situasjon
Plattformen bruker i dag `sla_category` med 3 verdier: `systems_processes`, `organization_governance`, `roles_access`. Disse vises i SLA-nedbrytningen på ISO Readiness-siden, i ComplianceSummaryCards-widgeten, og i SLAWidget. Hver compliance-krav er tagget med en av disse.

### Nye fokusområder
Erstatte de 3 kategoriene med 4 nye:

| ID | Navn (NO) | Beskrivelse |
|----|-----------|-------------|
| `governance` | Governance | Styring, ansvar og risikostyring |
| `operations` | Operations | Systemer, prosesser og drift |
| `identity_access` | Identity & Access | Brukere, roller og tilgangskontroll |
| `supplier_ecosystem` | Supplier & Ecosystem | Leverandører og tredjepartsrisiko |

### Filer som endres

**1. `src/lib/certificationPhases.ts`**
- Endre `SLACategory` type fra 3 til 4 verdier
- Oppdater `getPhaseForRequirement` til å bruke nye kategorier

**2. `src/lib/complianceRequirementsData.ts`** (1681 linjer)
- Re-mappe alle ~150+ krav fra gammel `sla_category` til ny:
  - `organization_governance` → `governance`
  - `systems_processes` → `operations` (hoveddelen) eller `supplier_ecosystem` (leverandør-relaterte)
  - `roles_access` → `identity_access`
- Leverandør-relaterte krav (A.5.19–A.5.23 osv.) flyttes til `supplier_ecosystem`

**3. `src/components/iso-readiness/SLACategoryBreakdown.tsx`**
- Utvide fra 3 til 4 kort med nye ikoner og farger
- Oppdatere `MOCK_TRENDS` med 4 verdier

**4. `src/components/widgets/SLAWidget.tsx`**
- Oppdatere `SLA_CATEGORIES` array til 4 verdier

**5. `src/components/widgets/ComplianceSummaryCards.tsx`**
- Oppdatere `slaByCat` referanser til nye kategorier

**6. `src/locales/en.json` og `src/locales/nb.json`**
- Legge til oversettelser for de 4 nye kategorinavnene

### Mapping-logikk (forenklet)
- Krav som handler om policy, ledelsesansvar, risikovurdering → `governance`
- Krav om systemer, drift, hendelser, kryptering, logging → `operations`
- Krav om tilgangskontroll, identitet, autentisering, roller → `identity_access`
- Krav om leverandører, skytjenester, supply chain → `supplier_ecosystem`

### Teknisk detalj
`SLACategory` typen i `certificationPhases.ts` er den sentrale definisjonen. Alle komponenter som refererer til denne typen vil automatisk få typefeil ved endring, noe som gjør refaktoreringen trygg.

Database-tabellen `compliance_requirements` har en `sla_category`-kolonne. Eksisterende data i databasen bør migreres til de nye verdiene, men statiske data i koden er primærkilden.

