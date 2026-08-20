# Kortere Sara-nedlasting overalt

Dialogen som forklarer nedlasting av Sara (`SaraOnboardingDialog`) brukes syv steder: Avvik, Datakilder og agenter, leverandørdokumentasjon, regelverkskrav, aktivitetsteaser, dokumentasjonsbevis og dokumentknappene. I dag viser den seks steg, kravpakke, tillitsgrense, fire fordeler, en «gjør aldri»-liste og en kjøreplan-boks. Det er for mye.

## Hva som endres

**1. Dialogen blir kort og handlingsrettet**
- Én linje som sier hva Sara gjør (leser dokumentasjon lokalt, sender kun bekreftelse).
- Tre steg i stedet for seks: Last ned og installer lokalt → Koble til Notion → Kjør og godkjenn funn.
- Én rolig linje om tillitsgrense: «Dokumentene forblir hos deg. Kun metadata og bekreftelse sendes til Mynder.»
- Knapper: Last ned Sara (primær) + «Les mer om Sara» som lenker til Innstillinger → Datakilder og agenter.
- Alt annet fjernes fra dialogen: kravpakken, fordelsliste, «gjør aldri»-liste, kjøreplan-boks, beta-badge-støy.

**2. Detaljene flyttes til Datakilder og agenter**
På `Integrations`-siden, under Sara-kortet, legges én seksjon «Slik fungerer Sara» med sammenleggbare blokker:
- Tillitsgrense: hva som blir hos kunden vs. hva som sendes.
- Kravpakken Sara vurderer (gjenbruk av `SaraRequirementPackage`).
- Hva Sara aldri gjør.
- Kjøreplan (manuell start i v1).

Standard er lukket, så siden ser ryddig ut.

**3. Ingen endringer i logikk**
Samme dialog-komponent brukes alle sju steder, så kuttet slår igjennom overalt uten å røre kallstedene.

## Teknisk

- `src/components/agents/SaraOnboardingDialog.tsx`: skrives om til kompakt versjon (~80 linjer), `max-w-md`, ingen scroll. «Les mer»-knappen navigerer til `/innstillinger/integrasjoner` (samme rute som Datakilder og agenter) og lukker dialogen.
- `src/pages/Integrations.tsx`: ny seksjon «Slik fungerer Sara» med `Accordion`/`Collapsible` som inneholder innholdet som fjernes fra dialogen.
- `src/components/agents/SaraRequirementPackage.tsx`: beholdes, brukes nå kun på Integrasjoner-siden.
- Nye/omdøpte i18n-nøkler under `saraOnboarding.*` i `src/locales/nb.json` og `en.json`; ubrukte nøkler flyttes til en `saraDetails.*`-gruppe for Integrasjoner-siden.
