

## Unified "Legg til" dialog for Dokumentasjon & Evidens

### Summary
Replace the three separate add-buttons (one per tab) with a single "+ Legg til" button in the page header. Clicking it opens a multi-step dialog where the user first chooses document category, then fills in details and sets visibility for the Trust Profile.

### Database change
Add a `visibility` column to `vendor_documents`:
```sql
ALTER TABLE public.vendor_documents 
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible';
```
Values: `published` (shown on public Trust Profile), `visible` (internal only), `hidden` (hidden everywhere except admin).

### New component: `AddEvidenceDialog.tsx`

A 3-step dialog flow:

**Step 1 - Choose type**
Three clickable cards:
- Retningslinje (Policy) - icon: FileText
- Sertifisering (Certification) - icon: Award  
- Dokument (Document) - icon: FolderOpen

Selecting one moves to step 2.

**Step 2 - Details**
- Display name (text input, required)
- File upload (drag & drop or click)
- Document sub-type dropdown (contextual based on step 1 choice):
  - Policy: policy, privacy_policy, acceptable_use, incident_response, security_policy, data_protection_policy
  - Certification: ISO 27001, ISO 9001, SOC 2, etc.
  - Document: DPA, report, agreement, other
- Expiry date (date picker, optional, shown prominently for certifications)
- Notes (textarea, optional)

**Step 3 - Visibility & publish**
Three radio-style options with descriptions:
- **Publisert** - "Synlig i Trust Profilen for alle som ser den"
- **Intern** - "Kun synlig internt i organisasjonen"
- **Skjult** - "Skjules helt, kun for administratorer"

A visual preview showing where the document will appear (Trust Profile badge).
Confirm button saves to `vendor_documents` with the chosen visibility.

### Changes to `TrustCenterEvidence.tsx`
1. Remove the three per-tab add buttons
2. Add a single "+ Legg til" button next to the page title
3. Wire it to open `AddEvidenceDialog`
4. After successful save, invalidate queries and optionally switch to the relevant tab
5. Show a visibility badge on each document card (eye icon for published, lock for hidden)

### Changes to `TrustCenterProfile.tsx` (public view)
Filter document queries to only show documents where `visibility = 'published'` in the expandable policies/certifications sections.

### File structure
- `src/components/trust-center/AddEvidenceDialog.tsx` (new)
- `src/pages/TrustCenterEvidence.tsx` (modified)
- `src/pages/TrustCenterProfile.tsx` (modified - filter by visibility)
- Migration for `visibility` column

