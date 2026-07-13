## Mål

Når brukeren setter status til **Verifisert** i statusnedtrekket i regelverkslisten (`/regulations`), skal en modal åpnes som tvinger fram bekreftelse av at det er en **ekstern, uavhengig part** som har verifisert, hvem det er, dato, og et **auto-forslag til gyldighetsperiode** før re-verifisering kreves.

## Endringer

### 1. Ny komponent: `src/components/regulations/VerifyRequirementDialog.tsx`

Modal (shadcn `Dialog`) som åpnes fra `FrameworkRequirementsList`. Felter:

- **Type verifikator** (radiogruppe, styrer auto-forslag):
  - Eksternt revisjonsselskap / sertifiseringsorgan (f.eks. BDO, DNV, Nemko) — auto 12 mnd
  - Sertifisering ISO/IEC (ISO 27001, 27701, 9001) — auto 36 mnd (årlig oppfølging)
  - SOC 2 Type II-rapport — auto 12 mnd
  - Penetrasjonstest / teknisk revisjon — auto 12 mnd
  - Attestasjonsbrev fra uavhengig part — auto 12 mnd
- **Navn på uavhengig part** (påkrevd, fritekst — org.navn)
- **Person / rolle** (valgfritt — f.eks. «Erik Solheim, Lead Auditor»)
- **Standard / rammeverksreferanse** (valgfritt — f.eks. «ISO 27001:2022»)
- **Rapportreferanse** (valgfritt)
- **Verifiseringsdato** (dato-picker, default i dag)
- **Gyldig til** (dato-picker, forhåndsutfylt basert på type; kan overstyres). Viser hjelpetekst «Foreslått basert på {type}. Endre om nødvendig.»
- **Bekreftelseshuk** (påkrevd): «Jeg bekrefter at ovennevnte part er uavhengig av vår virksomhet og har verifisert dette kravet.»

Knapper: Avbryt / Registrer verifikasjon (disabled til navn + huk er satt).

Utsteder resultat `{ verifierType, name, person?, standard?, reportRef?, date, validUntil }` til forelder.

### 2. `src/components/regulations/FrameworkRequirementsList.tsx`

- I `<select>` `onChange`: hvis `next === "verified"`, **ikke** kall `handleStatusChange` direkte — sett i stedet `verifyingId = req.requirement_id` og åpne dialogen. Alle andre statuser går som før.
- Erstatt eksisterende enkle `confirmVerification` (bruker kun navn+dato) med en variant som tar hele resultatet fra dialogen og skriver:
  - `progress: "verified"`
  - `evidence: "verified"` (eller `"revalidation_due"` hvis `validUntil` er innen 60 dager)
  - `revalidationDaysLeft` beregnet fra `validUntil`
  - `verification.externalVerifier`: `{ name, person, standard, date, reportRef }`
  - `verification.internalConfirmer`: gjeldende bruker (samme som i dag: «Vilde Gjellestad» i demo)
  - Legg til nytt `EvidenceDocument` med `verificationStatus: "verified"`, `verifiedBy: name`, `verifiedAt: date` slik at det vises i evidence-listen.
- Hvis brukeren avbryter dialogen: rull tilbake selectens visuelle verdi (styrt via `state.progress` som ikke endres, så selecten reflekterer forrige verdi automatisk).
- Fjern de gamle inline `verifyName` / `verifyDate` state-variablene til fordel for dialogens interne state.

### 3. `src/lib/requirementStatusModel.ts`

- Utvid `VerificationInfo.externalVerifier` med `validUntil?: string` (ISO-dato).
- Legg til hjelper `suggestValidityMonths(type: VerifierType): number` og typeliste `VERIFIER_TYPES` (id, labelNb, labelEn, defaultMonths) — brukes både av dialog og evt. framtidig kort.

### 4. i18n

- Alle strenger i dialogen ligger inline med `isNb`-toggle, i tråd med resten av filen. Ingen nye nøkler i `nb.json`/`en.json` nødvendig (matcher eksisterende mønster i denne visningen).

## Tekniske detaljer

```text
select onChange
  ├─ next !== "verified"  → handleStatusChange (uendret)
  └─ next === "verified"  → openVerifyDialog(reqId)
                              └─ onConfirm(result) → applyVerification(reqId, result)
                              └─ onCancel        → lukk uten endring
```

Auto-forslag: `validUntil = addMonths(date, VERIFIER_TYPES[type].defaultMonths)`. Endring av «Type verifikator» oppdaterer `validUntil` med mindre brukeren har redigert feltet manuelt (spor via `validUntilDirty`-flag).

## Utenfor scope

- Persistens mot Supabase (`vendor_documents.verification_*` finnes allerede, men denne siden bruker lokal `uiStates`; migrering til DB er en egen oppgave).
- E-post/kalendervarsel når `validUntil` nærmer seg (kan hektes på `check-evidence-freshness`-funksjonen senere).
- Endring av tilsvarende flyt i `VendorControlsTab` / `RequirementCard` — samme dialog kan gjenbrukes senere.