

## Update System Lifecycle Model

### Current State
The Systems page uses a tab-based split: "I bruk" (has work_area_id), "Ikke i bruk" (no work_area_id), "Arkiverte" (status=archived). The `status` column currently only holds `active` or `archived`.

### New Lifecycle Statuses
Replace the current tab model with a proper lifecycle status field:

| Status | Norwegian Label | Description |
|--------|----------------|-------------|
| `evaluation` | Under evaluering | Being assessed before adoption |
| `in_use` | I bruk | Active and in production (default) |
| `quarantined` | Karantene | Temporarily restricted |
| `phasing_out` | Fases ut | Planned for decommission |
| `archived` | Arkivert | No longer active, kept for records |
| `rejected` | Avvist | Evaluated and rejected |

### Changes

#### 1. Database -- Migrate existing status values
- Update existing `active` rows to `in_use`
- Keep `archived` as-is
- Default remains `in_use` for new systems (via migration: `ALTER COLUMN status SET DEFAULT 'in_use'`)

#### 2. Rewrite `Systems.tsx` tab + filter logic
- **Remove** the current 3-tab split (I bruk / Ikke i bruk / Arkiverte)
- **Replace** with a status filter dropdown alongside existing name/type/owner filters (4-column grid)
- Default filter = `in_use` (shows only active systems)
- "Alle statuser" option to see everything
- Each system card shows a small status badge with color coding
- Archive/restore mutations updated to use new status values

#### 3. Add status badge to system cards
- Show lifecycle status as a colored badge on each card
- Color mapping: `in_use`=green, `evaluation`=blue, `quarantined`=amber, `phasing_out`=orange, `archived`=gray, `rejected`=red

#### 4. Update `AssetRowActionMenu` actions
- "Arkiver" sets status to `archived`
- "Gjenopprett" sets status back to `in_use`
- Add inline status change via a Select on the card or in the action menu

### Technical Details
- Migration SQL: `UPDATE systems SET status = 'in_use' WHERE status = 'active'; ALTER TABLE systems ALTER COLUMN status SET DEFAULT 'in_use';`
- Status filter state: `const [statusFilter, setStatusFilter] = useState("in_use")`
- No tabs -- single flat list with filters
- Status badge uses existing Badge component with conditional className

