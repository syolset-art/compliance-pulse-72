

# Oppdater «Legg til relasjon»-dialogen

## Problemet
Dagens dialog er teknisk og vanskelig å forstå. Brukeren ser dropdown-menyer med verdier som «uses», «hosts», «connects_to» uten kontekst om hva de kobler eller hvorfor.

## Løsning
Redesigne dialogen til en visuell, trinnvis flyt som gjør det intuitivt å forstå hva som kobles og hvordan.

### Steg 1: Visuell flyt-modell
Øverst i dialogen vises en visuell «kobling» med tre elementer:
```text
┌──────────────┐          ┌──────────────┐
│  Denne       │ ───────► │  Velg mål    │
│  eiendelen   │  relasjon│              │
└──────────────┘          └──────────────┘
```
Kildeeiendelen (nåværende) vises som et kompakt kort med navn, type og ikon. Målet oppdateres live når brukeren velger.

### Steg 2: Velg type eiendel først
I stedet for én lang liste, la brukeren velge **kategori** først med klikkbare kort:
- **Leverandør** (Building2-ikon) — filtrerer til vendor-assets
- **System** (Server-ikon) — filtrerer til system-assets  
- **Annen eiendel** (Box-ikon) — viser resten (nettverk, hardware, data, etc.)

### Steg 3: Smarte relasjonstyper basert på valg
Når brukeren har valgt kategori, vises kun relevante relasjonstyper med norske, forklarende beskrivelser:
- Leverandør → «Leverer tjeneste til», «Behandler data for», «Regulerer»
- System → «Bruker», «Integrerer med», «Er avhengig av»
- Annen → «Kobles til», «Hoster», «Styres av»

### Steg 4: Søk og velg mål-eiendel
Beholder combobox-søket men filtrert på valgt kategori. Viser kun relevante eiendeler.

### Steg 5: Valgfri beskrivelse
Behold tekstfeltet for beskrivelse.

## Teknisk plan

1. **Oppdater `AddRelationDialog.tsx`**:
   - Legg til state for `targetCategory` (vendor/system/other)
   - Visuell flyt-seksjon øverst med source → target kort
   - Tre klikkbare kategorikort som filtrerer assets-listen
   - Dynamiske relasjonstyper basert på valgt kategori med norske beskrivelser
   - Filtrert asset-søk basert på kategori

2. **Bedre UX-elementer**:
   - Bredere dialog (`sm:max-w-lg`)
   - Kategorikort med ikoner og farger
   - Relasjonstype som visuell knapp-rekke (ikke dropdown)
   - Live-oppdatering av flyt-visualiseringen

