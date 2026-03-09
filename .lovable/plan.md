

## Dashboard Redesign Plan

### Problem
The current dashboard is status/admin-heavy — ComplianceStatusHero with maturity stages, CoverageWidget, and RiskExposureWidget dominate the top. The user wants an **action-oriented** dashboard that answers "what should I do?" rather than showing compliance status metrics.

### Changes

#### 1. Restructure Index.tsx layout
- **Remove** `ComplianceStatusHero` (maturity stages) and `CoverageWidget` from dashboard top
- **Move** Coverage data into the Compliance & Security menu pages instead
- **Promote** `ImmediateAttentionWidget` and `UserActionsWidget` to the top — these are the "what to do" widgets
- **Add** a new `CriticalSystemsWidget` showing AI Act-dependent systems and critical processes prominently
- New layout order:
  1. Compact greeting + quick summary row (open incidents count, pending tasks, critical processes)
  2. ImmediateAttention + UserActions (side by side)
  3. CriticalProcesses + new AI Act Systems dependency widget
  4. AIActivity + VendorRequests
  5. EnvironmentOverview + NIS2Readiness

#### 2. Add widget visibility toggle
- Add a settings gear icon in the dashboard header that opens a popover/dialog
- List all available widgets with toggle switches (on/off)
- Use `useDashboardConfig` hook (already exists) to persist hidden/shown widgets via `localStorage` or database
- Each widget card gets a small "×" dismiss button on hover for quick hiding

#### 3. Create new `CriticalDependenciesWidget`
- Shows systems flagged as AI Act-relevant with their risk level
- Shows critical processes and which systems they depend on
- Links directly to process/system profiles for action

#### 4. Move CoverageWidget to Compliance pages
- Import and render `CoverageWidget` in the compliance checklist or regulations page
- Remove from Index.tsx entirely

### Files to modify
- `src/pages/Index.tsx` — restructure layout, add widget toggle UI
- `src/components/widgets/CriticalDependenciesWidget.tsx` — new widget
- `src/pages/ComplianceChecklist.tsx` or `src/pages/Regulations.tsx` — add CoverageWidget here
- `src/hooks/useDashboardConfig.ts` — wire up to Index.tsx for widget visibility

