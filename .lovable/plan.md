
# Utdatert dokumentasjon-varsel pa vendorkort

## Oversikt
Seede `vendor_documents`-tabellen med realistiske dokumenter der noen har utlopt `valid_to`-dato, slik at det utloste dokumentbanneret i AssetMetrics vises. I tillegg legge til en visuell "utdatert"-badge pa VendorCard og utvide demo-seeding-logikken slik at det fungerer ved demo-reset.

## Endringer

### 1. Seed vendor_documents med utlopte dokumenter (database)
Sette inn dokumenter for 4-5 vendorer med `valid_to` i fortiden (f.eks. DPA utlopt 3 maneder siden, SOC 2 utlopt 1 maned siden). Noen vendorer far ogsa gyldige dokumenter for kontrast. Dette sikrer at AssetMetrics-banneret ("X dokumenter er utlopt" + "Be om oppdatering"-knapp) vises umiddelbart.

Eksempel-data:
- **Salesforce**: DPA utlopt 2024-11-15, ISO 27001 utlopt 2024-12-01
- **HubSpot**: SOC 2 utlopt 2025-01-10
- **Slack**: NDA utlopt 2024-10-20, Pentest-rapport utlopt 2025-01-05
- **Dropbox Business**: DPA utlopt 2024-09-30
- **Tripletex**: Oppdater eksisterende dokumenter med `valid_to` i fortiden
- **Microsoft 365**, **Visma**: Gyldige dokumenter (valid_to i fremtiden) for kontrast

### 2. VendorCard - ny expired-badge
Legge til en `expiredDocsCount`-prop pa VendorCard. Nar verdien er storre enn 0, vises en badge med `AlertTriangle`-ikon i destructive-farge som indikerer utdatert dokumentasjon.

### 3. VendorOverviewTab og VendorListTab - hente expired-data
Legge til en `useQuery` som henter antall utlopte dokumenter per vendor fra `vendor_documents`-tabellen (der `valid_to` er satt og er i fortiden), gruppert pa `asset_id`. Sende disse tallene til VendorCard.

### 4. Demo-seeding - utvide demoSeedInbox.ts
Legge til en `seedDemoDocuments()`-funksjon i `demoSeedInbox.ts` som setter inn vendor_documents med utlopte og gyldige datoer. Kalle denne funksjonen fra demo-reset-flyten.

## Tekniske detaljer

**Database-insert (vendor_documents):**
```sql
INSERT INTO vendor_documents (asset_id, file_name, file_path, document_type, valid_from, valid_to, status, source)
VALUES
  -- Salesforce: utlopt DPA
  ('e7610af0-...', 'DPA_Salesforce.pdf', 'demo/DPA_Salesforce.pdf', 'dpa', '2023-11-15', '2024-11-15', 'current', 'manual_upload'),
  -- HubSpot: utlopt SOC 2
  ('d57935e5-...', 'SOC2_HubSpot.pdf', 'demo/SOC2_HubSpot.pdf', 'soc2', '2024-01-10', '2025-01-10', 'current', 'manual_upload'),
  ...
```

**VendorCard ny prop og badge:**
```typescript
// Ny prop
expiredDocsCount?: number;

// Badge-visning
{expiredDocsCount > 0 && (
  <Badge variant="outline" className="text-[10px] gap-1 bg-destructive/10 text-destructive border-destructive/20">
    <AlertTriangle className="h-2.5 w-2.5" />
    {expiredDocsCount} utdatert
  </Badge>
)}
```

**Expired docs query i OverviewTab/ListTab:**
```typescript
const { data: expiredCounts = {} } = useQuery({
  queryKey: ["expired-docs-counts"],
  queryFn: async () => {
    const { data } = await supabase
      .from("vendor_documents")
      .select("asset_id, valid_to")
      .not("valid_to", "is", null);
    const now = new Date();
    const counts: Record<string, number> = {};
    data?.forEach(doc => {
      if (new Date(doc.valid_to) < now) {
        counts[doc.asset_id] = (counts[doc.asset_id] || 0) + 1;
      }
    });
    return counts;
  },
});
```

**seedDemoDocuments() i demoSeedInbox.ts:**
Ny funksjon som forst sletter gamle demo-dokumenter, deretter setter inn nye med realistiske utlopsdatoer. Kalles sammen med seedDemoInbox().

## Filer som endres
- `src/components/vendor-dashboard/VendorCard.tsx` - ny expiredDocsCount-prop og badge
- `src/components/vendor-dashboard/VendorOverviewTab.tsx` - hente expired-data, sende til VendorCard
- `src/components/vendor-dashboard/VendorListTab.tsx` - samme expired-data
- `src/lib/demoSeedInbox.ts` - ny seedDemoDocuments()-funksjon
- Database: Sette inn demo-dokumenter med utlopte datoer
