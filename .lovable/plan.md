# Dokumentopplasting + AI-klassifisering + uavhengig verifisering

Utvider `ManualDocumentationDialog` og kravlisten slik at brukeren, når status settes til **Implementert**, kan laste opp et dokument, få det AI-klassifisert (dokumenttype + hvilket artikkelnummer det dekker), og deretter be om verifisering av uavhengig organ (markert "Kommer" foreløpig).

## Flyt

1. Bruker åpner et krav → **Manuell dokumentering**.
2. Velger status = **Implementert** → nytt opplastingspanel vises.
3. Drar/velger fil → kaller eksisterende `useClassifyEvidence` (edge function `classify-evidence-document`).
4. Resultat vises inline: dokumenttype, hvilket artikkel/kontroll-id den dekker, konfidens, kort AI-sammendrag. Bruker kan overstyre.
5. Ved lagring: status = `implemented`, `evidence = self_reported`, dokumentet legges på `RequirementUiState.documents`.
6. I ekspandert kravvisning: dokumentet listes med et nytt handling-panel:
   - **Be om verifisering av uavhengig organ** (knapp med "Kommer"-badge, disabled + tooltip).
   - **Last ned** attest (også "Kommer" når ikke verifisert enda).
7. Når verifisert (fremtidig): `progress = verified`, `evidence = verified`, bruker kan laste ned signert bevis.

## Filendringer

**`src/components/dialogs/ManualDocumentationDialog.tsx`** (utvid)
- Endre `onSave`-signatur til `(status, comment, doc?)` hvor `doc` = `{ file, classification?, articleRef? }`.
- Ved `status === "implemented"` (ny verdi i tillegg til dagens 4): render nytt `<EvidenceUploader />`-panel.
- Uploader-panel:
  - Dropzone (drag/drop + fil-input).
  - Under upload: spinner + "Lara analyserer dokumentet…".
  - Etter klassifisering: kort m/ `documentTypeLabel`, `supportedControls[]` (mappet til artikkelnr), konfidens-pill, `summary`. To Selects lar bruker overstyre type + artikkel. Fallback (lav konfidens/timeout) viser manuell dropdown.
  - Fjern-knapp for å bytte fil.
- Ved lagring bygger dialogen et `EvidenceDocument`-objekt: `{ name, kind, classification: { docType, articles, confidence, summary }, verificationStatus: "self_reported" }`.

**`src/lib/requirementStatusModel.ts`** (mindre utvidelse)
- Utvid `EvidenceDocument`:
  ```ts
  interface EvidenceDocument {
    name: string;
    kind: string;
    classification?: {
      docType: string;      // f.eks. "Databehandleravtale"
      articles: string[];   // f.eks. ["Art. 28", "Art. 32"]
      confidence: number;
      summary?: string;
    };
    verificationStatus?: "self_reported" | "pending_verification" | "verified";
    verifiedBy?: string;    // uavh. organ
    verifiedAt?: string;
  }
  ```
- Ingen endring i badge-config.

**`src/components/regulations/FrameworkRequirementsList.tsx`**
- I ekspandert visning, erstatt dagens enkle dokument-liste med et rikere kort per dokument:
  - Ikon + filnavn + `kind`.
  - Klassifisering-linje: `Databehandleravtale · dekker Art. 28, Art. 32 · 92% sikker` (kun hvis `classification` finnes).
  - Statuspille: "Egenrapportert" / "Til verifisering" / "Verifisert" (bruker eksisterende `EVIDENCE_CONFIG`).
  - Handlinger:
    - `Last ned` — aktiv når `verificationStatus === "verified"`, ellers disabled m/ tooltip "Tilgjengelig etter uavhengig verifisering".
    - `Be om verifisering` — knapp med liten `Kommer`-badge; klikk viser toast "Uavhengig verifisering kommer snart" og setter `verificationStatus = "pending_verification"` lokalt (så UI viser "Til verifisering").
- Håndter oppdatert `handleDocSave(id, status, comment, doc)` som setter `documents: [doc]` og `evidence: "self_reported"` ved implementert.

**`src/lib/evidenceStatus.ts`** *(sjekk)* — ingen endring nødvendig; alt går via `RequirementUiState`.

## Tekniske detaljer

- Gjenbruker eksisterende `useClassifyEvidence` hook og `classify-evidence-document` edge function — ingen nye backend-endringer.
- Mapping fra `supportedControls` → artikkelnummer skjer klient-side: bruk `req.requirement_id` som hint, ellers vis rå kontroll-ID.
- Ingen persistens (matcher dagens demo-modell — state kun i komponentens `useState`).
- "Kommer"-flyten er ren UI: knapp disabled/toast, ingen kall til bakenden.
- Alt oversettbart (NB/EN) via i18next-mønsteret som brukes ellers i filen.

## Ikke inkludert

- Ekte integrasjon mot uavhengig verifiseringsorgan.
- Persistens av opplastede filer i `documents`-bucket (kan legges til senere ved å bytte demo-state mot Supabase Storage + `vendor_documents`-rader).
- Endring av `RequirementCard.tsx` / `VendorControlsTab.tsx` — samme mønster kan speiles dit i en senere iterasjon.
