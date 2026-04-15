

# Plan: Gruppere "Flere tjenester" i kategorier

## Problem

Når moduler vises under "Flere tjenester", er de en flat liste. Brukeren ønsker at de grupperes logisk:

```text
▾ Flere tjenester
  ── Mynder Core ──
    Arbeidsområder
    Oppgaver
    Avviksregister
    Rapporter
    Systemer

  ── Registre ──
    Leverandører
    Assets
```

## Endring

### `src/components/Sidebar.tsx`

Oppdatere renderingen av "Flere tjenester"-seksjonen (linje 462-478):

1. **Splitte `exploreItems` i to grupper** — `exploreCoreItems` (fra `managementNav` hvis ikke aktiv) og `exploreRegistryItems` (Leverandører + Assets hvis ikke aktive)
2. **Legge til underoverskrifter** inne i den collapsible seksjonen — små `text-[10px] uppercase text-muted-foreground` labels for "Mynder Core" og "Registre"
3. **Bare vise kategori-headere** når den kategorien har items (f.eks. hvis bare Leverandører mangler, vis kun "Registre"-headeren)

Endringene er kun i renderingen av explore-seksjonen — ingen ny fil, ingen andre filer.

## Fil

| Fil | Endring |
|---|---|
| `src/components/Sidebar.tsx` | Gruppere explore-items under kategori-overskrifter |

