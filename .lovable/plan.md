

## Plan: Redesign Regulations Page to Match New Layout

The image shows a redesigned "Regelverk og etterlevelse" page with three main sections:
1. **Top: Framework selector chips** — horizontal scrollable pills showing all active frameworks with mini progress indicators (e.g., "AI Act 23%", "GDPR 70%")
2. **Middle: Selected framework detail card** — shows the selected framework with description, progress bar, status overview, and a historical compliance chart
3. **Bottom: Requirements list** — "Krav og evaluatorer" section (already exists in FrameworkDetail.tsx)

The key change is merging FrameworkDetail into the Regulations page itself — instead of navigating to a separate route, users select a framework from the top chips and everything renders inline.

### Changes

**1. Redesign `src/pages/Regulations.tsx`**
- Replace the current category-based accordion layout with:
  - A header: "Regelverk og etterlevelse" with subtitle and a "Rediger aktive regelverk" button (opens current framework management as a dialog/sheet)
  - **Framework chips row**: Horizontal scrollable row of pill-shaped buttons for each active framework showing name, requirement count (e.g., "5/16 krav"), and a mini circular progress percentage. Clicking selects it.
  - **Selected framework detail card**: Shows icon, name, description, "Eksporter PDF" button, progress bar with "X av Y krav oppfylt", and a status overview row (Ikke oppfylt count, Delvis count, Oppfylt count, Automatisk count, Manuell count)
  - **Historical chart card**: "Historisk utvikling" with a line chart showing compliance score over 90 days (demo data)
  - **Requirements list**: Reuse the existing requirements list logic from `FrameworkDetail.tsx` — filter tabs (Alle, Ikke oppfylt, Delvis, Oppfylt), expandable requirement cards with manual documentation

**2. Create `src/components/regulations/FrameworkChipSelector.tsx`**
- Horizontal row of clickable framework chips with mini progress circles
- Each chip: framework name, "X/Y krav", circular progress indicator with percentage

**3. Create `src/components/regulations/FrameworkDetailCard.tsx`**
- Selected framework info card with progress bar and status overview

**4. Create `src/components/regulations/ComplianceHistoryChart.tsx`**
- Line chart using recharts showing demo compliance score data over 90 days

**5. Create `src/components/regulations/FrameworkRequirementsList.tsx`**
- Extract the requirements list + filter logic from `FrameworkDetail.tsx` into a reusable component

**6. Create `src/components/regulations/EditActiveFrameworksDialog.tsx`**
- Move the current framework management UI (category accordions with switches) into a Sheet/Dialog triggered by the "Rediger aktive regelverk" button

**7. Update `FrameworkDetail.tsx`**
- Keep the route for direct linking but have it redirect or render the same inline view

### Technical Details
- Uses `recharts` (already in project via shadcn charts) for the historical chart
- Demo data for chart: generate 90 days of semi-random compliance scores
- Framework chips use the existing `frameworks` and `selectedFrameworks` data
- Requirements data comes from existing `additionalFrameworkRequirements.ts` and `complianceRequirementsData.ts`
- The "Rediger aktive regelverk" dialog preserves all current toggle/activation logic

