## Endring: anbefalingskort i Modenhet & tjenester

På hvert anbefalingskort (komponent `MSPMaturityServiceMatrix.tsx`, rad ~763–807) er det i dag to knapper:

- Primær: **Lag tilbud**
- Sekundær (kun hvis regelverk): **Vis gap** med ikon + antall-badge

### Hva vi gjør

1. Bytt label fra **Vis gap** → **Kjør gap-analyse** (samme handler, `openGap(r.frameworkId)`).
2. Behold antall-badge for åpne gap — det gir kontekst og er kompakt.
3. Forenkle visuelt:
   - Fjern `FileText`-ikonet — teksten "Kjør gap-analyse" er tydelig nok.
   - Gjør sekundærknappen til `variant="outline"` i stedet for `ghost` med hover-flip, så det blir mindre støy og tydeligere at det er en handling sidestilt med "Lag tilbud".
4. Rekkefølge: **Kjør gap-analyse** først (utforskning), **Lag tilbud** som primær til høyre — matcher naturlig arbeidsflyt (analyser før du selger), men "Lag tilbud" beholder primær-styling så den fortsatt er hovedhandlingen.
5. Hvis kortet ikke har `frameworkId` (ingen gap å vise) → bare "Lag tilbud" som i dag.

### Hvorfor ikke wizard (Lag tilbud → starter med gap-analyse)

Du valgte to separate knapper. Det gir partner fleksibilitet til å kjøre gap-analyse uten å forplikte seg til tilbud, og MSPCreateOfferDialog har allerede valgfri gap-vedlegg (`attachGap`) som dekker det andre tilfellet.

### Filer

- `src/components/msp/MSPMaturityServiceMatrix.tsx` — knappeblokken rundt linje 763–807.

Ingen datamodell, ruter eller andre komponenter berøres.
