

## Plan: Simplify Work Area Documents Tab

### What changes

Replace the current complex table-based documents view in `WorkAreaDocumentsTab.tsx` with a simpler card-based list inspired by the Trust Center Evidence page. Instead of a public/private toggle, add an "AI-tilgjengelig" (Available for AI) toggle per document.

### Database migration

Add an `ai_enabled` boolean column to `work_area_documents`:

```sql
ALTER TABLE public.work_area_documents ADD COLUMN ai_enabled boolean DEFAULT false;
```

### UI redesign of `WorkAreaDocumentsTab.tsx`

1. **Remove** the 3 summary cards (document count, DPA count, missing DPAs) and the complex table layout.
2. **Remove** the document type selector from the upload row — simplify to just an upload button and the "Generer dokument" button.
3. **Replace** the table with a card-list layout matching TrustCenterEvidence:
   - Each document as a `Card` with icon, name, type badge, and date on the left.
   - On the right: an AI toggle (Switch) with `Brain`/`BrainOff` icon + label "AI" / "Ikke AI", styled with purple (`bg-primary`) when enabled, gray when not.
   - A `...` action menu (download, delete) on the far right.
4. **Add** a search input and category filter (matching the Evidence page pattern).
5. **Group** documents by type (like Evidence page groups by Policies/Certifications/Documents).
6. **Toast feedback** on AI toggle change: "Dokumentet er nå tilgjengelig for AI" / "Dokumentet er ikke lenger tilgjengelig for AI".

### Key UI element — AI toggle per document

```
[Brain icon] AI [Switch ●━━] ← purple when on, gray when off
```

With tooltip: "Gjør dokumentet tilgjengelig for AI-agenter" / "Dokumentet brukes ikke av AI".

### Files to modify

- `supabase/migrations/` — new migration adding `ai_enabled` column
- `src/components/work-areas/WorkAreaDocumentsTab.tsx` — full rewrite with simpler card-based layout, search/filter, AI toggle

### Files unchanged

- Keep the generate document dialog and preview dialog as-is (they work well).
- Keep upload/download/delete logic.

