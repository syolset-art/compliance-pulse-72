

# Plan: Navigere til dashboard og speile valgt virksomhet ved bytte

## Problem
1. Når brukeren bytter virksomhet i OrganizationSwitcher skjer det ingen navigering — brukeren kan bli stående på en underside som viser data fra forrige org.
2. Dashboard henter `companyName` fra `company_profile` uavhengig av valgt org, og reagerer ikke på bytte.

## Endringer

### 1. `src/components/sidebar/OrganizationSwitcher.tsx`
- Importere `useNavigate` fra react-router-dom
- Ved klikk på en org: kalle `setActiveOrg(org)`, lukke listen, og navigere til `/`

### 2. `src/pages/Index.tsx`
- Importere `useActiveOrganization`
- Bruke `activeOrg.name` som `companyName` i stedet for å fetche separat fra `company_profile`
- Fjerne den separate `companyName`-staten og tilhørende fetch (beholde `assetTypeTemplates`-fetch)

## Filer

| Fil | Endring |
|---|---|
| `src/components/sidebar/OrganizationSwitcher.tsx` | Legge til `useNavigate` og navigere til `/` ved org-bytte |
| `src/pages/Index.tsx` | Bruke `activeOrg.name` fra context i stedet for separat DB-fetch |

