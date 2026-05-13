
# Prioritet på system/leverandør

Legger til en P0–P3-prioritet på hvert system/leverandør (asset). Lara foreslår basert på risiko + kritikalitet, eier kan overstyre med valgfri begrunnelse. Avvik fra forslag flagges visuelt.

## Konsept

```
Risiko (Lara)  ─┐
                ├──►  Foreslått prioritet (P0–P3)  ──►  Faktisk prioritet
Kritikalitet  ─┘                                        (kan overstyres + begrunnelse)
(eier)
```

- **P0 – Kritisk** (rød)
- **P1 – Høy** (oransje)
- **P2 – Medium** (gul)
- **P3 – Lav** (grå)

Avvik på ≥2 nivåer fra Laras forslag vises med liten markør og tooltip.

## Forslagsmatrise

| Risiko \ Kritikalitet | Lav | Medium | Høy |
|---|---|---|---|
| Lav | P3 | P3 | P2 |
| Medium | P3 | P2 | P1 |
| Høy | P2 | P1 | P0 |
| Kritisk | P1 | P0 | P0 |

## Datamodell (assets-tabellen)

Feltet `priority` finnes allerede – gjenbrukes for faktisk prioritet (verdier endres til `P0`/`P1`/`P2`/`P3`). Nye kolonner:

- `priority_source` (text: `lara` | `manual`) – hvem som satte den sist
- `priority_suggested` (text) – siste Lara-forslag, brukes til avviksdeteksjon
- `priority_reason` (text, valgfri) – eiers begrunnelse ved overstyring
- `priority_updated_at` (timestamptz)
- `priority_updated_by` (text) – navn/e-post for audit

Enkel audit trail i ny tabell `asset_priority_history`:
- `asset_id`, `from_priority`, `to_priority`, `source`, `reason`, `changed_by`, `changed_at`

## UX-endringer

**1. AddSystemDialog – risiko-steg**
Etter at risiko_level + kritikalitet er valgt vises et lite Lara-kort:
> "Foreslått prioritet: **P1 – Høy** basert på medium risiko + høy kritikalitet"

Under: 4 chips (P0/P1/P2/P3). Velger eier noe annet enn forslaget, glir et "Begrunnelse (valgfritt)"-felt inn under, med plassholder "F.eks. kompenserende kontroller, system under utfasing, klinisk kontekst".

**2. Asset-/leverandørprofil – header**
Ny pille ved siden av risiko-pillen: prioritets-chip med ikon
- Lara-stjerne hvis `priority_source = lara`
- Brukerikon hvis overstyrt
- Tooltip viser forslag + begrunnelse + hvem/når

"Endre prioritet"-knapp åpner popover med chips + begrunnelse + en "Vis historikk"-lenke som åpner audit-listen.

**3. Systems-liste**
Ny sortérbar kolonne "Prioritet" (P0–P3 chip, fargekodet). Liten avviksmarkør hvis faktisk ≠ forslag. Filter i topplinjen.

**4. Aktiviteter**
Nye Activity-er på et system arver `priority` fra systemet som default. Eksisterende oppgaver røres ikke i denne runden.

## Filer som endres / opprettes

- `supabase/migrations/...` – 4 kolonner + `asset_priority_history`-tabell + RLS
- `src/lib/derivedPriority.ts` – matrise + helpers (`suggestPriority`, `isDeviation`, `priorityLabel`, `priorityColor`)
- `src/components/PriorityChip.tsx` – ny gjenbrukbar komponent
- `src/components/dialogs/AddSystemDialog.tsx` – Lara-forslag + chips + begrunnelse
- `src/components/asset-profile/AssetProfileHeader.tsx` – pille + popover
- `src/components/asset-profile/PriorityHistoryDrawer.tsx` – ny, audit trail
- `src/pages/Systems.tsx` – ny kolonne + filter
- `src/hooks/useCreateActivity.ts` (eller tilsvarende) – arv av default-prioritet
- i18n: `priority.p0..p3`, `priority.suggestedBy`, `priority.overrideReason`, `priority.deviation`, `priority.history`, `priority.changeButton` (EN/NO)

## Ikke med i denne runden

- Endring av eksisterende oppgavers prioritet
- Automatisk eskalering (P0 over X dager)
- Bulk-oppdatering på tvers av systemer
- Push-varsler ved avvik
