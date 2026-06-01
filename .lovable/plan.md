## Mål
I aktiveringsveiviseren for Trust Profile skal brukeren under **Organisasjon** (steg 1) også svare på om de har en partner som jobber med IT og sikkerhet. Svarer de ja, må de oppgi partnerens navn og aktivt akseptere at partneren får fullmakt til å oppdatere profilen.

## Endringer (kun frontend)

Fil: `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`

1. **Flytt partner-blokken fra steg 6 til steg 1 (Organisasjon).**
   - Eksisterende state (`partnerStatus`, `partnerName`, `partnerCompanyId`, `partnerType`, `showPartnerOnProfile`) gjenbrukes.
   - Legg til ny state: `partnerGrantAuthority: boolean` (default `false`) og `partnerAuthorityAccepted: boolean` (default `false`).
   - Auto-deteksjon (`managed_by_partner` / `msp_customers`) beholdes og forhåndsutfyller "Ja".

2. **UI under nettsted-verifisering i steg 1:**
   - Spørsmål: «Har dere en partner som jobber med IT og sikkerhet for dere?» med valg Ja / Nei / Vet ikke.
   - Ved **Ja**:
     - Tekstfelt: «Navn på partner» (påkrevd).
     - Checkbox: «Gi partneren fullmakt til å oppdatere Trust Profile på vegne av oss.»
     - Når checkbox er på vises kort forklaring + ekstra påkrevd checkbox: «Jeg bekrefter at jeg har myndighet til å gi denne fullmakten» (aksept).
   - Ved **Nei / Vet ikke**: ingen ekstra felter.

3. **Valideringsregel i `canNext` for steg 1:**
   - Krev at `partnerStatus` er valgt.
   - Hvis `partnerStatus === "yes"`: krev `partnerName.trim()`. Hvis `partnerGrantAuthority` er true: krev `partnerAuthorityAccepted`.

4. **Steg 6:** fjern partner-spørsmålet derfra (vises kun i steg 1 nå). Synlighet-delen beholdes uendret.

5. **Publisering (`handlePublish` / `seedFromActivation`-kall):** send med `partnerGrantAuthority` og `partnerAuthorityAccepted` der `partnerName`/`partnerStatus` allerede sendes, slik at fullmakts-status lagres sammen med partner-info. Ingen schema-endring i denne omgangen — feltene logges/persisteres på samme måte som dagens partner-felter.

## Tekst (norsk, kort og presis)
- Spørsmål: **«Har dere en partner som jobber med IT og sikkerhet?»**
- Fullmakt-tekst: **«Vi gir [partner] fullmakt til å oppdatere og vedlikeholde vår Trust Profile.»**
- Aksept: **«Jeg bekrefter at jeg har myndighet til å gi denne fullmakten.»**

## Ikke-mål
- Ingen endring i backend-tabeller eller RLS.
- Ingen endring i e-post/overlevering-flyt.
- Ingen endring i andre wizard-steg utover å fjerne duplisert partner-blokk fra steg 6.
