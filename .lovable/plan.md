# Agentforslag i «Hva brukes leverandøren til?»

I dag står det tekstknapper («Foreslå med Lara», «La Lara foreslå») og hele merkelappspaletten er alltid synlig. Det tar mye plass og forteller ikke at det allerede finnes et forslag som skal godkjennes.

## Ny oppførsel

**Agentikon i stedet for tekstknapp**
Tekstknappen erstattes av et lite rundt agentikon (samme form som Sara-ikonet, med «L» for Lara) med tooltip: «Lara har foreslått dette – godkjenn eller rediger». Ikonet står ved siden av tittelen.

**Uten Sara — Lara foreslår, brukeren godkjenner**
Kortet viser Laras forslag i komprimert form: agentikon, de foreslåtte bruksmerkene som ren tekst, og forslagsteksten. To handlinger: **Godkjenn** og **Rediger**. Merkelappspaletten og fritekstfeltet vises først når brukeren trykker Rediger. Etter Godkjenn vises verdiene som bekreftet med agentikon og en diskret «Rediger»-lenke.

**Med Sara installert — allerede bekreftet**
Kortet viser Sara-ikonet og at innholdet er kartlagt lokalt og allerede bekreftet av brukeren. Ingen godkjenn-knapp, ingen forslagsboks. Kun verdiene og en diskret «Rediger»-lenke hvis noe skal overstyres.

**Prosesser-kortet (AISuggestTextarea)**
Samme prinsipp: «La Lara foreslå» blir et agentikon med tooltip i stedet for tekstknapp. Selve forslagslisten som allerede finnes beholdes uendret.

Alt på norsk og engelsk.

## Teknisk

- Ny `src/components/agents/LaraIcon.tsx` etter mønster fra `SaraIcon` (rund «L», primærfarge).
- `src/components/asset-profile/usage/VendorPurposeCard.tsx`: ny prop `saraInstalled`; tre visningstilstander (forslag / bekreftet / redigering) styrt av lokal `editing`-state og om `purpose`/`tags` allerede er satt. Godkjenn kaller eksisterende `onSavePurpose` + `onToggleTag` med Laras forslag.
- `src/components/asset-profile/tabs/VendorUsageTab.tsx`: sender `saraInstalled` (finnes allerede via `useSaraAgent`) og de foreslåtte merkelappene til kortet.
- `src/components/asset-profile/AISuggestTextarea.tsx`: knappen blir ikonknapp med `Tooltip`.
- Ingen databaseendringer.
