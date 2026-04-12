

## Plan: Actionable TPRM controls with request dialog

### What changes

Replace the passive "Mangler" badges in the TPRM status card with **actionable buttons** that let the user request missing documents directly from the vendor. The design follows the uploaded reference image — missing items show a colored action button (e.g. "Be om DPA", "Be om SLA", "Be om risikovurdering") instead of a generic "Mangler" badge. Clicking the button opens the existing `RequestUpdateDialog` pre-filled with the correct document type.

### Changes to VendorTPRMStatus.tsx

1. **Import** `RequestUpdateDialog` and add state for dialog open/close and selected request type
2. **Add `assetName` and `vendorName` props** to the component (needed by `RequestUpdateDialog`)
3. **Replace the "Mangler" badge** with a styled button per document type:
   - DPA missing → "Be om DPA" / "Request DPA" button (red/destructive outline style matching the reference)
   - SLA missing → "Be om SLA" / "Request SLA"
   - Risk Assessment missing → "Be om risikovurdering" / "Request assessment"
4. **Add an email icon** (Mail) next to the action text, matching the reference image
5. **Render `RequestUpdateDialog`** at the bottom of the component with `preselectedType` set to the clicked document type — this dialog already supports uploading custom templates (e.g. own DPA template)
6. **Style the missing row** with a subtle red/warning left border or background tint to draw attention, matching the reference

### Props change in parent

Update wherever `VendorTPRMStatus` is rendered (in the Usage & Context tab) to pass `assetName` and `vendorName` props.

### No database changes needed

The `RequestUpdateDialog` already handles sending requests and storing them. No new tables or columns required.

### Files modified
1. `src/components/trust-controls/VendorTPRMStatus.tsx` — add actionable buttons and dialog integration
2. Parent component rendering `VendorTPRMStatus` — pass additional props

