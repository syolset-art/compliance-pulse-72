# Kompakt kontrolllinje for regelverksvisning

Mål: få grupperingsvalgene ("Grupper etter status / kontrollområde") til å stå på én felles linje med søk, "Last opp bevis" og "Bevis V2", slik at høyden over kravlisten reduseres.

## Forslag til løsning

```text
[ Søk ...              ] [Last opp bevis] [Bevis V2] [ Status ▼ ] [ Kontrollområde ▼ ]
```

 eller

```text
[ Søk ...              ] [Last opp bevis] [Bevis V2]  [ Status | Kontrollområde ]
```

### Alternativ A — én felles rad (foreslått)
1. Flytt `Grupper etter status` / `Grupper etter kontrollområde` inn i samme flex-rad som søkefeltet, Last opp bevis og Bevis V2-bryteren.
2. Endre grupperings-TabsList fra `w-full grid grid-cols-2` til en kompakt inline-segment (f.eks. `h-8` med `px-2` tekst, eller ikoner med tooltip på smale skjermer).
3. La søkefeltet fortsette å ta ledig plass (`flex-1`), mens de andre elementene får `shrink-0`.
4. På små skjermer (< md) lar vi raden bryte naturlig: grupperingsvalgene går under søk/bevis-raden, slik at det ikke blir klemt.

### Alternativ B — ikon-segment for gruppering
- Erstat tekstfanene med to ikonknapper (f.eks. `ListFilter` for status, `LayoutGrid` for kontrollområde) med tooltip.
- Fordel: tar nesten ikke plass. Ulempe: mindre selvforklarende enn tekst.
- Kan kombineres: tekst på desktop, ikoner på mobil.

## Hva som skal endres

- `src/components/regulations/FrameworkRequirementsList.tsx`:
  - Slå sammen grupperings-Tabs og søk+handlinger-raden til én felles flex-rad.
  - Justere padding/høyde på TabsList for å matche høyden på `h-9` søkefelt og knapper.
  - Legge til responsive wrapper (`flex-wrap`) for mobil.
- Ingen endringer i state, logikk, API eller database. Ren layout-endring.

## Akseptansekriterier

- Grupperingsvalgene står på samme linje som søk/Last opp bevis/Bevis på desktop.
- Ingen horisontal scroll i 1280 px bredde.
- Mobil: elementene bryter til 1–2 rader uten tap av funksjonalitet.
- Norsk/engelsk tekst beholdes uendret.
- Ingen endring i hvordan kravene grupperes eller filtreres.
