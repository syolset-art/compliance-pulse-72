# Implementeringsplan: AI-Agent-drevet Asset Import

## Oversikt
Utvide Lara (AI-agenten) til a handtere hele asset-import prosessen gjennom samtale, ikke tradisjonelle wizard-dialogs. Brukeren interagerer med Lara som guider dem gjennom valg og utforer handlinger.

---

## Fase 1: Nye verktoy for Lara

### 1.1 Utvid chat edge function med nye tools

**Fil: `supabase/functions/chat/index.ts`**

Legge til tre nye function tools:

```typescript
// Tool 1: start_asset_import
{
  name: "start_asset_import",
  description: "Initiate asset import workflow. Use when user wants to add assets.",
  parameters: {
    type: "object",
    properties: {
      method: {
        type: "string",
        enum: ["acronis", "azure_ad", "file_upload", "ai_suggestions", "manual"],
        description: "Import method chosen by user"
      }
    }
  }
}

// Tool 2: connect_integration  
{
  name: "connect_integration",
  description: "Connect to external system like Acronis, Azure AD",
  parameters: {
    type: "object",
    properties: {
      provider: { type: "string", enum: ["acronis", "azure_ad", "servicenow"] },
      api_key: { type: "string", description: "API key provided by user" },
      action: { type: "string", enum: ["test_connection", "fetch_assets", "setup_sync"] }
    }
  }
}

// Tool 3: import_assets
{
  name: "import_assets",
  description: "Import previewed assets to database",
  parameters: {
    type: "object",
    properties: {
      asset_ids: { type: "array", items: { type: "string" } },
      enable_sync: { type: "boolean" },
      sync_frequency: { type: "string", enum: ["daily", "weekly", "monthly"] }
    }
  }
}
```

### 1.2 Oppdater system prompt for asset-handtering

Legge til instruksjoner i systemPrompt:

```
ASSET IMPORT:
Nar brukeren vil legge til eiendeler, bruk suggest_options for a presentere valg:
- "Koble til Acronis" - For automatisk import fra IT-sikkerhetsplattform
- "Last opp fil" - For Excel/CSV import
- "AI-forslag" - Basert pa bedriftsprofil
- "Legg til manuelt" - Ett og ett

For Acronis-integrasjon:
1. Spor om API-nokkel
2. Kall connect_integration med action: "test_connection"
3. Ved suksess, kall connect_integration med action: "fetch_assets"
4. Vis forhandsvisning med show_content (content_type: "asset-import-preview")
5. Spor om bekreftelse
6. Kall import_assets

VIKTIG: Hold hele prosessen i chatten. Ikke apne dialogs!
```

---

## Fase 2: Backend for integrasjoner

### 2.1 Database-endringer

**Ny migrasjon:**

```sql
-- Tabell for integrasjonsforbindelser
CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'acronis', 'azure_ad', etc.
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT, -- Kryptert med vault
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily',
  sync_status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Utvid assets-tabellen
ALTER TABLE assets ADD COLUMN IF NOT EXISTS external_source_id TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS external_source_provider TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage integrations" ON integration_connections
  FOR ALL USING (true);
```

### 2.2 Edge function for Acronis

**Ny fil: `supabase/functions/sync-acronis/index.ts`**

```typescript
// Handterer:
// - test_connection: Verifiser API-nokkel
// - fetch_assets: Hent enheter fra Acronis
// - sync: Synkroniser (brukes av cron)

// Acronis API endpoints:
// GET /api/2/tenants - Liste over tenants
// GET /api/2/agents - Liste over agenter/enheter
// GET /api/2/resources - Ressurser

// Mapper Acronis-data til assets-struktur:
// agent.hostname -> asset.name
// agent.type -> asset.type (server, workstation, etc.)
// agent.os -> asset.details
```

---

## Fase 3: Frontend-handtering av nye tools

### 3.1 Oppdater ChatInterface

**Fil: `src/components/ChatInterface.tsx`**

Legge til handtering av nye tool calls:

```typescript
// I handleToolCall funksjonen:
case "start_asset_import":
  // Sett kontekst for asset import
  setConversationContext("asset-import");
  break;

case "connect_integration":
  // Kall edge function
  const result = await supabase.functions.invoke('sync-acronis', {
    body: { action: toolArgs.action, api_key: toolArgs.api_key }
  });
  // Returner resultat til AI for videre samtale
  break;

case "import_assets":
  // Utfor import
  // Vis bekreftelse
  break;
```

### 3.2 Ny content type for forhandsvisning

**Fil: `src/components/ContentViewer.tsx`**

Legge til `asset-import-preview` som viser:
- Liste over enheter som skal importeres
- Checkbox for a velge/velge bort
- Mapping-info (hva som blir asset type, navn, etc.)
- "Importer valgte" knapp som sender melding tilbake til Lara

---

## Fase 4: Brukerflyt i praksis

### Eksempel-samtale:

**Bruker:** "Jeg vil legge til nye eiendeler"

**Lara:** "Flott! Hvordan vil du legge til eiendeler?"
- [Koble til Acronis] [Last opp fil] [AI-forslag] [Manuelt]

**Bruker:** *klikker "Koble til Acronis"*

**Lara:** "For a koble til Acronis trenger jeg en API-nokkel. Du finner den i Acronis-portalen under Innstillinger > API-tilgang."
- [Jeg har nokkelen] [Vis meg hvordan]

**Bruker:** *klikker "Jeg har nokkelen"*

**Lara:** "Lim inn API-nokkelen under:"
*Input-felt vises i chat*

**Bruker:** *limer inn nokkel*

**Lara:** "Kobler til Acronis... Tilkobling vellykket! Fant 47 enheter. Vil du se dem?"
- [Vis alle] [Vis bare servere] [Vis bare arbeidsstasjoner]

**Bruker:** *klikker "Vis alle"*

**Lara:** "Her er enhetene jeg fant:"
*Viser forhandsvisning i hoyre panel med checkboxes*

**Bruker:** "Importer alle"

**Lara:** "Importerer 47 eiendeler... Ferdig! Skal jeg sette opp automatisk synkronisering sa nye enheter legges til automatisk?"
- [Ja, daglig] [Ja, ukentlig] [Nei takk]

---

## Fase 5: Filendringer oppsummert

| Fil | Endring |
|-----|---------|
| `supabase/functions/chat/index.ts` | Nye tools + oppdatert system prompt |
| `supabase/functions/sync-acronis/index.ts` | Ny edge function |
| `supabase/migrations/xxx_integrations.sql` | Database-endringer |
| `src/components/ChatInterface.tsx` | Handter nye tool calls |
| `src/components/ContentViewer.tsx` | Ny content type for forhandsvisning |
| `src/locales/nb.json` + `en.json` | Oversettelser |

---

## Fordeler med denne tilnarmingen

1. **Naturlig samtale** - Brukeren snakker med Lara, ikke fyller ut skjemaer
2. **Kontekstuell hjelp** - Lara kan forklare og veilede underveis
3. **Fleksibilitet** - Brukeren kan endre mening, stille sporsmal
4. **Konsistent UX** - Samme mal som andre Lara-interaksjoner
5. **Skalerbar** - Lett a legge til flere integrasjoner (Azure AD, ServiceNow, etc.)

---

## Prioritert rekkefølge

1. Database-endringer (migration)
2. Chat edge function - nye tools + prompt
3. Acronis edge function
4. ChatInterface - tool handling
5. ContentViewer - preview component
6. Oversettelser
