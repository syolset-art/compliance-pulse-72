# Erstatt «Agentisk Trust Profile»-banneret med CTA

Teksten «Leverandøren tok eierskap til sin Agentiske Trust Profile …» vises i `VendorStatusBanner` når status er `claimed`. Siden Trust Profile / Agentisk Trust Profile er fase 2 og ikke aktivert, skal denne erstattes med en knapp som inviterer leverandøren til å registrere seg i Trust Engine.

## Hva som bygges

### 1. Endre banneret i `VendorStatusBanner.tsx`
- Erstatt `status.key === "claimed"`-blokken (linje 268–285) med en CTA-banner.
- Banneret skal ha en kort, nøytral forklaringstekst og en primærknapp.
- Knappetekst: **«Be leverandør registrere seg i Trust Engine»** (NB) / **«Ask vendor to register in Trust Engine»** (EN).
- Klikk på knappen åpner eksisterende `InviteVendorDialog` (`setInviteOpen(true)`).
- Stil: nøytral bakgrunn (`bg-muted/40 border border-border`) i stedet for grønn success, siden dette ennå er en urealisert handling.
- Behold vertikal stripe, statuslabel og donut uendret (brukeren har ikke bedt om å endre disse).

### 2. To-språklige nøkler
- Legg til nøkler i `src/locales/nb.json` og `src/locales/en.json` under ny seksjon `vendorStatusBanner.claimed`:
  - `title` — kort forklaring, f.eks. «Få leverandøren til å dele data løpende».
  - `description` — «Trust Engine er fase 2. Inviter leverandøren til å registrere seg, så får du samlet inn informasjonen du trenger for god leverandørstyring.»
  - `cta` — «Be leverandør registrere seg i Trust Engine» / «Ask vendor to register in Trust Engine».

### 3. Ingen backend
- Bruker eksisterende `InviteVendorDialog` og `setInviteOpen`.
- Ingen nye tabeller, endepunkter eller migrasjoner.

## Akseptansekriterier
- Banneret viser ikke lenger påstanden om at leverandøren har tatt eierskap.
- Knappen åpner den eksisterende invitasjonsdialogen.
- Tekstene finnes på både norsk og engelsk.
- Visuell stil følger eksisterende tokens (ingen hardkodede farger).
