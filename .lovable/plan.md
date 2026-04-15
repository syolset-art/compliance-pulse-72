

# Plan: Samsvar mellom menynavn og sidetitler

## Funn

Gjennomgang av sidebar-meny (`Sidebar.tsx`), ruter (`App.tsx`), i18n-filer og faktiske sidetitler avdekker følgende avvik:

### Avvik mellom menynavn og sidetitler

| Sidebar-meny (nb) | Sidetittel (hardkodet) | Problem |
|---|---|---|
| **Organisasjon** (`nav.adminOrganisation`) | "Organiser etterlevelse i organisasjonen" | Menynavn og tittel stemmer ikke overens |
| **Tilgangsstyring** (`nav.accessManagement`) | "Tilganger" | Ulikt begrep |
| **Oppgaver** (Tasks.tsx) | "Oppgaver" (hardkodet) | Ikke lokalisert — burde bruke i18n. Minne sier "Aktivitet" |
| **Avviksregister** (Deviations.tsx) | "Avviksregister" (hardkodet) | Ikke lokalisert |
| **Regelverk** (Regulations.tsx) | "Regelverk og standarder" (hardkodet) | Menynavn og tittel avviker, + hardkodet |

### Det som stemmer (ingen endring nødvendig)
- Dashboard, Trust Center (Profile/Edit/Products/Evidence), Meldinger, Rapporter, Systemer, Leverandører, Assets, Varslinger — alle har samsvar mellom meny og side.

## Foreslåtte endringer

| Fil | Endring |
|---|---|
| `src/pages/Tasks.tsx` | Bruk `t("nav.tasks")` i stedet for hardkodet "Oppgaver" |
| `src/pages/Deviations.tsx` | Bruk i18n for tittel og undertekst |
| `src/pages/Regulations.tsx` | Bruk `t("nav.regulations")` + lokalisert undertekst |
| `src/pages/AdminOrganisation.tsx` | Endre sidetittel til "Organisasjon" / "Organisation" (matcher meny) |
| `src/pages/AdminAccessManagement.tsx` | Endre sidetittel fra "Tilganger" til "Tilgangsstyring" / "Access Management" (matcher meny) |

## Teknisk
- Alle endringer er kun i sidetitler (`<h1>`) og undertekster
- Bruker eksisterende i18n-nøkler der de finnes, eller legger til nye
- Ingen funksjonelle endringer

