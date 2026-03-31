

## Plan: Ny adminside – Varslinger (Notifications Settings)

### Hva skal bygges
En ny underside `/admin/notifications` i Administrasjon-seksjonen der brukeren ser en oversikt over alle varslingstyper i plattformen, med mulighet til å aktivere/deaktivere hver enkelt via switches.

### Implementering

**1. Legg til route i Sidebar (`Sidebar.tsx`)**
- Legg til `{ name: "nav.adminNotifications", href: "/admin/notifications", icon: Bell }` i `administrationMenu`-arrayen.

**2. Opprett side `src/pages/AdminNotifications.tsx`**
- Bruker `<Sidebar>` layout som de andre admin-sidene.
- Overskrift: "Varslinger" med beskrivelse "Administrer hvilke varsler som sendes til ansatte og administratorer."
- Statisk liste over varslingstyper gruppert i kategorier:
  - **Sikkerhet & Compliance**: Nye avvik, Compliance-frister, Sikkerhetsbrudd
  - **Dokumenter & Oppgaver**: Nye oppgaver, Dokumentoppdateringer, Godkjenningsforespørsler
  - **System & Integrasjoner**: Systemendringer, Integrasjonsfeil, Vedlikeholdsvarsler
- Hver varslingstype vises som en rad med ikon, tittel, kort beskrivelse, og en `<Switch>` for å aktivere/deaktivere.
- State holdes lokalt med `useState` (demo/MVP – ingen DB).
- Toast-melding ved endring ("Varsel oppdatert").

**3. Legg til route i `App.tsx`**
- `<Route path="/admin/notifications" element={<AdminNotifications />} />`

**4. Legg til i18n-nøkler** i `en.json` og `nb.json` for `nav.adminNotifications`.

### Filer som endres
- `src/components/Sidebar.tsx` – ny menylink
- `src/pages/AdminNotifications.tsx` – ny side (opprettes)
- `src/App.tsx` – ny route
- `src/locales/en.json` / `nb.json` – i18n-nøkkel

