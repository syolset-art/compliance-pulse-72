# Veiledning fra Mynder: del i "Hva gjelder" og "Neste steg"

Veiledningsfanen på leverandørprofilen skal svare på to spørsmål side om side:
venstre kolonne = hva som gjelder for denne leverandøren, høyre kolonne = hva som må gjøres videre,
og hvem som kan gjøre det (Lara-agent eller deg).

## Hva som endres

### Venstre: Hva gjelder (eksisterende regelverkskort)
Beholdes som i dag (Lovpålagte / Anbefalte + legg til egne), men vises alltid i to-kolonners rutenett —
også før grunnlag er hentet inn. Får en tydelig kolonneoverskrift "Hva gjelder".

### Høyre: Anbefalte tiltak (nytt kort, agentisk)
Et nytt kort "Neste steg" som alltid er til stede og bygger tiltakslisten fra faktiske hull i leverandørdataen,
ikke bare fra regelverk. Tiltak som genereres:

- Bruk og kontekst ikke oppgitt (hva leverandøren brukes til) → tiltak "Registrer bruk og kontekst"
- GDPR-rolle ikke satt → tiltak "Bekreft GDPR-rolle" (Lara kan foreslå)
- Risikonivå ikke satt → tiltak "Sett risikonivå" (Lara kan foreslå)
- Kritikalitet ikke satt → tiltak "Sett kritikalitet"
- Grunnlag ikke etterspurt → tiltak "Hent inn grunnlag" (Lara kan kjøre offentlig kartlegging / Agentisk Trust Profile)
- Manglende dokumentasjon per aktivert regelverk → dagens tiltak fra regelverkslogikken

Hvert tiltak vises som en kompakt rad med:
- tittel + kort begrunnelse (hvorfor det gjelder / hvilket krav det dekker)
- alvorlighetsprikk (kritisk / høy / normal) i plattformens fargeskala
- en utførende-etikett: "Lara kan gjøre dette" (agentisk) eller "Krever din beslutning"
- én primærknapp: "La Lara gjøre det" for agentiske tiltak, ellers "Åpne" som hopper til riktig felt/dialog

Toppen av kortet får en agentisk oppsummering fra Lara: "X tiltak — Lara kan utføre Y av dem",
med knapp "Kjør Laras forslag" som utfører alle agentiske tiltak (fyller forslag som utkast brukeren godkjenner).
Tomtilstand: "Ingenting utestående — Lara overvåker leverandøren."

Ingen data endres uten bekreftelse: Lara fyller forslag, brukeren godkjenner.

## Teknisk

- Ny `src/lib/vendorNextSteps.ts`: bygger `NextStep[]` fra leverandørdata
  (metadata `usage_purpose`/`usage_tags`, gdpr-rolle, risiko, kritikalitet), sourcing-state og
  eksisterende `VendorFrameworkAction[]`. Hvert steg har `owner: "lara" | "user"`, severity,
  begrunnelse og en `actionKey` som mapper til eksisterende dialoger.
- Nytt `src/components/asset-profile/guidance/VendorNextStepsCard.tsx` som rendrer listen.
  Gjenbruker eksisterende dialoger (dokumentforespørsel, opprett aktivitet, invitasjon til Agentisk
  Trust Profile, RequestBaselineDialog) og navigerer til Bruk og kontekst-fanen for kontekstfeltene.
- `MynderGuidanceTab.tsx`: fjern `needsBaseline`-spesialtilfellet for rutenettet — alltid
  `lg:grid-cols-2` med kolonneoverskrifter; baseline-tiltaket flyttes inn i Neste steg-kortet i
  stedet for å skjule høyre kolonne. Dagens `VendorRecommendedActionsCard`-innhold (Trust Profile-status
  og full tiltaksliste i arbeidsvindu) beholdes som "Se alle tiltak" fra det nye kortet.
- Leverandørens metadata (usage_purpose, gdpr-rolle, risiko) sendes inn som props fra `AssetTrustProfile`.
- Full EN/NO-tekst via samme mønster som resten av fanen. Responsivt: én kolonne på mobil.
