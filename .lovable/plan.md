## Mål

Gjøre etterlevelse per regelverk mer synlig i Trust Profile ved å vise modenhet i prosent per rammeverk — i et stramt, profesjonelt uttrykk som matcher resten av profilen.

## Endring

I `src/pages/TrustCenterProfile.tsx`, seksjonen "Etterlevelse" (rundt linje 840–872, og duplikatet i preview rundt linje 1987–2019):

Erstatt dagens flate rad av fargede chips med en kompakt tabell-lignende liste der hvert rammeverk vises som én rad med:

- Ikon (BookCheck for standarder, Scale for regelverk) + navn
- Liten "Standard" / "Regelverk"-etikett i muted tekst
- Modenhets-prosent (tabular-nums, fargekodet etter prosjektets risiko-palett: ≥75 success, 50–74 warning, <50 destructive)
- Tynn progress-bar (h-1.5) under navnet, samme fargekoding
- Hele raden er klikkbar og scroller til "Modenhet per kontrollområde" (beholder dagens oppførsel)

Layout:
- Container: `rounded-xl border border-border bg-card divide-y divide-border` (samme språk som Dokumentasjon-seksjonen rett under, så det føles som en familie)
- Header inne i kortet: liten tittel-rad med Scale-ikon, "Etterlevelse", og en høyre-justert hint-tekst "Modenhet basert på dokumenterte kontroller"
- Hver rad: `px-5 py-3.5`, grid med navn til venstre og prosent/badge til høyre, progress-bar under spennende hele bredden

Standarder vises først, deretter regelverk (samme rekkefølge som i dag via `recognizedFrameworks`-splitten finnes allerede).

## Datakilde

Bruk `useComplianceRequirements()` (samme hook som `DashboardFrameworkStatus` bruker) for å hente `stats.byFramework[frameworkId].score`. Rund av til heltall. Hvis et publisert rammeverk ikke har data (`total === 0`), vis "—" i prosent og en tom progress-bar med dempet tekst "Ingen data ennå" i stedet for badge.

Begge stedene seksjonen finnes (hoved-render og preview-tab) skal oppdateres likt — trekk evt. ut en liten lokal komponent `ComplianceFrameworksList` i samme fil for å unngå duplisering.

## Tekniske detaljer

```text
┌─ Etterlevelse ───────────── Modenhet pr. regelverk ─┐
│ 📘 ISO 27001        Standard                  82% ●│
│    ████████████████████░░░░                        │
├─────────────────────────────────────────────────────┤
│ ⚖  GDPR             Regelverk                  64% ●│
│    █████████████░░░░░░░░░░                         │
├─────────────────────────────────────────────────────┤
│ ⚖  NIS2             Regelverk                  —   │
│    ░░░░░░░░░░░░░░░░░░░░░░  Ingen data ennå         │
└─────────────────────────────────────────────────────┘
```

Filer som endres:
- `src/pages/TrustCenterProfile.tsx` (Etterlevelse-seksjonen, to forekomster)

Ingen DB-endringer, ingen nye avhengigheter — gjenbruker `Progress` fra shadcn og eksisterende design-tokens (success/warning/destructive).
