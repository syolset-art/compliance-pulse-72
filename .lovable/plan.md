# Regelverk (beta): Sara-bevissthet, godkjenningsflyt og ny sidestruktur

## Mål
Beta-siden skal fungere likt enten virksomheten bruker Lara alene eller har installert den lokale agenten Sara. Ordet "bevis" byttes til "dokumentasjon". Siden deles i tre tydelige komponenter, og gap får et anbefalt neste steg.

## 1. Terminologi: bevis → dokumentasjon
Erstatt "bevis" med "dokumentasjon" i alle brukersynlige tekster på regelverksflatene (arbeidskø, kravliste, tilknytningsdialog, PDF-kolonne). Interne variabel-/filnavn (evidence) beholdes uendret for å unngå unødig refaktorering.

## 2. Sara-bevissthet i beta
I dag bygges arbeidskøen kun fra Lara-logikk. Beta skal lese agentstatus (samme kilde som resten av appen bruker) og:

- **Sara ikke installert:** som i dag — Lara foreslår status og dokumentasjon, brukeren godkjenner.
- **Sara installert:** funn fra Sara vises som en egen **aktivitetslogg** ("Dette har Sara hentet inn"), med kravreferanse, kilde, tidspunkt, dokument-ID, hash og agentversjon. Sara-funn blandes ikke inn i Lara-forslagene, men får egen inngang.

## 3. Godkjenning — nå eller senere
Hvert funn/forslag kan:
- **Godkjennes** → status settes, kravet flyttes til "i orden".
- **Utsettes ("Godkjenn senere")** → kravet får status **Venter på godkjenning**, og det opprettes en oppgave til den som er ansvarlig for godkjenning. Oppgaven lagres i eksisterende oppgaveregister slik at den dukker opp i Aktivitet.
- **Avvises** → tilbake til gap.

Ansvarlig velges fra plattformens brukerliste, med forhåndsvalgt ansvarlig ut fra rolle (compliance-ansvarlig / personvernombud) der det er relevant.

## 4. Ny sidestruktur — tre komponenter

```text
┌──────────────────────────────────────────────┐
│ 1. Venter på godkjenning        [Åpne liste] │  ett kort, ett tall
├──────────────────────────────────────────────┤
│ 2. Mine regelverk                            │  rolig liste, modenhet pr. regelverk
├──────────────────────────────────────────────┤
│ 3. Jobb med regelverk                        │
│    Filtre: Venter på meg · Lara følger opp   │
│            I orden · Mangler dokumentasjon   │
└──────────────────────────────────────────────┘
```

1. **Venter på godkjenning** — én komponent som erstatter dagens tre køkort. Viser antall krav som venter, hvem de venter på, og en knapp inn til godkjenningslisten (dialog/panel der brukeren kan gå gjennom funn ett og ett: Godkjenn / Godkjenn senere / Avvis, med kildeinfo og — når Sara er på — aktivitetsloggen).
2. **Mine regelverk** — dagens oversiktsliste, beholdes med filtrering på kategori.
3. **Jobb med regelverk** — ny arbeidsflate med filterpiller på tvers av alle aktive regelverk:
   - *Venter på meg*
   - *Lara følger opp*
   - *I orden*
   - *Mangler dokumentasjon (gap)*
   Klikk på et krav åpner det valgte regelverket og markerer kravet i kravlisten (samme mekanikk som i dag).

## 5. Gap og anbefalt neste steg
For krav uten dokumentasjon vises hva som mangler og hva det betyr, med ett anbefalt neste steg per krav:

- **Last opp dokumentasjon** — når det er sannsynlig at dokumentet finnes.
- **Be Sara hente** — kun når Sara er installert og kravet er dekket av en tilkoblet kilde.
- **Opprett oppgave til ansvarlig** — når dokumentasjonen faktisk ikke finnes ennå; oppgaven får kravreferanse, regelverk, ansvarlig og frist.
- **Vurder som ikke relevant** — begrunnelse lagres og kravet tas ut av gapet.

Når Sara er koblet på skiller visningen mellom *"finnes, men ikke hentet inn"* og *"finnes ikke hos dere ennå"* basert på om noen tilkoblet kilde treffer kravet — det er dette som gjør gapet ærlig.

## Teknisk
- Ny `src/lib/regulationsApprovalQueue.ts`: utleder godkjenningskø og gap-elementer fra eksisterende kravdata + Sara-funn; erstatter/utvider `regulationsAgentQueue.ts`.
- Nye komponenter under `src/components/regulations/`: `PendingApprovalCard.tsx`, `ApprovalReviewDialog.tsx` (med Sara-aktivitetslogg), `RegulationsWorkPanel.tsx` (filterpiller + kravliste), `RequirementNextStep.tsx`.
- `src/pages/RegulationsBeta.tsx` restruktureres til de tre komponentene; `RegulationsWorkQueue.tsx` fases ut.
- Sara-status via `useSaraAgent`; funn via `SARA_RECENT_FINDINGS` i denne omgang (demodata, samme som øvrige Sara-flater).
- "Venter på godkjenning" og utsatte godkjenninger persisteres lokalt (samme mønster som dagens demo-status), og oppgaver skrives til eksisterende oppgavetabell via `useUserTasks`.
- Ingen endringer i klassisk `/regulations`.
