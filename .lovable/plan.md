

## Plan: Forenkle faser og utfall for leverandøraktiviteter

### Bakgrunn
Dagens prototype bruker 4 faser (Onboarding, Løpende oppfølging, Revisjon, Hendelseshåndtering) + et eget "outcome"-felt. Dette er to dimensjoner brukeren må forstå samtidig — for komplekst. Helseforetak, banker og andre regulerte virksomheter (DORA, NIS2, ISO 27036) bruker i praksis en livssyklus-modell for tredjepartsstyring, men de trenger ikke se hele rammeverket i en enkel aktivitetslogg.

### Anbefaling: To dimensjoner, men forenklet

**Dimensjon 1 — FASE (hvor i livssyklusen):** beholdes, men språket forenkles og utvides med én manglende fase.

| Fase | Forklaring | Når brukes |
|---|---|---|
| Vurdering før avtale | Due diligence, risikovurdering før kontrakt | Ny leverandør under evaluering |
| Onboarding | Avtale signert, oppstart, dokumentinnhenting | Aktiv onboarding |
| Løpende oppfølging | Periodisk dialog, KPI, statusmøter | Daglig drift |
| Revisjon og kontroll | Audit, stikkprøver, samsvarsgjennomgang | Årlig/planlagt kontroll |
| Hendelse og avvik | Sikkerhetshendelse, brudd, eskalering | Når noe har skjedd |
| Avslutning | Offboarding, terminering, dataoverføring | Avtale avsluttes |

Dette er språket DSB, Finanstilsynet og Helsedirektoratet faktisk bruker — gjenkjennelig for både helseforetak og banker.

**Dimensjon 2 — STATUS (forenklet fra "outcome"):** byttes fra dagens 5–6 utfallsverdier til 3 enkle statuser:

| Status | Betydning |
|---|---|
| Pågår | Aktiviteten er startet, ikke ferdig |
| Fullført | Avsluttet uten anmerkninger |
| Krever oppfølging | Avsluttet, men noe må følges opp (avvik, action) |

Dette dekker behovet — brukeren slipper å velge mellom "godkjent / ikke godkjent / utsatt / avvist / under behandling" osv.

### Hvorfor ikke kun status (uten fase)?
Du foreslo "startet / pågår / ferdig" alene. Problemet: en revisor og en innkjøper trenger å vite *hva slags* aktivitet det er — ikke bare at den pågår. "Møte med leverandør" sier lite uten kontekst om det er onboarding eller hendelseshåndtering. Fasen gir den konteksten på ett blikk og er det DORA art. 28 og NIS2 art. 21 forventer dokumentert.

### Endringer i koden

**1. `src/utils/vendorActivityData.ts`**
- Utvid `phase`-typen med `pre_assessment` og `termination`
- Oppdater `PHASE_CONFIG` med nye labels (NB/EN) og farger
- Erstatt `outcomeStatus` enum med 3 verdier: `in_progress`, `completed`, `needs_followup`
- Oppdater `OUTCOME_COLORS`
- Oppdater eksisterende seed-data til å bruke nye statuser

**2. `src/components/asset-profile/ActivityDetailPanel.tsx`**
- Bruk nye labels via `PHASE_CONFIG`
- Vis ny status-pill med ikon (Clock / CheckCircle2 / AlertCircle)

**3. Aktivitet-opprettelse / filtrering** (tidsline-komponenter som filtrerer på fase)
- Søk opp komponenter som refererer til gamle outcome-verdier og oppdater dropdown-valg + filterlogikk

**4. Tooltip / hjelp**
- Legg til kort tooltip på fase-velgeren: "Hvor i leverandørens livssyklus er denne aktiviteten?"
- Tooltip på status: "Hva er resultatet av aktiviteten så langt?"

### Migrering av demo-data
Mapping av gamle outcome-verdier:
- `approved`, `passed`, `closed` → `completed`
- `pending`, `in_review` → `in_progress`
- `failed`, `escalated`, `action_required` → `needs_followup`

### Ut av scope
- Backend-skjema (kun prototype-data i `vendorActivityData.ts`)
- Lokalisering utover NB/EN
- Endringer i selve aktivitetstype-katalogen (e-post, møte, dokument osv.)

