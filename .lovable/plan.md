
# Partner-berikelse: dokumentopplasting og modenhetspåvirkning

## Mål
MSP-partneren skal kunne laste opp dokumentasjon (pentest, risikovurdering, BCP osv.) direkte på kundekortet og umiddelbart se hvilke **regelverk** og **kontrollpunkter** dokumentet beriker — inkludert hvor mye modenheten øker.

## 1. Hvor dokumentet skal ligge

På `MSPCustomerDetail` (kundekortet) finnes allerede fanen **Trust Profile**. Vi legger berikelsen inn der via en ny underseksjon "Partner-bevis":

```
Kundekort → Trust Profile (fane)
   ├─ Modenhet per kontrollområde (eksisterer)
   ├─ Partner-bevis  ← NY seksjon
   │    ├─ [Last opp dokument] (knapp)
   │    └─ Tabell: Dokument · Type · Regelverk · Kontrollområder · Berikelse · Dato · Partner
   └─ Eksterne dokumenter (eksisterer via LaraInbox)
```

Begrunnelse: Dette gjenbruker den eksisterende `vendor_documents`-tabellen og `LaraInboxTab`-mønsteret, men skiller tydelig **partner-leverte bevis** fra både interne (kunden selv) og eksterne (mottatt fra leverandører). Tabellformatet matcher det vi nettopp ryddet opp i for "Eksterne dokumenter".

## 2. Opplastingsflyt (2 steg)

**Steg 1 — Velg fil + type**
Kompakt dialog:
- Filopplaster (drag/drop)
- Dokumenttype (pentest, DPIA, risikovurdering, BCP, sertifisering, annet)
- Kort fritekstnotat (valgfritt)

**Steg 2 — Lara foreslår mapping** (med checkboxer, samme mønster som `AISuggestTextarea`)
Lara leser dokumentet og foreslår:
- Hvilke **regelverk** det treffer (NIS2, ISO 27001, GDPR, DORA …)
- Hvilke **kontrollpunkter** innenfor hvert regelverk
- Estimert **modenhetsløft** pr. kontrollområde (f.eks. "Sikkerhet +8%")

Partneren huker av forslagene de godtar → klikker **Bekreft og berik**.

## 3. Hvordan partneren ser at berikelsen skjer

Tre synlige signaler — alle på Trust Profile-fanen:

**A. Bekreftelses-toast + inline diff** rett etter bekreftelse:
> "Pentest-rapport bekreftet. Modenhet for *Sikkerhet*: 62% → 70% (+8). Berører 6 kontrollpunkter i NIS2 og 4 i ISO 27001."

**B. Modenhet-kortet (`AssetMaturityByDomainCard`)** får en liten "berikelses-puls":
- Stablet progress-bar (baseline + berikelse) — vi har allerede `StackedProgress`-komponenten
- Liten "+8" badge ved siden av prosenten i 5 sekunder
- Hover viser tooltip: "8% kommer fra 2 partner-bevis"

**C. Partner-bevis-tabellen** viser status per rad:
| Dokument | Type | Regelverk | Kontroller | Berikelse | Dato | Av |
|---|---|---|---|---|---|---|
| pentest_q1.pdf | Pentest | NIS2, ISO27001 | 10 kontroller | Sikkerhet +8% | 2/6 | Ola (MSP) |

Klikk på en rad åpner et drawer som viser **eksakt hvilke kontrollpunkter** dokumentet dekker, med lenke til kontrollen i `TrustControlEvaluation`-visningen.

## 4. Tekniske endringer (kort)

- **Ny komponent**: `src/components/msp/PartnerEvidenceSection.tsx` (tabell + opplastingsknapp), brukes inne i `MSPCustomerTrustProfile` / Trust Profile-fanen på `MSPCustomerDetail`.
- **Ny dialog**: `PartnerEvidenceUploadDialog.tsx` (steg 1 + steg 2 med Lara-forslag og checkboxer).
- **Datamodell**: gjenbruk `vendor_documents` med nye felter (eller `metadata` JSON):
  - `source = 'partner'`
  - `uploaded_by_partner_id`
  - `frameworks: string[]`
  - `control_ids: string[]`
  - `maturity_delta: { area: string; delta: number }[]`
- **Edge function**: ny `analyze-partner-evidence` (eller utvide `classify-framework-doc`) som returnerer foreslåtte regelverk + kontroller + delta — drevet av Lovable AI (`google/gemini-2.5-flash`).
- **Modenhet**: `useTrustControlEvaluation` får et "enrichment"-lag som summerer godkjente partner-bevis pr. kontrollområde. `AssetMaturityByDomainCard` byttes til `StackedProgress`.
- **Sporing**: hver berikelse logges som en aktivitet i `VendorActivityTab` ("Partner X la til pentest — beriket 10 kontroller").

## 5. Det vi *ikke* gjør nå
- Ingen automatisk re-evaluering av modenhet uten partner-bekreftelse (samme prinsipp som "La Lara foreslå").
- Ingen endring av kundens eksisterende dokumentfaner — partner-bevis er en separat strøm.
- Ingen ny tabell i databasen før vi vet at `vendor_documents.metadata` ikke holder.

## Åpne spørsmål før bygging
1. Skal partner-bevis være synlig for **sluttkunden** i deres Trust Center, eller kun internt for partneren?
2. Skal modenhetsløftet kreve **godkjenning fra kunden** (som "Eksterne dokumenter") før det teller, eller telle umiddelbart fordi partneren er betrodd?
3. Skal vi vise et eget "Partner-bidrag denne måneden"-widget på MSP-dashboardet, eller holde det isolert på kundekortet?
