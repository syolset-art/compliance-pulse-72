

## Plan: Add Trust Profile and NIS2 Assessment access to MSP Partner Dashboard

### Problem
Partners on the MSP dashboard cannot view a customer's Trust Profile or start a NIS2 assessment directly. They must navigate deep into the customer portal to find these features.

### Approach
Add two quick-action buttons to the `MSPCustomerCard` and enhance the `MSPCustomerDetail` page with a dedicated Trust Profile section and NIS2 assessment launcher.

### Changes

**1. `src/components/msp/MSPCustomerCard.tsx`**
- Add two icon buttons at the bottom of each card: "Se Trust Profile" and "Start NIS2-vurdering"
- "Se Trust Profile" navigates to `/assets/{assetId}` — we'll need to look up or link the customer's self-asset. For demo purposes, navigate to a route like `/msp-dashboard/{customerId}/trust-profile`
- "Start NIS2-vurdering" navigates to `/msp-dashboard/{customerId}/nis2`
- Use `stopPropagation` so clicking these buttons doesn't trigger the card's main onClick

**2. `src/pages/MSPCustomerDetail.tsx`**
- Add a "Trust Profile" card in the dashboard grid with a summary of the customer's compliance level and a "Se full Trust Profile" button
- Add a "NIS2-vurdering" card showing a quick status (assessed/not assessed) with a "Start vurdering" button
- Both link to new sub-routes

**3. New page: `src/pages/MSPCustomerTrustProfile.tsx`**
- A wrapper page that shows the customer's Trust Profile (reusing the `AssetTrustProfile` components) with the partner banner at top
- Queries `assets` table for the customer's "self" asset (matching by `customer_name` or a linked field), or shows a fallback demo view
- Includes a back button to the MSP customer detail

**4. New page: `src/pages/MSPCustomerNIS2.tsx`**
- A wrapper page that embeds the `NIS2AssessmentTab` component for the customer's hardware assets
- Shows a list of the customer's devices with their NIS2 status
- Partner can select a device and run the NIS2 assessment inline
- For demo purposes, uses the existing assets from the database or generates fallback demo data

**5. `src/App.tsx`**
- Add routes: `/msp-dashboard/:customerId/trust-profile` and `/msp-dashboard/:customerId/nis2`

### Technical detail

Since `msp_customers` and `assets` are not directly linked via FK, we'll match by name (`customer_name` ↔ `name` in assets where `asset_type` = 'vendor' or 'self'). If no match is found, we show a "No Trust Profile found" state with an option to create one.

For the NIS2 page, we query `assets` where `asset_type = 'hardware'` and filter by a name/org match to the customer. In demo mode, we can show all hardware assets as a fallback.

### Files

| File | Change |
|------|--------|
| `src/components/msp/MSPCustomerCard.tsx` | Add Trust Profile and NIS2 quick-action buttons |
| `src/pages/MSPCustomerDetail.tsx` | Add Trust Profile summary card and NIS2 status card |
| `src/pages/MSPCustomerTrustProfile.tsx` | New - partner Trust Profile viewer with banner |
| `src/pages/MSPCustomerNIS2.tsx` | New - partner NIS2 assessment launcher |
| `src/App.tsx` | Add two new routes |

