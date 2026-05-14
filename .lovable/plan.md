## Mål

På siste steg (Synlighet) i aktiveringsveiviseren, vis en seksjon øverst som avklarer om virksomheten er knyttet til en partner (MSP/MSSP/IT-partner/konsulent). Auto-deteksjon brukes når mulig; ellers må brukeren svare før de kan publisere.

## Endringer

### 1. Auto-deteksjon av partner ved aktivering
I `ActivateTrustProfileWizard.tsx`, last inn partner-status når veiviseren åpnes:
- Les `company_profile`: `managed_by_partner`, `partner_name`, `partner_company_id`, `partner_type` (via `usePartnerInfo`-mønsteret).
- Sjekk `msp_customers` for rader hvor aktiv organisasjon matcher (`customer_name` eller `customer_org_number`) — gir partner-kandidat fra MSP-siden.
- Hvis enten kilde bekrefter en partner → `autoDetected = true`, prefyll partner-info, vis bekreftelse uten å spørre.

### 2. Ny PartnerStep-seksjon (vises på Synlighet-steget — fortsatt 6 steg totalt)
Legges som første blokk i `VisibilityStep` (eller direkte i body for `step === 6`, før eksisterende synlighet-UI). Tre tilstander:

**A) Auto-detektert partner**
- Grønn bekreftelses-card med Lara-ikon: «Vi har registrert at [Partner] forvalter Trust Profilen din.»
- Checkbox (default på): «Vis partner-tilknytningen på Trust Profilen min.»
- Brukeren kan klikke «Endre» for å bytte til manuell tilstand.

**B) Ikke detektert — må svare**
- Spørsmål: «Er du knyttet til en partner som hjelper deg med sikkerhet, IT eller compliance?»
- Tre valg (radio-cards): `Ja, koblet til partner` / `Nei, vi forvalter selv` / `Vet ikke ennå`.
- Inntil et valg er gjort er «Publiser»-knappen disabled (oppdater `canNext`/publish-validering).

**C) Ja → velg partner**
- Søkefelt med kombinasjons-velger: søker i `company_profile` (type partner) og `msp_customers.partner` for matchende navn (Mynder-økosystem).
- Treff vises som klikkbare resultatkort (navn, type, evt. logo).
- Fallback: «Ikke i listen?» → fritekst-input for partnernavn + valgfri e-post + partner-type (dropdown: MSP / MSSP / IT-partner / Konsulent / Annet).
- Checkbox: «Vis partner-tilknytningen på Trust Profilen min» (default på).

### 3. State i wizard
Legg til:
```ts
const [partnerStatus, setPartnerStatus] = useState<"auto" | "yes" | "no" | "unknown" | null>(null);
const [partnerName, setPartnerName] = useState("");
const [partnerCompanyId, setPartnerCompanyId] = useState<string | null>(null);
const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
const [showPartnerOnProfile, setShowPartnerOnProfile] = useState(true);
```
Auto-deteksjon ved åpning setter `partnerStatus = "auto"` + prefyller felt.

### 4. Persistering ved publisering
I `handlePublish` → utvid `ActivationValues` med `partner`-felt og oppdater `seedFromActivation` (i `src/lib/demoSeedTrustProfile.ts`) til å skrive på `company_profile`:
- `managed_by_partner = (status === "auto" || status === "yes")`
- `partner_name`, `partner_company_id`, `partner_type`, `show_partner_on_trust_profile`
- Hvis status `"no"` → sett eksplisitt `managed_by_partner = false`.
- Hvis `"unknown"` → ikke endre eksisterende verdier.

### 5. Validering
Oppdater `canNext` på step 6 / publish-knappen:
```ts
if (step === 6) {
  if (partnerStatus === null) return false;          // må svare
  if (partnerStatus === "yes" && !partnerName.trim()) return false;
  // visibility validering (eksisterende public-akknowledgment) består
}
```

### 6. Tekster (norsk, Lara-tone)
- Auto: «Lara har sett at **{partnerName}** forvalter sikkerheten din. Bekreft at dette skal vises på Trust Profilen.»
- Manuelt: «Mange virksomheter får hjelp av en partner. Hvis du har en, viser vi det på profilen — det styrker tilliten.»
- Tooltip på «Vis på Trust Profilen»: «Andre ser at en kvalifisert partner forvalter Trust Profilen din.»

## Filer som endres

- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` — state, auto-load, ny PartnerStep-seksjon øverst i step 6, validering, publisering.
- `src/lib/demoSeedTrustProfile.ts` — utvid `ActivationValues` med partner-felt, skriv til `company_profile`.
- (Ny lokal komponent) `PartnerSelectionBlock` inne i samme fil eller egen fil under `src/components/trust-center/activate/`.

## Ut av scope

- Ingen endringer på selve Trust Profile-visningen (partner-bånn vises allerede når `managed_by_partner` er satt).
- Ingen nye DB-kolonner — alle felt finnes på `company_profile` allerede.
- Ingen endring av antall steg (forblir 6).
