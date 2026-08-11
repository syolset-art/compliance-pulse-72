Oppdater Agentisk Trust Profile-dialog med MCP-valg

## Mål
Bevare manuell opplasting som standard i "Inviter til Agentisk Trust Profile"-dialogen, og legge til en tydelig, men tydelig merket V2/fremtidig, mulighet for å koble til leverandørens systemer via MCP.

## Endringer

### 1. Steg 3 i `InviteAgenticTrustCenterDialog.tsx` — leveringsmåte
- Introduksjonstekst i steg 3 byttes fra generell forklaring til "Velg leveringsmåte for dokumentasjon".
- Legge til en toggled/radio-gruppe med to valg:
  - **Manuell opplasting** (standard, valgt fra start).
  - **Koble til leverandørens systemer via MCP** (V2 / kommer senere).
- MCP-valget vises med et eget "V2"-badge og en kort forklarende tekst om at funksjonen ikke er klar ennå, men at Mynder vil støtte automatisk innhenting fra leverandørens systemer i fremtiden.
- Valget av MCP deaktiverer ikke resten av dialogen; dokumenttyper, kontaktpersoner og frist fortsetter som normalt, men det legges inn tydelig merking om at leveransen skjer manuelt inntil MCP aktiveres.

### 2. Visuell merking
- Bruk eksisterende muted- og primary-farger (ikke hardkodede farger).
- MCP-alternativet skal se "låst"/fremtidig ut (grået, med badge), uten å kunne klikkes aktivt inn som leveringsmåte i prototypen. Det skal allikevel være synlig og forståelig at det kommer.

### 3. Lagre valg
- Utvid `AgenticTrustCenterState` i `src/lib/agenticTrustCenter.ts` med valgfritt felt `deliveryMethod?: "manual" | "mcp"` (default `manual`).
- Ved lagring skrives `deliveryMethod` med tilstanden, slik at fremtidige visninger husker at MCP er ønsket, men ikke aktivert.

### 4. Påvirkning i `VendorRecommendedActionsCard.tsx`
- Hvis `deliveryMethod === "mcp"` og status er `invited`, vis en subtil hint-tekst i trust-profile-blokken: "MCP-kobling er planlagt — leverandøren laster opp manuelt inntil videre."

## Tekniske detaljer
- Filer: `src/components/asset-profile/guidance/InviteAgenticTrustCenterDialog.tsx`, `src/lib/agenticTrustCenter.ts`, `src/components/asset-profile/guidance/VendorRecommendedActionsCard.tsx`.
- Ingen nye avhengigheter.
- Oversettelseshåndtering i `isNb`-blokker; i18n-nøkler kan innføres senere.
- Forblir i lokal lagring (localStorage) per `assetId`.

## Akseptanse
- Dialogen åpner med "Manuell opplasting" forhåndsvalgt.
- MCP-valget er synlig, men tydelig merket som V2 / fremtidig.
- Valg av MCP lagres i tilstanden og vises i trust-profile-blokken.
- Manuell flyt fungerer uendret.
