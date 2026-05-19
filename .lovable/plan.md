## Mål
"Tilbud"-arkfanen skal kun være en oversikt over tilbud brukeren har laget – ikke kontrollpunkter eller leveranse-detaljer. Brukeren skal se hva som er laget, når og av hvem, og kunne sette status (Ikke startet / Pågår).

## Endringer

### 1. Ny datamodell for lagrede tilbud
I `MSPMaturityServiceMatrix.tsx`:
- Erstatt `OngoingItem` (med controls/meta) med en enkel `SavedOffer`-type:
  - `id`, `offerNumber` (T-2026-xxxx), `serviceTitle`, `frameworkLabel?`, `createdAt`, `createdBy`, `totalHours`, `totalPrice`, `status: "not_started" | "in_progress"`
- Seed `SAVED_OFFERS` med 2–3 demo-tilbud (f.eks. ISO 27001-klargjøring, Awareness-program) – ingen kontrollpunkter.
- Hold staten i `useState` slik at "Lag tilbud"-flyten kan legge til nye når dialogen lagrer (vi føyer på enkel `onSaved`-callback fra `MSPCreateOfferDialog` hvis det er trivielt – ellers bare seed-data nå, ny tilbud-tilføyelse kommer senere).

### 2. Ny visning av "Tilbud"-fanen
Erstatt eksisterende `TabsContent value="ongoing"`-blokk (linje ~737) med en kompakt liste:

```
[ikon] Tittel · framework-badge        [Status-velger ▾]
       T-2026-1234 · Laget 12. mai av Truls Hansen
       6 tiltak · 60 timer · 90 000 kr
```

- Ikon: `FileText` i nøytral container (fargen reflekterer status: muted for "Ikke startet", warning for "Pågår").
- `Select` til høyre med to valg: "Ikke startet" / "Pågår". Endring oppdaterer state + toast.
- Klikk på kortet åpner `MSPCreateOfferDialog` i preview-modus (gjenbruk eksisterende dialog) – ingen expand/kontroll-liste lenger.
- Fjern all logikk for `expandedOngoing`, `controlFilter`, og kontroll-rendering inne i denne fanen.

### 3. Ingenting endres i "Pågående oppdrag"
Den fanen beholdes som den er (egen `DELIVERIES`-flyt). "Pågår"-status på et tilbud flytter det IKKE automatisk dit – det er to separate konsepter inntil videre.

### 4. Opprydding
- Behold `OngoingItem`-typen kun hvis den brukes andre steder; ellers fjern.
- Behold `expandedOngoing` / `controlFilter` kun hvis brukt i andre faner; ellers fjern.

## Filer som endres
- `src/components/msp/MSPMaturityServiceMatrix.tsx` (datamodell, tab-innhold, state-rydding)

Ingen DB- eller backend-endringer. Ingen endringer i `MSPCreateOfferDialog`, "Anbefalte tjenester" eller "Pågående oppdrag".
