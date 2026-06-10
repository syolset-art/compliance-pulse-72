## Mål

Seksjonen **Dokumentasjon** på Trust Profile skal ikke lenger fungere som et generelt opplastingsbibliotek (policyer, sertifikater, generelle filer). Den skal kun vise dokumenter som er **delt med utvalgte kunder** — typisk:

- Signerte databehandleravtaler (DPA)
- Pentest-rapporter
- ROS-/risikoanalyser
- Andre konfidensielle rapporter rettet mot navngitte mottakere

Generelle, offentlig synlige bevis (policyer, sertifikater, ISO-attestasjoner osv.) skal i stedet ligge knyttet til etterlevelse / kontrollområder, ikke her.

## Endringer

### 1. Rebrand seksjonen
- `src/components/trust-center/edit/DocumentationSection.tsx`
  - Tittel: **«Delt dokumentasjon»** / "Shared documentation"
  - Undertekst: *"Avtaler og rapporter du har delt med utvalgte kunder — f.eks. signerte databehandleravtaler, pentest-rapporter og ROS-analyser. Kun mottakere du gir tilgang ser disse."*
  - Ikon: `Lock` / `ShieldCheck` for å signalisere konfidensialitet.

### 2. Begrens dokumenttyper
Erstatt dagens fire grupper med kun de typene som er kunde-spesifikke:
- **Databehandleravtaler** (`dpa`)
- **Pentest-rapporter** (`pentest`)
- **ROS / Risikoanalyser** (`risk_assessment`)
- **Andre rapporter** (`report`)

Policy / sertifikat-opplasting fjernes herfra (flyttes konseptuelt til etterlevelsesbevis senere — utenfor scope nå).

### 3. Tilgang er obligatorisk per dokument
- Når et nytt dokument lastes opp, settes `visibility = "restricted"` som default (ikke `visible`).
- Rett etter opplasting åpnes `DocumentAccessDialog` automatisk slik at bruker må velge minst én mottaker (e-post eller nettverkskontakt) før dokumentet er aktivt.
- Hvert listeoppføring viser:
  - Filnavn
  - Liten chip med antall mottakere: *"Delt med 3 kunder"* (lest fra `trust_document_grants`, filtrert på `revoked_at IS NULL`)
  - Handlinger i meny: **Administrer tilgang**, Erstatt, Fjern. «Skjul fra profil» fjernes — synlighet styres via tilgangsliste.

### 4. Tom tilstand
Når ingen dokumenter finnes: forklarende kort som beskriver hva denne seksjonen er ment for, med CTA «Last opp og del med kunde».

### 5. Filtrering av dataspørringen
`useQuery(["self-trust-documents", asset.id])` skal kun hente rader hvor `document_type IN ('dpa','pentest','risk_assessment','report')` slik at gamle policy/certificate-opplastinger ikke vises her.

## Utenfor scope
- Migrere eksisterende policy/certificate-dokumenter til et annet sted.
- Endringer i den offentlige Trust Profile-visningen (TrustCenterProfile.tsx) — vi kommer tilbake til hvordan tilgangsstyrte dokumenter eventuelt eksponeres der.
- Nye databasekolonner — `trust_document_grants` og `vendor_documents.visibility/document_type` dekker behovet.

## Filer som endres
- `src/components/trust-center/edit/DocumentationSection.tsx` (hovedendring)
- Ev. liten justering i `TrustCenterEditProfile.tsx` kun hvis seksjonsoverskriften/anchor-navn må oppdateres.
