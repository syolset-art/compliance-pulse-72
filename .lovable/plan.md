## Mål

Erstatte de to standalone-lenkene **Leverandører** og **Aktiva** i sidebaren med en felles, visuelt grupperende seksjon kalt **Trust Moduler** — slik at de skiller seg tydelig fra Mynder Core (Regelverk/Modenhet/Aktivitet osv.) og signaliserer at dette er stedet hvor man samler tredjeparter og eiendeler for å gjøre risikovurdering.

Ingen ruter, sider, datamodeller eller komponentlogikk endres. Kun visuell gruppering + label i sidebaren.

## Endringer

### 1. `src/components/Sidebar.tsx`
- Legge til en seksjonsoverskrift **"Trust Moduler"** rett over Leverandører/Aktiva-blokken (linje ~374), i samme stil som dagens "Mynder Core"-overskrift og "Flere tjenester" — liten uppercase label med litt tonet ned farge, ingen klikk-handling (ren gruppering, ikke kollapsbar — siden kun 2 elementer).
- Beholde eksisterende `Link`-rendering for `vendorLink` og `assetsLink` uendret (inkludert demo-data knappene under Leverandører).
- Beholde dagens separator-logikk (`border-b`) over og under blokken.
- Lese label fra i18n-nøkkel `nav.trustModules` med fallback `"Trust Moduler"` (NO) / `"Trust Modules"` (EN).

### 2. i18n-filer
- Legge til `nav.trustModules`:
  - NO: `"Trust Moduler"`
  - EN: `"Trust Modules"`

### 3. Memory
- Oppdatere `mem://technical/platform-modular-structure` med at Vendors + Assets vises gruppert som "Trust Moduler" i sidebaren (Systems forblir egen menypost under Mynder Core).

## Visuelt resultat

```text
─────────────────────────────
  MYNDER CORE
   • Mine arbeidsområder
   • Aktivitet
   • Avvik
   • Rapporter
   • Systemer
─────────────────────────────
  TRUST MODULER          ← NY label
   • Leverandører
   • Aktiva
─────────────────────────────
  Flere tjenester ▾
```

## Det vi IKKE gjør nå

- Ikke samle Systemer under Trust Moduler (du bekreftet kun Leverandører + Aktiva).
- Ikke gjøre seksjonen kollapsbar — for kort til å rettferdiggjøre interaksjon.
- Ikke lage en egen `/trust-modules`-landingsside.
- Ikke endre interne navn på modulene (Vendors/Assets) i kode.
