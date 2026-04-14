

## Plan: Rename header to "Oppgaver" with status + criticality only

### What changes

The top module header in `VendorTPRMStatus.tsx` currently shows only the status badge, risk, maturity stats, and task count. It needs to:

1. Show **"Oppgaver"** as the module title (like a section heading)
2. Show **status** badge (Under oppfølging / Godkjent / etc.)
3. Show **criticality** badge
4. Remove maturity stats and task count from the header line

This makes it a standardized header reusable across vendors and systems.

### New header layout

```text
┌──────────────────────────────────────────────────────┐
│ 📋 Oppgaver   🟡 Under oppfølging  · Høy    [▼]    │
└──────────────────────────────────────────────────────┘
```

### Technical details

**File: `src/components/trust-controls/VendorTPRMStatus.tsx`**

In the always-visible header (lines 206-240):
- Add "Oppgaver" / "Tasks" as a bold text label after the Shield icon
- Keep the status badge (`cfg.emoji` + `cfg.label`)
- Keep the criticality indicator (from `asset.criticality`)
- **Remove** the maturity stats display (`implementedCount/totalControls`)
- **Remove** the open tasks count badge
- Keep the status dropdown and expand button on the right

Add a new prop or use existing `asset.criticality` to show criticality as a simple badge (e.g. "Høy", "Middels", "Lav") with appropriate color.

No other files need changes. No database changes.

