# Plan: Leveranse-sjekklister + Tjenestekatalog

## Bakgrunn
På arkfanen "Leveranser" (i `MSPMaturityServiceMatrix`) er Awareness-program og Penetrasjonstest i dag bare statiske kort med fremdriftsbar. Partneren trenger å kunne huke av faktiske leveransepunkter. Tjenestene er partnerens egne (ikke Mynders regelverk), og bør derfor defineres ett sted — en ny **Tjenestekatalog** — der partner også ser hvilke regelverk-kontroller hver tjeneste treffer.

## Endringer

### 1. Sjekkliste på hvert leveranse-kort (Awareness, Pen-test, …)
I `src/components/msp/MSPMaturityServiceMatrix.tsx`:
- Utvid `DeliveryItem` med `serviceId` (peker til en tjeneste i katalogen) og `checklist: { id, label, done, doneAt? }[]`.
- Awareness-program får punkter som: "Kick-off med kunde", "Phishing-simulering Q1", "E-læringsmodul utrullet", "Rapport sendt", "Oppfølgingsmøte".
- Penetrasjonstest får: "Scoping", "Test gjennomført", "Rapport levert", "Re-test av funn", "Sluttmøte".
- Klikk på et leveransekort utvider det (samme mønster som "Pågående") og viser sjekklisten med `Checkbox`. Fremdriftsprosent regnes ut fra avhukede punkter (erstatter dagens hardkodede `progress`).
- Status-badge skifter automatisk fra "Aktiv" til "Levert" når alle punkter er huket av.

### 2. Ny arkfane "Tjenestekatalog"
Legges til i samme `Tabs`-rad (ved siden av Anbefalt / Pågående / Leveranser):
- Ny fil `src/lib/serviceCatalog.ts` med type `PartnerService { id, name, description, defaultChecklist: string[], frameworkMappings: { frameworkId, frameworkLabel, controlIds: string[] }[] }` og 3–4 demo-tjenester (Awareness-program, Penetrasjonstest, ISO-klargjøring, AI Governance).
- Ny komponent `MSPServiceCatalogTab.tsx`:
  - Liste over partnerens tjenester (kort).
  - Hver tjeneste viser: navn, beskrivelse, antall sjekklistepunkter, og **pills** for regelverk den treffer (f.eks. "ISO 27001 · 4 kontroller", "NIS2 · 2 kontroller").
  - Knapp "Legg til tjeneste" (åpner enkel inline-form: navn, beskrivelse, sjekklistepunkter, velg rammeverk-kontroller).
  - Knapp "Rediger" på hver tjeneste.
- Tekstforklaring øverst: "Mynder leverer regelverkene. Du legger inn dine egne tjenester her, og Lara viser hvordan de treffer kontrollpunkter på tvers av ISO 27001, NIS2, AI Act m.fl."

### 3. Kobling katalog ↔ leveranse
- `DeliveryItem.serviceId` peker inn i katalogen, slik at sjekkliste-malen og rammeverk-kontrollene arves derfra.
- I sjekklisten på leveransekortet vises en liten regelverks-pill ved siden av tittelen (samme som på "Pågående") som lenker til kontrollene.

## Tekniske detaljer
- Frontend-only / demo-state (`useState`) — ingen DB-endringer i denne iterasjonen.
- Følger eksisterende design-tokens: `Card`, `Badge`, `Checkbox`, `Tabs`, semantiske farger (`text-success`, `text-warning`, `text-destructive`).
- Norsk tekst gjennomgående (memoryregel: i18next-nøkler er ok å droppe i ren demo-UI lik resten av filen).

## Filer
- Endre: `src/components/msp/MSPMaturityServiceMatrix.tsx`
- Ny: `src/components/msp/MSPServiceCatalogTab.tsx`
- Ny: `src/lib/serviceCatalog.ts`

## Utenfor scope
- Persistens i database
- Faktisk Lara-evaluering av hvor godt en tjeneste dekker en kontroll (vises som statisk antall nå)
- Endringer i `MSPCreateOfferDialog`
