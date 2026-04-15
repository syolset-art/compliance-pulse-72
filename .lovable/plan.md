

# Plan: Fjerne partnerkunder fra organisasjonsvelgeren

## Konsept
Partnerkunder (fra `msp_customers`) skal ikke vises i sidebar-menyen. De hører hjemme i kundeoversikten på `/msp-dashboard`. Organisasjonsvelgeren skal kun vise egne virksomheter (`company_profile`).

## Endringer

### 1. `src/contexts/ActiveOrganizationContext.tsx`
- Fjerne fetch av `msp_customers` fra `fetchOrganizations`
- Kun hente fra `company_profile`
- Fjerne `partnerOrgs`-logikken

### 2. `src/components/sidebar/OrganizationSwitcher.tsx`
- Fjerne filtreringen og visningen av "Partnerkunder"-seksjonen
- Kun vise egne virksomheter (uten grupperings-label siden det bare er én type)

### 3. `src/components/sidebar/AddOrganizationDialog.tsx`
- Beholde muligheten til å legge til som partnerkunde — men da legges den bare til i `msp_customers` og vises på `/msp-dashboard`, ikke i menyen

## Filer

| Fil | Endring |
|---|---|
| `src/contexts/ActiveOrganizationContext.tsx` | Fjerne msp_customers-fetch, kun company_profile |
| `src/components/sidebar/OrganizationSwitcher.tsx` | Fjerne "Partnerkunder"-seksjonen |

