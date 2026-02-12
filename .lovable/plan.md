
# Demo Reset-knapp

## Hva skal bygges
En "Start demo på nytt"-knapp som tilbakestiller all demodata og simulerer nye innboks-oppdateringer fra leverandorer, slik at du kan demonstrere hele flyten fra onboarding til godkjenning av dokumenter.

## Funksjonalitet

### 1. Reset Demo-knapp i sidemenyen
En tydelig knapp nederst i sidemenyen (eller i header) med ikon og tekst "Start demo på nytt". Knappen vil:

- Slette alle eksisterende vendor-assets fra databasen
- Slette alle eksisterende lara_inbox-elementer
- Slette company_profile (tvinger onboarding-flyten)
- Slette vendor_documents
- Navigere til forsiden (som viser onboarding)

### 2. Etter onboarding: Seed nye innboks-elementer
Nar bedriftsprofilen er opprettet og vendor-listen er populert (etter onboarding/filopplasting), seedet det automatisk 6-8 nye lara_inbox-elementer knyttet til de faktiske vendorene i databasen. Disse simulerer:

- DPA-avtaler mottatt fra leverandorer
- SOC 2-rapporter
- ISO 27001-sertifikater
- Penetrasjonstester
- DPIA-vurderinger

Hvert element far realistiske avsendere, datoer og confidence scores slik at demo-flyten med godkjenning/avvisning fungerer godt.

### 3. Bekreftelsesdialog
For a unnga utilsiktet reset vises en bekreftelsesdialog ("Er du sikker? All data blir slettet") for knappen utforer handlingen.

## Teknisk plan

### Filer som endres:
1. **`src/components/Sidebar.tsx`** - Legge til "Start demo pa nytt"-knapp med RotateCcw-ikon, bekreftelsesdialog, og reset-logikk (DELETE fra assets, lara_inbox, vendor_documents, company_profile, deretter navigate til /)

2. **`src/pages/Index.tsx`** eller **`src/components/onboarding/CompactCompanyOnboarding.tsx`** - Etter fullfort onboarding: kall en funksjon som seeder lara_inbox med demo-dokumenter basert pa de vendorene som finnes i assets-tabellen

### Seeding-logikk (pseudokode):
```text
1. Hent alle vendors fra assets-tabellen
2. For et utvalg (6-8 stykker), generer inbox-elementer:
   - matched_asset_id = vendor.id
   - matched_document_type = tilfeldig (dpa, soc2, iso27001, etc.)
   - sender_email/name = realistisk per vendor
   - confidence_score = 0.85-0.98
   - status = "new"
   - received_at = siste 7 dager
3. Insert i lara_inbox
```

### Reset-logikk:
```text
1. Vis bekreftelsesdialog
2. DELETE FROM vendor_documents
3. DELETE FROM lara_inbox  
4. DELETE FROM assets
5. DELETE FROM company_profile
6. Invalidate alle react-query cacher
7. Navigate til "/"
```
