## Mål
Partner skal kunne markere en aktivitet (eller et helt kontrollpunkt) som ferdig via en eksplisitt **"Bekreft ferdig"-knapp**, laste opp ett eller flere dokumenter som bevis, og få en bekreftelse om at dette beriker kundens Trust Profile.

Dagens checkbox toggles `a.done` umiddelbart uten bevis — det erstattes med en bevisst bekreftelse + bevisopplasting.

## UX-flyt (i `MSPMaturityServiceMatrix.tsx`, fanen "Pågående oppdrag")

1. På hver aktivitetsrad i "Kontrollpunkter og aktiviteter":
   - Checkbox erstattes/forsterkes med en liten **"Bekreft ferdig"-knapp** (ghost, ikon `CheckCircle2`) til høyre på raden når `!a.done`.
   - Når `a.done`: vis grønn "Ferdig" pille + lenke "Se bevis" (åpner samme dialog i read-only) + "Angre" (åpner liten confirm).

2. På kontrollpunkt-headeren (over progress-bar): tillegg **"Bekreft hele kontrollpunktet"** når alle aktiviteter er ferdige men status fortsatt `partial`/`missing` — én klikk setter status til `fulfilled` og åpner bevis-dialog for samlet leveransebevis.

3. Klikk på "Bekreft ferdig" → ny **`ConfirmActivityDialog`**:
   - Tittel: aktivitetens navn + kontrollpunkt-kontekst (id + navn + framework-badge).
   - Felt:
     - Notat/kommentar (valgfritt, textarea).
     - Bevis-opplasting: dra-og-slipp + filvelger, multi-file, viser liste med navn/størrelse/X.
     - Sjekkboks "Del med kunden som en del av Trust Profile" (default på).
   - Footer: "Avbryt" + primær "Bekreft og berik Trust Profile".

4. Etter bekreftelse:
   - Aktivitet markeres `done`, bevis lagres i lokal state på leveransen (`a.evidence: EvidenceFile[]`, `a.confirmedAt`, `a.note`).
   - Toast (sonner): "Aktivitet bekreftet — Trust Profile oppdatert" med sekundærtekst "N bevis lagt ved · Kunden varsles".
   - Hvis alle aktiviteter i kontrollpunkt = done → status auto-flyttes til `fulfilled` og progress = 100.

## Datamodell-endring (kun frontend-state i denne iterasjonen)

I `MSPMaturityServiceMatrix.tsx`:

```ts
interface EvidenceFile { id: string; name: string; size: number; uploadedAt: string; }
interface Activity {
  id: string; label: string; done: boolean; owner?: string; date?: string;
  // NYTT:
  confirmedAt?: string;
  confirmedBy?: string;     // "Partner" (hardkodet i demo)
  note?: string;
  evidence?: EvidenceFile[];
  sharedWithCustomer?: boolean;
}
```

`toggleActivity` brukes ikke lenger til å sette `done = true` — kun til "angre" (sette `done = false` og rydde bevis-felt). Ny handler `confirmActivity(deliveryId, controlId, activityId, payload)` skriver feltene.

## Nye komponenter

- `src/components/msp/ConfirmActivityDialog.tsx` — Dialog (shadcn) med tekstfelt, fil-upload (input `type=file` med multiple, ingen ekte upload — kun lokal state med blob-metadata), checkbox, og knapp. Returnerer `{ note, files, sharedWithCustomer }` via `onConfirm`.

## Filer som endres

- `src/components/msp/MSPMaturityServiceMatrix.tsx`
  - Utvid Activity-typen, legg til `confirmActivity` og `undoActivity` handlere.
  - Bytt checkbox-only raden med knapp/badge-mønsteret over.
  - Render bevis-liste under aktiviteten når `confirmed`.
- `src/components/msp/ConfirmActivityDialog.tsx` (ny).

Ingen DB-endringer i denne iterasjonen — alt lever i lokal state slik resten av matrisen gjør. Når vi senere skal persistere, blir det en egen task (egen tabell `delivery_activity_evidence` + storage-bucket).

## Spørsmål før jeg bygger
1. **Bevis-lagring nå:** OK å holde det i lokal state (demo) i denne runden, eller vil du at jeg samtidig setter opp `delivery_activity_evidence`-tabell + storage-bucket?
2. **Kontrollpunkt-bevis:** Skal det også finnes en "Bekreft hele kontrollpunktet"-knapp (bulk-bekrefte alle aktiviteter med ett felles bevissett), eller kun per-aktivitet?
