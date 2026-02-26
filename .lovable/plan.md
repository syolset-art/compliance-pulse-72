

# Plan: Koble dashbord-widget til CertificationJourney-komponenten

## Problemet
Dashbordets `PostOnboardingRoadmapWidget` bruker en forenklet stepper (tynne fargebarer) som ikke kommuniserer fase-status tydelig. Oppgavesidens `CertificationJourney`-komponent viser derimot hver fase med "Fullført"-badge, "Aktiv"-indikator, beskrivelse og ekspanderbare aktiviteter — mye mer informativt.

## Løsning
Erstatte den forenklede phase-stepperen i `PostOnboardingRoadmapWidget` med den eksisterende `CertificationJourney`-komponenten som allerede brukes på Oppgavesiden. Denne viser:
- Grønt sjekkmerke + "Fullført"-badge for ferdige faser (f.eks. Fundament)
- Lilla pulserende prikk + "Aktiv"-badge for pågående faser
- Grått sirkel-ikon for ikke-startede faser
- Ekspanderbar detaljvisning med aktiviteter og læring
- "Valgfritt"-separator for Audit og Sertifisering

## Tekniske endringer

| Fil | Endring |
|---|---|
| `src/components/widgets/PostOnboardingRoadmapWidget.tsx` | Fjern den manuelle phase-stepperen (linje 216-245). Importer og bruk `CertificationJourney` med `completedPercent`. Fjern ubrukte imports (`cn` fra stepper-logikk). |

Selve `CertificationJourney`-komponenten trenger ingen endring — den tar allerede `completedPercent` som prop og beregner status per fase. Governance-level-banneret og "Neste prioriterte handlinger" beholdes som de er.

## Visuelt resultat
Dashbordet vil vise nøyaktig samme faseoversikt som på Oppgavesiden (bildet brukeren viste): "Fundament ✅ Fullført", "Implementering ● Aktiv", osv. med mulighet til å klikke og se detaljer.

