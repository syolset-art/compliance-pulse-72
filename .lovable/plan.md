
## Mål

En MSP/MSSP skal kunne legge til en kunde på under 30 sekunder. Compliance-kartleggingen (15 spørsmål) skal ikke ligge i onboarding — den flyttes til kundens profil og gjøres når partneren har tid. I stedet skal Lara automatisk foreslå **regelverk** og **matchende tjenester** basert på land, bransje og virksomhetsbeskrivelse. Høy konfidens = anvendt automatisk. Middels/lav = merket "Anbefalt" og krever ett klikk for å bekrefte.

## Ny "Legg til kunde"-flyt (3 steg)

```text
1. Identifiser        2. Bekreft         3. Ferdig
   ─────────────      ──────────         ────────
   Søk org.nr /       Navn, land,        Kunde opprettet
   nettside /         bransje, e-post    + Laras forslag
   manuelt            til kontakt        vises inline
```

Alt annet (kartlegging, gap-analyse, tjenestevalg) skjer **etter** at kunden er opprettet, på kundens profil.

### Steg 1 — Identifiser
En input. Partneren limer inn org.nr, domene eller kundenavn. Under: liten "Legg til manuelt"-lenke.

### Steg 2 — Bekreft
Auto-utfylt kort: navn, land, bransje (NACE), størrelse, kort virksomhetsbeskrivelse (fra Brønnøysund/nettside via eksisterende enrichment). Ett e-post-felt + rolle for hovedkontakt. Bruker kan redigere alle felt.

### Steg 3 — Ferdig
Kunden opprettes umiddelbart. Dialogen viser et lite oppsummeringspanel:

- **Regelverk som gjelder** (auto-anvendt, høy konfidens) — små pills med hake
- **Anbefalt å vurdere** (middels konfidens) — pills med stjerne, ett klikk for å bekrefte/avvise
- **Tjenester du sannsynligvis leverer** — matchet mot partnerens egen tjenestekatalog, samme konfidens-logikk

Knapper: "Åpne kunde" (primær) og "Legg til én til".

## Laras anbefalingsmotor

Ren regelbasert scoring — ingen ekstra AI-kall i onboarding, kjøres synkront på klienten basert på allerede-hentet data.

**Input:** `country`, `industryCode` (NACE), `employeeCount`, `businessDescription`, `hasEuCustomers` (utledet), `sector` (utledet: offentlig/finans/helse/kritisk infra).

**Output per regelverk:**
```ts
{ frameworkId: string; confidence: "high" | "medium" | "low"; reason: string }
```

**Regler (eksempler):**
- `country === "NO"` → GDPR **high**, Personopplysningsloven **high**
- NACE i {64, 65, 66} (finans) → DORA **high**, NIS2 **high**
- NACE i {86, 87} (helse) → Normen **high**, GDPR art. 9 **high**
- Kritisk infra (energi, transport, vann) → NIS2 **high**, Sikkerhetsloven **medium**
- `employeeCount > 50` OG EU-eksponering → NIS2 **medium**
- Behandler kortdata (nøkkelord i beskrivelse) → PCI-DSS **medium**
- Default fallback: ISO 27001 **low** (som "vurder")

**Tjeneste-matching:** Kryssreferer anbefalte regelverk mot partnerens tjenestekatalog (`controlIds` per tjeneste finnes allerede). Tjenester som dekker ≥1 krav fra et high-confidence regelverk vises som "Sannsynlig match".

## UI-prinsipper

- Én dialog, tre steg, samme visuelle stil som eksisterende `AddMSPCustomerDialog` (progress-dots øverst)
- Ingen kartleggingsspørsmål i onboarding
- Konfidens vises kun med ikon (hake = auto, stjerne = anbefalt), ikke prosenttall
- Anbefalinger er alltid reversible fra kundens profil
- Ingen ekstra forklaringstekst — tooltip ved hover forklarer "hvorfor"

## Compliance-kartlegging (flyttes)

De 15 spørsmålene fra bildet legges som et eget kort på kundens **Veiledning**-fane: "Bekreft compliance-status (0/15)". Åpnes i sidepanel. Ikke blokkerende. Svar overstyrer Laras auto-antakelser der de finnes.

---

## Teknisk

**Nye filer:**
- `src/lib/regulationRecommender.ts` — ren funksjon `recommendFrameworks(input) → Recommendation[]`. Rulesett i samme fil, dokumentert per regel.
- `src/lib/serviceMatcher.ts` — matcher anbefalte regelverk mot partnerens `savedServices` via eksisterende `controlIds`.
- `src/components/msp/CustomerRecommendationsPanel.tsx` — visning av regelverk-pills + tjeneste-pills med bekreft/avvis.
- `src/components/msp/customer-compliance/ComplianceMappingSheet.tsx` — flyttet innhold fra dagens `MSPAssessmentStep` (de 15 spørsmålene), åpnes fra Veiledning.

**Endrede filer:**
- `src/components/msp/AddMSPCustomerDialog.tsx` — reduseres kraftig. `Step`-union kortes til `"identify" | "confirm" | "done"` (behold `bulk`/`acronis` som separate innganger). Fjern `assessment` og `gap` fra hovedflyten.
- `src/pages/MSPCustomerDetail.tsx` — Veiledning-fanen får nytt "Compliance-kartlegging (0/15)"-kort som åpner sheeten. Kundens header viser Laras auto-anvendte regelverk.
- `src/components/msp/CustomerStatusBanner.tsx` — vis "Regelverk (N)" som chip-liste med ikon for auto vs. anbefalt.

**Data:**
- Lagre anbefalinger på kunde-raden i `msp_customers`: `recommended_frameworks jsonb`, `confirmed_frameworks jsonb`. Migrasjon med GRANT + RLS lik eksisterende policyer.
- Ingen endring i eksisterende `MSPAssessmentStep` — den gjenbrukes inne i sheeten.

**Ikke i scope:**
- Ingen endring i `MSPGapAnalysisStep`, `MSPServiceCatalog`, produktside eller sidebar.
- Ingen ny AI-gateway-integrasjon — anbefalingene er regelbaserte for å holde onboarding rask og gratis.

