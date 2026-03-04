

## Plan: Seed dummy compliance data for Hult IT Trust Profile

### Problem
The ValidationTab for asset `d812a623-b786-4a63-8cb7-64b8981dc41b` shows 0% on all standards because there are no rows in `system_compliance` for this asset.

### Approach
Since the `system_compliance` table has a FK to `systems` (not `assets`), we cannot insert data referencing an asset ID directly. Instead, we should make the ValidationTab use **hardcoded demo/fallback data** when no real compliance data exists, seeded directly in the component logic based on the asset's own `compliance_score`.

Alternatively, we can update the demo seeding logic to insert `system_compliance` rows. But the FK constraint to `systems` will block inserts with an asset UUID.

**Best approach**: Update the `ValidationTab` component to compute compliance levels from the asset's own `compliance_score` field when no `system_compliance` rows exist. This makes the Total Compliance ring reflect the asset's actual score, and distributes realistic per-standard scores.

### Changes

**File: `src/components/asset-profile/tabs/ValidationTab.tsx`**

1. Accept the asset's `compliance_score` as a prop (or fetch it from `assets` table).
2. When `system_compliance` returns empty, generate fallback data per standard based on the asset's compliance score:
   - GDPR: score + small offset
   - NIS2: score - offset (lower)
   - CRA: not assessed (0) for non-software vendors
   - AIAACT: minimal
3. Show a label like "Lav", "Medium", "Høy" next to the total score ring based on thresholds (< 50 = Lav, 50-79 = Medium, >= 80 = Høy).
4. Add demo tasks relevant to a vendor with medium compliance (e.g., "Innhent oppdatert DPA", "Gjennomfør risikovurdering").

**File: `src/lib/demoVendorProfiles.ts`** (optional)

Add "Hult IT AS" to the demo vendor profiles with a medium compliance score (~55) if it doesn't already exist as an asset.

### Technical detail

The fallback compliance generation in `ValidationTab`:
```typescript
const fallbackCompliance = useMemo(() => {
  if (compliance && compliance.length > 0) return null;
  const base = assetComplianceScore || 45;
  return [
    { standard: "GDPR", score: Math.min(base + 15, 100), status: base + 15 >= 80 ? "compliant" : "in_progress" },
    { standard: "NIS2", score: Math.max(base - 10, 0), status: "in_progress" },
    { standard: "CRA", score: Math.max(base - 25, 0), status: "non_compliant" },
    { standard: "AIAACT", score: 0, status: "not_assessed" },
  ];
}, [compliance, assetComplianceScore]);
```

The compliance level label next to the ring:
- `< 50` → "Lav" (red)
- `50-79` → "Medium" (yellow)  
- `>= 80` → "Høy" (green)

### Files

| File | Change |
|------|--------|
| `src/components/asset-profile/tabs/ValidationTab.tsx` | Add fallback compliance data, compliance level label, demo tasks |

