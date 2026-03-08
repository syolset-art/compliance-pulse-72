

## Analysis

The **ValidationTab** currently shows four sections:
1. **Controls Summary** (ControlsSummaryCard)
2. **System Tasks** (task list)
3. **Compliance by Standard** (GDPR, NIS2, CRA, AI Act progress bars)
4. **Total Compliance** gauge + **AI Insights**

Your instinct is right — "Compliance by Standard" as a static list is too rigid. Users should be able to choose *how* they view compliance data.

## Recommended Approach

Replace the static "Compliance by Standard" card with a **single card that has a view switcher** (segmented control / tabs inside the card):

- **By Framework** — GDPR, NIS2, CRA, AI Act (current view, renamed)
- **By Control Area** — Governance, Operations, Identity & Access, Supplier & Ecosystem (uses `groupControlsByArea` data already available)

This is a clean pattern: one card, two lenses on the same data. No extra clutter.

Also removing from this tab per previous decisions:
- **Total Compliance gauge** — redundant with Trust Score on the snapshot
- **AI Insights** — placeholder card with no real value yet
- **System Tasks** — belongs in a task/workspace view, not the validation tab

## Changes

### `src/components/asset-profile/tabs/ValidationTab.tsx`
- Remove the Total Compliance gauge card, AI Insights card, and System Tasks card
- Replace "Compliance by Standard" with a new **Compliance View** card containing:
  - A small segmented toggle: `By Framework` | `By Control Area`
  - **By Framework**: same GDPR/NIS2/CRA/AI Act progress bars (relabeled)
  - **By Control Area**: shows Governance/Operations/Identity & Access/Supplier scores using `useTrustControlEvaluation` hook (already exists)
- Keep the ControlsSummaryCard at the top
- Simplify the grid layout since we're removing the sidebar column

This keeps the ValidationTab focused: Controls Summary + Compliance breakdown with user-chosen perspective.

