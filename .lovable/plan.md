

# Forbedret "Legg til leverandorer" -- filopplasting, AI-dokumentanalyse og skanningsgrense

## Oversikt
Nar brukeren velger "Flere leverandorer" i AddVendorDialog, far de to nye valg i tillegg til det eksisterende soket: (A) koble til et API (kommer senere, disabled) og (B) laste opp en fil med leverandoroversikt. Opplastet fil analyseres av AI som identifiserer dokumenttype (leverandorliste, policy, DPIA osv.) og lar brukeren bekrefte eller korrigere. Et skanningstellersystem begrenser gratis AI-skanninger til 5 per periode, med upsell til Premium.

## Ny brukerflyt

```text
Steg 1: "Hvor mange?"
  - En leverandor (uendret)
  - Flere leverandorer -> NY "method"-steg

Steg 2 (nytt): "Hvordan vil du legge til?"
  A) Sok manuelt (eksisterende flyt)
  B) Koble til API (disabled, "kommer snart")
  C) Last opp fil med leverandoroversikt

Steg 3 (ved filopplasting):
  - Drag-and-drop / filvelger
  - AI-skanningsteller vises (f.eks. "2 av 5 skanninger igjen")
  - Animert analysesteg:
    1. "Leser dokumentinnhold..."
    2. "Identifiserer dokumenttype..."
    3. "Henter ut data..."
    4. "Sjekker compliance-informasjon..."
  - AI foreslaar dokumenttype (leverandorliste / policy / DPA / DPIA / annet)
  - Brukeren kan bekrefte eller korrigere forslaget
  - Dersom leverandorliste: viser ekstraherte leverandorer som kan importeres
  - Dersom policy/DPIA/annet: forklarer hva som ble funnet

Steg 4: Ved 5 brukte skanninger
  - Varselbanner: "Du har brukt alle AI-skanninger"
  - Melding: "Etter dette maa du fylle inn manuelt (5-10 min per dokument)"
  - To knapper: "Bruk siste skanning" / "Oppgrader forst"
  - Premium-upsell: "Ubegrenset AI-skanning for $1.37/dag"
```

## Tekniske endringer

### 1. Ny edge-funksjon: `classify-document`
Kaller Lovable AI for a identifisere dokumenttype fra filinnhold. Returnerer:
- `documentType`: "vendor_list" | "policy" | "dpa" | "dpia" | "certificate" | "report" | "other"
- `confidence`: number (0-1)
- `extractedVendors`: array (kun for vendor_list)
- `summary`: kort oppsummering

Bruker tool calling for strukturert output. Modell: `google/gemini-2.5-flash`.

### 2. Endringer i `AddVendorDialog.tsx`
- Ny step-type `"method"` etter "quantity" naar mode === "multiple"
- Ny step-type `"file-upload"` for filopplasting
- Ny step-type `"file-analyzing"` med animert analyse-UI (som i referansebildet)
- Ny step-type `"file-results"` som viser AI-forslag og lar brukeren bekrefte/korrigere
- State for skanneteller (lagret lokalt, starter paa 5)
- Varselbanner naar skanninger er brukt opp

### 3. AI-analyse-UI (fra referansebildene)
Analysesteg med animerte indikatorer:
- Sirkulaert ikon med sparkles
- Overskrift: "Identifiserer dokumenttype..."
- Fire statuslinjer som animeres sekvensielt:
  1. "Leser dokumentinnhold" (faded naar ferdig)
  2. "Identifiserer dokumenttype" (bold naar aktiv)
  3. "Henter ut datoer og tall"
  4. "Sjekker compliance-informasjon"
- Loading-dots animasjon

### 4. Dokumenttype-bekreftelse
Etter analyse viser vi:
- AI-foreslatt type med confidence-badge
- Dropdown for a korrigere type
- Dersom leverandorliste: tabell med ekstraherte leverandorer
- "Importer valgte"-knapp for leverandorer

### 5. Skanningsgrense-banner
Gjenbruker monsteret fra referansebildene:
- Gradientbar (gronn -> gul -> rod) som viser gjenvaerende skanninger
- Teller: "X av 5 skanninger igjen dette aaret"
- Reset-dato
- Naar 0 igjen: gult varselbanner med upsell

### Filendringer
- **Ny**: `supabase/functions/classify-document/index.ts` -- AI-klassifisering
- **Endret**: `src/components/dialogs/AddVendorDialog.tsx` -- nye steg, filopplasting, analyse-UI, skanneteller

### Ingen databaseendringer
Skannetelleren lagres i localStorage for demo-formaal. Ingen nye tabeller.

