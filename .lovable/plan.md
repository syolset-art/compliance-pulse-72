

## Plan: Make incomplete Security Foundation checkpoints clickable and actionable

### Problem
When users expand a security area in the Trust Controls Panel and see checkpoints marked "Missing" or "Partial", there is no way to navigate to the place where they can fix the issue. Users must manually figure out which tab or field to visit.

### Solution
Make non-implemented checkpoints clickable with a subtle "Fix" button that navigates the user to the correct location (tab, field, or dialog) where they can complete the checkpoint.

### Design approach

**1. Add a navigation map in `trustControlDefinitions.ts`**

Add a `CONTROL_NAV_MAP` that maps each control key to a navigation target:

```text
Control Key              → Target
─────────────────────────────────────────────
owner_assigned           → scroll to asset header (work area field)
responsible_person       → scroll to asset header (asset_manager field)
description_defined      → scroll to asset header (description field)
risk_level_defined       → switch to "riskManagement" tab
criticality_defined      → switch to "riskManagement" tab
risk_assessment          → switch to "riskManagement" tab
review_cycle             → switch to "validation" tab
documentation_available  → switch to "documents" tab
dpa_verified             → switch to "documents" tab
security_contact         → scroll to asset header (contact field)
sub_processors_disclosed → switch to "relations" tab
vendor_security_review   → switch to "controls" tab
mfa_enabled              → switch to "controls" tab
encryption_enabled       → switch to "controls" tab
backup_configured        → switch to "controls" tab
security_logging         → switch to "controls" tab
device_encryption        → switch to "controls" tab
endpoint_protection      → switch to "controls" tab
patch_management         → switch to "controls" tab
responsible_manager      → scroll to asset header
security_training        → switch to "controls" tab
incident_reporting       → switch to "incidents" tab
```

**2. Update `TrustControlsPanel.tsx`**

For each control with status `missing` or `partial`:
- Make the row clickable (cursor-pointer, hover highlight)
- Add a small arrow/button on the right: "Fiks →" / "Fix →"
- On click, call an `onNavigate` callback prop with the target tab name
- For header-level fields, emit a special target like `"_header:field_name"`

**3. Update `AssetTrustProfile.tsx`**

- Pass `onNavigateToTab` callback to `AssetMetrics` → `TrustControlsPanel`
- The callback calls `setActiveTab(tabName)` to switch to the correct tab
- For header fields, scroll to the header section and optionally highlight the field

**4. Visual treatment**
- Non-implemented rows get a subtle hover state (`hover:bg-muted/50 rounded-md px-1 -mx-1`)
- A small "Fiks" / "Fix" text with chevron-right icon appears on hover or always for missing items
- Implemented rows remain static (no click action needed)

### Files to edit
1. **`src/lib/trustControlDefinitions.ts`** — Add `CONTROL_NAV_MAP` export mapping control keys to tab targets
2. **`src/components/trust-controls/TrustControlsPanel.tsx`** — Accept `onNavigateToTab` prop, render clickable rows for incomplete controls
3. **`src/components/asset-profile/AssetMetrics.tsx`** — Pass through `onNavigateToTab` prop
4. **`src/pages/AssetTrustProfile.tsx`** — Wire `onNavigateToTab` callback to `setActiveTab`

