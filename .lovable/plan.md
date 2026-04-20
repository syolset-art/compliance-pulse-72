

## Plan: Forenklet status-modell + inline status-endring (matcher referansebildene)

Basert på de to skjermbildene: forenkle statusene fra 7 til 4, vis dem som tydelige "pill"-knapper i raden, og la brukeren endre status inline (uten å åpne hele detaljpanelet) med kommentarfelt.

### 1. Forenklet statusmodell (4 statuser)

Erstatt forrige forslag på 7 statuser med disse 4 (matcher bildet):

| Nøkkel | Norsk | Engelsk | Pill-stil |
|---|---|---|---|
| `open` | Åpent | Open | Rosa/rød: `bg-destructive/10 text-destructive border-destructive/30` |
| `in_progress` | Under oppfølging | In progress | Gul/amber: `bg-warning/10 text-warning border-warning/30` |
| `closed` | Lukket | Closed | Grønn: `bg-success/10 text-success border-success/30` |
| `not_relevant` | Ikke relevant | Not relevant | Grå: `bg-muted text-muted-foreground border-border` |

Hver status har en farget prikk (`•`) foran tekst i pill, label er UPPERCASE small-caps som i bildet.

**Fil:** `src/utils/vendorActivityData.ts` — `ActivityStatus`-type + `ACTIVITY_STATUS_CONFIG` med disse 4. Gammel `outcomeStatus`-mapping: `in_progress`→`in_progress`, `completed`→`closed`, `needs_followup`→`open`.

### 2. Mynder-statuslinje øverst (bilde 1, linje "Mynder ser:")

Over aktivitetslisten i `VendorActivityTab.tsx`, legg til en sammendragslinje:

```text
✦ Mynder ser:  1 åpent gap  ·  2 under oppfølging  ·  2 lukket siste 30 dg        Oppdatert nå
```

- Fargede tall (rød/gul/grønn) som matcher status-pillene
- Plasseres rett under tab-headeren, før status-filterknappene
- Tekst genereres fra `activities`-tellinger

### 3. Status-filterrad (bilde 1: "Alle · 5 / Åpne · 1 / Under oppfølging · 2 / Lukket · 2")

Erstatt dagens fase-filter-rad med status-filter (eller legg til ny rad under):
- Pille-knapper med status-prikk + label + count
- Aktiv pille får mørkere ring/border
- "Alle" først, så de tre brukte statusene (skjul `not_relevant` hvis ingen har den)

### 4. Status-pill i hver aktivitetsrad (bilde 1, høyre side)

I `VendorActivityTab.tsx` (linje ~265 hvor `OutcomeIcon` brukes i dag):
- Erstatt med en **klikkbar pille** plassert helt til høyre i raden
- Pille-stil matcher tabellen over (UPPERCASE, prikk, farget border)
- Liten chevron-ned (`▾`) i pillen indikerer at den er klikkbar
- Klikk på pillen åpner inline status-editor (se neste punkt) — IKKE hele detaljpanelet
- Klikk på resten av raden åpner detaljpanelet som før

### 5. Inline status-editor (bilde 2)

Ny komponent: `src/components/asset-profile/InlineStatusEditor.tsx`

Når brukeren klikker pillen utvides en seksjon under raden (samme bredde som raden, animert):

```text
Endre status til:
[● Åpent ✓] [● Under oppfølging] [● Lukket] [● Ikke relevant]

[Legg til kommentar (valgfritt)…………]   [Lagre] [Avbryt]
```

- 4 status-pille-knapper, valgt status får hake (`✓`) og lysere bakgrunn
- Tekstfelt for valgfri kommentar
- "Lagre" → `onUpdate({ outcomeStatus, statusComment })` og legg post i `statusHistory`
- "Avbryt" lukker editoren uten endring
- Lukker seg automatisk etter Lagre, og pillen i raden oppdateres
- ESC lukker editoren

### 6. Statushistorikk (in-memory)

I `VendorActivityTab.tsx` `updateActivity`-funksjonen: når status endres, push til `act.statusHistory: { from, to, comment?, changedAt, changedBy }[]`.

I detaljpanelet (`ActivityDetailPanel.tsx`) — ny seksjon nederst "Statusendringer" som lister historikken (kun synlig hvis ≥1 endring). Maks 3 vises, "Vis alle"-toggle for resten.

### 7. Default-status og demo-data

**`generateDemoActivities`:** Realistisk fordeling:
- ~40% `closed`, ~30% `in_progress`, ~25% `open`, ~5% `not_relevant`

**`RegisterActivityDialog.tsx`:** Default `open` for nye aktiviteter, med liten status-velger i dialogen (samme 4-pille-stil).

### Filer som endres / opprettes

**Endres:**
- `src/utils/vendorActivityData.ts` — ny 4-status-modell + config + mapping + demo-fordeling
- `src/components/asset-profile/tabs/VendorActivityTab.tsx` — Mynder-sammendragslinje, status-filterrad, klikkbar pille, integrasjon med inline-editor
- `src/components/asset-profile/ActivityDetailPanel.tsx` — bytt outcome-visning til ny status-pille + statushistorikk-seksjon
- `src/components/asset-profile/RegisterActivityDialog.tsx` — status-velger med default `open`

**Opprettes:**
- `src/components/asset-profile/InlineStatusEditor.tsx` — den utvidbare editoren fra bilde 2

### Ut av scope
- Persistering til database (alt holdes in-memory som resten av aktivitetslogikken)
- Notifikasjoner ved statusendringer
- Eksport av statushistorikk

