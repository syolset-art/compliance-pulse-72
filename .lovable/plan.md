
# Forbedret dokumentopplasting + HULT IT Trust Profile (Selverklaering)

## Oversikt
Vi bygger to ting:

1. **Ny dokumentopplastingsdialog** - Inspirert av referansebildet med smart klassifisering, type/kategori-velgere, visningsnavn, og kobling til regelverk
2. **HULT IT sin egen Trust Profile** - En "selverklaerings"-visning der HULT IT kan laste opp egne compliance-dokumenter og se innkommende foresportsler fra kunder

## Del 1: Ny dokumentopplastingsdialog

### Hva bygges
En ny dialog (`UploadDocumentDialog`) som erstatter det naavarende inline opplastingsskjemaet i DocumentsTab. Inspirert av referansebildet:

- **Header**: "Last opp dokumenter" med "Smart Classification"-badge
- **AI Auto-Fill banner**: Viser antall gjenvarende AI-skanninger (demo: "2 of 3 scans remaining this year")
- **Fil-kort per opplastet fil** viser:
  - Filnavn, storrelse, type-tag
  - Fjern-knapp (X)
  - **Type**-dropdown (Policy, Certificate, Report, Agreement, etc.)
  - **Kategori**-dropdown (Compliance, Security, Privacy, Legal, etc.)
  - **Visningsnavn** (Display Name) - tekstfelt
  - **Kobling til regelverk** - Multi-select med GDPR, ISO 27001, SOC 2, NIS2, AI Act etc.
  - **Confirm**-knapp per fil
- **"+ Add more files"** - dashed border-knapp for a legge til flere
- **Footer**: "X documents ready to upload" teller, Avbryt + "Upload All" knapp

### Regelverk-kobling
Ny funksjonalitet der hvert dokument kan kobles til relevante regelverk:
- GDPR
- ISO 27001
- ISO 27701
- SOC 2
- NIS2
- AI Act
- DORA
Vises som multi-select badges i opplastingsdialogen og som tags pa dokumentet i tabellen.

## Del 2: HULT IT Trust Profile (Selverklaering)

### Konsept
HULT IT er brukerens eget selskap. De trenger en Trust Profile for seg selv der de kan:
- Laste opp egne compliance-dokumenter (sertifikater, policies, rapporter)
- Se foresportsler fra kunder (koblet til `customer_compliance_requests`)
- Dele dokumentasjon med kunder som ber om det

### Hva bygges
1. **Opprett HULT IT som asset** i databasen med `asset_type: 'self'` (ny type for egen profil)
2. **Tilpass AssetHeader** til a vise "Selverklaering"-badge nar asset_type er 'self'
3. **Ny fane: "Foresportsler"** - viser innkommende kundeforesportsler (fra `customer_compliance_requests`) direkte i Trust Profile
4. **Navigasjon**: Legg til en snarvei i sidebar eller dashboard som tar brukeren rett til egen Trust Profile

### Foresportsler-fane i Trust Profile
Viser en liste over kundeforesportsler med:
- Kundenavn
- Type foresportsel
- Status og fremdrift
- "Del"-knapp som markerer foresportselen som fullfort

## Teknisk implementasjon

### Database-endringer
1. Insert HULT IT som asset med `asset_type: 'self'`
2. Legg til `linked_regulations` (text array) kolonne pa `vendor_documents` for regelverkskobling
3. Legg til `display_name` og `category` kolonner pa `vendor_documents`

### Nye filer
- `src/components/asset-profile/UploadDocumentDialog.tsx` - Ny opplastingsdialog
- `src/components/asset-profile/tabs/CustomerRequestsTab.tsx` - Fane for kundeforesportsler i Trust Profile

### Endrede filer
- `src/components/asset-profile/tabs/DocumentsTab.tsx` - Bruk ny dialog i stedet for inline-skjema
- `src/pages/AssetTrustProfile.tsx` - Legg til "Foresportsler"-fane, vis selverklaerings-modus
- `src/components/asset-profile/AssetHeader.tsx` - Vis "Selverklaering"-badge for self-type
- `src/components/Sidebar.tsx` - Legg til snarvei til egen Trust Profile

### UploadDocumentDialog - Struktur
```text
+------------------------------------------+
| Last opp dokumenter                    X |
|                                          |
| [Smart Classification] AI detekterer...  |
|                                          |
| +--------------------------------------+ |
| | AI Auto-Fill Available               | |
| | 2 of 3 scans remaining this year     | |
| | [====----] progress bar              | |
| +--------------------------------------+ |
|                                          |
| 1 file ready          Premium Features   |
|                                          |
| +--------------------------------------+ |
| | vendors.pdf  0.0 MB  policy       X  | |
| |                                      | |
| | Type         | Category             | |
| | [Policy   v] | [Compliance       v] | |
| |                                      | |
| | Display Name                         | |
| | [Vendors                          ]  | |
| |                                      | |
| | Regelverk                            | |
| | [GDPR] [ISO 27001] [+]              | |
| |                                      | |
| |                      [Confirm]       | |
| +--------------------------------------+ |
|                                          |
| + - - - - - - - - - - - - - - - - - - + |
| |        + Add more files              | |
| + - - - - - - - - - - - - - - - - - - + |
|                                          |
| 1 document ready      [Avbryt] [Upload]  |
+------------------------------------------+
```

### Demo-data for HULT IT
Ved opprettelse av HULT IT-profilen, seed noen eksempel-dokumenter:
- Informasjonssikkerhetspolicy (gyldig)
- Personvernerklering (gyldig)

Og koble noen customer_compliance_requests til HULT IT sin profil.
