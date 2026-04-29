## Mål

På Meldinger-siden (Lara-innboks) skal hvert dokument som venter på godkjenning være **åpent som standard**, slik at brukeren umiddelbart ser hele Laras forslag — inkludert hvilken handling Lara vil utføre (f.eks. "koble dokumentet til leverandør X"). Less is more: ingen unødvendige klikk for å se hva som godkjennes.

## Endringer

Fil: `src/components/customer-requests/LaraInboxContent.tsx`

### 1. Åpne kort som standard
- Initialiser `expandedIds` med ID-ene til alle elementer i `ready`-listen (analysert og klar for godkjenning).
- Bruk `useEffect` som synkroniserer settet når nye `ready`-items kommer inn, uten å lukke kort brukeren har lukket manuelt (track lukkede separat, eller bare auto-ekspander nye).
- Fjern chevron-rotasjon som primær affordans — kortet er åpent, klikk på header lukker det fortsatt.

### 2. Tydeliggjør Laras foreslåtte handling
Legg til en ny rad øverst i analyse-detaljene som beskriver konkret handling Lara vil utføre ved godkjenning:

```
Lara foreslår
→ Koble {dokumenttype} til leverandør {asset.name}
→ Erstatte forrige {dokumenttype} (hvis finnes)
→ Sette gyldighet til {valid_until}
→ Øke trust score med +{score_impact} poeng
```

Dette rendres som en kompakt liste med pil-prefix (→) inne i den eksisterende detalj-blokken, plassert før "Bekrefter"-raden. Bruker eksisterende styling (text-xs, foreground/muted-foreground), ingen nye komponenter.

Logikk for handlingslisten:
- Alltid: "Koble til leverandør {navn}" — eller "Tilordne leverandør (ikke matchet)" hvis `matched_asset_id` er null.
- Hvis `summary.valid_until`: "Setter gyldighet til {dato}".
- Hvis tidligere dokument finnes (sjekk via `vendor_documents` query — eller bare vis "Erstatter forrige hvis finnes" tekstuelt for å unngå ekstra query).
- Alltid: "Øker trust score med +X poeng" når `score_impact` finnes.

### 3. Knapper forenkles
Beholde "Avvis" og "Godkjenn og berik trust score". "Les dokumentet"-lenke beholdes. "Åpne {asset.name}" beholdes for kontekst.

## Hva vi ikke endrer
- Ingen DB-endringer.
- Ingen endring i godkjennings-/superseding-logikken.
- "Lara analyserer"- og "I kø"-seksjonene forblir kompakte (åpning gir ingen verdi der).

## Teknisk notat
- Endring isolert til `LaraInboxContent.tsx`.
- ~30-40 linjer endret/lagt til.
