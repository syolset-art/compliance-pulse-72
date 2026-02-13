
# Trust Profil - Omdoping + Publiseringsstyring

## Hva som endres

### 1. Omdoping: "Tillitsprofil" blir "Trust Profil"
Alle forekomster av "Tillitsprofil" i norsk og "Trust Profile" i engelsk endres til **"Trust Profil"** i begge sprak. Dette gjelder:
- `src/locales/nb.json`: `nav.trustProfile` fra "Tillitsprofil" til "Trust Profil"
- `src/locales/en.json`: `nav.trustProfile` fra "Trust Profile" til "Trust Profil"
- Sidebar-lenken og alle andre steder som bruker denne oversettelsennokkelen

### 2. Ny publiseringsseksjon pa Trust Profil (self-type)
Nar brukeren apner HULT IT sin Trust Profil (selverklaering), vises en ny seksjon over fanene med publiseringsstyring. Inspirert av referansebildet, men mer minimalistisk og profesjonelt.

#### Publiseringskort (ny komponent: `TrustProfilePublishing.tsx`)
Et kort vist kun for `asset_type === 'self'` med:

**Statusindikator:**
- Privat/Offentlig toggle med tydelig visuell tilstand
- Nar privat: "Profilen er ikke publisert enna. Velg hvem som kan se den."
- Nar publisert: "Profilen er synlig for valgte kunder."

**Publiseringsmalgruppe:**
- Radiogruppe med to valg:
  1. **Alle kunder** - "Profilen er tilgjengelig for alle som ber om den"
  2. **Utvalgte kunder** - Viser en liste med kundenavn (fra `customer_compliance_requests`) med avkrysningsbokser
- Tydelige labels og beskrivelser for universell utforming

**Handlingsknapper:**
- "Vis Trust Profil" (outline) - forhåndsvisning
- "Lagre endringer" (primary) - lagrer publiseringsinnstillinger

### 3. WCAG-hensyn
- Alle interaktive elementer far `aria-label` og `role` der nodvendig
- Fargekontrast folger WCAG AA-krav (minimum 4.5:1)
- Fokusindikatorer er synlige pa alle interaktive elementer
- Skjermleser-vennlige statusmeldinger via `aria-live`
- Logisk tab-rekkefolge og tastaturnavigasjon

### 4. Database-endringer
Ny kolonne pa `assets`-tabellen for publiseringsstatus:
```sql
ALTER TABLE assets ADD COLUMN publish_mode text DEFAULT 'private';
ALTER TABLE assets ADD COLUMN publish_to_customers text[] DEFAULT '{}';
```
- `publish_mode`: 'private' | 'all' | 'selected'
- `publish_to_customers`: Array med kundenavn (for 'selected'-modus)

## Teknisk implementasjon

### Nye filer
- `src/components/asset-profile/TrustProfilePublishing.tsx` - Publiseringskort med toggle, malgruppe, kundeliste

### Endrede filer
- `src/pages/AssetTrustProfile.tsx` - Legger til `TrustProfilePublishing` mellom metrics og tabs for self-type
- `src/components/asset-profile/AssetHeader.tsx` - Oppdaterer "Selverklaering"-badge-tekst om nodvendig
- `src/locales/nb.json` - Endrer "Tillitsprofil" til "Trust Profil", legger til publiseringsnokler
- `src/locales/en.json` - Endrer "Trust Profile" til "Trust Profil", legger til publiseringsnokler
- Database-migrasjon for nye kolonner

### Komponentstruktur for `TrustProfilePublishing`
```text
+--------------------------------------------------+
| Trust Profil                                      |
| Administrer din Trust Profil og velg              |
| hvem som kan se den.                              |
|                                                   |
| +----------------------------------------------+ |
| | Profilen er privat                            | |
| | Ingen kunder kan se profilen din enna.        | |
| +----------------------------------------------+ |
|                                                   |
| Publiseringsinnstillinger                         |
|                                                   |
| ( ) Alle kunder                                  |
|     Profilen deles med alle som ber om innsyn     |
|                                                   |
| ( ) Utvalgte kunder                              |
|     Velg hvilke kunder som far tilgang            |
|                                                   |
|     [ ] Allier AS                                |
|     [ ] TechCorp AS                              |
|     [ ] Nordic Solutions                          |
|                                                   |
|              [Vis Trust Profil] [Lagre endringer] |
+--------------------------------------------------+
```

### UI-designprinsipper
- Minimalistisk og rent: Ingen unodvendig visuell stoy
- Klarsprak: Korte, presise beskrivelser uten fagsjargong
- Apple-inspirert estetikk med subtle borders og muted bakgrunner
- Responsivt: Stacker vertikalt pa mobil, knapper full bredde
- Fokusstatus synlig pa alle interaktive elementer (ring-2 ring-primary)
