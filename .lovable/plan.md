

# Mynder Partner-badge pa Trust Profil

## Hva skal bygges
Virksomheter som er forhandlere/MSP-partnere av Mynder skal fa en tydelig visuell badge pa sin Trust Profil, slik at andre virksomheter kan se at de er offisielle Mynder-partnere og radgivere.

## Oversikt over endringer

### 1. Nytt felt i `company_profile`-tabellen
Legger til en `is_msp_partner`-kolonne (boolean, default `false`) i `company_profile`. Dette styrer om bedriften er en registrert Mynder-forhandler.

### 2. Mynder Partner-badge i AssetHeader
Nar en bruker ser pa en Trust Profil av typen `self`, hentes `company_profile` for a sjekke `is_msp_partner`. Hvis `true`, vises en fremtredende badge ved siden av firmanavnet:

- Ikon: `Award` eller `ShieldCheck` fra Lucide
- Tekst: "Mynder Partner"
- Stil: Gradientaktig/gylden farge for a skille den fra vanlige badges, f.eks. `bg-amber-100 text-amber-800 border-amber-300`

### 3. Demo-data
Setter `is_msp_partner = true` pa eksisterende demo-bedrift slik at badgen er synlig for testing.

## Teknisk plan

### Database-migrasjon
```sql
ALTER TABLE company_profile
ADD COLUMN is_msp_partner boolean NOT NULL DEFAULT false;
```

### Endringer i `AssetHeader.tsx`
- Ny query: hent `company_profile` og sjekk `is_msp_partner`
- Vis badge kun nar `asset.asset_type === 'self'` og `companyProfile.is_msp_partner === true`
- Badge plasseres i badge-raden ved siden av "Selverklaering"-badgen

### Filer som endres
- **Ny**: `supabase/migrations/...` - Legge til `is_msp_partner` pa `company_profile`
- **Endret**: `src/components/asset-profile/AssetHeader.tsx` - Legge til query og badge-visning

### Badge-design
Badgen far et distinkt utseende som skiller seg fra vanlige status-badges:
- Gylden/amber fargeskjema
- `Award`-ikon foran teksten
- Tekst: "Mynder Partner" (eventuelt "Offisiell Mynder-forhandler" pa norsk)
- Plasseres rett etter firmanavnet i header-raden

