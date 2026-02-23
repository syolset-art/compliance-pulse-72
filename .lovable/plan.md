

# Ressurssenter -- Engasjerende landingsside

## Konsept

I dag lander brukeren rett pa Tabs (Compliance-prosessen / Regelverk / Ordliste). Det er funksjonelt men kjedelig. Vi legger til en **landingsseksjon** over tabene som gir liv til siden med:

1. **Oppdateringer / Changelog** -- Siste nyheter om plattformen (nye funksjoner, forbedringer)
2. **Fire navigasjonskort** som inviterer brukeren videre:
   - "Din modenhet" -- kort om hvor de er i prosessen, med lenke til compliance-fanen
   - "Regelverk" -- GDPR, NIS2 etc., med lenke til regelverk-fanen
   - "Ordliste" -- forklaring av begreper, med lenke til ordliste-fanen
   - "Chat med Lara" -- snarvei til chatvinduet i bunnen

## Visuell struktur

```text
+---------------------------------------------------------------+
|  Ressurssenter                                                 |
|  Alt du trenger for aa forstaa compliance                      |
+---------------------------------------------------------------+
|                                                                |
|  SISTE OPPDATERINGER (horisontalt scrollbar)                   |
|  [Ny: Baerekraftsrapport] [Oppdatert: Risikovurdering] [...]  |
|                                                                |
+---------------------------------------------------------------+
|                                                                |
|  UTFORSK  (2x2 grid paa desktop, stacked paa mobil)            |
|  +---------------------------+  +---------------------------+  |
|  | Din modenhet              |  | Regelverk                 |  |
|  | Implementering - aktiv    |  | GDPR, NIS2, ISO, AI Act   |  |
|  | Se hvor du er ->          |  | Laer mer ->               |  |
|  +---------------------------+  +---------------------------+  |
|  +---------------------------+  +---------------------------+  |
|  | Ordliste                  |  | Spor Lara                 |  |
|  | 24 begreper forklart      |  | AI-assistenten som        |  |
|  | Bla i ordlisten ->        |  | hjelper deg ->            |  |
|  +---------------------------+  +---------------------------+  |
|                                                                |
+---------------------------------------------------------------+
|  [Compliance-prosessen]  [Regelverk]  [Ordliste]  <-- Tabs    |
|  (eksisterende innhold beholdes uendret)                       |
+---------------------------------------------------------------+
```

## Detaljerte endringer

### 1. `src/pages/Resources.tsx` -- Legg til landingsseksjon

**Over** de eksisterende Tabs legges det til:

**a) Oppdateringer-stripe:**
- Horisontalt scrollbar rad med sma kort/badges
- Hardkodet data i en konstant `PLATFORM_UPDATES` (dato, tittel, type: "ny"/"oppdatert"/"beta", lenke)
- Eksempler: "Baerekraftsrapport (Ny)", "Forbedret risikovurdering", "AI Act-modul (Beta)", "Ny leverandor-sammenligning"
- Hvert kort har et ikon, fargekode basert paa type, og klikk navigerer til relevant side

**b) Fire navigasjonskort (2x2 grid):**
- **Din modenhet**: Viser gjeldende fase fra `getPhaseStatus` + kort beskrivelse, klikk setter `activeTab="compliance"` og scroller ned
- **Regelverk**: Ikon + "GDPR, NIS2, ISO 27001 og AI Act", klikk setter `activeTab="regulations"`
- **Ordliste**: Ikon + antall begreper fra `GLOSSARY_TERMS.length`, klikk setter `activeTab="glossary"`
- **Spor Lara**: Ikon med Lara-butterfly + "Faa svar paa compliance-sporsmaal", klikk scroller til chat-seksjonen

Hvert kort har:
- Stort ikon i farget bakgrunn (primary/blue/amber/purple)
- Tittel og 1-linjers beskrivelse
- Chevron-pil for aa indikere klikkbarhet
- Subtil hover-effekt med border-primary og shadow

### 2. Ingen nye filer

Alt legges til i `Resources.tsx` som en ny seksjon mellom header og Tabs. Oppdateringer-dataen er en enkel konstant i samme fil.

## Tekniske detaljer

### PLATFORM_UPDATES konstant
```typescript
const PLATFORM_UPDATES = [
  { id: "sustainability", title: "Baerekraftsrapport", type: "ny" as const, route: "/sustainability", icon: Leaf },
  { id: "risk-update", title: "Forbedret risikovurdering", type: "oppdatert" as const, route: "/tasks?view=readiness", icon: Shield },
  { id: "ai-act", title: "AI Act-modul", type: "beta" as const, route: "/ai-registry", icon: Bot },
  { id: "vendor-compare", title: "Leverandor-sammenligning", type: "ny" as const, route: "/assets", icon: GitCompare },
];
```

### Navigasjonskort-implementasjon
Hvert kort er en `button` som kaller `setActiveTab()` + `scrollTo` (eller for chat: `scrollIntoView`). Bruker en `useRef` paa tabs-seksjonen og chat-seksjonen for smooth scrolling.

### Filer som endres
1. **`src/pages/Resources.tsx`** -- Legg til landingsseksjon med oppdateringer og navigasjonskort over Tabs

