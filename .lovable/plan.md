
# Be om oppdatering - Trust Profile Feature

## Oversikt
Legge til en "Be om oppdatering"-funksjon direkte i Trust Profile som lar compliance-ansvarlig sende foresporsler til leverandorer om manglende eller utgatt informasjon. Funksjonen skal vare enkel, intuitiv og demo-klar.

## Brukeropplevelse

Brukeren ser en tydelig knapp i Trust Profile-headeren: **"Be om oppdatering"**. Nar den klikkes, apnes en dialog der brukeren kan:

1. Velge hva som mangler/er utgatt (dokumenter, informasjon, sertifikater)
2. Sette en frist
3. Legge til en kort melding
4. "Sende" foresporselen (simulert i demo)

I tillegg: Dokumenter og metrics som er utgatt eller mangler far automatisk et visuelt varsel med en hurtigknapp for a be om oppdatering direkte derfra.

## Endringer

### 1. Ny dialog: RequestUpdateDialog
En modal dialog som apnes fra headeren eller fra individuelle varsler:
- **Foresporselstyper** (flervalg): Penetrasjonstest, DPA, ISO 27001-sertifikat, SOC 2, DPIA, Generell oppdatering
- **Frist** (datofelt med standard 30 dager frem)
- **Melding** (valgfritt tekstfelt, forhåndsutfylt basert pa kontekst)
- **Mottaker** (e-post, forhåndsutfylt fra leverandorens kontaktinfo)
- Knapp: "Send forespørsel via Lara"

Nar brukeren klikker send, opprettes en rad i `vendor_document_requests` og en toast bekrefter at "Lara sender foresporselen".

### 2. Oppdater AssetHeader
Legg til en "Be om oppdatering"-knapp (med Send-ikon) ved siden av leverandornavnet. Knappen apner RequestUpdateDialog.

### 3. Smarte varsler i DocumentsTab
Dokumenter som er utlopt eller utloper snart far en liten "Be om ny versjon"-knapp direkte pa raden i tabellen. Klikk apner RequestUpdateDialog forhåndsutfylt med riktig dokumenttype.

### 4. Varselbanner i metrics
Nar det finnes utgatte dokumenter eller manglende obligatoriske dokumenter, vis et lite varselbanner mellom metrics og tabs med tekst som "2 dokumenter er utlopt" og en hurtigknapp.

### 5. Demo-data
Oppdater eksisterende demodata slik at noen dokumenter er utlopt, slik at varslene vises automatisk.

## Tekniske detaljer

**Nye filer:**
- `src/components/asset-profile/RequestUpdateDialog.tsx` - Dialog-komponent

**Endrede filer:**
- `src/components/asset-profile/AssetHeader.tsx` - Legg til "Be om oppdatering"-knapp
- `src/components/asset-profile/tabs/DocumentsTab.tsx` - Legg til inline "Be om ny versjon"-knapper pa utgatte rader
- `src/components/asset-profile/AssetMetrics.tsx` - Legg til varselbanner for utgatte dokumenter
- `src/pages/AssetTrustProfile.tsx` - Evt. state-koordinering

**RequestUpdateDialog props:**
```typescript
interface RequestUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  vendorName?: string;
  preselectedType?: string; // forhåndsvalgt dokumenttype
}
```

**Dialog logikk:**
- Oppretter rad i `vendor_document_requests` med valgt type, frist og status "pending"
- Invaliderer queries for a oppdatere DocumentRequestsSection automatisk
- Toast-melding: "Lara sender foresporselen til [leverandor]"

**Varselbanner-komponent (inline i AssetMetrics eller egen):**
- Query mot `vendor_documents` for a finne dokumenter der `valid_to < now()`
- Viser antall utgatte dokumenter med en "Be om oppdatering"-knapp

**Ingen nye tabeller trengs** - bruker eksisterende `vendor_document_requests`.
