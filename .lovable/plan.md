

## Plan: Bytt fanetrekkefølge — Leverandørliste som standard, Oversikt blir handlingsfokusert

### Endring

Nåværende rekkefølge: **Oversikt → Alle → Kart → Leverandørkjede → Sammenlign**

Ny rekkefølge: **Alle leverandører → Krever handling → Kart → Leverandørkjede → Sammenlign**

| # | Fane | Innhold |
|---|------|---------|
| 1 | **Leverandører** (default) | Nåværende VendorListTab — den fullstendige listen med filtre og sortering |
| 2 | **Krever handling** | Nåværende VendorOverviewTab — KPI-er, aksjoner, risikofordeling, compliance-distribusjon |
| 3–5 | Kart / Leverandørkjede / Sammenlign | Uendret |

### Fil

| Fil | Endring |
|---|---|
| `src/pages/Assets.tsx` | Endre `defaultValue="overview"` til `defaultValue="all"`. Flytt `all`-triggeren først i TabsList. Endre label for overview-fanen til "Krever handling". |

