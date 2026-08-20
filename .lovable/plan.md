# Timeleveranse per regelverk i Produkter og tjenester

På /msp-services skal partneren kunne åpne et regelverk, se **alle oppgaver** som må gjøres for å dekke alle punkter i regelverket, redigere eller fjerne oppgaver, og få foreslåtte timer og pris basert på timeprisen som allerede er satt i innstillingene.

## Ny arkfane: Regelverk

Ved siden av «Mine» og «Alle» kommer en tredje fane **Regelverk**.

- Liste over regelverk (GDPR, ISO 27001, AI Act, NIS2 osv.) med antall krav, antall oppgaver, totale timer og total pris.
- Klikk på et regelverk åpner en detaljvisning (panel til høyre) med hele oppgavepakken.

## Oppgavepakken for et regelverk

Oppgavene grupperes på kontrollområde/kategori, og hver rad viser:

- Oppgavenavn (f.eks. «Protokoll over behandlingsaktiviteter (ROPA)»)
- Hvilket krav / artikkel den dekker
- Oppgavetype: Rådgivning, Teknisk leveranse, Dokumentasjon eller AI-utkast (Lara kan lage førsteutkast)
- Foreslåtte timer (min–maks) og pris beregnet fra partnerens timepris
- Rediger og Fjern

Handlinger:

- **Rediger**: endre navn, type, timer og eventuell fast pris.
- **Fjern**: tar oppgaven ut av pakken (kan angres via «Nullstill til forslag»).
- **Legg til egen oppgave**: fritekst med type og timer.
- **Velg/velg bort** oppgaver med avkrysning — summen oppdateres løpende.

Nederst en oppsummeringslinje: «X oppgaver · Y–Z timer · pris fra timepris NNN kr» med to knapper:

- **Lagre som tjeneste** — legger pakken inn i «Mine» som en regelverkstjeneste med timer og pris.
- **Bruk i tilbud** — samme pakke som utgangspunkt for et kundetilbud.

Endringene lagres per partner (lokalt, samme mønster som resten av tjenestekatalogen), slik at pakken beholdes mellom besøk.

## Hvor timene og prisene kommer fra

Timeforslagene er allerede definert i plattformen (`documentDeliverables.ts`) som timespenn per dokumenttype, f.eks. ROPA 4–8 t, DPIA 6–12 t, pentest 12–30 t. Pris = timer × timepris fra Innstillinger, avrundet. Partneren kan alltid overstyre både timer og pris.

## Teknisk

- Ny komponent `src/components/msp/MSPFrameworkHoursTab.tsx` (liste) + `MSPFrameworkTaskPackageSheet.tsx` (detalj/redigering), registrert som ny fane i `MSPServiceCatalogTab.tsx`.
- Oppgavegenerering i ny ren modul `src/lib/frameworkTaskPackage.ts`:
  - krav hentes fra `compliance_requirements` (`framework_id`, `requirement_id`, `name_no`, `category`) via Supabase,
  - dokument-/tiltaksnavn per krav fra `requirementDocumentationHints.ts`,
  - type, timespenn og notat fra `getDeliverableProfile()` i `documentDeliverables.ts`,
  - pris via `estimateDocumentPrice()` og `formatPriceRange()`.
- Timepris og valuta fra eksisterende `useServiceDefaults()`.
- Overstyringer (redigert/fjernet/egendefinert) lagres i localStorage per regelverk, med «Nullstill til forslag».
- Lagring som tjeneste gjenbruker eksisterende `extras`-flyt i `MSPServiceCatalogTab.tsx` (navn, timer, pris, regelverkskobling).
- Regelverk uten krav i databasen vises med tomtilstand og lenke til å legge til egne oppgaver.

## Utenfor scope

- Endring av prismodell eller provisjonslogikk for Mynder-produkter.
- Automatisk AI-generering av nye oppgaver utover eksisterende dokument-hint.
