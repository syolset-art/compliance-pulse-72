## Mål

Krympe Lara-samtykke-boksen som i dag tar en hel kortbredde over dokumentlisten, og heller vise den som en subtil, elegant kontroll ved siden av dokumentasjons-overskriften.

## Endring

I `src/components/msp/CustomerDocumentationTab.tsx`:

1. Fjerne det store `<Card>`-blokken (linje 242–271) som viser "Lara kan få lese-tilgang til opplastede dokumenter".
2. Flytte kontrollen inn i header-raden ved siden av "Dokumentasjon"-tittelen (der teksten `{totalDocs} bevis fra {groupedDocs.size} regelverk` står nå).
3. Ny kompakt form: en liten pill med Lara-avatar/ShieldCheck-ikon + kort label "Lara-tilgang" + en liten `Switch` (sm), gruppert i én rad. Tooltip via `Info`-ikon eller på hele pillen forklarer hva tilgangen betyr.

```text
┌──────────────────────────────────────────────────────────────┐
│ Dokumentasjon ⓘ        12 bevis · 3 regelverk   🛡 Lara-tilgang [◉]│
└──────────────────────────────────────────────────────────────┘
```

## Detaljer

- Bruk `h-7` høyde på pill-containeren, `Switch` i `scale-75` for tettere visuelt uttrykk.
- Beholde all funksjonalitet: `access`/`toggleAccess`, tooltip-tekst.
- Ingen andre komponenter berøres.
