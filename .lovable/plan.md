

# Plan: Sikkerhetstjenester koblet til compliance-krav og Trust Profile

## Konsept

Opprette en **Security Service Catalog** — en definert liste over sikkerhetstjenestekategorier (Backup & Restore, Endepunktsikkerhet, E-postsikkerhet, Nettverk- og skysikkerhet, Sikkerhetskultur, SOC-tjeneste, Compliance) som kobles til ISO 27001-kontroller og compliance-krav. Denne koblingen synliggjøres på tre steder:

```text
1. Trust Profile (ny fane/seksjon "Sikkerhetstjenester")
   → Viser hvilke tjenestekategorier som er dekket/mangler
   → Premium feature for MSP-kundens sluttbruker

2. MSP Customer Detail
   → Partner ser gap-analyse: hvilke tjenester kunden trenger
   → Direkte kobling til kartleggingsresultater

3. Dashboard-widget "Sikkerhetsdekning"
   → Visuell oversikt over dekning per kategori
   → Fargekodede kort (grønn/gul/rød)
```

## Tekniske endringer

### 1. Ny fil: `src/lib/securityServiceCatalog.ts`
Definerer 7 tjenestekategorier med:
- `id`, `name`, `color` (matcher bildet)
- `linkedControls[]` — ISO 27001 requirement_ids (f.eks. Backup → A.12.3, A.8.13)
- `linkedAssessmentKeys[]` — kobling til MSP assessment questions
- `description`, `icon`

### 2. Ny komponent: `src/components/msp/SecurityServiceGapCard.tsx`
- Viser 7 tjenestekategorier som fargekodede kort
- Kryssjekker med kundens assessment-svar og asset-data
- Status per kategori: "Dekket" / "Mangler" / "Ukjent"
- Plasseres på MSP Customer Detail-siden

### 3. Ny komponent: `src/components/widgets/SecurityCoverageWidget.tsx`
- Dashboard-widget med kompakt visning av dekning
- 7 mini-kort med fargekoding fra bildet
- Teller: "4/7 dekket" med progress bar
- Klikk navigerer til Trust Profile eller MSP-detalj

### 4. Ny seksjon i Trust Profile: `src/components/asset-profile/tabs/SecurityServicesSection.tsx`
- Vises som Premium-seksjon i Trust Profile (self-type)
- Viser hvilke sikkerhetstjenester som er aktive
- MSP-kundens sluttbruker ser anbefalinger basert på compliance-gap

### 5. Oppdater `src/lib/dashboardLayouts.ts`
- Legg til `security-coverage` widget i `ALL_WIDGETS`
- Vis for `sikkerhetsansvarlig` og `compliance_ansvarlig`

### Filer som endres/opprettes

| Fil | Endring |
|---|---|
| `src/lib/securityServiceCatalog.ts` | Ny — 7 kategorier med ISO-kobling |
| `src/components/msp/SecurityServiceGapCard.tsx` | Ny — gap-analyse for MSP-kunder |
| `src/components/widgets/SecurityCoverageWidget.tsx` | Ny — dashboard-widget |
| `src/components/asset-profile/tabs/SecurityServicesSection.tsx` | Ny — Trust Profile premium-seksjon |
| `src/lib/dashboardLayouts.ts` | Legg til widget-config |
| `src/pages/MSPCustomerDetail.tsx` | Legg til SecurityServiceGapCard |

Ingen databaseendringer nødvendig — all data utledes fra eksisterende assessment-svar og asset-metadata.

