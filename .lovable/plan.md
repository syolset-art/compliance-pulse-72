

## Group Systems by Category Without Filtering

### Approach
Replace the flat list with a **grouped view** that organizes systems under category headers (e.g., "Kommunikasjon", "Økonomi", "Prosjektstyring"). All systems remain visible at all times. A horizontal category chip bar at the top lets users click a category to scroll to that section, with a count badge on each chip. The existing filter dropdowns stay as-is for when users want to narrow down.

### Changes

#### 1. Add a view toggle: "Liste" vs "Gruppert"
A `ToggleGroup` above the system list lets users switch between the current flat list and the new grouped view. Default: grouped.

#### 2. Grouped view in `Systems.tsx`
- Derive category groups from `filteredSystems` using `useMemo` -- group by `system.category`, with a fallback "Ukategorisert" group
- Render each group as a collapsible section with:
  - Category name as header + system count badge
  - Systems listed as cards underneath (reusing `renderSystemCard`)
- A horizontal scrollable chip bar at the top shows all categories with counts. Clicking a chip smooth-scrolls to that section (using `ref` per category + `scrollIntoView`)

#### 3. Category chip bar
- Rendered above the card list when in grouped view
- Each chip: category name + count, styled as outline badges
- Active/clicked chip gets primary styling
- "Alle" chip at the start shows total count

### Technical details
- No database changes
- Uses existing `categories` memo and `filteredSystems`
- Grouping: `Object.groupBy` or manual reduce on `system.category`
- Scroll targets via `useRef` map keyed by category string
- View mode stored in local state (no persistence needed)
- The existing 4-column filter row remains unchanged and applies to both views

