## Mål
Erstatte den tekstdrevne forklaringen øverst på "Hvordan virker det"-fanen med en tydelig **visuell illustrasjon** som viser sammenhengen mellom:

- **Kundens Trust profile & modenhet** (venstre side)
- **Partnerens tjenester** (midten — broen)
- **Tilbud, regelverk og kontrollpunkter** (høyre side)

Stegene under (1–5) og outcome-kortene beholdes som de er — de fungerer som detaljert utdypning under illustrasjonen.

## Illustrasjonens oppbygning

En SVG-basert illustrasjon (ren React + Tailwind/semantiske tokens, ingen ekstra avhengigheter) bygget som tre kolonner koblet sammen med flytlinjer:

```text
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  KUNDE          │         │   PARTNER        │         │  COMPLIANCE         │
│                 │         │                  │         │                     │
│  Trust profile  │ ──────▶ │  Dine tjenester  │ ──────▶ │  Tilbud             │
│  Modenhet 0–4   │         │  (byggeklosser)  │         │  Regelverk (NIS2,   │
│  ●●●○○          │         │  • Backup        │         │   ISO, GDPR…)       │
│                 │ ◀────── │  • MDR           │ ◀────── │  Kontrollpunkter    │
│  Hever seg ▲    │  bevis  │  • Opplæring     │  dekker │  ✓ A.8.13 ✓ Art.21  │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
```

### Visuelle elementer
- **Venstre kort (Kunde)**: Shield-ikon, "Trust profile", en liten modenhetsbar (0–4 prikker) med pil oppover som viser at den hever seg.
- **Midtkort (Partner)**: Wrench/Layers-ikon, "Dine tjenester", 3 chips med eksempeltjenester (Backup, MDR, Awareness).
- **Høyre kort (Compliance)**: FileText/ShieldCheck-ikon, "Tilbud + Regelverk + Kontrollpunkter", med små framework-badges (NIS2, ISO 27001, GDPR) og 2–3 grønne ✓-kontroller.
- **Forbindelseslinjer**: To-veis piler mellom kortene med korte etiketter:
  - Kunde → Partner: *"leverer på"*
  - Partner → Compliance: *"dekker"*
  - Compliance → Kunde: *"hever modenhet"* (lukker loopen)
- **Loop-følelsen**: En subtil sirkulær flyt som understreker at partnerens leveranse → dekker kontroller → hever kundens modenhet i trust profile.
- Bruker semantiske tokens: `bg-card`, `border-border`, `text-primary`, `bg-success/10`, etc. WCAG-vennlig kontrast og tekststørrelse (≥ `text-sm`).
- Responsivt: 3 kolonner på `md+`, stables vertikalt på mobil (piler roteres 90°).

## Tekstendringer
- Beholder hero-overskriften, men forkorter ingressen til én setning.
- Fjerner ikke stegene (1–5) eller outcome-seksjonen — illustrasjonen kommer **i tillegg**, plassert rett under hero, før stegene, som den umiddelbare "aha"-en.

## Filer som endres
- `src/components/msp/MSPServiceHowItWorksTab.tsx` — legge til ny `<ServiceFlowDiagram />`-komponent (inline i samme fil eller egen fil under `src/components/msp/`), plassert mellom hero og stegene.

Ingen endringer i forretningslogikk eller data.
