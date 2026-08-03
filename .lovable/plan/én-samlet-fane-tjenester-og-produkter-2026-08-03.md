# Én samlet fane: Tjenester og produkter

Fanen «Tjenester og produkter» på kundekortet bygges om til tre tydelige seksjoner: **Aktivert**, **Anbefalt**, og **Pågående oppdrag**. I dag viser fanen aktivert-oversikt, tilbud og en lang liste med alt som kan tilbys — det gir ingen prioritering og skjuler oppdrag som er i gang (de ligger i en egen «Leveranser»-fane).

## Slik blir fanen

```text
Tjenester og produkter
├── Aktivert hos kunden        moduler, regelverk, aktive tjenester + status
├── Pågående oppdrag           leveranser i arbeid + tilbud (utkast/sendt)
└── Anbefalt for økt modenhet  Lara-rangerte tjenester/produkter med begrunnelse
```

### 1. Aktivert hos kunden
Beholdes som i dag: moduler med livssyklus-status (Aktiv / Sagt opp — aktiv til dato), aktive regelverk og leverte/aktive tjenester. Kompakte rader med statuspiller.

### 2. Pågående oppdrag
Ny seksjon som samler alt som er i bevegelse:
- Leveranser under arbeid med fremdrift (antall aktiviteter fullført) og neste steg
- Tilbud med status Utkast og Sendt
- Klikk åpner eksisterende leveranse-arbeidsflate

«Leveranser»-fanen beholdes for detaljert oppfølging; denne seksjonen er inngangen til den.

### 3. Anbefalt for økt modenhet
Erstatter dagens flate «Tilgjengelig å tilby»-liste:
- Topp anbefalinger rangert etter modenhetsgap, hver med kort begrunnelse (hvilket kontrollområde/krav den løser) og estimert salgspotensial
- Produkter (moduler/regelverk som bør aktiveres) og tjenester vises i samme liste, merket med type
- Alt øvrig ligger bak «Vis alle tilgjengelige» slik at listen holdes kort

## Teknisk

- `src/components/msp/CustomerServicesAndProductsTab.tsx` restruktureres til de tre seksjonene.
- Pågående oppdrag: gjenbruk av `useCustomerOffers` (utkast/sendt) og leveransedata som allerede driver `OngoingDeliveriesList.tsx`; ingen ny datamodell.
- Anbefalinger: gjenbruk av rangeringen i `src/lib/maturityNextActions.ts` og tjenestematchingen i `MSPMaturityServiceMatrix.tsx`, pakket inn i en ny kompakt liste-komponent.
- Ingen databaseendringer. Norske labels følger eksisterende i18n-mønster.
