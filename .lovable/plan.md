# Sara-teaser i aktivitetsdialogen

Når brukeren åpner dialogen for å registrere en aktivitet på en leverandør, skal de få en liten, avvisbar teaser for den lokale compliance-agenten Sara. Teaseren skal ikke hindre brukeren i å fortsette med aktiviteten.

## Hva som bygges

### 1. Ny teaser-komponent
`src/components/agents/SaraActivityTeaser.tsx` — en liten, kompakt boks som:
- Kun vises når Sara ikke er installert (`useSaraAgent().installed === false`).
- Har en "Lukk" / "Ikke nå"-knapp som skjuler teaseren og lagrer valget i `localStorage` (nøkkel: `mynder.sara.activityTeaser.dismissed`).
- Viser Sara-ikonet og en kort, salgsvennlig tekst om automatisk ROS-analyse og kontinuerlig overvåking av leverandøren.
- Har en CTA-knapp "Les mer" / "Se Sara" som åpner `SaraOnboardingDialog`.
- Støtter både norsk og engelsk via `isNb`-mønsteret.

### 2. Integrasjon i `RegisterActivityDialog.tsx`
- Importer `SaraActivityTeaser` og `SaraOnboardingDialog`.
- Plasser teaseren øverst i skjemaet, rett under dialogtittelen, slik at den er synlig uten å kreve scrolling.
- Hvis brukeren har installert Sara, vises teaseren ikke.
- Etter at brukeren lukker teaseren, skal den fortsatt ikke vises i samme dialogøkt eller senere økter.

### 3. Tekster
Nye nøkler i `src/locales/nb.json` og `src/locales/en.json` under `saraActivityTeaser`:
- `title` — "Slipp manuell ROS-analyse av leverandører"
- `description` — "Sara er din lokale compliance-agent. Hun overvåker leverandøren automatisk og varsler deg når noe endrer seg — uten at dokumentene forlater din infrastruktur."
- `cta` — "Se hvordan Sara fungerer"
- `dismiss` — "Lukk"

### 4. Oppførsel
- Teaseren er ikke-blokkerende; brukeren kan fylle ut aktivitetsskjemaet som normalt.
- Klikk på CTA åpner `SaraOnboardingDialog` (samme komponent som brukes andre steder i appen).
- Når onboarding-dialogen lukkes, returnerer brukeren til aktivitetsskjemaet.

## Teknisk
- Ingen backend-endringer eller nye tabeller.
- Gjenbruker `useSaraAgent` og `SaraOnboardingDialog`.
- `localStorage` brukes kun for avvisningsstatus, ikke for forretningsdata.
- Apple-lik minimal stil med semantiske tokens (`bg-primary/[0.03]`, `border-primary/20`).
