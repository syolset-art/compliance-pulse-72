# Oppdatert arbeidsflyt-dokumentasjon + to produktendringer

Hovedleveransen er en oppdatering av `docs/plattform-arbeidsflyter.md` etter dine korrigeringer, pluss to konkrete kodeendringer du ba om (behovsanalyse uten salgspotensial, «Avvikling» → «Avslutte»).

## A. Det jeg har verifisert i koden

- **Partner → Muligheter** (`/msp-partner/muligheter`): en visning bygget på mockdata i `src/lib/partnerOpportunities.ts`. Per kunde: bransje, foreslåtte regelverk (fra offentlig register), aktiverte produkter, om kunden har overtatt Trust-profilen, og en liste «mulige oppgaver» (arbeidspakke, hvilke krav den løfter, omfang liten/middels/stor, dekkende tjeneste, rekkefølge, KI-merket, timeestimat). Formålet er å gå fra mulighet til tilbud på tre klikk. Alt er mockdata — ingen database bak.
- **Oppdag systemer** (`DiscoverSystemsDialog.tsx`): implementert, men i dag med kun to valg — **Acronis** (Lara henter enheter og backup-status via 7 Security-agenten) og **Registrer manuelt**.
- **«Koble på deg selv»** (`ConnectSourcesCallout.tsx`): en gjenbrukbar CTA som vises der data mangler, og som peker til Innstillinger → Integrasjoner. Den finnes i koden, men er en inngang uten reelle integrasjoner bak (kun Acronis).
- **Trust Center**: rutene finnes (`/trust-center/*`: profil, dokumenter, policyer, sertifiseringer, bevis, produkter, deling, `/s/:token`). Altså implementert som visning/deling — men ikke automatisk oppdatering.

## B. Endringer i dokumentet

1. **Ny seksjon: Legg til leverandør** — hele flyten fra søk/oppslag → grunndata og GDPR-rolle → kritikalitet og prioritet → Laras anbefalte innhentingsmetode → be om grunnlag / agentisk Trust Profile-invitasjon → dokumentasjon og bevis. Med kapasitetsgrensen (5 gratis, hard grense ved nr. 6).
2. **Partner → Muligheter** beskrives som over, merket som mockdata-basert.
3. **Trust Center** omskrives: formålet er å synliggjøre samlet modenhet med bevis, og publisere/dele med kunder og samarbeidspartnere. Fase 2 (ikke implementert): automatisk oppdatering drevet av en AI Compliance Agent som kontinuerlig finner mangler, dokumentasjon og tiltak. Status settes til Delvis, med usikkerhet om dagens implementasjonsgrad markert eksplisitt.
4. **Mynder Core → Core** overalt i dokumentet.
5. **Core steg 4 (RoPA)** merkes «Må kvalitetssikres av Vilde (jurist) — potensielt behov for refaktorering».
6. **Avviksregister**: rettes til at avvik **ikke** påvirker score, men gir signal og kan generere oppgaver til ansvarlig.
7. **Oppgaver** utvides med **Prosjekter**: opprett prosjekt med prosjekttype (DPIA, ROS, TIA, Revisjon, Penetrasjonstest, Systemanskaffelse, Sikkerhetsrevisjon, Annet), inviter kolleger og samarbeidspartnere på e-post for asynkront arbeid, valgfri kobling til system, start- og sluttdato, og hvem som skal godkjenne dokumentet. Status: implementert i produksjon, ikke i Lovable-prototypen; over 5 måneder gammel og trenger sluttkundetest + oppgradering.
8. **Behandlingsprotokoll**: ok, men merkes «trenger juridisk validering (Vilde)».
9. **Innstillinger**: merkes med kommende redesign fordi den nye tilgangsstyringsmodellen ikke er på plass.
10. **Avvikling → Avslutte** som begrep i hele dokumentet (og i ordlisten).
11. **Min profil**: Wiki-/kunnskapssenter settes til **Planlagt** (ikke implementert). **Mine avtaler** settes til **Ikke bekreftet**.
12. **Tverrgående flyter**: «Koble på deg selv» og «Oppdag systemer» beskrives med den faktiske koden (se A) og status justeres til Delvis / Ikke bekreftet.
13. **Partner → Behovsanalyse** omskrives: lister kundene som matcher de valgte regelverkene, slik at partneren ser hvem de kan lage tilbud til. Salgspotensial tas ut nå, og beskrives som ønsket senere (potensial ved aktivering av regelverk for alle matchende kunder).
14. **Tilgang i partnerteam** settes til **Ikke implementert**, med versjon 1 beskrevet: tilgang går via Trust Profile, og når partneren aktiverer et produkt hos kunden kan de samtidig bekrefte rollen som driftspartner. En bruker (f.eks. kundeansvarlig) kan også be om lesetilgang til en kundes profil.
15. **Acronis** beskrives som eneste integrasjonskilde i dag, med det den faktisk gir: uthenting av PC-er og mobiltelefoner hos partnerens kunde, samt backup-status.
16. **Gap-listen** oppdateres med: ny tilgangsstyringsmodell, tilgang i partnerteam, wiki-senter, «Mine avtaler» ubekreftet, Trust Center fase 2 (AI Compliance Agent + automatisk oppdatering), prosjekter i Lovable-prototypen, juridisk validering av RoPA og behandlingsprotokoll, salgspotensial i behovsanalyse, og flere integrasjonskilder utover Acronis.

## C. Kodeendringer

- **Behovsanalyse** (`src/components/msp/NeedsAnalysisWizardDialog.tsx` og tilhørende steg): fjerne salgspotensial-beregning og kronebeløp fra analyse- og kampanjesteget. Resultatet viser matchende kunder med hvilke regelverk som treffer, som grunnlag for tilbud.
- **«Avvikling» → «Avslutte»**: erstatte brukervendt tekst i produkt- og regelverksvisningene (bl.a. `RetireModuleDialog`, `RetireFrameworksDialog`, `ModuleCard`, `CustomerServicesAndProductsTab`). Kun tekst — ingen endring i logikk eller datamodell.

## D. Leveranse

Oppdatert `docs/plattform-arbeidsflyter.md` i samme markdown-struktur, klar til import i Notion.
