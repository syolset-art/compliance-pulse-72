# Utvide wizarden fra 5 til 7 steg

I dag har `ActivateTrustProfileWizard` 5 steg (0–4). Vi utvider til 7 steg (0–6) ved å legge inn **Modenhet** etter dagens bekreft-steg, og **Dokumenter** før forhåndsvisning.

## Ny stegrekkefølge

| # | Navn | Endring |
|---|------|---------|
| 0 | Velkommen | uendret |
| 1 | Organisasjon | uendret |
| 2 | Lara-skanning | uendret |
| 3 | Bekreft (Om virksomheten + Kontakter) | uendret |
| 4 | **Modenhet — Ja/Nei/Senere** | NY |
| 5 | **Dokumenter** | NY |
| 6 | Forhåndsvis & publiser | flyttet fra 4 |

Progress-bar, "Steg X av 7", `next/back`-grenser og `canProceed` oppdateres tilsvarende.

## Steg 4 — Modenhet (kjernen)

En kompakt liste med 4 kontrollområder. Hvert spørsmål har en rad med:
- Spørsmålstekst
- Liten **Info-ikon** (hover/tooltip viser GDPR-artikkel — f.eks. "Art. 30", "Art. 28") — artikkelen vises *aldri* i hovedteksten
- Tre-knapp toggle: **Ja / Nei / Senere**
- Hvis Lara har forhåndsutfylt svar: liten Lara-pille med tooltip "Foreslått av Lara basert på [dokumentnavn]". Brukeren kan bekrefte (lar stå) eller overstyre.

### Kontrollområder og spørsmål (alle på norsk, eksakt som brukeren skrev)

**1. Styring** — eierskap, ansvar, dokumentasjon (5 spørsmål, knyttet til Art. 24, 13, 24, 30, 39)
**2. Drift og sikkerhet** — tekniske/organisatoriske tiltak (5 spørsmål, Art. 32, 32, 33, 32, 32)
**3. Personvern og datahåndtering** — GDPR-kjerne (5 spørsmål, Art. 6, 5(1c), 5(1e), 15–20, 44–49)
**4. Tredjepartsstyring** — databehandlere (4 spørsmål, Art. 30(1f), 28, 28(1)+35, 28(2))

Visuelt: hvert område er et `<Card>` med ikon (Users / ShieldCheck / Lock / Globe) og tittel, så liste av spørsmål under. Layout følger Apple-minimal stil (samme som dagens FieldGroup).

### Lara-forhåndsutfylling

Basert på funnene fra steg 2 (`scan.findings` + `scan.security` + `scan.privacy` + `scan.documents`), settes default for utvalgte spørsmål:
- Personvernerklæring publisert → "Ja" hvis `privacy.policyUrl` finnes
- Kryptering i hvile/transit → "Ja" hvis `security.encryption` nevnt
- MFA → "Ja" hvis `security.mfa` nevnt
- DPA signert med databehandlere → "Nei" hvis DPA mangler i scan
- Oversikt over databehandlere → "Ja" hvis `dataStorage.subProcessors.length > 0`
- Resten defaulter til **"Senere"** (ingen press på brukeren)

State lagres som `Record<questionId, "yes" | "no" | "later">`. Ferdige svar persisteres til Trust Profile metadata via eksisterende `seedFromActivation` (utvides med `maturityAnswers`).

## Steg 5 — Dokumenter

Enkel opplastingsliste som adresserer hull fra steg 4:
- Forhåndsdefinerte slots: **Personvernerklæring**, **Databehandleravtale (mal)**, **Informasjonssikkerhetspolicy**, **Hendelsesplan** (+ "Annet")
- Hver slot viser status: ✅ "Funnet av Lara" / ⬆️ "Last opp" / ⏭️ "Hopp over"
- Drag-and-drop område + `<input type=file>` per slot (mock i denne iterasjonen — lagres som metadata-referanse, faktisk filopplasting kan komme senere)
- Når bruker laster opp DPA: oppdater Steg 4-svaret "Har dere signert databehandleravtale" automatisk fra "Nei" → "Ja" (ved å mutere `maturityAnswers`-state). Vises som en liten toast: "Lara oppdaterte svaret i Personvern-området."

Knapp "Hopp over alle" tilgjengelig — alt er valgfritt.

## Steg 6 — Forhåndsvis & publiser

Dagens `PreviewStep` brukes uendret, men får tilleggs-summering nederst:
- "Modenhet: X av 19 spørsmål besvart (Ja/Nei), Y markert som «Senere»"
- "Dokumenter: Z lastet opp / oppdaget"

## Tekniske detaljer

**Filer som endres:**
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — utvid `Step`-typen til `0..6`, oppdater `next/back`/`canProceed`/header/progress, legg til to nye komponenter `MaturityStep` og `DocumentsStep`
- `src/lib/demoSeedTrustProfile.ts` — utvid `ActivationValues` med `maturityAnswers: Record<string,"yes"|"no"|"later">` og `documents: {slot, name, status}[]`, sørg for at `seedFromActivation` skriver disse til asset-metadata under `metadata.maturity` og `metadata.documents`

**Ny fil:**
- `src/lib/trustMaturityQuestions.ts` — eksporterer kontrollområder + spørsmål + GDPR-artikkel-referanser som typede konstanter, slik at Maturity-steget og senere drilldown-visninger kan dele samme kilde.

**Ingen backend-endringer** — alt lagres i eksisterende `assets.metadata`-JSON for self-asset.

**Ingen nye avhengigheter.**
