

# Sentrering av dashboard-innholdet

## Problem

Dashboard-siden (Index.tsx) er ikke sentrert som de andre sidene i applikasjonen. Innholdet er venstreorientert i stedet for horisontalt sentrert.

## Sammenligning av nåværende layout

| Side | CSS-klasser | Sentrert? |
|------|-------------|-----------|
| **Dashboard (desktop)** | `w-full max-w-7xl p-4 md:p-10` | Nei |
| **Dashboard (mobil)** | `container max-w-7xl mx-auto p-4` | Ja |
| **Regulations** | `p-6 max-w-4xl mx-auto` | Ja |
| **Tasks** | `container mx-auto p-6 max-w-7xl` | Ja |

## Løsning

Legge til `mx-auto` på dashboard-containerens desktop-layout for å sentrere innholdet horisontalt, akkurat som de andre sidene.

## Teknisk endring

### Fil: `src/pages/Index.tsx`

**Linje 254 - Desktop layout:**

Fra:
```tsx
<div className="w-full max-w-7xl p-4 md:p-10 pt-8 md:pt-10">
```

Til:
```tsx
<div className="w-full max-w-7xl mx-auto p-4 md:p-10 pt-8 md:pt-10">
```

## Resultat

Etter denne endringen vil dashboard-innholdet:
- Være sentrert horisontalt på store skjermer
- Ha samme visuelle oppførsel som Regulations, Tasks og andre sider
- Følge prosjektets etablerte layout-standard (`container max-w-7xl mx-auto`)

