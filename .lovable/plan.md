

## Problem

The Reports page currently only shows compliance reports grouped by regulation (GDPR, NIS2, ISO 27001, AI Act) and one "Organisasjon" tab with a compliance overview. There's no way to view portfolio reports — such as vendor portfolio, system portfolio, or asset portfolio — which are important for leadership to get a quick status overview.

## Plan

### 1. Add a "Porteføljer" tab to the Reports page

Add a new tab called **"Porteføljer"** (Portfolios) in the existing `TabsList`, positioned after "Organisasjon" and before "GDPR". This tab will contain portfolio report cards.

### 2. Create portfolio report cards

Inside the new `TabsContent`, render a grid of cards for:

- **Leverandørportefølje** — Vendor portfolio summary (count, risk distribution, avg compliance score). Click navigates to `/vendors` or triggers the existing PDF export via `generateVendorPortfolioReport`.
- **Systemportefølje** — System portfolio (count of systems, lifecycle status breakdown, risk levels). Click navigates to `/systems`.
- **Eiendelsportefølje** — All assets overview (total count by type, risk distribution).
- **Samlet lederrapport** — Combined executive summary across all portfolios. A single card that generates a combined PDF with key metrics from all three portfolios.

Each card will show:
- Icon, title, description
- Key stats pulled from the `assets` table (vendor count, system count, risk breakdown)
- Status badge (Klar/Utkast based on data availability)
- Action buttons: "Åpne" (navigate) and "Last ned PDF" (generate report)

### 3. Data fetching

Add a query to fetch asset counts grouped by `asset_type` and risk distribution from the `assets` table. This data populates the summary stats on each portfolio card.

### 4. Executive report PDF generation

Create a new function `generateExecutivePortfolioReport` that combines:
- Vendor summary (count, risk breakdown, avg score)
- System summary (count, lifecycle status)
- Asset summary (total by type)
- Key risk indicators across all portfolios

Uses the same `jsPDF` + `autoTable` pattern as the existing vendor portfolio PDF.

### Files to modify/create
- `src/pages/Reports.tsx` — Add "Porteføljer" tab with portfolio cards, data queries
- `src/components/reports/generateExecutivePortfolioReport.ts` — New file for combined PDF generation

### Technical details
- Reuse the existing `ReportCard` component for individual portfolio cards
- Add a special larger card for the combined executive report
- Query `assets` table with `.select("id, asset_type, risk_level, compliance_score, lifecycle_status")` and group client-side
- The "Ikke vurdert" logic (score 0 = not assessed) will be consistent with the vendor PDF changes already made

