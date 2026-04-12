

## Plan: Redesign vendor header — metrikk-kort i horisontal rad, skjul bedriftsinfo bak toggle

### Problemet
Dagens layout har risiko/kritikalitet/modenhet som en vertikal sidebar til høyre (skjult på mobil), pluss en synlig bedriftsinfo-stripe (Org.nr, Bransje, Kategori, Nettside) som tar plass. Skjermbildet fra plattformen viser en bedre løsning: horisontale metrikk-kort under headeren.

### Ny layout for leverandør/system-profiler (ikke self)

```text
┌──────────────────────────────────────────────────────────┐
│ [logo] Outlook       Eier: HR ×    Systemansvarlig: ×    │
│        Microsoft | https://...                           │
│        Beskrivelse...                                    │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────┐│
│ │⚠ RISIKONIVÅ │ │📈 MODENHET   │ │📋 INTERN     │ │📝  ││
│ │ Moderat     │ │ 88%          │ │ RISIKOVURD.  │ │OPP ││
│ │ risiko      │ │              │ │ 23.03.2026   │ │ 0  ││
│ └─────────────┘ └──────────────┘ └──────────────┘ └────┘│
├──────────────────────────────────────────────────────────┤
│ [ℹ Vis bedriftsinfo]  ← klikkbar for Org.nr/Bransje etc│
└──────────────────────────────────────────────────────────┘
```

### Teknisk implementering

**Fil 1: `src/components/trust-controls/HeaderMaturityIndicators.tsx`** — omskrives
- Bytt fra vertikal sidebar til en horisontal rad med 4 kort (grid cols-2 sm:cols-4)
- Kort 1: **Risikonivå** — badge med fargekode + ikon
- Kort 2: **Modenhetsnivå** — prosent med ikon
- Kort 3: **Intern risikovurdering** — dato (demo) med ikon
- Kort 4: **Oppgaver** — antall (demo: 0) med ikon
- Hvert kort: border, liten padding, ikon øverst til høyre, label øverst, verdi under
- Fjern `hidden md:flex` — synlig på alle skjermstørrelser
- Flytt fra høyre sidebar-posisjon til under beskrivelsen

**Fil 2: `src/components/asset-profile/AssetHeader.tsx`** — endres
- Flytt `HeaderMaturityIndicators` fra høyre side til under header-innholdet (etter beskrivelse, før bedriftsinfo)
- Gjør bedriftsinfo-stripen (Org.nr, Bransje, Kategori, Nettside) skjulbar med en toggle-knapp "Vis bedriftsinfo" / "Skjul bedriftsinfo"
- Legg til `useState` for `showCompanyInfo`, default `false`
- Fjern owner/manager/contact fra under bedriftsinfo — behold dem i toppen ved siden av navn (som i skjermbildet)

**Fil 3: `src/components/system-profile/SystemHeader.tsx`** — endres
- Samme mønster: flytt `HeaderMaturityIndicators` fra sidebar til under header
- Plasser som full-bredde rad med 4 kort

**Fil 4: `src/components/device-profile/DeviceHeader.tsx`** — endres
- Samme tilpasning

### Eier/Systemansvarlig plassering
Beholder eier og systemansvarlig-velgerne øverst til høyre i headeren (som i skjermbildet), ikke i en egen seksjon under.

