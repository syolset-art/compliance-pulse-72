# Forenklede statusvalg: Ikke påbegynt · Pågår · Implementert · Verifisert

Erstatter dagens fire statusvalg (Oppfylt, Delvis oppfylt, Ikke oppfylt, Ikke relevant) i `ManualDocumentationDialog` med en tydelig fremdriftsakse på fire trinn. Verifisert-trinnet krever signert dokument fra uavhengig organ og gjøres derfor ikke direkte valgbart — bruker må gå via "Be om verifisering"-flyten.

## Statusvalg (ny)

| Verdi | Label | Beskrivelse i UI |
|---|---|---|
| `not_started` | Ikke påbegynt | Kravet er ikke adressert enda. |
| `in_progress` | Pågår | Arbeid pågår, ikke ferdig implementert. |
| `implemented` | Implementert | Kravet er innført. Krever opplastet dokumentasjon. |
| `verified` | Verifisert | Låst valg — krever signert bekreftelse fra uavhengig organ. |

"Ikke relevant" tas ut av dialogen (kan legges tilbake senere som eget "scope"-valg hvis ønsket).

## Endringer

**`src/components/dialogs/ManualDocumentationDialog.tsx`**
- Bytt SelectItem-listen til de fire nye verdiene.
- `verified` renderes som disabled SelectItem med hjelpetekst: *"Krever signert dokument fra uavhengig organ — be om verifisering fra Implementert-status."*
- Under Select: liten info-callout når status = `implemented`: *"Neste steg: Last opp dokumentasjon. Du kan senere be om uavhengig verifisering herfra."*
- Under Select: liten info-callout når status = `verified` (om noen får det via annen vei): *"Verifisering krever signert bekreftelse fra uavhengig organ. Kommer snart — foreløpig kan du be om verifisering på det opplastede dokumentet."*
- Uploader-panel vises fortsatt kun ved `implemented` (uendret).

**`src/components/regulations/FrameworkRequirementsList.tsx`**
- Utvid `handleDocSave`-mappingen:
  - `not_started` → `{ progress: "not_answered", evidence: "required" }`
  - `in_progress` → `{ progress: "in_progress", evidence: "self_reported" }`
  - `implemented` → uendret (implementert + self_reported + documents)
  - `verified` → `{ progress: "verified", evidence: "verified" }` (beholdt for kompletthet, men UI-en tillater det ikke direkte)
- Fjern nå ubrukte grener (`fulfilled`, `partial`, `not_applicable`, `not_fulfilled`).

## Ikke inkludert
- Automatisk sending til uavhengig organ (fortsatt "Kommer"-flyt via dokumentkortet).
- Endring av filtertabs i kravlisten — mapping via `bucketOf(progress)` fortsetter å fungere.
- Endring av `RequirementCard.tsx` / `VendorControlsTab.tsx` — samme mønster kan speiles senere.
