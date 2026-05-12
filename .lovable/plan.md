# Demo: Aktiver TrustProfile (førstegangs-onboarding på Trust Center)

## Mål
Når en bruker som har startet med **Mynder Core** (uten Trust Profile) går inn på `/trust-center/profile` for første gang, skal en ny veiledet flyt aktivere profilen. Lara henter mest mulig automatisk fra leverandørens hjemmeside, og brukeren bekrefter/justerer i en smidig wizard som dekker alle feltene som finnes i preview + edit.

## Trigger og inngang
- Sjekk i `TrustCenterProfile.tsx`: hvis `asset` mangler eller `lifecycle_status !== "active"` og brukeren ikke har sett wizarden før (flag i `localStorage: mynder.trustprofile.activated`), vis ny komponent `ActivateTrustProfileWizard` som modal-overlay over selve siden.
- Knapp "Aktiver Trust Profile" i toppen av siden for å åpne wizarden manuelt etterpå.
- Demo seedes via samme `seedDemoTrustProfile()` som finnes, men bare ved fullført wizard.

## Wizard-struktur (5 steg)

**Steg 0 – Velkommen / informasjon**
- Forklarer at Mynder nå lager en egen, publiserbar Trust Profile.
- Viser hva profilen inneholder (badges: Bedriftsinfo, Kontakter, Personvern, Sikkerhet, Dokumenter, Underleverandører).
- CTA: "La Lara starte" + sekundær "Jeg fyller ut selv".

**Steg 1 – Organisasjon & verifisering**
- Inputs: land (default NO), selskapsnavn, org.nr.
- Gjenbruker `useBrregLookup` for autoutfylling fra Brønnøysund (samme mønster som `CreateTrustProfileModal`).
- Verifiseringsstatus vises som grønn pill når match funnet.
- Hjemmeside-URL felt (auto-foreslått fra brreg-domene hvis tilgjengelig, ellers brukerinput).

**Steg 2 – Lara skanner hjemmesiden**
- Viser animert "Lara analyserer framdrift.no…" panel med live-checklist:
  - Beskrivelse av virksomheten
  - Personvernerklæring
  - Sikkerhetsside / Trust-side
  - Kontaktpersoner (DPO, sikkerhet, support)
  - Sertifiseringer nevnt på siden (ISO 27001, GDPR osv.)
  - Underleverandører/sub-processors
- I demo bruker vi forhåndsdefinerte mock-funn (ingen ekte scraping nødvendig). Bygges som faked progressive reveal med `setTimeout`-sekvens (700–1200 ms per punkt) – konsistent med `useDemoController`-mønsteret.
- Resultat: en "Lara fant X felter" oppsummering.

**Steg 3 – Bekreft og juster (samlet skjema, smidig)**
Ett scrollbart skjema gruppert i kort, alle felter forhåndsutfylt fra Lara. Bruker kan endre inline.
Felter dekker det som finnes i preview/edit (refererer eksisterende seksjoner i `src/components/trust-center/edit/*`):
- **Bedrift**: navn, org.nr, beskrivelse, bransje, antall ansatte, land/region, hjemmeside, logo.
- **Kontakter**: hovedkontakt, DPO, CISO/sikkerhet, support-epost (`ContactsSection`).
- **Personvern**: lenke til personvernerklæring, juridisk grunnlag, dataminimerings-uttalelse (`PrivacySection`).
- **Sikkerhet**: kryptering, MFA, hendelseshåndtering, sertifiseringer (`SecurityDetailsCard`).
- **Datalagring**: regioner, sub-processors (`DataStorageSection` + `AIVendorsSection`).
- **Dokumenter**: foreslåtte dokumenter Lara fant lenker til (`DocumentationSection`).
Hver Lara-utfylte verdi får liten lilla `Sparkles`-badge "Foreslått av Lara".

**Steg 4 – Forhåndsvisning & publisering**
- Embed mini-versjon av `TrustCenterProfile` preview-tab i en read-only `iframe`-style container.
- To CTA: "Publiser profil" (kjører `seedDemoTrustProfile()` + setter `publish_mode = "public"` + `lifecycle_status = "active"`) eller "Lagre som utkast".
- Suksess: konfetti-aktig toast + lukker wizard, scroller til toppen av profilen som nå viser ferdig data + grønn "Publisert" badge.

## Filer som skal opprettes
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx` – hovedmodal med stegnavigasjon.
- `src/components/trust-center/activate/LaraWebsiteScanStep.tsx` – animert scan-step.
- `src/components/trust-center/activate/ConfirmFieldsStep.tsx` – samlet redigeringsskjema.
- `src/components/trust-center/activate/PreviewPublishStep.tsx` – preview + publiseringsknapper.
- `src/lib/demoTrustActivation.ts` – mock Lara-funn (firmabeskrivelse, kontakter, personvern-URL, sikkerhetsfunn, sub-processors, sertifiseringer) for et par demo-domener (framdrift.no + generisk fallback).

## Filer som endres
- `src/pages/TrustCenterProfile.tsx`: 
  - Legg til state `showActivateWizard` basert på localStorage-flag + asset-status.
  - Render `<ActivateTrustProfileWizard />` når aktiv.
  - Erstatt eksisterende "Bruk demo"-knapp med "Aktiver Trust Profile"-CTA i header når profil ikke er aktivert.
- `src/lib/demoSeedTrustProfile.ts`: utvid med en `seedFromActivation(values)` som tar brukerens bekreftede verdier istedenfor faste konstanter.

## Tekniske detaljer
- Ingen backend-endringer eller nye tabeller – skriver til eksisterende `company_profile`, `assets` (self), `evidence_checks` via samme mønster som `seedDemoTrustProfile`.
- All "scraping" er simulert i frontend (demo). Ekte Firecrawl/edge function lages ikke i denne iterasjonen – arkitekturen lar oss bytte `demoTrustActivation.ts` med ekte edge function senere uten UI-endringer.
- i18n: nye strenger legges i `src/locales/nb.json` og `en.json` under `trustCenter.activate.*`.
- Design: følger Apple-minimal + lilla primær (#5A3184). Bruker eksisterende `Card`, `Dialog`, `Progress`, `Sparkles`-ikon for Lara-markeringer.
- Tilgjengelighet: full tastaturnavigasjon, fokushåndtering mellom steg, ESC for å lukke (med bekreftelse hvis data finnes).

## Akseptanse
- Førstegangs-besøk på `/trust-center/profile` (uten aktiv profil) viser velkomst-modalen.
- Brreg-oppslag fyller selskapsnavn/org.nr.
- Lara-scan-step viser progressive funn og en oppsummering.
- Bekreft-step har alle felter fra preview/edit forhåndsutfylt med Lara-badges.
- Publisering oppdaterer profilsiden + setter localStorage-flagget slik at modalen ikke vises igjen.
- "Aktiver Trust Profile"-knapp i header lar bruker kjøre flowen igjen ved behov.
