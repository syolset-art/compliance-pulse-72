
## Kontekst

Det er partneren (MSP) som aktiverer regelverk på sine kunder. Widgeten "Aktiveringsgrad" på MSP-dashbordet snakker i dag om "kunder som har aktivert compliance-leveransen" — det er misvisende. Den skal i stedet vise hvor mange kunder som har **godkjent å få aktivert regelverk** som del av tilbudet fra partneren.

## Endringer

Kun tekst/etiketter i `src/pages/MSPPartnerDashboard.tsx` — ingen logikk, tall, ruter eller andre widgets endres.

### `ClaimRateWidget` (linjer ~204–245)
- **Overskrift (label):** "AKTIVERINGSGRAD" → **"GODKJENT AV KUNDE"**
- **Hovedlinje:** "47 av 400 kunder har aktivert" → **"47 av 400 kunder har godkjent regelverkstilbud"**
- **Underlinje:** "Kunder som har godkjent compliance-leveranse · +2 mnd" → **"Kunder som har akseptert regelverk aktivert av deg · +2 mnd"**
- Ringen beholder "12%" og "aktive"-label endres til **"godkjent"**.

### `KPIS`-array (linje ~33)
- `label`: "AKTIVERINGSGRAD" → **"GODKJENT AV KUNDE"**
- `sub`: "47 av 400 kunder har aktivert compliance-leveransen" → **"47 av 400 kunder har godkjent regelverkstilbud"**

### `PartnerHeader` (linje ~168)
Beholdes uendret ("Du har 7 nye meldinger og Lara har 4 forslag i dag").

## Utenfor scope
- Ingen endring i data eller prosenter.
- Andre widgets (Pågående kampanjer, Trust score, Lara-forslag-tabell osv.) er ikke berørt.
- Ingen endring i navigasjon eller drilldown-siden `/msp-partner/widget/claim-rate` — det håndteres separat hvis ønskelig.
