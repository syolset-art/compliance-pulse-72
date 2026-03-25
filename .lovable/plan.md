

## Upgrade System Trust Profiles to Match Asset/Vendor Trust Profiles

### Problem
The route `/systems/:id` currently points to `AssetTrustProfile`, which queries the `assets` table. Since systems live in the `systems` table, the page shows "not found" when you click a system card. The existing `SystemTrustProfile.tsx` page exists but is not wired up and has a much simpler layout than the full asset trust profile.

### Solution
Route `/systems/:id` to a redesigned `SystemTrustProfile` that mirrors the look and feel of `AssetTrustProfile` -- same trust seal header, trust controls panel, and tab structure -- but reads from the `systems` table.

### Changes

#### 1. Update route in `App.tsx`
Change `/systems/:id` to render `SystemTrustProfile` instead of `AssetTrustProfile`.

#### 2. Rewrite `SystemTrustProfile.tsx`
Rebuild the page to match the `AssetTrustProfile` structure:
- **Header**: Reuse the same trust seal design from `AssetHeader` but adapted for system data (system icon, vendor badge, status badge, editable description, system manager, contact person).
- **Trust Controls Panel**: Show the `TrustControlsPanel` with trust score gauge, verification confidence, and security domain progress -- same as assets.
- **Tabs**: Use the same tab structure as `AssetTrustProfile`:
  - Validation (from Mynder)
  - Controls
  - Data Handling
  - Audit & Risk Management
  - Deviations & Incidents
  - Documents
  - Usage (work areas, processes)
  - Overflow menu: Inbox
- **Back navigation**: Navigate back to `/systems`.

#### 3. Update `SystemHeader.tsx`
Restyle to match `AssetHeader` trust seal visual: large circular SVG gauge, trust metrics column, vendor badge, editable fields. Reuse the same card layout and spacing.

#### 4. Update `SystemMetrics.tsx`
Replace the current simple metrics with `TrustControlsPanel` integration, matching how `AssetMetrics` works -- showing trust score, domain progress bars, and scope badges.

### Technical details
- System data maps to asset-like fields: `system.name` → name, `system.vendor` → vendor, `system.status` → lifecycle_status, `system.risk_level` → risk_level, `system.work_area_id` → work_area_id, etc.
- The asset-profile tab components (`ValidationTab`, `ControlsTab`, `DataHandlingTab`, etc.) use `assetId` prop. For systems, we pass `systemId` and either adapt each tab to also accept system context, or use the system-profile specific tabs that already exist.
- Since system-profile already has its own `ValidationTab`, `DataHandlingTab`, `RiskManagementTab`, `IncidentManagementTab`, and `SystemUsageTab`, we keep using those but ensure the visual wrapper (tabs, overflow menu) matches the asset profile pattern.
- No database changes needed -- all data already exists in the `systems` table.

