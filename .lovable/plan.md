Add a "Les mer" (Read more) button to the Trust Profile takeover task in the Lara recommendation banner. When clicked, it opens a dialog explaining why the customer should take over their Trust Profile.

### What to build

1. **Extend `LaraPlanTask` type** (`src/components/lara/types.ts`):
   - Add optional `readMoreCtaLabelNb?: string` and `readMoreCtaLabelEn?: string` fields.
   - Add optional `readMoreContent?: string` field for a short content key/identifier.

2. **Extend `LaraRecommendationBanner`** (`src/components/lara/LaraRecommendationBanner.tsx`):
   - Add optional `onReadMore?: (task: LaraPlanTask) => void` prop.
   - In the single-task card view (the "Én og én" mode), render a small "Les mer" text button next to the dismiss controls when the current task has `readMoreCtaLabelNb/En` and `onReadMore` is provided.
   - In table view, add a "Les mer" action button in the actions column for tasks that have the read-more fields set.

3. **Create a new dialog component** `TrustProfileTakeoverInfoDialog` (`src/components/msp/TrustProfileTakeoverInfoDialog.tsx`):
   - Dialog with title "Hvorfor bør kunden overta sin Trust Profile?"
   - Content explaining in clear Norwegian:
     - Trust Profile lages én gang og kan gjenbrukes overfor leverandører, kunder, ansatte og myndigheter
     - Hvis kunden ikke overtar profilen, kan konsekvensen være at de blir spurt om å oppgi den samme informasjonen flere ganger
     - Det er opp til kunden å avgjøre
   - Close button at the bottom.

4. **Wire it up in `MSPCustomerDetail`** (`src/pages/MSPCustomerDetail.tsx`):
   - Add `readMoreCtaLabelNb: "Les mer"` to the Trust Profile takeover task (the one with title "Kunden har ikke overtatt sin Trust Profile").
   - Add state `[readMoreOpen, setReadMoreOpen]`.
   - Pass `onReadMore={() => setReadMoreOpen(true)}` to `<LaraRecommendationBanner>`.
   - Render `<TrustProfileTakeoverInfoDialog>` with `open={readMoreOpen}`.

### Technical details
- Use the existing `Dialog` primitives from `@/components/ui/dialog`.
- Use existing color tokens (primary, muted-foreground, etc.) — no new colors.
- Keep styling consistent with the existing Lara banner card design.
- The "Les mer" button should be subtle (ghost variant, small text) so it doesn't compete with the primary CTA.

### Files to change
- `src/components/lara/types.ts` — extend type
- `src/components/lara/LaraRecommendationBanner.tsx` — add read-more button rendering
- `src/components/msp/TrustProfileTakeoverInfoDialog.tsx` — new dialog component
- `src/pages/MSPCustomerDetail.tsx` — wire read-more to the task and render dialog