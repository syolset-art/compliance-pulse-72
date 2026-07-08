## Problem

Etter at brukeren velger status **Implementert** (via ManualDocumentationDialog), er kravet låst i "delvis" — det finnes ingen vei videre til **Verifisert** inne i kravraden. I tillegg tar Lara-forklaringsboksen mye plass etter at dokumentasjon allerede er lagt inn, som gjør UI-et rotete.

## Løsning

Én kompakt statuslinje øverst i det utvidede kravet som lar brukeren bytte mellom `Implementert` og `Verifisert` (og tilbake), uten dialogbokser eller store paneler.

### 1. Inline statusbytte (kompakt)

Legg til én liten linje rett under kravets beskrivelse når `state.progress === "implemented"` eller `"verified"`:

```
[Status: Implementert ▾]   Marker som verifisert →
```

- Venstre: liten status-pille (samme visuelle språk som eksisterende progress-pill), klikkbar → åpner en enkel popover med statusvalgene (`Ikke besvart`, `Under arbeid`, `Implementert`, `Verifisert`, `Ikke aktuell`). Endring oppdaterer `uiStates` direkte.
- Høyre (kun når `implemented`): en subtil link-knapp `Marker som verifisert →` som åpner en liten inline-form (ikke dialog) med to felt:
  - `Verifisert av` (tekst, f.eks. "PwC" eller intern rolle)
  - `Dato` (default i dag)
  - `Bekreft`-knapp
  På bekreft: sett `progress: "verified"`, `evidence: "verified"`, og opprett et minimalt `verification`-objekt slik at seksjonen på linje 526 renderes.

Nedgradere: fra `verified` skal statusbyttet i pillen tillate å gå tilbake til `implemented` (rydder `verification`-feltet).

### 2. Redusere støy i Lara-boksen når dokumentasjon finnes

Når `state.documents.length > 0` og `bucketOf(state.progress) !== "not_met"`:
- Ikke rendre den store `LaraDataSourceExplainer`-boksen. Erstatt med én kompakt linje:
  `Lara har registrert dokumentasjon — {N} dokument · {status}` med en liten `Endre`-lenke som scroller til dokumentlisten.
- Cross-reference-forslaget (finn dokument fra annet krav) skal fortsatt vises, men kun når `state.documents.length === 0`.

### 3. Skjule kommentar-panelet når status ikke er `partial`/`in_progress`

Kommentar-veilederen (chips + input) vises i dag når `bucketOf === "partial"`, som inkluderer `implemented`. Fjern kommentar-panelet når `progress === "implemented"` — det er ikke lenger "delvis" i praktisk forstand. Behold kun for `in_progress`.

## Filer som endres

- `src/components/regulations/FrameworkRequirementsList.tsx`
  - Ny inline status-rad rett etter `<p>{req.description_no}</p>` (rundt linje 352)
  - Betinget rendring av `LaraDataSourceExplainer` (rundt linje 354)
  - Betingelsen på kommentar-panelet (rundt linje 404)
  - Utvide `handleDocSave` / legge til liten helper for statusbytte uten dokument
- Ingen endringer i `LaraDataSourceExplainer.tsx` eller dialogen.

## Ute-av-scope

- Ingen endring i datamodell eller backend.
- Ingen endring i den eksisterende ManualDocumentationDialog.
- Beholder eksisterende verifiseringsvisning (grønt panel med ekstern verifier + intern bekrefter) uendret.
