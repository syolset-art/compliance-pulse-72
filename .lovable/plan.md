

## Plan: Sirkulær score-ring + prioritetsvisning og default-sortering på leverandørkort

Oppdater `VendorCard` med en sirkulær progress-ring rundt skåren (som i referansebildet), vis tydelig prioritet, og sorter listen etter prioritet som standard.

### 1. Sirkulær score-ring i `VendorCard.tsx` (øverst til høyre)

Erstatter dagens tekst-prosent (linje 124–134) med en kompakt SVG-ring (40×40 px):

- **Ring**: `<svg>` med to `<circle>`-elementer (bakgrunn + progress). `strokeDasharray` styres av `compliance_score`.
- **Senterlabel**: 
  - Hvis `scoreDisplay === "percent"` → vis `{score}%` (lite, fet, tabular-nums)
  - Hvis `scoreDisplay === "label"` → vis "Sterk" / "Moderat" / "Svak" / "Ikke vurdert"
- **Fargekoding** (matcher Mynders risikofarger):
  - ≥75 → `text-success` / stroke `hsl(var(--success))` ("Sterk")
  - 50–74 → `text-warning` / stroke `hsl(var(--warning))` ("Moderat")
  - <50 → `text-destructive` / stroke `hsl(var(--destructive))` ("Svak")
  - 0 / null → grå ring, ingen progress, label "–" eller "Ikke vurdert"
- Action-menyen (`AssetRowActionMenu`) flyttes ned ved siden av ringen eller beholdes inline.

### 2. Prioritetsvisning på kortet

Beholder priority-badgen i Row 2 men gjør den mer tydelig med fargekoding etter nivå:

| Nivå | Label | Stil |
|---|---|---|
| `critical` | Kritisk | `bg-destructive/10 text-destructive border-destructive/20` |
| `high` | Høy | `bg-warning/15 text-warning border-warning/30` |
| `medium` | Medium | `bg-primary/10 text-primary border-primary/20` |
| `low` | Lav | `bg-muted text-muted-foreground border-border` |
| `null` | Ikke satt prioritet | `bg-muted/50 text-muted-foreground border-dashed` |

Badge får et lite `Flag`-ikon foran labelen for å skille fra de andre badges.

### 3. Default-sortering etter prioritet i `VendorListTab.tsx`

I `filtered`-useMemo (linje 183–213): Når `sortColumn === null` (ingen aktiv brukersortering), sorter resultatet etter prioritetsrangering før newly-added-injeksjon:

```text
critical (0) → high (1) → medium (2) → low (3) → null/ikke satt (4)
```

Sekundær sortering: `compliance_score` synkende, deretter `name` A→Z.

Brukerens manuelle sortering (klikk på kolonneheader i list-view) overstyrer dette som før.

### 4. Liten visuell justering

- Card-header får litt mer padding-right (`pr-1`) så ringen ikke krasjer med 3-prikkmenyen.
- Ringen får tooltip på hover som viser eksakt prosent + label uansett `scoreDisplay`-mode.

### Filer som endres
- `src/components/vendor-dashboard/VendorCard.tsx` — ny `<ScoreRing>`-subkomponent + oppdatert priority-badge
- `src/components/vendor-dashboard/VendorListTab.tsx` — default-sortering etter prioritet

### Ut av scope
- Sortering i list-view-tabellen (beholder eksisterende kolonnesortering)
- Endring av list-view-rad (kun card-view får ringen i denne iterasjonen)
- Ny prioritetskolonne i tabellvisningen (kan komme i neste iterasjon)

