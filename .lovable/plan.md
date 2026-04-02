

## Plan: Clean up task filters on the Tasks page

### Problem
The Tasks page has three separate filter sections stacked vertically, creating visual clutter:
1. "Filtrer etter kontrollområde" (domain filter) — a full Card with buttons
2. AI Status filter — a row of large buttons (All, AI handling, Requires action, Hybrid)
3. "Filtrer etter:" — another row of uppercase buttons (SYSTEM, PROSESS, PROTOKOLL, etc.)

### Solution
Consolidate all filters into a single, clean filter bar with grouped chip-style toggles:

**Single filter strip** replacing all three sections:
- **Row 1**: Domain chips (Alle, Personvern, Informasjonssikkerhet, AI Governance) — small rounded pills
- **Row 2**: Type & Priority chips in two visually separated groups using a subtle divider:
  - Type group: System, Prosess
  - Priority group: Høy, Middels, Lav
- Remove the AI Status filter row entirely (it duplicates domain filtering and adds confusion with "Hybrid" which has unclear meaning)
- Remove the wrapping Card around domain filters — use inline chips directly
- Keep the task count summary as a small text line below

### Files to edit
1. **`src/pages/Tasks.tsx`** (lines ~489-684)
   - Remove the domain filter Card wrapper, replace with inline chip row
   - Remove the AI Status Filter section (lines 627-665)
   - Redesign the type/priority filter section (lines 667-684) as grouped chips
   - Combine into one compact `<div>` with two rows
   - Use small rounded-full buttons (`px-3 py-1 text-xs`) similar to the UpcomingTasksWidget filter style
   - Remove unused state: `aiStatusFilter`, `aiHandlingCount`, `requiresActionCount`, `hybridCount`

