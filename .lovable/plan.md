# Innhentingsmetode per leverandør — Laras anbefaling

Grunnideen: «be om grunnlag» er ikke én handling, men et valg av innhentingsmetode. Hvem som gjør jobben avhenger av mandatstyrke og hvor offentlig beviset allerede er. Prototypen skal gjøre den variasjonen synlig.

## Tre innhentingsmetoder

1. **Kunde-drevet kartlegging** — agent høster offentlige kilder (Trust Center, ISO/SOC, transparency-rapporter). Leverandøren deltar ikke. Bevisnivå: «AI-utledet fra offentlig kilde» med kilde-URL, dato og scope.
2. **Lettvekts leverandør-respons** — én e-post, svar med vedlegg. Laveste terskel, standard for de fleste.
3. **Leverandør-eid agentisk profil** — leverandøren claimer og vedlikeholder profilen. Kun der mandatet er sterkt nok.

Claim frikobles fra brukbarhet: en profil kan være solid uten at leverandøren noen gang claimer. «Claimet» er et kvalitetsnivå, ikke en forutsetning.

## Endringer i prototypen

**1. Ny modell (`src/lib/vendorSourcingMethod.ts`)**
- Type `SourcingMethod = "public_harvest" | "email_request" | "vendor_agentic"` med norsk/engelsk label, beskrivelse, innsatsnivå for leverandøren og bevisnivå metoden gir.
- `recommendSourcingMethod(signals)` — Lara-heuristikk basert på signaler vi allerede har: leverandørtype/størrelse, offentlig fotavtrykk, kritikalitet, GDPR-rolle og kundens mandatstyrke. Returnerer primær anbefaling + eventuelt alternativ + kort begrunnelse i Laras stemme.
- Prototypelagring per assetId i localStorage (samme mønster som `agenticTrustCenter.ts`).

**2. Statusbanner (`VendorStatusBanner.tsx`)**
- Valgt element «Overtatt 8. mars 2026» beholdes, men presiseres til at dette er tidspunktet leverandøren tok eierskap til sin agentiske trust profile.
- Ny tom-tilstand: når ingen innhenting er startet, sier banneret at grunnlag for modenhetsvurdering ikke er etterspurt ennå, og viser Laras anbefalte innhentingsmetode med én primær CTA (og alternativ som sekundærvalg der Lara er i tvil).
- Metode-spesifikke CTA-er: «La agenten kartlegge offentlige kilder», «Send forespørsel på e-post», «Inviter til Agentisk Trust Profile».

**3. Leverandør-velger for demo**
- Liten arketype-velger (Microsoft / BankID / Helse Vest-leverandør) i veiledningsområdet på leverandørprofilen, som bytter signalsettet og dermed Laras anbefaling live.
  - Microsoft: mandat lavt, offentlig fotavtrykk høyt → kunde-drevet kartlegging.
  - BankID: i skjæringspunktet → begge tilbys, kartlegging først.
  - Helse Vest-leverandør: mandat høyt, lite offentlig → agentisk invitasjon.

**4. Kobling til eksisterende flyt**
- `CreateVendorActivityDialog` og `VendorRecommendedActionsCard` forhåndsvelger metoden Lara anbefaler i stedet for å lede med invitasjon for alle.
- Bevisnivå på leverte dokumenter merkes med opphav (offentlig kilde / oppgitt av leverandør / verifisert), slik at svakere grunnlag vises åpent.

## Åpent punkt (ikke kode)

Agent-taksonomien (Lara, Motor, Kundeagent, Sonde, Bro) mangler navn på den kunde-drevne kartleggingsagenten som høster offentlige kilder uten leverandørens deltakelse. Foreslås tatt videre til Totto; prototypen bruker inntil videre «Lara kartlegger offentlige kilder».
