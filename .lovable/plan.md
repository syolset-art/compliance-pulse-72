# Oppdag systemer — automatisert systemkartlegging med Lara

## Endring i UX

Erstatt knappen **"Legg til system"** på Assets-siden med **"Oppdag systemer"**. Klikk åpner en dialog med fire kilder:

| Kilde | Ikon | Hva Lara gjør |
|---|---|---|
| 🔵 Koble til Microsoft | Microsoft-logo | Henter apper fra Entra ID + Defender for Cloud Apps (shadow IT via Graph API) |
| 🟢 Koble til Google Workspace | Google-logo | Henter tilkoblede apper fra Admin SDK |
| 🟣 Last opp Excel | Excel-ikon | Parser opplastet .xlsx med systemliste (kolonner: navn, leverandør, formål) |
| 🟠 Registrer manuelt | Blyant | Dagens flyt (`AddAssetDialog`) |

## Brukerflyt (Microsoft, primær)

1. Bruker klikker **Oppdag systemer** → velger **Koble til Microsoft**.
2. OAuth-samtykke (Lara ber om `Application.Read.All`, `AuditLog.Read.All`, `Directory.Read.All`, `DiscoveredApp.Read.All` for Defender).
3. Statuspanel: "Lara skanner Microsoft-miljøet …" (viser: Entra apps, Defender discovered apps, aktive brukere).
4. **Discovery-innboks** vises som kortliste. For hvert oppdaget system kjører Lara den 3-stegs matching-pipelinen (se under) og markerer utfall.
5. Bruker godkjenner ett-for-ett eller "Godkjenn alle høy tillit".

## Lara sin 3-stegs matching (kjøres per oppdaget system)

```text
                oppdaget system: "Slack"
                         │
                         ▼
┌────────────────────────────────────────────────┐
│ 1. Trust Profile fra før?                      │
│    → søk i vår globale trust_profile-database  │
│      (system_templates + delte trust-profiler) │
├────────────────────────────────────────────────┤
│  Ja → Koble til eksisterende trust profile     │
│  Nei ↓                                         │
└────────────────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────┐
│ 2. Leverandørrelasjon i kundens vendors?       │
│    → match på vendor-navn / domene             │
├────────────────────────────────────────────────┤
│  Ja → Bruk eksisterende vendor                 │
│  Nei → Opprett ny Vendor (Lara beriker)        │
└────────────────────────────────────────────────┘
                         ▼
┌────────────────────────────────────────────────┐
│ 3. Systemkort finnes i kundens assets?         │
├────────────────────────────────────────────────┤
│  Ja → Marker som duplikat, tilby "slå sammen"  │
│  Nei → Opprett System (asset), lenk til vendor │
│        + trust profile fra steg 1              │
└────────────────────────────────────────────────┘
                         ▼
                     Ferdig ✓
```

Alle tre stegene vises som checkbokser på kortet i innboksen, med Lara-badge "auto-matchet" eller "kunden må bekrefte".

## Akseptansekriterier

- "Legg til system"-knappen finnes ikke lenger — kun "Oppdag systemer".
- Alle fire kilder tilgjengelig fra samme dialog.
- Ingen asset opprettes uten godkjenning (også ved høy tillit — men "Godkjenn alle" er ett klikk).
- Hvert opprettet system har `source: "microsoft_entra" | "microsoft_defender" | "google_workspace" | "excel_import" | "manual"` og lenke til rå-funn.
- Trust profile-match dedupliserer på tvers av kunder (samme "Slack" gjenbruker samme trust profile).
- Vendor opprettes automatisk kun når steg 2 gir null match; ellers gjenbrukes eksisterende.
- Bruker kan koble fra Microsoft/Google når som helst; tokens slettes.

## Teknisk

**Ny tabell:**
- `discovered_systems` (org_id, source, external_id, raw_name, raw_vendor, raw_metadata, users_count, first_seen, last_seen, match_trust_profile_id, match_vendor_id, match_asset_id, status: pending/approved/rejected/merged)

Bruker eksisterende `integration_connections` + `integration_providers` (allerede i skjemaet). Legger til providers `microsoft_entra`, `microsoft_defender`, `google_workspace`.

**Edge functions:**
- `microsoft-oauth-callback` — token-utveksling, lagrer i `integration_connections`
- `scan-microsoft-systems` — kaller Graph `/applications`, `/servicePrincipals`, `/security/dataDiscovery/cloudAppDiscovery/uploadedStreams` (Defender), aggregerer, upsert til `discovered_systems`
- `scan-google-workspace` — Admin SDK `/customer/my_customer/apps`
- `parse-excel-systems` — leser xlsx, ekstraherer rader
- `match-discovered-system` — kjører 3-stegs pipeline (trust profile lookup → vendor match → asset dedup), oppdaterer `match_*_id` på raden
- `approve-discovered-system` — utfører de tre create/link-operasjonene og skriver til `assets` + `system_vendors`

**UI-komponenter:**
- `src/components/systems/DiscoverSystemsDialog.tsx` — de fire valgene
- `src/components/systems/DiscoveryInbox.tsx` — kortliste med 3-stegs status
- `src/components/systems/ExcelUploadStep.tsx` — dra-og-slipp + kolonnemapping

**Erstattes:** knappen som i dag åpner `AddAssetDialog` → åpner i stedet `DiscoverSystemsDialog`. "Registrer manuelt" i dialogen fortsetter å bruke `AddAssetDialog`.

## Ut av scope for denne iterasjonen

- Sanntids-synk (kun manuell + planlagt daglig kjøring i første versjon)
- Okta / Jamf / andre IdP-er (forberedes i `integration_providers`, ikke implementeres)
- Kostnadsanalyse / lisensoptimalisering fra Defender-data
- Automatisk deling av oppdagede systemer med MSP-partner

## Åpne spørsmål før build

1. **Microsoft-tilgang**: Skal vi bruke **Lovable-connector** (raskest, admin-samtykke via Lovable) eller kreve at kunden lager egen **Azure AD app-registrering** (mer arbeid, men kunden eier full kontroll og Defender-lisens-scope)? Anbefaler Lovable-connector for MVP, med opsjon om egen app senere.
2. **Excel-format**: Skal vi definere én fast mal (kolonner: `Systemnavn | Leverandør | Formål | Antall brukere`) som kunden laster ned først, eller la Lara auto-mappe vilkårlige kolonner? Anbefaler fast mal for MVP.
