

## Plan: Complete DataHandlingTab with editable workflows

### Problem
The DataHandlingTab currently displays data but has no way for users to add or edit information. The "Add" buttons are non-functional, labels need updating, and there is no dialog for adding data processors (vendors).

### Naming changes
- "Datalagringslokasjoner" → **"Datalagring og overføring"**
- "Sletterutiner" → **"Oppbevaring og sletting"**
- Same in English locale

### What will be built

**1. Add Data Processor Dialog** (`AddDataProcessorDialog.tsx`)
- Form fields: Name, Purpose, EU/EOS compliant (toggle), Source/origin
- Inserts into `system_vendors` table (note: FK currently points to `systems` — need migration to also support `assets`)
- Inline delete button on each vendor row

**2. Editable AI Usage Card**
- Toggle switch for AI in use (yes/no)
- Text area for AI usage description
- Upserts into `system_data_handling` table

**3. Editable Data Locations (Datalagring og overføring)**
- Input field + "Add" button to add location tags (e.g. "Norway", "EU", "AWS Frankfurt")
- Click badge to remove
- Updates `system_data_handling.data_locations` array

**4. Editable Retention Keywords (Oppbevaring og sletting)**
- Input field + "Add" to add keywords/policies (e.g. "3 years", "GDPR Art. 17")
- Click badge to remove
- Updates `system_data_handling.retention_keywords` array

### Database changes

**Migration**: Create a new `asset_data_processors` table (since `system_vendors` FK is to `systems`, and assets use a different table):
```sql
CREATE TABLE public.asset_data_processors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text,
  eu_eos_compliant boolean DEFAULT false,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.asset_data_processors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON public.asset_data_processors FOR ALL USING (true) WITH CHECK (true);
```

### Files to edit/create

| File | Action |
|------|--------|
| **Migration** | Create `asset_data_processors` table |
| `src/components/asset-profile/tabs/AddDataProcessorDialog.tsx` | New — form dialog for adding vendors |
| `src/components/asset-profile/tabs/DataHandlingTab.tsx` | Rewrite — add inline editing for AI usage, locations, retention; wire Add buttons; use new table; rename labels |
| `src/locales/nb.json` | Update label keys |
| `src/locales/en.json` | Update label keys |

### UX approach
- AI Usage card: toggle + inline text area, auto-saves on blur
- Locations and retention: inline tag input (type + Enter or click +), badges are removable with X
- Data processors: dialog with form, table shows edit/delete actions
- All changes save immediately with toast feedback

