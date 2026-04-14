

# Plan: Mynder Trust Engine — Offentlig søkeportal og kundelenke

## Hva skal bygges

1. **Ny side: Mynder Trust Engine** (`/trust-engine`)
   - En enkel, offentlig-rettet landingsside som presenterer konseptet "Mynder Trust Engine — Portable Trust — The New European Standard"
   - Header med Mynder-logo og tagline
   - Søkefelt for å søke blant Trust Profiler (søker i `assets`-tabellen med `asset_type = 'self'`)
   - Resultatliste som viser organisasjoner med navn, bransje, Trust Score og badges
   - Klikk på en organisasjon åpner dens Trust Profile

2. **Ny side: Offentlig Trust Profile-visning** (`/trust-engine/profile/:assetId`)
   - Wrapper rundt eksisterende `TrustCenterProfile`-komponenten med `readOnly={true}`
   - Inkluderer en "Mynder Trust Engine"-header/banner øverst med tilbake-navigasjon til søkesiden
   - Viser at profilen er del av Trust Engine-databasen

3. **Oppdater navigasjon fra MSP-dashboard**
   - "Gå inn i kundens portal" i `MSPCustomerDetail.tsx` og `MSPCustomerTrustProfile.tsx` navigerer nå til `/trust-engine/profile/:assetId` (matcher kundens asset)
   - Finner kundens `self`-asset basert på kundenavn

## Tekniske detaljer

- **Ruter**: Legg til `/trust-engine` og `/trust-engine/profile/:assetId` i `App.tsx`
- **Søk**: Bruker `supabase.from('assets').select('*').eq('asset_type', 'self').ilike('name', '%query%')` 
- **Trust Engine-landingsside**: Minimalistisk design med Mynder-branding, søkefelt sentrert, og kort grid for resultater
- **MSP-kobling**: Oppdater `MSPCustomerDetail.tsx` og `MSPCustomerTrustProfile.tsx` til å slå opp kundens asset og navigere til Trust Engine-profilen
- **Design**: Apple-inspirert, lilla primærfarge (#5A3184), god kontrast, stor tekst for UU

