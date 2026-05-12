## Mål

Når partneren åpner **Tjenester** for første gang, skal Lara starte en kort guidet samtale (3–4 spørsmål) og foreslå en skreddersydd tjenestepakke. Partneren kan så **velge**, **tilpasse** eller **lage egne** tjenester. Etter første gangs oppsett vises katalogen som i dag, men med en knapp «Kjør Lara på nytt».

## Brukerflyt

```text
Første besøk (tom katalog)
  └─ Lara-velkomstkort (full bredde)
       └─ "Kom i gang" → Lara-veiviser (4 steg)
            1. Hvilke kundesegmenter? (SMB, mellomstore, kritisk infra, offentlig)
            2. Hvilke fagområder leverer dere? (Sikkerhet, GDPR, ISO, AI, NIS2, kvalitet)
            3. Leveransemodell (engangsprosjekt / løpende abonnement / hybrid)
            4. Modenhetsnivå hos typisk kunde (lav / middels / høy)
       └─ Lara genererer 5–8 forslag → vises som valgbare kort
            – Hver kort: navn, kort beskrivelse, 3 sjekkpunkter (forhåndsvisning),
              regelverks-pills, "Velg" + "Tilpass"
       └─ "Legg til valgte" → tjenester havner i katalogen
       └─ "Lag egen tjeneste fra bunnen" lenke nederst

Etter første besøk (katalog med tjenester)
  └─ Vanlig katalog-visning (som i dag)
  └─ Knapp øverst: "Lara: foreslå flere tjenester" (kjører veiviseren igjen)
```

## Endringer

### Ny komponent: `MSPLaraServiceWizard.tsx`
- 4-stegs dialog/inline-flow med Lara-branding (Sparkles-ikon, primary-farger).
- Steg vises som kort med chip-/pill-valg (multi-select for steg 1–2, single for 3–4).
- "Tilbake" / "Neste" / "Hopp over og bygg selv".
- Avsluttende loading-state ("Lara skreddersyr forslag …") før resultat.
- Kjørt på `/msp-services` første gang (tom katalog) eller fra knapp.

### Ny komponent: `MSPLaraServiceSuggestions.tsx`
- Viser 5–8 genererte tjenestekort.
- Hvert kort: navn, beskrivelse, sjekkpunkt-preview, regelverks-pills.
- Toggle "Velg" (Checkbox-stil) + "Tilpass" (åpner eksisterende `ServiceForm`-mønster inline).
- Footer: «Legg til valgte (n)» primær-knapp + «Avbryt».

### Utvidelse: `src/lib/serviceCatalog.ts`
- Legg til `SUGGESTION_TEMPLATES: PartnerService[]` (10–12 maler dekkende sikkerhet, GDPR, ISO, AI, NIS2, kvalitet, drift).
- Legg til regelbasert `suggestServices(answers)` som filtrerer maler basert på svarene (ren TS, ingen AI-call i denne iterasjonen — Lara-merkevaren brukes som UI-grep).
- Eksponer `WIZARD_QUESTIONS` med spørsmål + alternativer for å holde data atskilt fra UI.

### Endre: `MSPServiceCatalogTab.tsx`
- Hvis `services.length === 0` og veiviseren ikke er fullført → vis Lara-velkomstkort + auto-åpne veiviseren.
- Hvis `services.length > 0` → vis dagens katalog + ny knapp «Lara: foreslå flere tjenester» ved siden av «Ny tjeneste».
- Behold eksisterende «Ny tjeneste»-flyt uendret.

### Endre: `MSPServiceCatalog.tsx` (sidewrapper)
- Ingen funksjonelle endringer; tab-komponenten håndterer selv første-gangs-flyt.

## Tekniske detaljer

- **State**: kun lokal `useState` i denne iterasjonen (matcher dagens demo-mønster). En `useState<boolean>` for «wizard ferdig» persisteres ikke — neste iterasjon kan flytte til DB.
- **Forslagslogikk** (eksempel):
  - Segment «kritisk infra» eller fagområde «NIS2» → push «NIS2-klargjøring», «Hendelseshåndtering».
  - Fagområde «AI» → push «AI Governance-rammeverk», «AI-risikovurdering».
  - Modell «løpende abonnement» → push «Awareness-program», «SOC-as-a-Service».
- **Design**: Apple-minimal, `bg-primary/5` Lara-kort, deep purple primær. Bruker eksisterende `Card`, `Badge`, `Checkbox`, `Button`, `Dialog`/inline. Ingen nye design-tokens.
- **i18n**: Dropper i18n-nøkler i denne demo-flyten (matcher resten av MSP-filene).
- **Ingen DB-endringer**, ingen edge functions. Ingen bruk av Lovable AI Gateway nå — Lara-personligheten vises gjennom kopi og ikon, mens forslagene er deterministiske maler. (Kan oppgraderes til ekte AI-call senere uten å endre UI-kontrakten.)

## Filer

- Ny: `src/components/msp/MSPLaraServiceWizard.tsx`
- Ny: `src/components/msp/MSPLaraServiceSuggestions.tsx`
- Endre: `src/lib/serviceCatalog.ts` (legge til maler + suggest-funksjon + spørsmål)
- Endre: `src/components/msp/MSPServiceCatalogTab.tsx` (første-gangs-flyt + ny knapp)

## Utenfor scope

- Persistens i database (lagres kun i komponentstate).
- Ekte AI-kall via Lovable AI Gateway (kan kobles på senere; UI-kontrakten er kompatibel).
- Endringer i kunde-detaljvisningens «Tjenester»-fane.
- Endringer i `MSPCreateOfferDialog` eller leveransekortene.
