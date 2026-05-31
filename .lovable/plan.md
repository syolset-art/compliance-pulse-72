## Mål
Gjøre Vurdering-fanen / Pågående leveranser om til partnerens faktiske **arbeidsstasjon**: et spørreskjema-aktig grensesnitt der hver oppgave (fra tjenestebeskrivelsen) er et "spørsmål" partneren (eller en agent) svarer ut. Når alle er svart ut → automatisk sluttrapport som viser hvilke kontrollpunkter som ble lukket og hvor mye kundens modenhet økte.

Datafundamentet finnes allerede:
- `DeliveryItem → controls[] → activities[]` med felt `status: "in_progress" | "not_relevant" | "done"` og `done: boolean`.
- "Generer sluttrapport" + "Send til kunde" finnes i `OngoingDeliveriesList`.
- Hver aktivitet er allerede koblet til et kontrollpunkt (f.eks. `A.6.3`) og en tjeneste (`serviceId`).

Det som mangler er **rammen**: partneren skal forstå at dette er deres arbeidsmetode (svare ut spørsmål), se framdrift som progressbar, og kunne sette hver oppgave til **Ikke påstartet / Pågår / Ikke aktuelt / Fullført** like enkelt som å klikke en pille.

## Endringer

### 1. `src/components/msp/OngoingDeliveriesList.tsx` — bygges om til spørreskjema-UX

**Topp-header per oppdrag (allerede en kort linje — bygges ut):**
- Stor progressbar med "X av Y oppgaver svart ut" + "Z% mot rapport".
- Mini-stat-strip: `Pågår · Ikke aktuelt · Fullført · Ikke påstartet` (klikkbare som filter, erstatter dagens "Alle / Gjenstår / Fullført / Med dokument").
- Kort tekstforklaring: "Dette oppdraget løses ved å svare ut spørsmålene under. Når alle er besvart, genereres rapporten til kunden automatisk."
- Tag-rad med kontrollpunkter som blir lukket (f.eks. `ISO 27001 A.6.3`, `NIS2 Art. 21`) — gir partneren forståelse av hvilken modenhet de jobber mot.

**Aktivitetsraden (`ActivityRow`) gjøres om til en "spørsmål-rad":**
- Venstre: spørsmålstekst (dagens `label`) + liten linje med "Kontrollpunkt: A.6.3" + eier-pille (Agent/Partner).
- Høyre: status-segment med fire piller — **Ikke påstartet · Pågår · Ikke aktuelt · Fullført**. Aktiv pille farges med semantic token; klikk på en pille setter status.
  - "Fullført" åpner fortsatt `ConfirmActivityDialog` (note + evidence) som i dag.
  - "Ikke aktuelt" setter `status = "not_relevant"`, teller som "svart ut" mot total, men markerer kontrollbidraget som N/A i rapporten.
  - "Pågår" setter `status = "in_progress"` (default i dag).
  - "Ikke påstartet" nullstiller (ny status `not_started` — se Tekniske detaljer).
- Behold "Lara-utkast"-knappen og evidens-listen under raden når relevant.

**Kontrollpunkt-blokken:** behold, men gjør tydeligere at "når alle spørsmål i blokken er besvart → dette kontrollpunktet er lukket". Vis et lite skilt "Lukker A.6.3 i ISO 27001" øverst i blokken.

**Footer per oppdrag:** uendret flyt (Generer sluttrapport → Send til kunde), men teksten endres til:
- Knapp-tilstand "Alle spørsmål må svares ut for å generere rapport" når noen står som *Ikke påstartet* eller *Pågår*.
- Når alt er *Fullført* eller *Ikke aktuelt* → knappen blir aktiv og tooltip viser hvor mange kontrollpunkter som lukkes og estimert modenhetsdelta.

### 2. `src/components/msp/MSPMaturityServiceMatrix.tsx`
- Utvid `ActivityStatus` til `"not_started" | "in_progress" | "not_relevant" | "done"`.
- Justér mock-data så hver leveranse har en blanding av statuser (inkl. minst én `not_started` og én `not_relevant`) så UI-en demonstreres umiddelbart.
- Oppdater `controls[].progress`-beregningen: tell `done + not_relevant` som "svart ut", men kun `done` bidrar til faktisk modenhetsdelta i rapporten.

### 3. `src/components/msp/ConfirmActivityDialog.tsx`
- Liten tilpasning: tittel endres til "Svar ut: {spørsmålstekst}" og bekreftelses-knappen til "Marker som fullført".
- Legg til knapp "Sett som ikke aktuelt" som lukker dialog og setter `not_relevant` med valgfri begrunnelse (ny `reason`-prop som lagres som `note`).

### 4. `src/components/msp/DeliverySummaryDialog.tsx` (rapport-forhåndsvisning)
- Vis tre tellere øverst: **Fullført / Ikke aktuelt / Lukkede kontrollpunkter**.
- I lista over kontrollpunkter: marker N/A-aktiviteter tydelig, og vis "Modenhet økt fra X% → Y%" basert på lukkede kontrollpunkter.
- Ingen endring i send-flyten.

### 5. `src/pages/MSPCustomerDetail.tsx`
- Endre tab-label fra "Vurdering" til **"Pågående oppdrag"** (og `value="assessment"` beholdes for å unngå brudd i query-params).
- Liten intro-linje over matrisen: "Her gjør du arbeidet. Hvert oppdrag er et sett spørsmål du svarer ut sammen med agenter. Når alt er svart ut, leverer vi rapporten til kunden."

## Tekniske detaljer
- `ActivityStatus` utvides til `"not_started" | "in_progress" | "not_relevant" | "done"`. `done: boolean` beholdes for bakoverkompatibilitet og settes `true` kun når `status === "done"`.
- Status-piller bruker semantic tokens: `muted` (ikke påstartet), `warning` (pågår), `secondary` (ikke aktuelt), `success` (fullført).
- Progress-formel per kontroll: `progress = round(100 * (done + not_relevant) / total)`. Modenhetsdelta i rapport: kun `done`.
- Filter-state i `OngoingDeliveriesList` utvides til `"all" | "not_started" | "in_progress" | "not_relevant" | "done" | "evidence"`.
- Ingen DB- eller backend-endringer; alt er mock-/lokal-state i dag.

## Out of scope
- Faktisk PDF-generering (dagens stub beholdes).
- Endre `MSPAssessmentStep` (4-områders baseline-quiz — separat flyt).
- Faktisk agent-utførelse av oppgaver (kun UI som viser at agent eier).
