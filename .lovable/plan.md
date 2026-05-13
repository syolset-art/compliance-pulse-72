## Mål

Fjerne "Sist lagt til"-widgeten på Leverandør-oversikten og erstatte den med en graf som viser compliance-aktivitet over tid — uavhengig av om aktiviteten er utført av Lara (agentisk) eller av et menneske.

## Hva som endres

**Fil:** `src/components/vendor-dashboard/VendorOverviewTab.tsx`
- Fjern hele "Recently Added"-kortet (linje ~232–272).
- Behold rutenettet 2-kolonner: venstre = ny `ComplianceActivityChart`, høyre = eksisterende `SystemsPriorityChart`.

**Ny fil:** `src/components/vendor-dashboard/ComplianceActivityChart.tsx`

## Graf-design

- **Type:** Stacked area chart (Recharts) med myk gradient — passer eksisterende visuelle språk.
- **X-akse:** Siste 30 dager (gruppert per dag) med toggle for 7d / 30d / 90d.
- **Y-akse:** Antall aktiviteter.
- **To serier (stacket):**
  - **Lara (agentisk)** — primary-fargen
  - **Manuell (menneske)** — accent/muted-foreground
- **Header:** Tittel "Compliance-aktivitet", totalsum siste periode + endring vs forrige periode (↑/↓ %).
- **Tooltip:** Dato + fordeling Lara / Manuell + total.
- **Tom tilstand:** Diskret melding "Ingen aktivitet registrert i perioden".

## Datakilder (aktivitet = enhver compliance-handling)

Aggregeres i én spørring per kilde, deretter slått sammen klient-side per dag:

| Kilde | Tabell | Tidsstempel | Kategori |
|---|---|---|---|
| Statusendringer på krav | `requirement_status` | `updated_at` | Manuell hvis `updated_by` er bruker, ellers Lara |
| Evidens lagt til/sjekket | `evidence_checks` | `created_at` | Lara hvis `source = 'lara'/'ai'`, ellers Manuell |
| Lara-forslag utført | `lara_inbox` | `updated_at` der `status = 'accepted'/'executed'` | Lara |
| Leverandør opprettet/oppdatert | `assets` (filter `asset_type = 'vendor'`) | `updated_at` | Manuell |
| Prioritetsendringer | `asset_priority_history` | `created_at` | Manuell hvis `changed_by` finnes, ellers Lara |

Filtreres på company/tenant via eksisterende RLS (ingen schema-endringer).

Hvis en kilde mangler kolonner som angir agent vs menneske, faller den til "Manuell" som default.

## Tilgjengelighet (UU)

- `<h2>` for korttittel.
- Wrapper rundt grafen med `role="img"` og `aria-label` som oppsummerer total + fordeling.
- Periode-toggle som `<button>` med `aria-pressed`.

## Avgrensning

- Kun frontend + lese-spørringer mot eksisterende tabeller.
- Ingen migrasjoner, ingen endringer i RLS, ingen endringer i `SystemsPriorityChart` eller andre seksjoner.
