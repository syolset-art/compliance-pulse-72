# Kontrollområder: vekting + regelverkskobling

## Mål
Når brukeren ser et kontrollområde (f.eks. Styring) i Trust Profile, skal de kunne:
1. Forstå at antall kontrollpunkter kommer fra de aktiverte regelverkene.
2. Se hvor mye områdets score teller i Trust Score (områdevekt).
3. Se hvilke kontrollpunkter som inngår og hvilken vekt hvert punkt har.

## Modell

### Områdevekting (fast, fra ditt bilde)
Lagres i `src/lib/controlAreas.ts` som `AREA_WEIGHTS`:

| Område                        | Spørsmål det svarer på             | Vekt |
| ----------------------------- | ---------------------------------- | ---- |
| Drift og sikkerhet            | Fungerer sikkerheten i praksis?    | 30 % |
| Styring og ansvar             | Hvem har ansvaret?                 | 25 % |
| Personvern og datahåndtering  | Har vi kontroll på personopplysn.? | 20 % |
| Identitet og tilgang          | Hvem har tilgang til hva?          | 15 % |
| Tredjepart og verdikjede      | Har vi kontroll på tredjeparter?   | 10 % |

Trust Score = Σ(områdescore × områdevekt). Vises i overskriften.

### Kontrollpunkter (avledet fra aktive regelverk)
- Ny helper `getActiveControlPointsByArea(activeFrameworkIds)` i `src/lib/controlAreas.ts`:
  filtrerer `complianceRequirementsData` + `additionalFrameworkRequirements` på `framework_id ∈ aktive`, grupperer via `toCanonicalArea(sla_category)`.
- Returnerer per område: `{ requirements[], byFramework: { [frameworkId]: count } }`.

### Vekting per kontrollpunkt (MVP)
- Standard `weight = 1.0` (alle teller likt — enkleste forklaring).
- Reserverer plass for fremtidig prioritetsvekt (Critical=2/Standard=1/Optional=0.5) via samme `weight`-feltet i `ScoredRequirement`. Ingen DB-endring nå.

### Score-formel
```text
områdescore = Σ(modenhet × vekt) / Σ(vekt) × 25     // 0-4 → 0-100
trust_score = Σ(områdescore × områdevekt) / 100
```

## UX — "Slik er Styring beregnet"

Hvert områdekort i `MSPCustomerTrustProfileCard` blir klikkbart. Klikk åpner en **høyre Sheet-drawer** (samme mønster som resten av appen) med fire seksjoner:

```text
┌─ Styring og ansvar ──────────────────── × ─┐
│ [ikon]  Styring og ansvar                  │
│ Score 78 %      Områdevekt 25 % av Trust   │
├────────────────────────────────────────────┤
│ DREVET AV AKTIVE REGELVERK                 │
│ [ISO 27001 · 12 pkt] [NIS2 · 8] [GDPR · 4] │
│ → 24 kontrollpunkter totalt i området      │
├────────────────────────────────────────────┤
│ KONTROLLPUNKTER (24)                       │
│ Navn               Regelverk   Vekt  Status│
│ A.5.1 Policy       ISO 27001    1.0   ✓    │
│ Art. 21(2)(a)      NIS2         1.0   ◐    │
│ …                                          │
├────────────────────────────────────────────┤
│ SLIK BEREGNES SCOREN                       │
│ Σ(modenhet × vekt) / Σ(vekt) × 25 = 78 %   │
│ Områdets vekt i Trust Score: 25 %          │
│ → Les hele metoden                         │
└────────────────────────────────────────────┘
```

I tillegg, på hvert områdekort i selve Trust Profile-kortet:
- Liten chip "24 fra 3 regelverk" under progress-baren (lavmælt, ikke støy).
- `info`-ikon med tooltip "Klikk for å se hvilke regelverk som driver dette området".

## Filer som endres

| Fil | Endring |
| --- | --- |
| `src/lib/controlAreas.ts` | Legg til `AREA_WEIGHTS`, `getActiveControlPointsByArea()`, `calculateTrustScore()`. |
| `src/lib/scoringEngine.ts` | Ny `calculateScoreByDomainAndFramework()` for cross-tab regelverk × område. |
| `src/components/msp/MSPCustomerTrustProfileCard.tsx` | Ta inn `activeFrameworkIds`, beregn antall + score per område reelt, gjør kortene klikkbare, vis chip. |
| `src/pages/MSPCustomerDetail.tsx` | Send `activeFrameworkIds` videre til kortet. |
| `src/components/msp/ControlAreaBreakdownDrawer.tsx` (ny) | Sheet med de fire seksjonene over. |
| `src/pages/MaturityMethodology.tsx` | Oppdater metode-siden med ny områdevekting-tabell og formel. |

## Avgrensninger (MVP)
- Ingen DB-endringer. `weight = 1.0` på alle requirements i Phase 1.
- Kun MSP-kundens Trust Profile-kort i denne runden; samme drawer kan senere gjenbrukes på leverandørenes Trust Profile og Trust Center.
- Områdevekter er hardkodet i `controlAreas.ts`; partner-admin/superuser-justering kommer senere.

## Spørsmål jeg gjør forutsetninger på (kan endres)
- **Per-punkt-vekt:** starter likt (1.0). Kan senere kobles til `priority` eller Lara/verifisering.
- **Plassering av forklaring:** høyre Sheet-drawer (matcher mønsteret i resten av appen), pluss en liten chip + info-tooltip på selve kortet for raskt overblikk.

Si fra om vekter eller plassering skal justeres før implementering.
