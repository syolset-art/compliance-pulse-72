

# Hjelp og support -- Redesign av Ressurssiden

## Oversikt

Erstatter dagens statiske "Laeringssenter" med et dynamisk **"Hjelp og support"**-senter med en AI-drevet chat i sentrum. Brukeren kan stille sporsmaal, fa kontekstuell hjelp om Mynder, regulatorisk veiledning og support -- alt pa ett sted.

## Layout: Tre kolonner pa desktop, stacked pa mobil

```text
+---------------------+---------------------------+---------------------+
|  Hurtiglenker (v)   |     Chat (sentrum)        |  Kunnskapsbase (h)  |
|                     |                           |                     |
|  Hvordan bruke      |  [Forhandsdefinerte       |  GDPR-artikler      |
|    Mynder           |   kontekst-knapper]       |  NIS2-artikler      |
|  Hvordan bruke      |                           |  ISO 27001          |
|    Lara Soft        |  Chat-vindu med           |  AI Act             |
|  ISO-sertifisering  |  kilde-indikator          |                     |
|  Ofte stilte        |                           |  Kom i gang          |
|    sporsmaal        |  [Skriv et sporsmaal...]  |  Demo-videoer       |
|  Faglig opplaering  |                           |                     |
+---------------------+---------------------------+---------------------+
```

Pa mobil: Chat er primaer, hurtiglenker og kunnskapsbase tilgjengelig via faner.

## Chatfunksjonalitet

### Forhandsdefinerte kontekster (chips over chatten)
- **Mynder-hjelp**: "Hvordan bruker jeg Mynder?" -- svar basert pa plattformkunnskap
- **Lara Soft**: "Hvordan bruker jeg Lara?" -- AI-assistenten
- **ISO-sertifisering**: Sporsmaal om ISO 27001-prosessen
- **Ofte stilte sporsmaal**: Vanlige sporsmaal om compliance
- **Faglig opplaering**: GDPR, NIS2, AI Act, etc.

Nar brukeren klikker en kontekst-chip, sendes en forhandsdefinert system-prompt til chatten som setter konteksten.

### Kilde-regulering (kostnadskontroll)
- Hvert svar markeres med kilde: **"Mynder-data"** (gratis, intern), **"Faglig kilde"** (AI, koster credits)
- For Mynder-spesifikke sporsmaal: Bruker innebygd kunnskap (ingen AI-kall)
- For faglige sporsmaal (GDPR, NIS2 etc.): Bruker Lovable AI via chat-edge-function med en dedikert "support"-kontekst
- Daglig/ukentlig grense pa AI-sporsmaal for gratisbrukere (UI-melding nar grensen naas)

### Kilde-badges pa svar
Hvert AI-svar far en liten badge:
- `Mynder` (blaa) -- svar fra intern kunnskapsbase
- `AI-assistent` (lilla) -- svar generert av AI-modell
- `Artikkel` (graa) -- lenke til en artikkel i kunnskapsbasen

## Filer som endres

1. **`src/pages/Resources.tsx`** -- Fullstendig omskrivning til nytt layout med chat, hurtiglenker og kunnskapsbase
2. **`src/locales/nb.json`** -- Oppdater "Laeringssenter" til "Hjelp og support" + nye nokler
3. **`src/locales/en.json`** -- Tilsvarende engelske oversettelser
4. **`src/components/Sidebar.tsx`** -- Oppdater label fra "Laeringssenter" til "Hjelp og support", endre ikon fra BookOpen til HelpCircle

## Tekniske detaljer

### Resources.tsx -- Ny struktur
- **Venstre panel**: Hurtiglenker som klikkbare kort med ikon. Klikk setter kontekst i chatten.
- **Senter**: Chat-grensesnitt (forenklet versjon av ChatInterface-monsteret). Bruker `supabase.functions.invoke('chat')` med en `supportContext`-parameter som styrer system-prompt.
- **Hoyre panel**: Eksisterende kunnskapsbase (GDPR-artikler, NIS2 etc.) beholdes men flyttes hit.

### Chat-implementasjon
- Gjenbruker streaming-logikken fra eksisterende `chat` edge function
- Legger til en `supportContext` parameter som velger mellom ulike system-prompts:
  - `mynder-help`: Statisk FAQ/hjelp om plattformen (kan besvares uten AI-kall)
  - `regulatory`: GDPR/NIS2/ISO-sporsmaal (krever AI-kall)
  - `faq`: Forhåandsdefinerte svar (ingen AI-kall)
- For `mynder-help` og `faq`: Bygger svar fra en lokal kunnskapsbase (hardkodet i frontend) uten a kalle edge function -- null kostnad
- For `regulatory`: Kaller edge function med tilpasset system-prompt for faglige sporsmaal

### Lokale FAQ-svar (null kostnad)
En map med vanlige sporsmaal og svar som haandteres i frontend uten AI-kall:
```typescript
const faqAnswers = {
  "hvordan legge til system": "Ga til Eiendeler > Klikk 'Legg til'...",
  "hva er ropa": "ROPA er en oversikt over...",
  // etc.
};
```

### Sidebar-endring
- Endre `BookOpen` ikon til `HelpCircle`
- Endre `t("nav.resources")` -- som allerede mapper til "Laeringssenter" -- til "Hjelp og support" i nb.json

### Lokalisering
- `nb.json`: `nav.resources` -> "Hjelp og support", `resources.title` -> "Hjelp og support", `resources.subtitle` -> "Storsomaal, support og faglig hjelp"
- `en.json`: Tilsvarende engelske verdier

