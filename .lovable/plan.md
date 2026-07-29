
## Mål

Gjøre «Regelverk anbefalt for denne kunden» til en handlingsrettet tabell som viser anbefalte tjenester per regelverk, lar partneren aktivere et regelverk (med bekreftelse på at kunden har godkjent), og speiler aktiveringen inn i Produkter-fanen der samme regelverk kan avvikles eller utvides.

## Endringer

### 1. `RegulationsStatusCard.tsx` — utvid tabellen

Legg til to nye kolonner slik at tabellen har:

```text
| Regelverk | Anbefalte tjenester | Status | Handling |
```

- **Regelverk**: navn + AI-anbefalt/Bekreftet/Aktivert badge + kort begrunnelse (som i dag).
- **Anbefalte tjenester**: opptil 3 chips hentet via `PARTNER_SERVICES` og `SERVICE_LIBRARY` filtrert på `frameworkId`. Chips med solid fyll = allerede i partnerens katalog, chips med stiplet ramme = Mynder-forslag. «+N flere» hvis flere enn 3. Tom celle håndteres med subtil «Ingen tjenester koblet».
- **Status**: viser om regelverket er `AI-anbefalt`, `Bekreftet` eller `Aktivert hos kunden` (sistnevnte hvis id finnes i `activeFrameworkIds`).
- **Handling**:
  - Ikke bekreftet → `Bekreft` (som i dag).
  - Bekreftet men ikke aktivert → `Aktiver` (primær) som åpner `ActivateRegulationDialog`.
  - Aktivert → sekundær lenke `Se i Produkter` som scroller/navigerer til Produkter-fanen og markerer regelverk-modulen.

Ny prop `activeFrameworkIds: string[]` og `onActivate(frameworkId): void` sendes inn fra `MSPCustomerDetail.tsx`.

### 2. Ny `ActivateRegulationDialog.tsx` (i `src/components/msp/guidance/`)

Enkel bekreftelsesdialog før aktivering:

- Tittel: «Aktiver {regelverk} for {kunde}»
- Kort forklaring: aktivering legger regelverket i Produkter-fanen, starter fakturering (836 kr/mnd demo-pris) og gjør kravene tilgjengelige for kunden.
- Liste over anbefalte tjenester som allerede er i katalogen (kan hukes av for å inkluderes i tilbudet — visuelt kun i denne omgang).
- Obligatorisk checkbox: **«Jeg bekrefter at kunden har godkjent aktivering av dette regelverket.»** — Aktiver-knappen er disabled til huket av.
- Ved bekreftelse: kaller `handleToggleFramework(frameworkId, false)` (samme mutasjon som Produkter-fanen bruker) via callback, viser toast «{regelverk} aktivert i Produkter».

### 3. `MSPCustomerDetail.tsx` — koble sammen

- Hent `activeFrameworkIds` (allerede tilgjengelig) og send til `RegulationsStatusCard`.
- Implementer `onActivate` som åpner dialogen; ved bekreftelse gjør samme Supabase-oppdatering av `active_frameworks` som `CustomerModulesTab` bruker (delt hjelper i samme fil eller inline).
- `Se i Produkter`-lenken bytter til Produkter-tab (`setActiveTab("modules")`) og setter en `highlightedModule="regulations"` state.

### 4. `CustomerModulesTab.tsx` — speilkobling

- Ta imot valgfri `highlightedModule?: string` og legg en kort ring/glow på tilhørende kort i 2 sekunder.
- «Regelverk»-kortet viser allerede antall aktive regelverk; ingen strukturendring, men:
  - `secondaryAction`: legg til «Avvikle regelverk» som åpner `EditActiveFrameworksDialog` i «avvikle»-modus (samme dialog, bare fokus på huk av).
  - Primær `Endre regelverk` beholdes — brukes for å utvide til flere regelverk.
- Ingen prisendring/logikk-endring utover det.

### 5. Ingen DB-endringer

`active_frameworks` på `msp_customers` brukes allerede av begge fanene — mutasjonen deles.

## Teknisk

- Filer opprettet: `src/components/msp/guidance/ActivateRegulationDialog.tsx`.
- Filer endret: `RegulationsStatusCard.tsx`, `MSPCustomerDetail.tsx`, `CustomerModulesTab.tsx`.
- Oversettelser: legges til under `regulationsCard.*` og `activateRegulation.*` i `nb.json`/`en.json`.
- Ingen nye avhengigheter.

## Ute av scope

- Faktisk fakturaflyt / Stripe.
- E-post til kunde med bekreftelseslogg.
- Historikk over hvem som aktiverte når (kan komme senere som `regulation_activations`-tabell).
