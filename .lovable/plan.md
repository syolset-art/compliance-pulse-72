
# Dempet dokumentasjons-indikator i kravlisten

Erstatter "Dokumentasjon mangler"-pillet med en mye mer diskret indikator, og skjuler den helt for krav som ikke er besvart (der er "manglende dokumentasjon" ikke handlingsrettet — brukeren har ikke tatt stilling ennå).

## Endring i `FrameworkRequirementsList.tsx`

**Dagens visning:** To badges (progress + evidence) i toppraden, hvor "Dokumentasjon mangler" ofte vises som eget pill i warning-farge.

**Ny visning:**

1. **Fjern "Dokumentasjon mangler"-pillet fra rad-headeren helt.** Progress-pillet ("Implementert", "Pågår", "Verifisert" etc.) står alene.

2. **Ny subtil indikator** — kun et lite `Paperclip`-ikon (h-3.5) plassert til venstre for progress-pillet:
   - **Har dokumentasjon:** `text-muted-foreground` + liten teller (`Paperclip · 2`) — nøytralt.
   - **Mangler dokumentasjon** *og* status ∈ {`in_progress`, `implemented`, `verified`}: `Paperclip` i `text-warning/70` uten fyll, med tooltip: *"Dokumentasjon mangler for denne statusen"*.
   - **Ikke besvart / Ikke relevant:** **ingen** ikon — vi maser ikke om dokumentasjon når kravet ikke er tatt stilling til.

3. **Dedup-logikken i statusbadges** oppdateres slik at når `evidence === "required"` og progress ikke er verifisert, viser vi bare progress-pillet (ikke lenger dobbelt-badge). Bevis-badgen vises kun når evidence gir tilleggsinfo utover progress (attested, verified, revalidation_due).

## Effekt

- Ikke-besvart krav: kun ett dempet progress-pill, ingen dokumentasjonsstøy.
- Pågår/implementert uten dokumentasjon: én liten warning-tonet paperclip som subtil visuell påminnelse.
- Med dokumentasjon: nøytralt paperclip + teller.

## Ikke inkludert
- Ingen endring i `requirementStatusModel` — `EvidenceState`-typen beholdes; kun visningen i listen endres.
- Ingen endring i ekspandert kort — der kan brukeren fortsatt se full dokumentasjonsstatus.
- Ingen endring i `RequirementCard.tsx` / `VendorControlsTab.tsx` i denne runden.
