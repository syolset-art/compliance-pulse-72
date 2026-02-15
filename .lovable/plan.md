

# Redesign av Abonnementssiden - Inspirert av referansebilde

## Oversikt
Abonnementssiden (`/subscriptions`) redesignes for a matche referansebildets layout: forbrukskort pa toppen, anbefalt plan med features og "Kommer snart"-seksjon, og betalingsmetodevalg nederst.

## Hva som endres

### 1. Ny header
- Tittel: **"Fakturering og planer"**
- Undertittel: "Administrer ditt abonnement og fakturering"
- Ren layout uten tilbake-knapp (sidemenyen dekker navigasjon)

### 2. Forbrukskort (Usage Meters) - topp
Fire kompakte kort i en rad, inspirert av referansebildet:

| Kort | Ikon | Eksempel |
|------|------|----------|
| AI dokument-autofyll tilgjengelig | Sparkles | 2 av 3 skanninger gjenstar i ar |
| AI-chat tilgjengelig | MessageCircle | 10 av 10 meldinger gjenstar i ar |
| Leverandorer | Users | 24 av 25 leverandorer gjenstar |
| Dokumentsignering tilgjengelig | FileSignature | 5 av 5 gratis signeringer gjenstar i ar |

Hvert kort viser:
- Ikon + tittel
- "X av Y gjenstar"-tekst
- Tynn Progress-bar (fargekodet: bla/gronn)
- "X brukt" venstre, "Tilbakestilles DD.MM.YYYY" hoyre

### 3. Anbefalt plan-kort (erstatter navarende plan-summary + plans grid)
Et stort kort som viser navarende/anbefalt plan:

- **"ANBEFALT"**-badge med Sparkles-ikon
- Plannavn (f.eks. "Premium-plan")
- Beskrivelse: "Perfekt for leverandorer i alle storrelser"
- Pris: **"2 490 kr"** per maned + "Faktureres arlig - 29 880 kr/ar"
- Info-rad: "Premium gjelder for alle i organisasjonen..."
- **Feature-liste** med gronn checkmark:
  - Ubegrensede AI-skanninger av dokumenter (info-ikon)
  - Del dokumenter offentlig med kunder (info-ikon)
  - Offentlig Compliance-side (info-ikon)
  - Dokumentsignering (info-ikon)
  - Prioritert kundestotte (info-ikon)
- **"KOMMER SNART"**-seksjon med gra checkmarks + "Kommer snart"-badge:
  - Avanserte analyser og ESG-innsikt
  - Rapporter om konkurranseanalyse
  - Varsler om konkurrentoppdateringer

### 4. Betalingsmetode-seksjon
Nederst, to radioknapper:
- **Kort / Stripe Link** - "Betal med bedriftskort eller Link-lommebok. Stripe lagrer kortene sikkert og stotter 3-D Secure." + "UMIDDELBAR"-badge
- **Faktura / Bankoverfoering** - "Motta en Stripe-faktura med bankdetaljer (SEPA/ACH). Betaling forfaller innen 30 dager." + "B2B"-badge

### 5. CTA-knapp
Full bredde: **"Oppgrader na"** med pil-ikon

## Hva som fjernes
- Tilbake-knappen (unodvendig med sidebar)
- Tre-kolonne plansammenligning (erstattes med ett anbefalt plan-kort)
- Kontrollomrade-seksjonen (bevares i Regulations-siden)
- Gammel forbruksseksjon (erstattes med nye kompakte forbrukskort)
- Hjelp-seksjonen nederst

## Teknisk implementasjon

### Endrede filer
- `src/pages/Subscriptions.tsx` - Fullstendig redesign av layout og innhold

### Ingen nye filer eller databaseendringer
All data bruker eksisterende `useSubscription`-hook. Forbruksdata forblir hardkodet som demo.

### UI-struktur
```text
+--------------------------------------------------+
| Fakturering og planer                            |
| Administrer ditt abonnement og fakturering       |
+--------------------------------------------------+

+----------+ +----------+ +----------+ +----------+
| AI doc   | | AI-chat  | | Leverand.| | Dok.sign |
| 2/3 igjen| | 10/10    | | 24/25    | | 5/5      |
| [====  ] | | [======] | | [=     ] | | [======] |
| 1 brukt  | | 0 brukt  | | Lagt 1   | | 0 brukt  |
+----------+ +----------+ +----------+ +----------+

+--------------------------------------------------+
| * ANBEFALT                                       |
| Premium-plan                                     |
| Perfekt for leverandorer i alle storrelser       |
|                                                  |
| 2 490 kr per maned                               |
| Faktureres arlig - 29 880 kr/ar                  |
|                                                  |
| [i] Premium gjelder for alle i organisasjonen... |
|                                                  |
| v Ubegrensede AI-skanninger av dokumenter (i)    |
| v Del dokumenter offentlig med kunder (i)        |
| v Offentlig Compliance-side (i)                  |
| v Dokumentsignering (i)                          |
| v Prioritert kundestotte (i)                     |
|                                                  |
| KOMMER SNART                                     |
| ~ Avanserte analyser og ESG-innsikt [Kommer snart]|
| ~ Rapporter om konkurranseanalyse   [Kommer snart]|
| ~ Varsler om konkurrentoppdateringer[Kommer snart]|
+--------------------------------------------------+

| Velg hvordan du vil betale                       |
|                                                  |
| (*) Kort / Stripe Link            UMIDDELBAR     |
|     Betal med bedriftskort eller...              |
|                                                  |
| ( ) Faktura / Bankoverfoering           B2B      |
|     Motta en Stripe-faktura med...               |
|                                                  |
| [========== Oppgrader na  ->  ==================]|
+--------------------------------------------------+
```

### Designprinsipper
- Minimalistisk, Apple-inspirert estetikk
- Muted bakgrunner pa forbrukskort (bg-muted/30)
- Tynne progress-barer (h-1.5) med farger per kategori
- Subtile borders og avrundede hjorner
- "Kommer snart"-badges i outline-stil
- Betalingsmetode som radiogruppe med border-primary pa valgt
- Full WCAG AA-kontrast og tastaturnavigasjon
