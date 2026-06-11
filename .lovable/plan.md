## Mål

Seksjonen i Trust Profile (preview) skal speile "Leverandører"-seksjonen fra Rediger Profil (`CriticalVendorsSection`), men i visningsmodus og med tittel **"Underleverandører"** (i stedet for "Leverandører"). MSP-partner-kortet beholdes som et eget undertittel/blokk i samme seksjon.

## Endringer

Kun frontend, kun `src/pages/TrustCenterProfile.tsx` (rundt linje 2141–2187).

### 1. Tittel
- Endre `{isNb ? "Leverandører" : "Vendors"}` (linje 2159) → `{isNb ? "Underleverandører" : "Subprocessors / Vendors"}`.

### 2. Hent data
Les `meta.criticalVendors` (samme nøkkel som `CriticalVendorsSection` bruker via `useAssetMetadata`) og filtrer rader med utfylt `name`.

### 3. Layout
Beholder samme kortskall (`rounded-xl border border-border bg-card overflow-hidden`) med `Users`-ikon-header. Innhold:

- **MSP-partner-kort** (eksisterende blokk) vises først hvis `partnerInfo` finnes (uendret innmat).
- **Underleverandør-liste** under, som `divide-y divide-border` rader. Hver rad i visningsmodus viser:
  - `Building2`-ikon i avrundet bakgrunn (samme stil som partner-kortet).
  - Navn (font-semibold) + valgfri `Badge` med leverandørtype-label (oppslag i `VENDOR_TYPE_OPTIONS` via `vendorTypeKey`; "Annet" → bruk `purpose`).
  - Sekundærlinje: GDPR-rolle (oversatt label fra `GDPR_ROLE_OPTIONS`), org.nr hvis satt, DPA-status som liten badge ("DPA: Ja/Nei/Ukjent") når relevant.
  - Nettside som lenke (`Globe`-ikon) hvis `url` finnes.
- Tom-state: vis kort kursiv tekst "Ingen underleverandører publisert." (kun hvis verken partner eller kritiske leverandører finnes — ellers vis bare det som er der).

### 4. Konstanter
For å unngå import fra `edit/`-mappen, inline en liten `VENDOR_TYPE_LABEL`- og `GDPR_ROLE_LABEL`-oppslagsobjekt øverst i `TrustCenterProfile.tsx` (samme verdier som i `CriticalVendorsSection.tsx`).

## Ikke-mål
- Ingen endringer i Rediger Profil eller datalagring.
- Ingen endring av eksisterende `SubprocessorTable` (GDPR-underbehandlere) – det er en separat seksjon.
- Ingen endringer i partner-kortets innhold/logikk.
