

# Tilpass siste steg i veiviseren til kontekst

## Problem
Siste steg ("Bruksomfang") er generisk og uavhengig av det brukeren har fylt inn i tidligere steg. Sporsmalene om frekvens, antall behandlinger/beslutninger og berorte personer mangler sammenheng med valgte AI-funksjoner, risikoniva og berorte grupper.

## Endringer i `src/components/process/ProcessAIDialog.tsx`

### 1. Kontekstuell intro basert pa tidligere svar
Legg til en kort oppsummering overst i steg 6 som viser:
- Valgt risikoniva (f.eks. "Minimal risiko")
- Antall valgte AI-funksjoner (f.eks. "Personalisert opplaering, Automatisk oppgavetildeling")
- Berorte grupper (f.eks. "Ansatte, Kunder")

Dette gir brukeren en kvittering og skaper sammenheng.

### 2. Tilpass sporsmalstekstene til konteksten
- Frekvens-sporsmalet: Endre fra den generiske "Hvor ofte brukes AI i denne prosessen?" til noe som inkluderer funksjonene, f.eks. "Hvor ofte brukes *Personalisert opplaering* og *Automatisk oppgavetildeling*?"
- "Berørte personer per maned": Forhands-navngi de valgte gruppene, f.eks. "Hvor mange *ansatte og kunder* berores per maned?"
- "AI-beslutninger/behandlinger per maned": Behold eksisterende logikk som allerede tilpasser label basert pa `hasDecisionFeatures`.

### 3. Vis overstyringssporsmalet mer kontekstuelt
Sporsmalet "Hvor ofte overstyres AI-anbefalingen?" vises i dag bare nar `hasDecisionFeatures` er true. Legg til en kort forklarende tekst som nevner de spesifikke beslutningsfunksjonene, f.eks. "Hvor ofte overstyres anbefalinger fra *CV-screening* og *Kandidatrangering*?"

## Teknisk plan

### Fil: `src/components/process/ProcessAIDialog.tsx` (steg 6, linje 966-1037)

1. **Kontekstboks** (ny, overst i steget): En kompakt oppsummering med ikon som viser risikoniva-badge, liste over valgte funksjoner, og berorte grupper. Bruker eksisterende data fra `riskCategory`, `aiFeatures`, og `affectedPersons` state.

2. **Dynamisk frekvenslabel** (linje 971): Bytt ut hardkodet "Hvor ofte brukes AI i denne prosessen?" med en dynamisk streng som inkluderer de forste 2-3 valgte funksjonsnavnene.

3. **Dynamisk berort-label** (linje 1003): Endre "Estimert berorte personer per maned" til a inkludere de valgte gruppene fra `affectedPersons`, f.eks. "Estimert berorte ansatte og kunder per maned".

4. **Dynamisk overstyrings-label** (linje 1016): Tilsvarende - inkluder de spesifikke beslutningsfunksjonene i sporsmalsteksten.

Ingen nye filer, ingen databaseendringer. Kun UI-tilpasninger i ett eksisterende steg.

