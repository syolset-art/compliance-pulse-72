## Mål
Gjør aktiverte moduler raskt tilgjengelige som førsteklasses menypunkter, og samle systemer/aktiva i en logisk "Registre"-gruppe. Aktiverte moduler skal alltid være synlige direkte — uaktiverte havner i "Flere tjenester".

## Foreslått sidebar-struktur

```text
Dashboard
Trust Center                (alltid)
──────────
Regelverk                   (alltid)
Leverandører ▸ Rapporter    (kun hvis Vendor-modul aktivert)
Meldinger                   (alltid)
──────────
Mynder Core ▾               (kun hvis Core aktivert)
  Arbeidsområder
  Aktivitet
  Avvik
  Rapporter
Registre ▾                  (kun hvis Core eller Assets aktivert)
  Systemer                  (vises når Core aktivert)
  Aktiva                    (vises når Assets aktivert)
──────────
Flere tjenester ▾           (samler kun ikke-aktiverte moduler)
  Mynder Core / Leverandører / Aktiva
```

### Begrunnelse for plassering
- **Leverandører** løftes opp mellom Regelverk og Meldinger — det er en hyppig brukt modul og fortjener ett klikk, ikke to. Beholder `Rapporter` som inline-undermeny som i dag.
- **Mynder Core** beholdes som collapsible gruppe (mange underpunkter), men `Systemer` flyttes ut til en ny **Registre**-gruppe sammen med **Aktiva**. Dette gir én mental modell: "registre over ting vi forvalter".
- **Registre** vises automatisk når enten Core eller Assets er aktivert; underpunkter filtreres etter hvilken modul som er aktiv. Dette unngår et nytt aktiveringsbegrep — Systemer følger Core, Aktiva følger Assets, slik du beskriver.
- **Flere tjenester** beholdes for oppdagelse av ikke-aktiverte moduler, men inneholder ikke lenger Systemer separat (det følger Core).
- Ingen nye toppnivåpunkter for brukere som ikke har aktivert noe — sidebar holdes ren.

## Endringer i kode (kun `src/components/Sidebar.tsx`)

1. **Konstanter**:
   - Splitt `managementNav` slik at `Systemer` ikke lenger ligger der. Ny `coreNav` = Arbeidsområder, Aktivitet, Avvik, Rapporter.
   - Ny `systemsLink = { name: "nav.systems", href: "/systems", icon: Cloud }`.
   - Behold `vendorLink` og `assetsLink`.

2. **Render-rekkefølge** i `<nav>`:
   - Dashboard → Trust Center → separator
   - Regelverk → (Leverandører hvis aktivert, med Rapporter-undermeny som i dag) → Meldinger → separator
   - Mynder Core (collapsible, bruker ny `coreNav`) hvis aktivert
   - Registre (ny collapsible-seksjon, ikon `Layers` eller `Cloud`) hvis `showCoreNormal || showAssetsNormal`. Underpunkter bygges dynamisk: `[showCoreNormal && systemsLink, showAssetsNormal && assetsLink]`.
   - Fjern dagens "Trust Moduler"-overskrift og inline Leverandører/Aktiva-blokk (Leverandører er nå løftet opp, Aktiva flyttet til Registre).
   - Flere tjenester: `exploreCoreItems` peker fortsatt til `coreNav` + `systemsLink` (Systemer er en del av Core-tilbudet i utforsk-visningen). `exploreRegistryItems` blir bare `assetsLink` hvis ikke aktivert.

3. **Aktiv-state**:
   - Ny `isRegistriesActive = location.pathname.startsWith("/systems") || location.pathname.startsWith("/assets")`.
   - `isManagementActive` oppdateres til å bruke `coreNav` (uten Systems).

4. **i18n**: legg til `nav.registries` ("Registre" / "Registries") hvis ikke allerede finnes (brukes i dag i Flere tjenester, så nøkkelen finnes).

Ingen endringer i ruter, sider eller backend — kun navigasjonsstruktur.

## Ut av scope
- Ingen endringer i selve modul-aktiveringsflyten eller `useSubscription`-logikken.
- Ingen endringer i Trust Center-, Innstillinger- eller Partner-menyene.