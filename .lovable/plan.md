# Lara foreslår tjenester — førstegangsopplevelse + rikere veiviser

## Mål
Når en partner åpner Produkter og tjenester for første gang (tom katalog), skal det være tydelig at Lara kan foreslå tjenester. Selve veiviseren blir mer fleksibel: flervalg der det gir mening, en ny "land/marked"-steg, og fritekst på fagområder.

## Endringer

### 1. Førstegangs-CTA i katalogen
Fil: `src/components/msp/MSPServiceCatalogTab.tsx`

- Detekter "tom katalog" (ingen egne `extras` og ingen adopterte maler).
- Vis et fremhevet Lara-kort øverst i katalogfanen:
  - Ikon + tittel: "La Lara sette opp tjenestekatalogen din"
  - Kort forklaring (1 setning) om hva Lara gjør basert på markeder, segmenter og fagområder.
  - Primær-knapp: "Start med Lara" → åpner `MSPLaraServiceWizard`.
  - Sekundær-lenke: "Bygg manuelt" (lukker kortet for økten).
- Når katalogen ikke lenger er tom, vises den eksisterende diskrete "Lara-forslag"-knappen som i dag.

### 2. Utvidet veiviser
Fil: `src/lib/serviceCatalog.ts` (`WIZARD_QUESTIONS`, `WizardAnswers`, `suggestServices`)

Nytt spørsmålsett (5 steg — matcher skjermbildene brukeren viste):

1. **Marked/land** (multi) — Norge, Sverige, Danmark, Finland, EU/EØS, UK, Australia, Globalt. Inkluderer "Velg alle".
2. **Kundesegmenter** (multi) — SMB, Mellomstore, Enterprise, Kritisk infrastruktur, Offentlig sektor. "Velg alle".
3. **Fagområder** (multi + fritekst) — IT-sikkerhet, Personvern/GDPR, ISO 27001, NIS2, DORA, AI Governance/AI Act, Åpenhetsloven/leverandørkjede. Inputfelt "Legg til eget fagområde" som pusher chips inn i valgene. "Velg alle".
4. **Leveransemodell** (multi, endret fra single) — Engangsprosjekt, Løpende abonnement, Managed service, Hybrid.
5. **Kundemodenhet** (multi, endret fra single, valgfri) — Lav, Middels, Høy. Merkes "Valgfritt" og kan hoppes over uten å blokkere "Vis forslag".

Datamodell:
```ts
type WizardAnswers = {
  markets: string[];
  segments: string[];
  domains: string[];           // inkl. fritekst
  customDomains: string[];     // egen liste for scoring/visning
  models: string[];
  maturity: string[];          // valgfri
};
```

`suggestServices()` oppdateres: skårer maler mot tags for markets/segments/domains/models; maturity nedvekter kun når satt; ukjente fritekst-fagområder brukes til å søke etter navn/beskrivelse på tvers av `PARTNER_SERVICES` + `SUGGESTION_TEMPLATES` og markeres med "matchet på fritekst".

### 3. UI-oppdateringer i veiviseren
Fil: `src/components/msp/MSPLaraServiceWizard.tsx`

- Støtte for `multi: true` på alle steg (er allerede der, men "Velg alle"-toggle må inn).
- Ny "Velg alle / Fjern alle"-liten lenke over chips-listen når `multi`.
- Nytt `input`-felt under chips når spørsmålet har `allowFreeText: true` (fagområder). Enter/komma legger til chip; chips kan fjernes.
- Valgfri-modus: hvis `optional: true`, tillat "Vis forslag" uten svar; vis tekst "Valgfritt — hopp over hvis usikker".
- Progress-baren skalerer til 5 steg (kommer gratis fra `WIZARD_QUESTIONS.length`).

### 4. Ingen backend-endringer
Alt er klient-side/prototype. Ingen migrasjoner, ingen edge functions.

## Ikke i scope
- Kobling til reell kundeportefølje / gap-analyse (diskutert tidligere, kan komme som eget steg).
- Persistering av wizard-svar (holdes i minne som i dag).

## Akseptansekriterier
- Tom katalog viser Lara-CTA øverst; forsvinner så snart første tjeneste er lagt til.
- Veiviseren har 5 steg med markeder først.
- Fagområder tillater fritekst-chips i tillegg til presets.
- Leveransemodell og modenhet støtter flervalg; modenhet kan hoppes over.
- "Velg alle" fungerer på alle multi-steg.
- `suggestServices` returnerer relevante forslag også når kun fritekst-fagområder er valgt.
