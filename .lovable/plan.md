

## Hjelpe nye brukere å forstå arbeidsområder

### Problemet
Nye brukere som kommer til "Mine arbeidsområder" for første gang forstår ikke hva et arbeidsområde er eller hvorfor de skal opprette dem. Lara (chatten) kan svare, men brukeren ønsker hjelp direkte i grensesnittet.

### Løsning: Dismissable intro-banner for nye brukere

En informativ velkomst-seksjon som vises øverst på siden, mellom headeren og filtrene, kun for brukere som ikke har sett den før (dismiss-state lagres i `localStorage`).

**Innhold i banneret:**

> **Hva er et arbeidsområde?**
> Et arbeidsområde representerer en avdeling, funksjon eller ansvarsområde i organisasjonen din — for eksempel «HR», «IT-drift» eller «Kundeservice». Hvert arbeidsområde samler systemene, prosessene og leverandørene som hører til, slik at du får oversikt over risiko og etterlevelse på ett sted.

Under teksten: tre korte eksempel-kort med ikoner som viser hva et arbeidsområde inneholder:
1. **Systemer** — "Legg til systemer og verktøy som brukes"
2. **Prosesser** — "Dokumenter behandlingsaktiviteter og AI-bruk"
3. **Leverandører** — "Hold oversikt over tredjeparter"

En "Lukk"-knapp (X) øverst til høyre som setter `localStorage`-flagg `workarea-intro-dismissed` og skjuler banneret permanent.

### Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/pages/WorkAreas.tsx` | Legg til state `showIntroBanner` basert på `localStorage`. Render en Card-komponent mellom header og filtre med forklaringstekst, tre illustrative mini-kort, og en dismiss-knapp. Skjul banneret når `workAreas.length > 0 && introDismissed`, men vis alltid for tom-tilstand. |

Ingen database- eller backend-endringer nødvendig.

