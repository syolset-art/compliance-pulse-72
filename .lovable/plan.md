

## Redesign Leverandorer / Vendors Page

Rename sidebar back from "Tredjepartsstyring" to **"Leverandorer"** (nb) / **"Vendors"** (en) -- simpler, clearer. Then completely redesign the `/assets` page from a generic asset registry into an action-oriented vendor management hub.

### Current Problem

The page shows a flat table of all asset types (systems, networks, locations, vendors) with compliance stats. Users want to:
- Focus on **vendors** specifically
- See what **actions** they can take
- Understand which **systems/assets belong to each vendor**
- See vendor **locations** on a map
- Have a **standardized Trust Profile** per vendor
- Build their vendor registry easily (manually or with AI)

### New Page Structure

The page gets a tabbed layout with four views:

```text
[Leverandorer]
+-----------------------------------------------+
| Leverandorer                    [+ Legg til]   |
| Oversikt | Alle | Kart | Leverandorkjede       |
+-----------------------------------------------+
```

**Tab 1: Oversikt (Overview)** -- default landing
- Quick actions bar: Add Vendor, Discover with AI, Review Pending
- Compact metrics row: Total vendors, Compliant %, Missing DPA, High Risk
- "Needs Attention" cards: vendors missing DPA, overdue reviews, unaudited high-risk
- Vendors grouped by category (Cloud/SaaS, Infrastructure, Consulting)

**Tab 2: Alle (All Vendors)** -- the current table refined
- Filtered to vendor-type assets primarily, with toggle to include all asset types
- List/card view toggle
- Existing sort and filter functionality preserved

**Tab 3: Kart (Map)** -- geographic vendor overview
- Visual layout grouping vendors by region: Norway, EU/EEA, USA, Other
- Each vendor as a card within its region group
- Color-coded by compliance/risk status
- Clear GDPR data transfer indicator for non-EU vendors

**Tab 4: Leverandorkjede (Supply Chain)** -- vendor relationships
- Tree view: Your Vendor -> Their Sub-processors
- Which of your systems connect to which vendors (from `asset_relationships`)
- Nested card layout (no external library)

### Database Migration

Add `country` and `region` columns to `assets` table:
- `country` (text): e.g. "Norway", "Germany", "USA"
- `region` (text): e.g. "norway", "eu_eea", "usa", "other"

These enable the map view and GDPR transfer compliance checks.

### Sidebar Rename

| Locale | Current | New |
|--------|---------|-----|
| nb.json | `nav.assets`: "Tredjepartsstyring" | "Leverandorer" |
| en.json | `nav.assets`: "Third-Party Management" | "Vendors" |

### Files

| File | Change |
|------|--------|
| `src/locales/nb.json` | Rename nav.assets to "Leverandorer". Add keys for vendor dashboard tabs, quick actions, map regions, supply chain, needs attention labels |
| `src/locales/en.json` | Rename nav.assets to "Vendors". Add matching English keys |
| `src/pages/Assets.tsx` | Complete redesign: replace flat table + summary widget with tabbed layout (Overview, All, Map, Supply Chain). Move current table logic into "All" tab |
| **New:** `src/components/vendor-dashboard/VendorOverviewTab.tsx` | Quick actions, metrics row, needs-attention cards, vendors by category |
| **New:** `src/components/vendor-dashboard/VendorListTab.tsx` | Refined table/card list (current table logic extracted here) with list/card toggle |
| **New:** `src/components/vendor-dashboard/VendorMapView.tsx` | Region-grouped visual layout (Norway, EU/EEA, USA, Other) with vendor cards inside each region |
| **New:** `src/components/vendor-dashboard/SupplyChainTab.tsx` | Tree view of vendor -> sub-processor relationships using `asset_relationships` table |
| **New:** `src/components/vendor-dashboard/VendorCard.tsx` | Compact card: name, category, compliance score, DPA status, country badge, connected systems count |
| **New:** `src/components/vendor-dashboard/QuickActionsBar.tsx` | Action buttons: Add Vendor, AI Discovery, Review Pending |
| **New:** `src/components/vendor-dashboard/VendorMetricsRow.tsx` | Compact row: total, compliant %, missing DPA, high risk |
| **New:** `src/components/vendor-dashboard/NeedsAttentionSection.tsx` | Actionable cards for vendors needing immediate attention |
| **Migration** | Add `country` and `region` columns to `assets` table |

### Technical Approach

- The existing `AssetSummaryWidget` stays available for work areas but is no longer used on the main vendor page
- All data comes from the existing `assets` table (filtered by `asset_type`) and `asset_relationships` table
- Map view uses structured CSS grid regions (no map library needed) -- simple, fast, accessible
- Supply chain view queries `asset_relationships` with `relationship_type = 'uses'` or `'sub_processor'` to build the tree
- Quick action "Discover with AI" opens the Lara chat panel with a pre-filled vendor discovery prompt
- All strings use translation keys for full i18n support

