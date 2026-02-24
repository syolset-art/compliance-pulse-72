

# Kontekstuell tilpasning av "Hvem pavirkes"-sporsmalet

## Problemet
Sporsmalet "Hvem pavirkes av AI-beslutninger?" vises alltid med samme ordlyd, uavhengig av hva brukeren har svart i tidligere steg. Hvis AI-funksjonene som er valgt (f.eks. "Personalisert opplaering", "Automatisk oppgavetildeling") ikke innebarer beslutninger som pavirker folk direkte, er ordlyden misvisende og forvirrende.

## Losning
Tilpass sporsmalet dynamisk basert pa valgte AI-funksjoner og kontekst fra tidligere steg:

### Logikk
1. **Sjekk om valgte funksjoner antyder beslutninger** -- bruk et sett med nøkkelord (screening, rangering, vurdering, score, filtrering, avslag) for å avgjore om AI tar "beslutninger"
2. **Tilpass ordlyd**:
   - Hvis beslutnings-funksjoner: "Hvem pavirkes av AI-beslutningene?" (som na)
   - Hvis kun stotte/analyse-funksjoner: "Hvem bruker eller berores av AI-funksjonene?"
   - Hvis ingen funksjoner valgt: Skjul seksjonen helt
3. **Legg til kontekstuell undertekst** som refererer til de valgte funksjonene, f.eks.: "Du har valgt Personalisert opplaering og Automatisk oppgavetildeling. Hvem bruker disse?"

## Teknisk plan

### Fil: `src/components/process/ProcessAIDialog.tsx`

**Endring 1** -- Legg til en hjelpefunksjon (rundt linje 380) som bestemmer ordlyd basert pa valgte funksjoner:

```typescript
const DECISION_KEYWORDS = ['screening', 'rangering', 'vurdering', 'score',
  'filtrering', 'avslag', 'beslutning', 'godkjenning', 'kredittscore'];

const getAffectedPersonsContext = () => {
  const selectedNames = aiFeatures.filter(f => f.selected).map(f => f.name.toLowerCase());
  const hasDecisionFeatures = selectedNames.some(name =>
    DECISION_KEYWORDS.some(kw => name.includes(kw))
  );
  const featureList = aiFeatures.filter(f => f.selected).map(f => f.name).join(', ');

  if (hasDecisionFeatures) {
    return {
      label: 'Hvem pavirkes av AI-beslutningene?',
      hint: `Basert pa ${featureList} -- hvem kan bli direkte pavirket av disse beslutningene?`,
    };
  }
  return {
    label: 'Hvem bruker eller berores av AI-funksjonene?',
    hint: `Du bruker ${featureList}. Velg hvem som bruker eller berores av dette.`,
  };
};
```

**Endring 2** -- Oppdater "Affected persons"-seksjonen (linje 728-749) til a bruke den dynamiske konteksten:

- Erstatt hardkodet label med `getAffectedPersonsContext().label`
- Legg til en liten muted undertekst med `getAffectedPersonsContext().hint` som viser sammenhengen
- Skjul hele seksjonen dersom ingen AI-funksjoner er valgt (`selectedFeaturesCount === 0`)

**Endring 3** -- I Steg 6 (Bruksomfang, linje 867-938):

- "Estimert AI-beslutninger per maned" (linje 897): Endre label dynamisk pa samme mate -- hvis ingen beslutningsfunksjoner, bruk "Estimert AI-behandlinger per maned"
- "Hvor ofte overstyres AI-anbefalingen?" (linje 919): Vis kun dersom beslutnings-funksjoner er valgt, ellers skjul

Kun en fil endres: `src/components/process/ProcessAIDialog.tsx`.
