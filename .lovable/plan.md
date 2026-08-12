# Forenklet, agentisk «Legg til system»

Dagens flyt er en 6-stegs veiviser (søk → bekreft → leverandør → kategori → risiko → kontakt) med progresjonslinje. Den oppleves som et skjema. Ny flyt: én skjerm der Lara gjør jobben og brukeren bekrefter.

## Ny flyt (2 steg)

```text
[1] Hva heter systemet?         [2] Laras utkast
 ┌──────────────────────────┐    ┌───────────────────────────────┐
 │ Skriv navn eller lim URL │ →  │ Slack — Slack Technologies    │
 │ (forslag mens du skriver)│    │ Kategori · Leveranse · Rolle  │
 └──────────────────────────┘    │ Kritikalitet · Persondata     │
   Lara jobber… (3 linjer)       │ Leverandør: kobles automatisk │
                                 │ [Lagre system] [Vis detaljer] │
                                 └───────────────────────────────┘
```

- **Steg 1 – Ett felt.** Navn eller URL. Bibliotek-treff og nettsøk vises som forslag under feltet. Ingen stegtelling, ingen progresjonslinje.
- **Laras arbeid vises, ikke skjules.** Kort agentisk statuslinje mens den henter: «Finner leverandør… Klassifiserer… Vurderer persondata…».
- **Steg 2 – Ett bekreftelseskort.** Alt Lara har utledet vises som redigerbare chips/pills på én flate: leverandør, kategori, leveransemodell, leverandørrolle, kritikalitet, persondata. Hver verdi har Lara-ikon og kort begrunnelse ved hover.
- **Én knapp lagrer.** «Lagre system» er alltid tilgjengelig — brukeren trenger ikke røre noe.
- **Detaljer er valgfrie.** «Vis detaljer» folder ut kontaktperson, beskrivelse og fritekst. Ikke egne steg.
- **Leverandørkobling** skjer i bakgrunnen: eksakt treff kobles automatisk (vises som chip med «endre»); usikkert treff vises som ett valg i kortet, ikke som eget steg.

## Kapasitet og nivå

Uendret: når grensen for aktivt nivå er nådd, åpnes nivåvelger + vilkår før dialogen (samme komponenter som Innstillinger > Produkter).

## Teknisk

- `src/components/dialogs/AddSystemDialog.tsx` reduseres fra `WizardStep`-maskinen (6 steg) til to tilstander: `input` og `review`. Eksisterende søk, AI-forslag (`useVendorMatch`, kategori-forslag) og lagringslogikk gjenbrukes uendret — kun presentasjon og rekkefølge endres.
- `VendorLinkStep` brukes ikke lenger som eget steg; matchresultatet rendres som en rad i bekreftelseskortet (filen beholdes inntil videre).
- Nytt lite delkomponent `LaraDraftCard` i samme mappe for chip-raden med begrunnelser.
- Ingen endring i database, felter eller lagret payload; standardverdier settes fra Laras forslag som i dag.
- Norsk/engelsk tekst via samme `isNb`-mønster som i dag.
