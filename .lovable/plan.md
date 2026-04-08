

## Redesign av Eiendeler-fanen i arbeidsområdevisningen

### Problemet
Fanen "Eiendeler" er for generisk — brukere forstår ikke at den dekker systemer, leverandører, lokasjoner, nettverk og enheter. Filtreringen og "Legg til"-menyen er allerede på plass, men selve fanenavnet og den visuelle presentasjonen kommuniserer ikke godt nok hva som finnes her.

### Løsning: Visuelt kategori-dashboard med ikoner

Erstatt den nåværende raden med filterknapper (Alle / System / Lokasjon / Nettverk) med **klikkbare kategori-kort** som fungerer som både filter og visuell oversikt. Hver kategori viser ikon, navn og antall.

```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  🖥 Systemer │ │ 🏢 Levera-  │ │ 📍 Loka-    │ │ 🌐 Nettverk │ │ 💻 Enheter  │
│     4        │ │  ndører  2  │ │  sjoner  1  │ │      0      │ │      0      │
│              │ │             │ │             │ │   (kommer)  │ │   (kommer)  │
└──────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
         ↑ klikk = filtrer tabellen under
```

### Konkrete endringer

**Fil: `src/pages/WorkAreas.tsx`**

1. **Erstatt filterknapp-raden** (linje ~903-936) med et grid av 5 kategori-kort:
   - **Systemer** (Server-ikon) — aktiv, filtrerer `asset_type === "system"`
   - **Leverandører** (Building2-ikon) — aktiv, filtrerer `asset_type === "vendor"`
   - **Lokasjoner** (MapPin-ikon) — aktiv, filtrerer `asset_type === "location"`
   - **Nettverk** (Network-ikon) — disabled med "Kommer"-badge
   - **Enheter** (Monitor-ikon) — disabled med "Kommer"-badge

2. **Hvert kort viser:**
   - Ikon øverst
   - Kategorinavn
   - Antall assets i den kategorien (live count fra `allAssets`)
   - Valgt-tilstand med `border-primary bg-primary/5`
   - "Alle"-filter aktiveres ved å klikke på det allerede valgte kortet (toggle av)

3. **Legg til `vendor` i assetTypeFilter**-typene, og oppdater filtreringslogikken til å inkludere vendor-assets.

4. **Endre fanenavnet** fra "Eiendeler" / "Eien" til **"Verdier"** med Package-ikon beholdt — et mer dekkende norsk begrep.

5. **Flytt "+ Legg til"-knappen** opp til høyre for kategori-kortene, slik at den er visuelt knyttet til oversikten.

### UI-detaljer
- Kortene bruker `grid grid-cols-2 sm:grid-cols-5 gap-2` for responsivitet
- Valgt kort: `border-primary bg-primary/5 shadow-sm`
- Disabled kort: `opacity-50 cursor-not-allowed` med liten "Kommer"-tekst
- Hover på aktive kort: `hover:border-primary/50`
- Animasjon: `transition-all duration-150`

Ingen database- eller backend-endringer nødvendig.

