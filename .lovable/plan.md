## Mål

Førstegangs-aktivering skal være en mild introduksjon til hvilke felt vi spør om — ikke et fullstendig redigeringsverktøy. Brukeren skal kunne gå gjennom uten å lese mye, og finpusse alt i **Rediger profil** etterpå.

Prinsipp: **én ting per steg, kort tekst, ingen tips-bokser.**

---

## Endringer per steg

### Felles header (gjelder alle steg)
- Behold steg-indikatoren (stepper med tall + label) — den er allerede ren.
- Fjern den lange ingressen under tittelen. Erstatt med **én kort setning** per steg (maks ~10 ord).
- Fjern det doble headeret (Lara-bobla + den store H2). Behold kun Lara-bobla med Lara-intro + en liten "Steg X av 7"-pill. Tittelen blir overflødig når Lara allerede sier det samme.
- Fjern `Progress`-baren under headeren (steppern viser allerede progresjon).

### Steg 1 — Organisasjon
- Allerede ryddig når brukeren er innlogget (kort bekreftelseskort + nettside-spørsmål). Ingen endring.

### Steg 2 — Lara skanner
- Ingen endring (auto-steg).

### Steg 3 — Bekreft virksomhet  *(stor forenkling)*
Nå: beskrivelse + 4 kontaktroller (hoved, DPO, sikkerhet, beredskap) med ekstra DPO/Kontakt-toggle og en stor lyspære-tips-boks.

Forenkles til **kun to felt**:
1. Beskrivelse (Lara-utfylt)
2. **Hovedkontakt** (navn + e-post)

Fjern fra aktivering:
- DPO/Personvern-rad + DPO/Kontakt-toggle
- Sikkerhetskontakt-rad
- Beredskapsansvarlig-rad (navn/e-post/telefon)
- Lyspære-tips-boksen om "mindre selskaper"

Legg til én liten footnote (12px, muted): *"Du kan legge til personvern-, sikkerhets- og beredskapskontakter senere i Rediger profil."* DPO/sikkerhets-/beredskapsfelt i `ActivationValues` settes fortsatt (tomme strenger) så seedingen ikke knekker.

### Steg 4 — Dokumenter
- Behold listen, men fjern eventuelle ekstra info/tips-paneler. Legg til kort tekst: *"Valgfritt. Du kan også laste opp senere."*

### Steg 5 — Kritiske leverandører
- Behold leverandørradene.
- **Fjern** upload/URL-blokken for samlet underleverandørliste fra aktivering (flyttes til Rediger profil). State + analyse-koden beholdes, men UI-blokken rendres ikke i veiviseren.
- Reduser intro-tekst til én linje.

### Steg 6 — Modenhet  *(stor forenkling)*
Nå: stor info-boks + alle 15 spørsmål synlige på én side, 4 områder utbrettet.

Endres til:
- Fjern den store Lara-info-boksen øverst. Erstatt med én linje: *"Lara har svart for deg. Bekreft eller juster."*
- Vis hvert av de 4 områdene som en **kollapsbar Card** (Governance, Operations, Privacy, Third-party). Standard: alle kollapsert, med en liten oppsummering per område (f.eks. "5 spørsmål · 3 bekreftet av Lara").
- Bruk eksisterende `Card` + en enkel `button` med chevron som toggle (ingen ny avhengighet). Spørsmålene under er uendret.
- Fjern Tips/Regelverk-paragrafene inni info-boksen.

### Steg 7 — Synlighet  *(forenkling)*
Nå: PartnerSelectionBlock + Visibility på samme steg.

Endres til:
- **Fjern PartnerSelectionBlock fra aktivering**. Behold koden og state; partner kan settes i Rediger profil. (Hvis `partnerStatus === "auto"` fra auto-deteksjonen, bevar den stille i state — den seedes uten å vise blokk.)
- Fjern krav i `disabled`-logikken på Fullfør-knappen om at `partnerStatus !== null`.
- Steget viser kun synlighetsvalg + den korte forklaringen.

---

## Tekniske detaljer

Filer som endres:
- `src/components/trust-center/activate/ActivateTrustProfileWizard.tsx`
  - `header`-blokken (linje 511–550): fjern H2 + ingress + Progress, behold bare en liten steg-pill.
  - `ConfirmStep` (linje 1083–1174): fjern rader for `privacy`, `security`, `incident`; fjern lyspære-boks; legg til footnote-tekst.
  - `MaturityStep` (linje 1260–1379): erstatt info-boks med én linje; pakk hvert område i kollapsbar Card med lokal `useState` for åpen/lukket per område.
  - `CriticalVendorsStep` (linje 1390+): fjern subprocessor upload/URL-UI-seksjonen (behold props/state inntakt).
  - Steg 7-blokken (linje 622–650): fjern `PartnerSelectionBlock`-render.
  - `handlePublish` (linje 408+): fjern partner-disabled-krav i footer (linje 678–681).
  - `STEP_LABELS` og `STEP_LABELS` kan beholdes uendret — antall steg er det samme.

Ingen endringer i:
- `seedFromActivation` / `ActivationValues`-typen (alle felter fortsatt sendt, bare tomme der UI er fjernet)
- `CriticalVendorsSection` / `CompanyInfoForm` i Rediger profil (de viser allerede disse feltene)
- Modenhet-datastruktur eller Lara-skanningslogikk

## Validering
Etter implementering: åpne aktiveringen, gå gjennom alle steg, verifiser at steg 3, 6 og 7 er merkbart kortere og at Fullfør fungerer uten å fylle ut partner.
