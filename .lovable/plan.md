Kort ned avviklingsdialogen

Bakgrunn
--------
I dag er `RetireModuleDialog.tsx` for lang og detaljert. Brukeren må gjennom to steg, der steg 2 lister opp alle dataalternativene (last ned JSON/CSV, overfør til annen mottaker, behold til sletting) med full oversikt over moduldata. Dette skaper inntrykk av at man avvikler hele profilen, og dataeksport er egentlig ikke klar ennå.

Mål
---
Beholde tostegs-flyten, men gjøre dialogen betydelig kortere og mer vennlig. I steg 2 skal vi:
- Fortelle høflig at data-nedlasting kommer snart.
- Deaktivere/forenkle nedlastingsvalgene (JSON/CSV-knapper grået ut).
- Fjerne «Overfør til en annen mottaker»-alternativet inntil videre.
- Beholde «Behold dataene til sletting» som standardvalg.
- Tydeliggjøre at det er modulen/produktet som avvikles, ikke hele Mynder-profilen, og at faktureringen stanser fra neste periode.

Hva som skal endres
-------------------

1. `src/components/subscriptions/RetireModuleDialog.tsx`
   - Steg 1: behold grunnlagsvalg, men kort ned tekster og eventuelt redusere visuell støy.
   - Steg 2: erstatte den lange data-oversikten med en kompakt infoboks.
     - Tekst i retning av: «Du kan snart laste ned dataene dine. Inntil videre oppbevarer vi dem trygt frem til sletting.»
   - Fjerne `Overfør til en annen mottaker`-radioknapp og tilhørende e-postfelt.
   - Beholde `Behold dataene til sletting` som valgt alternativ.
   - Beholde `Last ned JSON` / `Last ned CSV`-knapper, men sette `disabled` og vise en tooltip/merketekst «Kommer snart».
   - Endre bekreftelsesteksten fra profilfokus til produktfokus: bekrefte at fakturering for produktet stanser, ikke at hele kontoen avvikles.
   - Oppdatere `dataChoice`-tilstand og `canConfirm`-logikk slik at den fortsatt fungerer uten `transfer`-valget.

2. `src/lib/moduleActivationState.ts` (valgfritt, vurderes)
   - Hvis `transfer` ikke lenger skal brukes i denne dialogen, kan `CancellationDataChoice` beholdes som den er (for bakoverkompatibilitet og for `CustomerServicesAndProductsTab.tsx`), men dialogen bruker kun `download`/`retain`.

3. Verifisering
   - Sjekke at dialogen åpnes fra `src/pages/Subscriptions.tsx` og at den nye korte teksten vises riktig.
   - Sjekke at deaktiverte knapper og tooltip vises som forventet i preview.
   - Kjøre `tsc --noEmit` for å sikre at fjerning av felter/valg ikke brekker typer.

Akseptansekriterier
-------------------
- Dialogen har fortsatt to steg, men steg 2 tar vesentlig mindre plass.
- Det finnes en vennlig, høflig infoboks som forklarer at data-nedlasting kommer snart.
- JSON/CSV-knapper er deaktiverte og merket som «Kommer snart».
- «Overfør til en annen mottaker» er fjernet fra denne dialogen.
- Det er tydelig at produktet avvikles, ikke hele profilen, og at fakturering stanser fra neste periode.
