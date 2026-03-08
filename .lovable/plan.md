

## Simplify Trust Profile — Summary-First Design

**Problem**: The current Trust Profile shows 5 full cards all expanded simultaneously (Trust Status, Control Areas with all sections open, Key Risks list, Recommended Actions list, AI Insights). Too much information competes for attention.

**Design approach**: A single compact summary card at the top gives the user instant status. Details are progressive — collapsed by default and expandable on demand.

### Changes to `TrustControlsPanel.tsx`

1. **Compact Trust Summary Card** (replaces the current Trust Status + AI Insights cards)
   - Left: Large trust score ring/number with color coding
   - Center: One-line AI summary (the most important finding)
   - Right: Top 1–2 risks as compact badges + a primary CTA button for the #1 recommended action
   - Profile source badge stays as a small tag

2. **Collapsible detail sections below** — all collapsed by default
   - "Control Areas" — each area starts collapsed, shows `3/5 implemented` inline
   - "All Risks" — collapsed, with count badge in header
   - "All Recommended Actions" — collapsed, with count badge

3. **Remove the separate AI Insights card** — the summary sentence moves into the top card

4. **ControlAreaSection**: Change `useState(true)` → `useState(false)` so areas start collapsed

### Implementation detail

- Wrap sections 2–4 in `Collapsible` from radix (already installed)
- The top summary card is always visible (~120px height)
- Use `ChevronDown/Up` toggle for each detail section
- Keep all existing logic in `trustControlDefinitions.ts` unchanged

This reduces the initial view from ~5 full cards to one compact card + 3 collapsed headers.

