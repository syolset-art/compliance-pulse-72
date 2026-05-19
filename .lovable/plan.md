## Vurdering: hva er overflødig på "Veiledning fra Mynder"

Dagens fane viser 6 blokker. Mye av det overlapper, og noe gir lite reell verdi for en partner som Hult IT eller 7Security nå. Mål: behold det partneren faktisk handler på, fjern resten.

### Behold (gir partnerverdi nå)

1. **Lara-anbefalingsbanner** — konkrete to-do's partneren kan klikke på. Kjernen i fanen.
2. **MSPCustomerSnapshotCard** — 4 nøkkeltall (modenhet, delta, kritiske gap, neste frist). Eneste sted partneren får et "én-skjerm-svar" på *hvor står kunden?*.
3. **MSPCustomerOpportunityCard** — kr-potensial × rammeverk. Direkte salgsverdi, kobler til Tjenestekatalogen. Kjernen i partner-vinklingen.

### Fjern (overflødig eller for tynt nå)

1. **MSPCustomerMaturityCard** (modenhet per 4 kontrollområder)
   - Tallene er avledet av samme `initial_assessment_score` som Snapshot-kortet allerede viser (×0.9, ×1.05 osv.) — det er ikke ekte data, bare en multiplikasjon. Partneren får ingen ny innsikt.
   - Hører hjemme på kundens egen TP, hvor tallene faktisk kommer fra reelle vurderinger.

2. **FrameworkMaturityGrid** (modenhet per regelverk)
   - Henter `useComplianceRequirements()` som er **partnerens egen org-data**, ikke kundens. På MSP-kundeprofil viser den feil tall.
   - Opportunity-kortet dekker allerede "per rammeverk"-vinkelen, men med kr-tall som faktisk betyr noe for partner.

3. **VendorPrivacyAssessment**
   - Designet for leverandørprofil (vurdering av en *vendor*), gjenbrukt her uten å være tilpasset MSP-kunde-konteksten. Innholdet er generisk og duplikat med det kunden ser i sin egen TP.
   - Kan komme tilbake senere som ekte "skjulte saker"-liste når vi har data, men ikke nå.

4. **MSPMynderSignalsFeed**
   - Hele listen er hardkodet demo. Ingen logikk, ingen kobling til faktiske hendelser. Ser fint ut men gir 0 verdi før den er drevet av ekte signaler.
   - Snapshot-kortet viser allerede "kritiske gap" og "neste frist" — det er det samme signalet i komprimert form.
   - Tar tilbake når vi har en reell signal-pipeline (Lara-oppdagelser, dokumentklassifisering, fristmotor).

### Resultat: 3 blokker i stedet for 6

```text
1. Lara-anbefalingsbanner       (tiltak)
2. MSPCustomerSnapshotCard      (status)
3. MSPCustomerOpportunityCard   (inntekt)
```

Hver blokk svarer på ett tydelig spørsmål: *Hva må jeg gjøre? · Hvor står kunden? · Hva kan jeg selge?*

### Tekniske endringer

Kun `src/pages/MSPCustomerDetail.tsx`:
- Fjern import og bruk av `MSPCustomerMaturityCard`, `FrameworkMaturityGrid`, `VendorPrivacyAssessment`, `MSPMynderSignalsFeed`.
- Fjern `frameworks`-query (brukes ikke lenger på denne fanen).
- Fjern den unødvendige `(() => {...})()`-wrapperen rundt Maturity-kortet.

Filer ikke slettet (kan gjenbrukes senere): `MSPMynderSignalsFeed.tsx`, `MSPCustomerMaturityCard.tsx`. La ligge til vi vet om de skal tilbake med ekte data.

### Ut av scope

- Ingen endringer på fanene Tjenester / Meldinger / Trust Profile.
- Ingen schema- eller backend-endringer.
- Ingen endring på Snapshot- eller Opportunity-kortene selv.
