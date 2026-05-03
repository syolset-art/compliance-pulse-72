## Mål
Tydeliggjøre **hvem en kjøper kan kontakte** hos en leverandør for henholdsvis personvern (DPO) og sikkerhetshendelser (CISO/IRT) — i tillegg til dagens hovedkontakt.

## Endringer

### 1) Database (migrasjon)
Legge til 4 nye, valgfrie felter på `assets`:
- `privacy_contact_name` (text)
- `privacy_contact_email` (text)
- `security_contact_name` (text)
- `security_contact_email` (text)

Begrunnelse: holder hovedkontakt uendret, og lar samme person fylles inn i begge dersom de dekker begge rollene.

### 2) UI — ny "Kontakter for kjøper"-blokk
Erstatte dagens enkle `ContactPersonField` på leverandørkortet (header) med en kompakt **3-rads kontaktblokk**:

```text
KONTAKTER
Hovedkontakt        Navn · e-post · tlf            [rediger]
Personvern (DPO)    navn · e-post                  [rediger / kopier hovedkontakt]
Sikkerhet/IRT       navn · e-post                  [rediger / kopier hovedkontakt]
```

Designprinsipper (Apple-minimal, i tråd med eksisterende stil):
- Samme dempede stil som nåværende felt: liten ikon-firkant + label uppercase + verdi inline
- Ikoner: `User` (hovedkontakt), `Shield` (personvern/DPO), `AlertTriangle` (sikkerhet/IRT)
- Manglende kontakt vises med stiplet venstrekant + advarselsfarget ikon (samme mønster som i dag)
- "Bruk hovedkontakt"-snarvei (én klikk) når DPO eller sikkerhetskontakt er tom
- Inline edit-modus per rad (navn + e-post; tlf kun på hovedkontakt)
- Validering av e-postformat
- Rask "kopier e-post"-handling på hover

### 3) Trust-profil (publikum)
På leverandørens **Trust Profile** (det kjøper ser) eksponere de tre kontaktene tydelig under "Kontakt":
- Hovedkontakt (eksisterende)
- **Personvern / DPO** (ny)
- **Sikkerhet / hendelser** (ny)

Dersom kun ett felt er fylt ut, vises kun det. Hvis begge spesialkontaktene mangler, faller det tilbake til hovedkontakt med teksten *"Ingen egen kontakt registrert — bruk hovedkontakt"*.

### 4) Lara-tips
Når en leverandør mangler enten personvern- eller sikkerhetskontakt, legges et lavprioritetsforslag inn i Lara-veiledning på leverandørkortet:
*"Be leverandøren oppgi DPO- og sikkerhetskontakt — viktig ved hendelser og innsynsbegjæringer."*

## Filer som berøres
- **Migrasjon (ny):** legge til 4 kolonner på `assets`
- `src/components/asset-profile/ContactPersonField.tsx` → utvides til ny `VendorContactsBlock` (eller ny fil `VendorContactsBlock.tsx`, gammel beholdes som intern rad-komponent)
- `src/components/asset-profile/AssetHeader.tsx` → bytter ut bruken
- `src/components/trust-profile/...` → vise de tre kontaktene på publikumsvisningen (finner riktig fil ved implementasjon)
- `src/lib/laraGuidance.ts` (eller tilsvarende) → legge inn nytt veiledningssignal

## Ute av scope
- Ingen endring i tilgangsstyring/RLS (feltene er offentlige innenfor eksisterende `assets`-policy)
- Ingen ny tabell — feltene er flate på `assets` for enkelhet og lesbarhet
