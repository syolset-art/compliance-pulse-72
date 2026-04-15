

# Plan: Øke tekststørrelsen i sidebaren

## Problem
Seksjonsoverskriftene i sidebaren bruker `text-xs` (12px) som er for lite. Menyelementene bruker `text-sm` (14px) som også kan virke smått.

## Endringer i `src/components/Sidebar.tsx`

### Seksjonsoverskrifter (CollapsibleSection headers)
- Linje 275: `text-xs font-semibold` → `text-sm font-semibold`
- Linje 447: `text-xs font-semibold` → `text-sm font-semibold`

### Menyelementer (links)
Menyelementene bruker allerede `text-sm` — disse kan økes til `text-[0.9375rem]` (15px) for bedre lesbarhet, eller beholdes som `text-sm` om bare overskriftene var problemet.

### Ikoner
Seksjonsikonene er `h-4 w-4` (16px) — disse økes til `h-[18px] w-[18px]` for å matche litt større tekst.

## Fil

| Fil | Endring |
|---|---|
| `src/components/Sidebar.tsx` | Øke `text-xs` → `text-sm` på seksjonsoverskrifter, vurdere økning på menyelementer |

