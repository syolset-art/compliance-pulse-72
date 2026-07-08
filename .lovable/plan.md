## Mål

Når et krav har status **Verifisert**, må det være tydelig at verifiseringen er gjort av en uavhengig ekstern aktør, hvem det er, når det ble gjort, og hvem internt som har bekreftet dette. Dokumentasjonen skal fortsatt være tilgjengelig, men skal knyttes til verifikatoren.

## Endringer

### 1. Datamodell (`src/lib/requirementStatusModel.ts`)

Utvid `RequirementUiState` med et strukturert `verification`-objekt (kun brukt når `progress === "verified"`):

- `externalVerifier`: navn (f.eks. "BDO Norge AS"), person (f.eks. "Erik Solheim, Lead Auditor"), standard (f.eks. "ISO 27001:2022"), dato, rapportreferanse.
- `internalConfirmer`: navn, rolle, dato — personen internt som har bekreftet at ekstern uavhengig aktør er brukt.

Fjern `attestedBy` fra de to verifiserte demo-casene og erstatt med `verification`-blokk. Sett `verifiedBy` + `verifiedAt` på dokumentene som faktisk er verifisert av ekstern aktør (typisk attestasjon/sertifikat), slik at "Verifisert av uavhengig organ"-badgen på dokumentet blir riktig.

### 2. Expanded panel (`FrameworkRequirementsList.tsx`)

Legg til en ny verifikasjonsboks i det utvidede panelet, plassert rett over dokumentasjonslisten, som kun vises når `state.progress === "verified"` og `state.verification` finnes:

```text
┌─ Verifisert av uavhengig aktør ────────────────────┐
│  BDO Norge AS · ISO 27001:2022                      │
│  Erik Solheim, Lead Auditor · 8. juli 2026          │
│  Rapport: BDO-2026-0472                             │
│  ─────────────────────────────────────────────────  │
│  Bekreftet internt av                               │
│  Vilde Gjellestad, Compliance Lead · 10. juli 2026  │
└─────────────────────────────────────────────────────┘
```

Design:
- Outline-kort med `border-success/40`, subtil `bg-success/5`.
- Øvre seksjon: ShieldCheck-ikon (success) + ekstern aktør, revisor-person, standard, dato, rapportreferanse.
- Skillelinje, deretter nedre seksjon: UserCheck-ikon (success) + intern bekrefter, rolle, dato.
- Kompakt (text-sm/text-xs), Apple-minimal, ingen fylte fargefelt.

### 3. Dokumentliste

For dokumenter med `verificationStatus === "verified"`: vis `verifiedBy` og `verifiedAt` som en liten linje under filnavnet (f.eks. "Verifisert av BDO Norge AS · 8. juli 2026"), i tillegg til den eksisterende badgen. Ingen endring for egenrapporterte dokumenter.

## Ikke i scope

- Ingen backend/schema-endringer — dette er demo-UI-state.
- Ingen endring av statusbadgen til høyre i rad-header.
- Ingen ny arbeidsflyt for å registrere ekstern verifisering (kommer separat).