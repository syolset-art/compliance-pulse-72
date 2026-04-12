

## Plan: Add optional SLA fields to Deliveries

### Summary
Add optional SLA fields (uptime requirement, response time, support hours) to each delivery in the Leveranser tab, with a collapsible section in the add/edit dialog.

### Database Migration
Add 4 nullable columns to `vendor_deliveries`:
- `sla_uptime` (text) - e.g. "99.9%"
- `sla_response_time` (text) - e.g. "4 timer"  
- `sla_support_hours` (text) - e.g. "08:00–16:00"
- `sla_notes` (text) - free-text for additional SLA details

### UI Changes in `DeliveriesTab.tsx`

1. **Add dialog** - Add a collapsible "Tjenestenivåavtale (SLA)" section below the contract document upload, containing:
   - Oppetidskrav (Uptime requirement) - text input
   - Responstid (Response time) - text input
   - Støttetider (Support hours) - text input
   - SLA-merknader (SLA notes) - textarea

2. **Table display** - Add an SLA indicator column (hidden on mobile) showing a small badge/icon when SLA fields are filled in

3. **Form state** - Extend the form state object with the 4 new SLA fields, all optional

### Technical Details
- Migration adds nullable text columns with no defaults
- Form fields are wrapped in a disclosure/collapsible so they don't clutter the dialog for users who don't need SLA
- Insert query updated to include the new fields
- Existing deliveries unaffected (all fields nullable)

