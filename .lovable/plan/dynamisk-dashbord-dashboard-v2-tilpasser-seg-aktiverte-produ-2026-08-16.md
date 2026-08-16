# Dynamisk dashbord (Dashboard v2) — tilpasser seg aktiverte produkter

I dag har vi separate dashbord: Trust Center-dashbordet på `/`, Core-dashbordet på `/dashboard-core`, leverandørdashbordet på `/vendors` og partnerdashbordet. Ingen av dem tilpasser seg kombinasjonen av produkter kunden faktisk har aktivert.

Forslaget er et nytt, dynamisk dashbord som demonstreres side om side med dagens løsning — ingenting fjernes.

## Slik fungerer det

Dashbordet settes sammen av widget-blokker som slås av og på ut fra hvilke produkter som er aktive:

```text
Alltid:            Lara-hilsen + samlet modenhet + Laras arbeidskø
Regelverk aktivt:  Regelverk i scope, krav uten bevis, neste tiltak
Trust Center:      Trust-profil-status, delinger, kundeforespørsler
Leverandørmodul:   Leverandørrisiko, utløpende avtaler, kartlegging
Core:              Systemer, oppgaver/prosjekter, avvik, behandlingsprotokoll
Eiendeler:         Eiendeler per arbeidsområde, oppdagede enheter (Acronis)
Ingenting aktivt:  Kom i gang-kort som foreslår første produkt
```

Regler vi bygger inn (i tråd med hvordan produktene henger sammen):
- Aktiverer kunden et regelverk, blir Trust Center automatisk tilgjengelig — og motsatt.
- Rekkefølgen på blokkene er ikke fast: den styres av hva som er mest «ferskt» og hvor det er mest åpent arbeid, slik at det viktigste alltid ligger øverst.
- Hver blokk er kort (maks 3–5 linjer) og har én tydelig handling, i tråd med den agentiske retningen.
- Ikke-aktiverte produkter vises nederst som diskrete «kan aktiveres»-kort, ikke som tomme widgets.

## Demo-bryter for teamet

Øverst på siden ligger en liten demo-kontroll (kun for prototypen) hvor man kan skru produkter av og på — Regelverk, Trust Center, Leverandør, Core, Eiendeler — og se dashbordet bygge seg om i sanntid. Det gjør det enkelt å vise teamet alle kombinasjonene uten å endre faktisk abonnement.

## Menyendring: Eiendeler ut av Registre

- «Eiendeler» blir eget toppnivå-menypunkt, på nivå med Core og Leverandører.
- Seksjonen «Registre» går ut; Systemer flyttes inn under Core-seksjonen der den hører hjemme.

## Teknisk

- Ny modul-oppløser `src/lib/dashboardModules.ts`: leser `useSubscription` (Core/leverandør), `moduleActivationState` (Eiendeler, Trust Center, Regelverk) og valgte regelverk, og returnerer et sett med aktive modulnøkler + avledningsreglene (regelverk ⇄ Trust Center).
- Nytt widget-register `src/lib/dynamicDashboardRegistry.ts`: hver blokk beskrives med nøkkel, tittel, hvilke moduler den krever, prioritet og en score-funksjon for sortering.
- Ny side `src/pages/DashboardDynamic.tsx` på ruten `/dashboard-v2`, som rendrer blokkene i beregnet rekkefølge og viser aktiveringskort for inaktive produkter.
- Nye/gjenbrukte blokk-komponenter under `src/components/dashboard-dynamic/`. Vi gjenbruker eksisterende widgets der de finnes (`AggregatedMaturityWidget`, `LaraWorkQueueWidget`, `VendorInsightsWidget`, `AssetSummaryWidget`, `TrustProfileViewsWidget`) og lager kompakte varianter der de er for store.
- Demo-bryteren er en egen komponent med lokal state (lagres i localStorage), uten å skrive til abonnementsdata.
- Sidebar: nytt menypunkt for dashbordet (synlig i prototypen), «Eiendeler» løftes til toppnivå og «Registre»-seksjonen fjernes.
- `/`, `/dashboard-core` og dagens dashbord berøres ikke.
