# Plan: 4 kontrollpunkter på Trust Profile-fanen (Dintero)

## Kontekst
På `/msp-dashboard/:id` ligger fane 4 "Trust Profile" som rendrer `MSPCustomerTrustProfileCard`. Kortet viser i dag sertifiseringer, policyer og innsynsforespørsler — men ingen oversikt over modenhet på de 4 kjernedomenene som ellers brukes i plattformen (jf. memory: Governance, Operations, Privacy, Third-Party, 0–4 skala).

## Hva som bygges
Ny seksjon "Kontrollpunkter" i `MSPCustomerTrustProfileCard.tsx`, plassert rett under "Synlighet / Profilvisninger" og over "Sertifiseringer". Den viser de 4 kjernedomenene som hver sin rad med:

- Ikon + navn (Styring, Drift og sikkerhet, Personvern, Tredjepart)
- Kort beskrivelse (1 linje)
- Modenhet 0–4 (tall + mini progress-bar)
- Statusfarge: grønn ≥75 %, oransje 50–74 %, rød <50 % (jf. risk-color memory)
- Liten "Lara"-pille om verdien er avledet fra Lara/Mynder (ikke selvrapportert)

Demo-data for Dintero (hardkodet i komponenten på linje med eksisterende `certifications`/`policies`-konstanter):

```text
Styring             3/4   Lara
Drift og sikkerhet  4/4   Selvrapportert
Personvern          2/4   Lara
Tredjepart          3/4   Lara
```

## Tekniske detaljer
- Kun frontend-endring i `src/components/msp/MSPCustomerTrustProfileCard.tsx`.
- Bruk semantiske tokens (`bg-success`, `bg-warning`, `bg-destructive`, `text-foreground`, `bg-muted/30`).
- Bruk `Progress` fra `@/components/ui/progress` for modenhetsbaren, eller en enkel `div` med width-% hvis vi vil holde det kompakt.
- Ikoner fra `lucide-react`: `ShieldCheck` (Styring), `Activity` (Drift), `Lock` (Personvern), `Users` (Tredjepart). `Sparkles` for Lara-pille.
- Ingen nye hooks, ingen endring i `serviceCatalog` eller andre filer.
- Følger samme `Card`/spacing-mønster som de eksisterende seksjonene i samme fil.

## Out of scope
- Ingen kobling til ekte modenhetsdata (`useMaturityScore` etc.) i denne iterasjonen — vi seeder demo-tall slik resten av kortet allerede gjør.
- Ingen drilldown / klikk-handling på radene.
- Ingen endringer i andre faner eller i `MSPCustomerSnapshotCard`.
