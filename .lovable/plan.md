

## Fix Contact Step in Add System Dialog

### Problem
The "Systemansvarlig" (system manager) field in the contact step is confusing during system registration. This should either be auto-populated by the AI/web lookup or left empty. The user needs to add a **contact person at the vendor** instead.

### Changes

#### 1. Database Migration -- Add contact fields to `systems` table
Add `contact_person` and `contact_email` columns to the `systems` table (matching the pattern already used in `assets`).

#### 2. Update `AddSystemDialog.tsx` -- Contact Step
- Remove the "Systemansvarlig" input from the contact step
- Replace with two fields: **Kontaktperson hos leverandør** (name) and **Kontakt e-post** (email)
- Update form state to use `contact_person` and `contact_email` instead of `system_manager`
- Auto-fill `system_manager` from web lookup result if available (store silently, don't show in form)
- Update the summary section to show contact person instead of system manager
- Update the `handleSubmit` to save the new fields

#### 3. Update `SystemHeader.tsx`
- Show contact person info if available (read-only or editable)
- Keep system manager field but label it more clearly as internal owner/responsibility

### Technical Details
- New columns: `contact_person TEXT`, `contact_email TEXT` on `systems` table
- Form state adds `contact_person`, `contact_email`; removes `system_manager` from visible UI
- `system_manager` stays in DB for internal use (assigned later via card or header)

