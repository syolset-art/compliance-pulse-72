

## Plan: Risk → Cost visning med tiltakskostnad og besparelse

### Hva
Utvid BusinessRiskExposureWidget og lag en detaljside som viser ledere den fulle "Risk → Cost"-historien: hva risikoen koster, hva tiltaket koster, og hva organisasjonen sparer.

### Datamodell (demodata, ingen ny tabell)
Utvid `RISK_DATA` med tre nye felter per risiko:

```text
mitigation_cost   — hva tiltaket koster (engangskostnad)
mitigation_label  — kort beskrivelse av tiltak ("Signer DPA", "Aktiver MFA")
residual_exposure — resteksponering etter tiltak
```

Besparelse beregnes: `exposure - residual_exposure - mitigation_cost`

### Endringer

**`BusinessRiskExposureWidget.tsx`** — Oppdater:
- Endre undertekst til: "Se hvor du taper penger på risiko"
- Legg til en liten "besparelse"-kolonne per rad som viser potensiell besparelse i grønt
- Gjør hver rad klikkbar → navigerer til `/risk`
- Footer-knapp: "Se prioriterte tiltak" → `/risk`

**Ny fil: `src/pages/BusinessRiskDetail.tsx`** — Detaljside:
- Sammendragskort øverst: Total ALE, Total tiltakskostnad, Total besparelse (3 MetricCards)
- Prioritert liste med alle 5 risikoer, hver som et utvidbart kort:
  - Prosess / System / Kategori-badge
  - Tre kolonner: "Årlig risikokostnad" | "Tiltakskostnad" | "Besparelse"
  - Tiltaksbeskrivelse (hva som må gjøres)
  - Knapp: "Opprett oppgave" (toast, demo)
- Visuell: Stacked bar per risiko som viser eksponering vs. restrisiko vs. besparelse

**`src/App.tsx`** — Legg til route `/risk` → `BusinessRiskDetail`

### Filer

| Fil | Endring |
|-----|---------|
| `src/components/widgets/BusinessRiskExposureWidget.tsx` | Utvid demodata, klikkbare rader, ny tekst |
| `src/pages/BusinessRiskDetail.tsx` | Ny detaljside med ROI-oversikt |
| `src/App.tsx` | Ny route `/risk` |

