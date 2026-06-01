## Mål
Når man åpner Trust Center i sidemenyen, skal det ligge en egen menyoppføring «Aktiver Trust Profile» som åpner aktiveringsveiviseren i **manuell modus** (ingen autoplay), slik at brukeren kan klikke seg gjennom punktene selv.

## Endringer

### 1. `src/components/Sidebar.tsx` — Trust Center-undermeny
- Utvid `trustCenterItems` (linje 150) med et nytt punkt øverst eller rett under «Trust Profile»:
  - Label: `isNb ? "Aktiver Trust Profile" : "Activate Trust Profile"`
  - Icon: `Sparkles` (samme ikon Lara bruker i wizarden)
  - Bruker ikke `href`; håndteres som en `onClick`-knapp som:
    1. Nullstiller `localStorage.removeItem("mynder.trustprofile.activated")`
    2. Navigerer til `/trust-center/profile?activate=1&mode=manual`
    3. Dispatcher `window.dispatchEvent(new CustomEvent("open-activate-trust-wizard", { detail: { mode: "manual" } }))`
- Eksisterende «Demo: Aktiver Trust Profile»-knappen nederst i sidemenyen (linje ~825–840) beholdes uendret — den er for autoplay-demo. Den nye menyoppføringen er for manuell gjennomgang.
- Render menyoppføringen med samme aktiv-stil som de andre `trustCenterItems`, men som `<button>` i stedet for `<NavLink>` siden den ikke peker på en egen rute.

### 2. `src/pages/TrustCenterProfile.tsx` — Lytt på manuell modus
- I `useEffect`-en rundt linje 247–261 som lytter på `open-activate-trust-wizard` og leser `?activate=1`:
  - Les `event.detail?.mode` og `URLSearchParams.get("mode")`.
  - Lagre i `useState<boolean>` (f.eks. `wizardAutoPlay`) som settes til `false` når `mode === "manual"`, ellers `true` (uendret default for eksisterende demo-flow).
- Send denne videre som `autoPlay={wizardAutoPlay}` til `<ActivateTrustProfileWizard …/>`.

### 3. Ingen endringer i selve wizarden
`ActivateTrustProfileWizard` støtter allerede `autoPlay?: boolean` (linje 63–66). Når den er `false` advancer ikke wizarden automatisk, og brukeren klikker «Neste» selv — akkurat det brukeren ber om.

## Resultat
Brukeren får et tydelig menypunkt under Trust Center → «Aktiver Trust Profile» som åpner aktiveringsveiviseren steg for steg uten autoplay. Demo-knappen for opptak/autoplay forblir tilgjengelig som før.
