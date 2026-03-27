

## Smart Documents for Work Areas — Contract & Document Hub

### What we're building
Replace the "Coming soon" placeholder on the Documents tab with a practical document hub focused on contracts and auto-generated documents at the work area level. Since vendor/system registration already exists elsewhere, this focuses on what's unique to work areas: managing contracts, generating privacy declarations, and linking documents to the work area's compliance context.

### Features

#### 1. New component: `WorkAreaDocumentsTab.tsx`
The Documents tab gets three sections:

**A. Upload & manage contracts**
- Upload zone for contracts (DPA, SLA, NDA, processor agreements)
- Files stored in existing `documents` bucket under `work-areas/{workAreaId}/`
- Each document gets a type selector (DPA, SLA, NDA, Privacy Policy, Risk Assessment, Other)
- Table view: file name, type, uploaded date, linked vendor/system (optional dropdown from work area's assets)
- Delete action per document

**B. Auto-generate documents**
- "Generate" button section with template options:
  - Personvernerklæring (Privacy Declaration)
  - Databehandleravtale (DPA template)
  - Risikovurdering (Risk Assessment summary)
- Clicking a template calls an edge function that uses AI to generate a draft based on the work area's systems, processes, and assets
- Output rendered in a preview dialog with "Download as DOCX" option
- Generated docs auto-saved to the documents bucket

**C. Document overview cards**
- Summary cards at top: "X contracts uploaded", "Y missing DPAs" (cross-referenced with assets that have `gdpr_role = 'processor'` but no linked DPA document)
- Quick compliance insight without full AI analysis

#### 2. New DB table: `work_area_documents`
```sql
create table public.work_area_documents (
  id uuid primary key default gen_random_uuid(),
  work_area_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_size integer,
  document_type text default 'other',
  linked_asset_id uuid,
  notes text,
  generated boolean default false,
  created_at timestamptz default now()
);
alter table public.work_area_documents enable row level security;
create policy "Allow all access" on public.work_area_documents for all using (true) with check (true);
```

#### 3. New edge function: `generate-work-area-document`
- Accepts `workAreaId`, `templateType` (privacy_declaration | dpa_template | risk_assessment)
- Fetches the work area's linked systems and assets from the DB
- Sends context to AI to generate a Norwegian-language document draft
- Returns structured text (sections with headings + content)
- Uses `LOVABLE_API_KEY` with `google/gemini-2.5-flash`

#### 4. Update `WorkAreas.tsx`
- Replace the "Coming soon" card with `<WorkAreaDocumentsTab workAreaId={...} />`
- Update the document count badge from hardcoded `5` to live count from `work_area_documents`

### Technical details
- Storage path: `work-areas/{workAreaId}/{fileName}` in existing `documents` bucket
- Document types: `dpa`, `sla`, `nda`, `privacy_policy`, `risk_assessment`, `contract`, `other`
- The generate function composes context from `systems` + `assets` where `work_area_id` matches
- No changes to existing vendor/system flows -- this is purely a document layer on top

