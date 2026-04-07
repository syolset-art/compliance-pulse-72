

## Plan: Skille Trust Center-visning fra intern asset-visning

### Problemet i dag
Når brukeren åpner «Trust Profile» fra Trust Center-menyen, leder den til `/assets/{selfId}` — den samme siden som brukes for interne leverandør-/systemvurderinger, med alle operasjonelle arkfaner (Validering, Kontroller, Datahåndtering, etc.). Trust Center er ment å være organisasjonens **utadrettede profil**, ikke et internt arbeidsverktøy.

### Konsept

**To ulike visninger av samme data:**

```text
┌──────────────────────────────┐     ┌──────────────────────────────┐
│  Trust Center Profile        │     │  Asset Trust Profile         │
│  /trust-center/profile       │     │  /assets/{id}                │
│                              │     │                              │
│  Utadrettet, samlet visning  │     │  Internt arbeidsverktøy      │
│  Ingen arkfaner              │     │  Med arkfaner                │
│  Scrollbar seksjonslayout    │     │  Validering, Kontroller...   │
│  Publisering + forhåndsvisn. │     │  Innboks, Forespørsler...    │
└──────────────────────────────┘     └──────────────────────────────┘
```

### Hva Trust Center-profilen skal vise (basert på referansebildene)

Én sammenhengende side med seksjoner i rekkefølge:
1. **Header** — Firmanavn, logo, verifisert-badge, Trust Score gauge, metadata (org.nr, land, bransje, nettside)
2. **Nøkkeltall-stripe** — Trust Score, Sertifiseringer, DPA-status, Dokumenter
3. **Trust Score-detaljer** — Donut-gauge med domene-kort (Sikkerhet, Personvern, DPA, etc.) + styrker/bekymringer/anbefalinger
4. **Modenhetsvurdering** — 4 pilarer med prosentpoeng og nivå-badges
5. **Nøkkelroller + Organisasjonsdekning** — Side-om-side visning
6. **Publiseringspanel** — Toolbar for publisering, forhåndsvisning, lagring (kun for eier)

### Endringer

**1. Ny side: `TrustCenterProfile.tsx`**
- Ny rute: `/trust-center/profile`
- Henter organisasjonens `self`-asset og bygger opp en seksjonbasert visning (ikke faner)
- Gjenbruker eksisterende komponenter: `AssetHeader`, `AssetMetrics`, `TrustProfilePublishing`
- Legger til nye seksjoner for modenhet, nøkkelroller og organisasjonsdekning som scrollbare kort
- Inkluderer «Rediger detaljer»-lenke til `/assets/{selfId}` for brukere som trenger den interne visningen

**2. Oppdater `Sidebar.tsx`**
- Trust Profile-lenken endres fra `/assets/{selfId}` → `/trust-center/profile`
- Fallback beholdes for når self-asset ikke finnes

**3. Oppdater `App.tsx`**
- Ny rute: `/trust-center/profile` → `TrustCenterProfile`

**4. Beholde `/assets/{id}` uendret**
- Den interne asset-visningen med arkfaner forblir som den er
- Brukes for leverandører, systemer, og som «avansert redigering» for self-profilen

### Tekniske detaljer
- `TrustCenterProfile` henter self-asset via `assets`-tabellen (`asset_type = 'self'`)
- Gjenbruker `ValidationTab`-logikken (Trust Score-detaljer) og `AssetMetrics` inline — uten å wrappe i `<Tabs>`
- Modenhetsvurdering-seksjonen gjenbruker pilarer fra compliance-logikken
- Layouten er en enkel vertikal stack med `<Card>`-seksjoner — ingen fanenavigasjon

