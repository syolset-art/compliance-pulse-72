## Mål
På fanen "Alle" i partnertjenestekatalogen skal knappen **«Beskriv egen tjeneste»** fjernes og erstattes med inline-komponenten `ServiceCoverageSearch` — slik den allerede fungerer på fanen "Mine". Brukeren skal kunne skrive inn en tjeneste, få forslag til regelverk/krav, velge hvilke krav som skal med, og opprette tjenesten.

## Verifisert tilstand
- `src/components/msp/MSPServiceCatalogTab.tsx` inneholder en knapp på linje 674: `<Button ...>Beskriv egen tjeneste</Button>`.
- Samme fil importerer og bruker `ServiceCoverageSearch` på linje 917 inne i `<TabsContent value="mine">`.
- `ServiceCoverageSearch` støtter allerede valg av enkeltkrav, automatisk beskrivelse og «Opprett»-handling.

## Endringer

### 1. Fjern «Beskriv egen tjeneste»-knappen i «Alle»
- Slett knappen på linje 674–677.
- Behold Lara-wizard-CTAen (`Sparkles`-knapp/ikon) som i dag, slik at anbefalingsfunksjonen fortsatt er tilgjengelig.

### 2. Sett inn `ServiceCoverageSearch` i «Alle»-fanen
- Plasser komponenten rett under introduksjonsteksten (linje 645) og over anbefalingsbanneret / tjenestelisten.
- Bruk samme `onAdd`-mønster som på «Mine»:
  - Lag et `ExtraService`-objekt med `source: "manual"` og valgte mappings.
  - Legg til i `extras`-listen.
  - Vis toast med lenke «Vis i katalogen».
  - Bytt aktiv fane til "mine" slik at brukeren ser den nye tjenesten øverst.
- Bruk `existingNames` filtrert på brukerens egne (ikke-Mynder) tjenester for å unngå duplikater.

### 3. Juster layout og tomtilstand
- Sørg for at det er tydelig at søket på «Alle» legger tjenesten i brukerens egen katalog — tekstlige ledetraler kan beholdes fra «Mine» eller justeres lett.
- Etter opprettelse: behold fokus på opprettelsesbekreftelsen og scrolleventuelt til «Min tjenestekatalog».

## Akseptansekriterier
- [ ] «Beskriv egen tjeneste»-knappen er fjernet fra «Alle»-fanen.
- [ ] Fanen «Alle» viser `ServiceCoverageSearch` med felt, tabell over krav med avkrysningsbokser, og «Opprett»-knapp.
- [ ] Å opprette en tjeneste fra «Alle» legger den til i `extras` og åpner fanen «Mine».
- [ ] Duplikatsjekken fungerer på tvers av begge fanene.
- [ ] Lara-wizard-CTAen («La Lara foreslå tjenester» / Sparkles-ikon) forblir synlig.

## Ikke i scope
- Endre innhold eller logikk i `ServiceCoverageSearch`.
- Endre oppførselen på «Mine»-fanen.
- Fjerne eller endre `CustomServiceDialog` som knappen åpnet i dag — dialogen beholdes inntil videre (bare ikke lenket fra «Alle»-knappen).