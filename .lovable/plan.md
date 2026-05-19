
# Spørreskjema som partnertjeneste

## Hvorfor dette gir mening nå

Spørreskjema er typisk "work to be done" partnere fakturerer for: GDPR-modenhet, NIS2-scoping, ISO 27001 gap-analyse, leverandørvurdering. I dag har vi tre adskilte spørreskjema-motorer i koden uten å være en _tjeneste_:

| Hvor | Hva | Bruk i dag |
|---|---|---|
| `lib/mspAssessmentQuestions.ts` | 4 kategorier × ISO/NIS2-spørsmål | MSP onboarding-wizard (engangs) |
| `lib/trustMaturityQuestions.ts` | 4 områder × GDPR-spørsmål | Trust Profile aktivering (kunden selv) |
| `customer-requests/TemplateLibrary` | PDF-maler partneren laster opp | Sendes som dokumentvedlegg |

Ingen av disse kan i dag _bestilles_ av partneren på vegne av kunden, _gjennomføres_ av kunden, og _hentes tilbake_ som modenhetsdata partneren bruker til rådgivning. Det er nettopp det Hult-IT og 7Security trenger for å skape verdi.

## Konsept: "Spørreskjema-tjenester"

En **spørreskjema-tjeneste** er en ny type i partnerens tjenestekatalog (`serviceCatalog.ts`) ved siden av prosjekt/abonnement. Partneren publiserer den til kundens portal, kunden får et oppdrag i sin egen Mynder ("Besvar spørreskjema fra Hult-IT"), svarene flyter tilbake til partnerens kundebilde og oppdaterer **Partner-snapshot** + skaper konkrete tiltak Lara kan jobbe videre med.

### Tre faste pakker som dekker 80 % av behovet

1. **GDPR-modenhet** (gjenbruker `MATURITY_AREAS`, 19 spørsmål) — selges som "GDPR-helsesjekk", 5–10 000 kr
2. **NIS2-scoping** (subset av MSP_ASSESSMENT governance + nye NIS2-spørsmål) — "Er dere i scope?", 7 500 kr
3. **ISO 27001 gap** (gjenbruker MSP_ASSESSMENT alle 4 kategorier) — "Mini gap-analyse", 15 000 kr

Partneren kan også bygge **egne** skjemaer (fritekst-spørsmål, ja/nei, skala 1–5), men det er fase 2.

## Flyt

```text
Partner: Tjenester → "Aktiver GDPR-helsesjekk for ACME"
                                  ↓
Kunden (ACME) får oppdrag i sin Mynder-inbox:
   "Hult-IT har bestilt en GDPR-helsesjekk. 19 spørsmål, ~15 min."
                                  ↓
Kunden besvarer (samme UI som dagens aktiveringswizard)
                                  ↓
Svar lagres → partnerens kundebilde:
   - Snapshot-kortet får ekte modenhetstall (ikke lenger multiplisert mock)
   - Lara genererer 3-5 konkrete tiltak basert på "nei"-svar
   - Hver "nei" mapper til en oppfølgingstjeneste i katalogen (DPIA, DPO, ...)
                                  ↓
Partner fakturerer skjemaet + selger inn tiltakene
```

## Hva som faktisk bygges i denne fasen

Minimal, verdiskapende skive — ingen ny backend, alt drives av `useActivatedServices`-mønsteret som allerede finnes.

### 1. Utvid `PartnerService`-typen

Legg til to felt i `src/lib/serviceCatalog.ts`:

```ts
deliveryType?: "advisory" | "questionnaire";   // default advisory
questionnaireId?: "gdpr_maturity" | "nis2_scope" | "iso_gap";
```

### 2. Legg til 3 nye tjenester i `PARTNER_SERVICES`

- `q-gdpr-maturity` → bruker `MATURITY_AREAS`
- `q-nis2-scope` → bruker governance-subsett av `MSP_ASSESSMENT_QUESTIONS`
- `q-iso-gap` → bruker alle `MSP_ASSESSMENT_QUESTIONS`

Med eksisterende `frameworkMappings`, `price`, `priceModel`. Ingen ny logikk i `suggestServices`.

### 3. Vis spørreskjema-tjenester tydelig i katalogen

I `MSPServiceCatalogTab` / `ServiceCard`: et "Spørreskjema"-badge når `deliveryType === "questionnaire"` + tellingen av antall spørsmål under beskrivelsen ("19 spørsmål · ~15 min").

### 4. Aktiveringsdialog

Når partneren klikker "Aktiver for kunde" på en spørreskjema-tjeneste: én ny `ActivateQuestionnaireDialog` — velg kunde, sett frist, skriv kort intro. Lagrer i `useActivatedServices` med `{ customerId, questionnaireId, status: "sent" }`.

### 5. Kundens side: ett nytt kort i kundens TP-inbox

Komponent `PendingQuestionnaireCard` — viser aktiverte skjemaer fra partnere. Klikk → åpner eksisterende `ActivateTrustProfileWizard`-modenhetstrinn (gjenbruk), lagrer svar tilbake i `useActivatedServices` som `{ status: "completed", answers }`.

### 6. Partnerens side: erstatt mocket modenhetstall i Snapshot

`MSPCustomerSnapshotCard` leser `answers` fra completed questionnaires for kunden. Hvis ingen er fullført → "Send GDPR-helsesjekk for å hente reelt modenhetstall" CTA. Hvis fullført → reell prosent + lenke til svarene.

### 7. Lara-tiltaksforslag fra "nei"-svar

I `MSPCustomerDetail`-fanen "Veiledning fra Mynder": hvis kunden har fullført et skjema, vis liten liste "Lara fant 4 gap fra GDPR-helsesjekken" med tiltak som mapper "nei" → tjeneste-ID (f.eks. "Ingen DPA" → `tpl-dpa-review`). Klikk → "Foreslå tjeneste" som åpner dagens `MSPCreateOfferDialog`.

## Det vi IKKE bygger nå

- Egendefinerte skjemaer (bygg-din-egen). Fase 2.
- Backend-tabell for svar — alt går i `useActivatedServices`-localStorage til vi vet hva som funker.
- E-postvarsling til kunde — kunden ser det neste gang de er innlogget.
- PDF-rapport av besvart skjema — kan lett legges på senere via dagens PDF-mønster.
- Endringer i `MSPAssessmentStep` / Trust Profile-aktivering — de fortsetter å fungere som i dag, vi gjenbruker spørsmålene.

## Filer som røres

- `src/lib/serviceCatalog.ts` — utvid type, legg til 3 tjenester
- `src/components/msp/ServiceCard.tsx` — badge + meta-linje
- `src/components/msp/ActivateQuestionnaireDialog.tsx` — ny
- `src/components/customer-requests/PendingQuestionnaireCard.tsx` — ny (vises på kundens inbox-side)
- `src/hooks/useActivatedServices.ts` — utvid lagret entry med `questionnaireId`, `status`, `answers`
- `src/components/msp/MSPCustomerSnapshotCard.tsx` — les ekte svar når tilgjengelig
- `src/pages/MSPCustomerDetail.tsx` — vis Lara-gap-liste fra svar

## Spørsmål før jeg bygger

1. **Pakkene** — er GDPR / NIS2 / ISO de tre riktige å starte med, eller vil dere heller starte med bare én (f.eks. GDPR-helsesjekk) for å validere flyten?
2. **Pris** — skal partneren selv sette pris per spørreskjema, eller foreslår vi en standard (5/7,5/15 000 kr)?
3. **Hvor finner partneren disse?** — egen "Spørreskjema"-fane i Tjenester, eller blandet inn i dagens katalog med et filter?
