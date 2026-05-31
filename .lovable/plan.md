# Forenklet Compliance-meny for partnere + "Andre moduler" i Innstillinger

Når en partner bytter til workspace-modus **"Min organisasjon — Compliance og styring"**, skal sidebaren være minimal: kun Trust Center, Regelverk og Meldinger. Alt annet (Mynder Core, Registre, Leverandørmodul, Flere tjenester, Bli Partner) flyttes til Innstillinger som "Andre moduler" som kan aktiveres.

## Mål

1. Partnere får et eget Trust Center-punkt øverst i compliance-menyen.
2. Compliance-menyen for partnere viser kun: **Trust Center**, **Regelverk**, **Meldinger**.
3. Skjulte moduler kan aktiveres på nytt fra Innstillinger → "Andre moduler". Når en modul aktiveres, dukker den opp i menyen igjen.

## Endringer

### 1. `src/components/Sidebar.tsx` — compliance-grenen
- Beholde eksisterende `isPartner`-flagg (allerede beregnet via `companyProfile.is_msp_partner`).
- Når `workspaceMode === "compliance" && isPartner`:
  - Vise Dashbord + nytt **Trust Center**-punkt (lenke til `/trust-center/profile`, ikon `ShieldCheck`).
  - Vise `globalNav` filtrert til kun **Regelverk** og **Meldinger**.
  - Skjule: Mynder Core-seksjonen, Registre-seksjonen, Leverandører-collapse, "Flere tjenester", "Bli Partner".
  - Skjulingen overstyres per-modul av en ny localStorage-flagg `mynder_partner_modules_enabled` (JSON-array med modulnøkler: `"core"`, `"registries"`, `"vendors"`, `"more"`, `"become_partner"`). Når en nøkkel er til stede, vises tilhørende blokk igjen.
- Ikke-partnere er uendret.

### 2. `src/pages/MSPPartnerSettings.tsx` — ny seksjon "Andre moduler"
Legge til en seksjon nederst (eller som ny fane) med kort for hver modul:
- **Mynder Core** — "Aktivitet, kontroller og styringsoppgaver"
- **Registre** — "Systemer og aktiva"
- **Leverandørmodul** — "Tredjeparts­leverandører og TPRM"
- **Flere tjenester** — "Utforsk tilleggsmoduler"

Hvert kort har en Switch "Aktiver i Compliance-menyen". Toggle skriver/fjerner nøkkelen i `mynder_partner_modules_enabled` (localStorage) og trigger `window.dispatchEvent(new Event("storage"))` slik at sidebaren oppdateres.

### 3. Liten hjelpefunksjon
Ny `src/lib/partnerModules.ts` med:
- `getEnabledPartnerModules(): string[]`
- `setPartnerModuleEnabled(key, enabled): void`
- Konstant-liste over modulnøkler + etiketter (gjenbrukes i Sidebar + Innstillinger).

## Avgrensning

- Ingen endringer i partner-modus-menyen (`PartnerNav`) eller TopBar.
- Ingen DB-/backend-endringer; alt styres frontend via localStorage.
- Ingen ruteendringer — Trust Center-lenken bruker eksisterende `/trust-center/profile`.
- i18n følger samme `isNb ? ... : ...`-mønster som resten av Sidebar.tsx.
