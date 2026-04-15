

# Plan: Profesjonalisere Abonnement og Credits-siden

## Analyse
Lovable-referansen har to ting som gjør den mer polert:
1. **Toppbanner** med nåværende plan + credits-oversikt side om side — gir umiddelbar status
2. **Credits-oversikten** viser daglige vs månedlige credits med reset-info, ikke bare en bar

Vår side mangler dette «status-dashbordet» øverst og har credits gjemt lenger ned. Plankortene kan også strammes opp.

## Endringer

### 1. Nytt toppbanner (Subscriptions.tsx)
Legge til en 2-kolonne hero-seksjon øverst:
- **Venstre kort**: «Du er på [Plan]»-kort med fornyelsesstatus, nøkkelpunkter (credits/mnd, Trust Engine-synlighet)
- **Høyre kort**: «Credits tilgjengelig»-kort med stor saldo, progress bar, månedlig fornyelsesdato og direkte «Kjøp credits» og «Administrer»-knapper

### 2. Forbedre CreditsSection
- Vise **månedlige credits** med reset-dato (beregnet fra `company_credits.next_reset_at`)
- Legge til «Fornyes om X dager» under saldoen
- Fjerne duplikat credits-info når toppbanneret er på plass — CreditsSection blir kjøps-/transaksjonshistorikk

### 3. Plankort-forbedringer
- Legge til kort beskrivelse under plannavnet (f.eks. «For virksomheter som vil ha full kontroll»)
- Vise årlig/månedlig toggle som en Switch øverst i plan-seksjonen (ikke per kort)

### 4. Ingen strukturelle endringer
- Komponenter, Regelverk, Betalingsmetode-seksjonene beholdes som de er
- Kun visuell oppgradering av toppen

## Filer

| Fil | Endring |
|---|---|
| `src/pages/Subscriptions.tsx` | Nytt hero-banner, billing toggle, plankort-beskrivelser, refaktorert credits-seksjon |
| `src/lib/planConstants.ts` | Legge til `description`-felt per plan tier |

