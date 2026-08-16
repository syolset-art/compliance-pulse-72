# Review av planen «Dokument hub: opplasting, veiledende dokumentasjon og MCP-demo»

## Svar på spørsmålene

### 1. Motsetninger mot tidligere planer

Én reell motsetning, én tilsynelatende.

- **Reell:** `requirement_evidence.document_id` har i dag en FK direkte til `vendor_documents(id)` (bekreftet: `requirement_evidence_document_id_fkey ... REFERENCES vendor_documents(id) ON DELETE CASCADE`). Å laste opp til `uploaded_documents` og deretter skrive bevis er derfor umulig uten skjemaendring. Punkt 1 i planen kolliderer med punkt «Analyse skrives til requirement_evidence … uten endringer».
- **Tilsynelatende:** prinsippet om at hub-en er «lesende» gjaldt normaliseringen (`documentHub.ts` bygger bare visningsmodell). Å legge opplasting i hub-en bryter ikke det, så lenge selve skrivingen skjer i en delt lib og ikke i `buildHubDocuments`. Anbefaling: behold `documentHub.ts` rent lesende, legg skriving i `src/lib/requirementEvidence.ts` (som allerede gjør nøyaktig dette).

### 2. Bøtte- og tabellnavn

- Storage-bøtter som finnes: `company-logos` (public), `documents` (privat), `vendor-documents` (privat). Begge navnene i planen finnes, men bevis-flyten bruker `vendor-documents`, ikke `documents`.
- `uploaded_documents` finnes, men har bare: `id, user_id, file_name, file_path, file_size, mime_type, analysis_status, analysis_results, created_at, updated_at`. Den har **ikke** `display_name`, `document_type` eller `asset_id`. Dialogen i planen (visningsnavn + dokumenttype + kontekst) kan altså ikke lagres der.
- I `documentHub.ts` blir `uploaded_documents`-rader hardkodet til `documentType: "other"`, `module: "other"`, `contextLabel: null` og `uploadedBy: row.user_id` (rå UUID). Kolonnen «Registrert av» ville vist en UUID, og modul-/type-filtrene ville ikke virke for hub-opplastinger.

### 3. Hvordan «Analyser nå» bør skrive

Anbefalt: **speil hub-opplastinger inn i `vendor_documents` på egen organisasjon**, akkurat som Regelverk-bevis gjør i dag. Ingen skjemaendring, ingen ny kildekolonne, og dokumentet får riktig modul/kontekst i hub-en automatisk (`buildHubDocuments` setter allerede modul `framework` for dokumenter som har en `requirement_evidence`-rad).

Konkret: gjenbruk `persistRequirementEvidence()` i `src/lib/requirementEvidence.ts` (laster opp til `vendor-documents`, inserter i `vendor_documents` med `asset_id` = self-asset, deretter én `requirement_evidence`-rad per krav). To justeringer:

- Funksjonen krever i dag både en self-asset og innlogget bruker, ellers returnerer den `null` uten feilmelding. Hub-dialogen må vise en tydelig melding hvis lagring ikke er mulig.
- Splitt den i to steg, siden hub-flyten tillater «Gjør det senere»: `persistDocument()` (fil + `vendor_documents`-rad) og `linkRequirementEvidence()` (koblingsradene). «Analyser nå» kaller begge; «senere» kaller bare første.
- Tabellen har `UNIQUE (requirement_id, document_id)` — bruk `upsert` med `onConflict` slik at re-analyse av samme dokument ikke feiler.

«Ikke analysert»-merket trenger ingen ny kolonne: det er ganske enkelt et dokument uten rader i `requirement_evidence` (og uten treff i `buildComplianceCoverage`) — altså `!scoreDocIds.has(doc.id)`, som hub-en allerede beregner.

`uploaded_documents` bør ikke brukes til denne flyten i det hele tatt. Alternativet med egen kildekolonne (`source_table` + drop FK) frarådes: det svekker referanseintegriteten og krever endringer i både `fetchRequirementEvidence` (som joiner `vendor_documents`) og modenhetsberegningen.

### 4. FrameworkDocumentsDialog / MCP

- `src/components/regulations/FrameworkDocumentsDialog.tsx` finnes og bruker `documents`-bøtta + `framework_documents` med AI-klassifisering før lagring. Mønsteret (fil → AI-klassifisering → review → lagre) er gjenbrukbart som UX, men **ikke** som lagringsmål: den skriver framework-scopet, og krever `framework_id`.
- `src/lib/mcpAgentConnections.ts` finnes med `mcpServerUrl()`, `MCP_EXPOSED_TOOLS` (3 verktøy), `readMcpConnections()` og `hasMcpConnections()`, med localStorage som prototypelagring. `/mcp-agent-connections`-siden finnes. Panelet kan gjenbruke dette som planlagt. Merk at `mcpServerUrl()` returnerer `${origin}/api/mcp`, som ikke er et faktisk endepunkt — panelet må derfor merkes tydelig som demo/kommer, slik planen allerede sier.

### 5. Andre hull

- **Duplisert katalog.** Ny `src/lib/guidingDocuments.ts` overlapper med tre eksisterende filer: `requirementDocumentationHints.ts` (dokumentnavn per GDPR-artikkel), `frameworkEvidenceExpectations.ts` (forventet dokument per krav med status `received`/`agent_confirmed`/`missing`) og `documentDeliverables.ts`. Bygg fanen på disse i stedet for en fjerde katalog.
- **Cache.** Etter opplasting må `queryClient.invalidateQueries(["document-hub"])` og `["requirement-evidence", frameworkId]` kjøres, ellers står tabellen uendret i inntil 60 sekunder (`staleTime`).
- **Analysefunksjonen** `analyze-evidence-coverage` tar `documentText` og ett krav om gangen. Hub-opplasting mot «alle aktiverte regelverk» betyr mange kall; begrens til et forhåndsvalgt regelverk eller topp N kandidatkrav, og hent tekst via `analyze-document`/`classify-evidence-document` først.
- **Navnekollisjon:** ingen `src/components/documents/`-mappe finnes ennå — greit, men merk at `DocumentsTab.tsx` finnes under `asset-profile`.
- **Filtypebegrensning:** hub-dialogen bør akseptere samme typer som eksisterende opplastere, og vise størrelse (`vendor_documents` lagrer ikke `file_size`, så «Størrelse» blir tom for hub-opplastinger — vurder å utelate kolonnen for disse).

## Foreslåtte endringer i planen før godkjenning

1. Punkt 1: bytt lagringsmål fra `documents`-bøtte + `uploaded_documents` til **`vendor-documents`-bøtte + `vendor_documents` på egen organisasjon**, via delt lib.
2. Teknisk: `UploadHubDocumentDialog.tsx` gjenbruker `requirementEvidence.ts` (ikke `FrameworkDocumentsDialog`s lagring), og splitter persist i dokument- og koblingssteg med `upsert`.
3. Punkt 2: bygg «Veiledende dokumentasjon» på `frameworkEvidenceExpectations.ts` + `requirementDocumentationHints.ts` i stedet for ny `guidingDocuments.ts`.
4. Legg til cache-invalidering og et valg av regelverk i analysesteget.
5. Punkt 3 (MCP-panel) kan gjennomføres som beskrevet, merket som demo.
