

## Device Trust Profile -- Action-Oriented Redesign

### Problem
The current device profile shows everything (OK, partial, missing) in long lists without clear actions. Users see "Mangler" and "Delvis" labels without knowing what to do. Too much noise, not enough signal.

### Design Principles
- **Hide what's OK** -- passed controls are collapsed behind a "Show all" toggle
- **Critical findings first** -- elevate failed controls with clear action buttons
- **Actionable items** -- every issue shows what to do + status tracking (not started / in progress / done)
- **Less is more** -- overview tab shows only what needs attention

### Changes

#### 1. Redesign `DeviceControlStatus.tsx`
- Keep the summary score card at top (score %, progress bar, counts)
- Remove the full list of OK controls -- replace with a collapsible "X av Y kontroller OK" section using Collapsible component
- Failed and warn controls get action buttons inline ("Fiks dette" / "Aktiver tjeneste")
- Each failed/warn item gets a status selector: `Ikke startet` | `Pågår` | `Fullført`
- Rename "Mangler" to "Krever tiltak" (Requires action) and "Delvis" to "Trenger oppfølging" (Needs follow-up)

#### 2. Redesign `DeviceRiskFindings.tsx`
- Each finding gets a clear "Anbefalt tiltak" (Recommended action) button
- Add status badge per finding: `Ikke startet` | `Pågår` | `Løst`
- Group by severity but limit initial view to critical + high; medium behind "Vis flere"

#### 3. Simplify `DeviceOverviewTab.tsx`
- Show only: (1) compact score summary, (2) critical/high findings with actions, (3) action plans
- Move DeviceControlStatus full view to the "Controls" tab only
- Technical status and automation stay in grid at bottom

#### 4. Update `DeviceActionPlans.tsx`
- Add status toggle per action item (not started / in progress / done)
- Done items collapse to bottom with strikethrough

### Technical Details
- Status tracking is local state (useState) for now -- no DB changes needed
- Use existing Collapsible component from `@/components/ui/collapsible`
- Use existing Badge variants for status indicators
- All text bilingual (nb/en) following existing pattern

