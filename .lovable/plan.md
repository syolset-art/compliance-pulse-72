# Riktig terminologi: Agentisk Trust Profile

Invitasjonen gjelder leverandørens **Agentiske Trust Profile** — ikke et Trust Center. Trust Center er stedet profilen kan vises, og det er foreløpig ikke offentlig.

## Tekstendringer

I invitasjonskortet og dialogen på leverandørprofilen:

- "Agentisk Trust Center" / "Agentic Trust Center" → "Agentisk Trust Profile" / "Agentic Trust Profile"
- CTA: "Inviter til Agentisk Trust Profile"
- Tomtilstand: "Leverandøren mangler Agentisk Trust Profile — dokumentasjon må etterspørres manuelt."
- Statusstripe: "Agentisk Trust Profile aktiv" / "Leverandøren er invitert til Agentisk Trust Profile"
- Knapp: "Åpne trust profile"
- Pille på tiltak: "Via Trust Profile"
- Dialogtekster: "eget rom for trust profile", "Dette etterspør trust profilen — og holder den oppdatert videre."
- Meldingsmal til leverandøren: "Vi setter opp en Agentisk Trust Profile for <leverandør> …"

## Trust Center som kommende visning

Nederst i invitasjonsdialogen (bekreftelsessteget) legges en dempet infolinje:

"Trust profilen er foreløpig ikke offentlig. Snart kan leverandører publisere sin agentiske trust profil i et Trust Center."

Engelsk tilsvarende. Ingen lenke, ingen knapp — kun informasjon.

## Teknisk

- Berørte filer: `VendorRecommendedActionsCard.tsx`, `InviteAgenticTrustCenterDialog.tsx`, `MynderGuidanceTab.tsx`, `src/lib/agenticTrustCenter.ts` (kommentarer/etiketter).
- Filnavn, typenavn (`AgenticTrustCenterState`) og localStorage-nøkler beholdes uendret, slik at eksisterende prototypedata ikke går tapt. Kun brukersynlig tekst endres.
- Lenkefunksjonen `trustCenterLink` beholder samme rute; kun knappeteksten endres.
