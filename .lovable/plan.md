
# Ressurssenter 2.0 -- Visuelt dashboard med chat

## Konsept

Erstatter det tomme tre-kolonners oppsettet med et moderne, dashboard-aktig ressurssenter inspirert av ChatGPT/Notion AI. Siden har to soner: en ovre "dashboard"-sone med forslag og snarveier, og en nedre chat-sone som fyller resten av skjermen.

## Layout

```text
Desktop:
+---------------------------------------------------------------+
|  Hjelp og support                                              |
|  Hva kan vi hjelpe deg med?                                    |
+---------------------------------------------------------------+
|                                                                |
|  [Kom i gang]  [Lara AI]  [ISO-veien]  [GDPR]  [Ofte stilte]  |
|   med Mynder    assistent   til 27001    guide    sporsmaal     |
|                                                                |
+---------------------------------------------------------------+
|  Kunnskapsbase (horizontal scroll cards)                       |
|  [GDPR 6 art] [NIS2] [ISO 27001] [AI Act]                     |
+---------------------------------------------------------------+
|                                                                |
|  Chat (full bredde, kontekst-chips inne i chatten)             |
|  Still et sporsmaal...                                         |
|                                                                |
+---------------------------------------------------------------+

Mobil:
+---------------------------+
|  Hva kan vi hjelpe med?   |
+---------------------------+
|  [Mynder] [Lara] [ISO]... |  <- horizontal scroll
+---------------------------+
|                            |
|  Chat (full hoyde)         |
|                            |
+---------------------------+
```

## Detaljerte endringer

### 1. `src/pages/Resources.tsx` -- Fullstendig omskriving

**Desktop-visning:**
- Ovre sone: Stor, varm velkomsttekst ("Hva kan vi hjelpe deg med?")
- Under: 5 handlingskort i et grid (2-3 kolonner). Hvert kort har ikon, tittel og kort beskrivelse. Klikk setter aktiv kontekst og scroller ned til chatten.
- Kunnskapsbase-seksjon: Horisontalt scrollbare kort for GDPR, NIS2, ISO, AI Act med artikkelantall-badge
- Chat-seksjon: Full bredde, integrert SupportChat-komponent (ingen sidepaneler)

**Mobil-visning:**
- Kompakt velkomst
- Horisontale emne-knapper
- Chat i full hoyde

Fjerner det rigide 3-kolonners gridet og bruker en vertikal, sentrert layout som foler seg som en moderne app.

### 2. `src/components/support/SupportChat.tsx` -- Forbedret velkomst

- Fjerner de dupliserte kontekst-chipsene nar de allerede vises i dashboard-sonen over (desktop)
- Beholder chips pa mobil der de er det eneste navigasjonsalternativet
- Storre, mer innbydende tom-tilstand med foreslatte sporsmaal-bobler brukeren kan klikke pa

### 3. `src/components/support/QuickLinksPanel.tsx` -- Ikke lenger brukt som separat panel

Denne komponenten fjernes fra Resources-layouten. Logikken flyttes inn i nye handlingskort direkte i Resources.tsx.

### 4. `src/components/support/KnowledgePanel.tsx` -- Beholdes som separat komponent

Beholdes men rendres som horisontale kort i dashboardet i stedet for en smal kolonne.

## Tekniske detaljer

### Handlingskort-data
```typescript
const actionCards = [
  { id: "mynder-help", icon: Compass, title: "Kom i gang med Mynder", desc: "Lar deg bruke plattformen", gradient: "from-blue-500/10 to-blue-600/5" },
  { id: "lara", icon: Sparkles, title: "Lara AI-assistent", desc: "Spor Lara om hva som helst", gradient: "from-purple-500/10 to-pink-500/5" },
  { id: "iso", icon: Award, title: "ISO 27001-veien", desc: "Steg-for-steg sertifisering", gradient: "from-amber-500/10 to-orange-500/5" },
  { id: "regulatory", icon: BookOpen, title: "Faglig opplaering", desc: "GDPR, NIS2, AI Act", gradient: "from-emerald-500/10 to-green-500/5" },
  { id: "faq", icon: MessageCircle, title: "Ofte stilte sporsmaal", desc: "Raske svar", gradient: "from-sky-500/10 to-cyan-500/5" },
];
```

### SupportChat forbedringer
- Ny prop `showContextChips?: boolean` (default true) slik at Resources kan skjule dem pa desktop
- Foreslatte sporsmaal i tom-tilstanden:
  - "Hvordan legger jeg til en leverandor?"
  - "Hva er forskjellen pa GDPR og NIS2?"
  - "Hjelp meg med risikovurdering"
- Klikk pa forslagene sender dem som melding

### Filer som endres
1. **`src/pages/Resources.tsx`** -- Ny dashboard-layout med handlingskort + kunnskapskort + chat
2. **`src/components/support/SupportChat.tsx`** -- Foreslatte sporsmaal i velkomst, valgfri chips-visning
