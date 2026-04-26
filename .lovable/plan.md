## Problem

På Regelverk → Krav-listen (f.eks. "Protokoll over behandlingsaktiviteter / ROPA") viser plattformen bare "Status: Ikke oppfylt" + en generisk instruksjon ("Last opp et dokument…"). Brukeren forstår ikke:

1. **Hvorfor** Lara ikke har funnet/laget dette automatisk
2. **Hvor i Mynder** dataen ville kommet fra hvis den fantes (f.eks. ROPA → modulen `Behandlingsprotokoll` på `/processing-records`)
3. **Hva brukeren konkret må gjøre** for at Lara skal kunne hente det

Dette er en generell regel — den skal gjelde **alle** krav i listen, ikke bare ROPA.

## Løsning: "Hvorfor Lara ikke fant data"-blokk per krav

Når et krav ikke er oppfylt (eller delvis), erstatter vi den generiske "Hva må gjøres?"-boksen med en strukturert **Lara-forklaringsblokk** som forteller:

- **Datakilde i Mynder** — hvilken modul/side Lara henter fra (med direktelink)
- **Hvorfor Lara ikke har data ennå** — konkret årsak (modul ikke aktivert, ingen oppføringer, manglende kobling, krever manuell handling)
- **Neste steg** — én tydelig CTA (f.eks. "Gå til Behandlingsprotokoll", "Last opp dokument", "Aktiver modul")

### Visuelt mønster (per ikke-oppfylt krav)

```text
┌─ Hvorfor mangler Lara data? ─────────────────────────┐
│ 🤖  Lara henter dette fra: Behandlingsprotokoll      │
│                                                       │
│  Lara fant 0 registrerte behandlingsaktiviteter.     │
│  For at protokollen skal være komplett må            │
│  behandlinger registreres i ROPA-modulen.            │
│                                                       │
│  [ Gå til Behandlingsprotokoll → ]                   │
└──────────────────────────────────────────────────────┘
```

For `agent_capability = "manual"` (f.eks. styrebeslutning) blir teksten:
> "Dette kravet kan ikke hentes automatisk — det krever et signert dokument eller en bekreftelse fra en person."
> CTA: `Last opp dokument`

For `agent_capability = "assisted"`:
> "Lara kan lage et utkast basert på dine data, men trenger din godkjenning."
> CTA: `Be Lara forberede utkast`

For `agent_capability = "full"` når status fortsatt er `not_met`:
> "Lara har ikke funnet nok data i [modulnavn] ennå."
> CTA: `Gå til [modul]`

## Tekniske endringer

### Fil 1: `src/lib/requirementDataSourceMap.ts` (NY)

Mapping fra `requirement_id` (eller fallback `sla_category`) → datakilde-metadata:

```ts
export interface RequirementDataSource {
  module: string;          // Vises: "Behandlingsprotokoll"
  route: string;           // /processing-records
  whyMissing: string;      // "Lara fant 0 registrerte behandlingsaktiviteter…"
  ctaLabel: string;        // "Gå til Behandlingsprotokoll"
}

export const REQUIREMENT_DATA_SOURCES: Record<string, RequirementDataSource> = {
  // GDPR
  'gdpr:art30': { module: 'Behandlingsprotokoll', route: '/processing-records', … },
  'gdpr:art33': { module: 'Avvik', route: '/deviations', … },
  'gdpr:art28': { module: 'Leverandører', route: '/assets', … },
  'gdpr:art35': { module: 'Behandlingsprotokoll (DPIA)', route: '/processing-records', … },
  // ISO 27001 — eksempler
  'A.5.1':  { module: 'Dokumenter', route: '/admin/documents', … },
  'A.5.7':  { module: 'Leverandører', route: '/assets', … },
  'A.8.9':  { module: 'Systemer', route: '/systems', … },
  // …
};

// Fallback per sla_category når spesifikk mapping mangler
export const SLA_CATEGORY_FALLBACK: Record<string, RequirementDataSource> = {
  governance:       { module: 'Dokumenter',     route: '/admin/documents',  … },
  identity_access:  { module: 'Systemer',       route: '/systems',          … },
  vendor_mgmt:      { module: 'Leverandører',   route: '/assets',           … },
  incident_mgmt:    { module: 'Avvik',          route: '/deviations',       … },
  risk_mgmt:        { module: 'Risiko',         route: '/business-risks',   … },
  data_protection:  { module: 'Behandlingsprotokoll', route: '/processing-records', … },
};

export function getRequirementDataSource(req: ComplianceRequirement): RequirementDataSource | null { … }
```

Vi starter med en pragmatisk dekning (~20–30 høyfrekvente krav + alle `sla_category`-fallbacks). Resten faller tilbake til "Mynder har ingen automatisk kilde for dette ennå — krever manuell dokumentasjon."

### Fil 2: `src/components/regulations/LaraDataSourceExplainer.tsx` (NY)

Liten presentasjonskomponent som mottar `RequirementDataSource` + `agent_capability` + `status` og rendrer den fargerike forklaringsblokken med ikon (Bot), modulnavn, årsakstekst og CTA-knapp som navigerer.

Bruker Mynder-tokens: `bg-primary/5 border-primary/20`, `text-primary` for ikon, `rounded-pill` for CTA, Mulish.

### Fil 3: `src/components/regulations/FrameworkRequirementsList.tsx` (REDIGERES)

Linjene 233–238 ("Hva må gjøres?"-boksen) erstattes med:

```tsx
{state.status !== "met" && (
  <LaraDataSourceExplainer
    requirement={req}
    status={state.status}
  />
)}
```

`LaraDataSourceExplainer` inkluderer både datakilde-blokken **og** den eksisterende "Dokumenter dette kravet"-knappen (som nå blir sekundær handling under primær CTA).

## Filer som endres
- `src/lib/requirementDataSourceMap.ts` (ny)
- `src/components/regulations/LaraDataSourceExplainer.tsx` (ny)
- `src/components/regulations/FrameworkRequirementsList.tsx` (oppdatert)

## Ut av scope
- Faktisk telling av oppføringer i hver modul (vi viser generisk "Lara fant ingen data" — ikke "Lara fant 3 av 12"). Dette kan komme i en senere iterasjon når vi vet hvilke spørringer som trengs per krav.
- Endringer i Trust Profile / Compliance Checklist (samme mønster kan gjenbrukes der senere).
- Oversettelser til engelsk — beholder norsk i denne omgangen siden hele Krav-listen allerede er norsk.