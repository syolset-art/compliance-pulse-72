# Veiledning fra Mynder på leverandørprofilen

Gjør veiledningsfanen på leverandørprofilen lik oppsettet i skjermbildet fra kundevisningen — men høyre kort viser **anbefalte tiltak** i stedet for produkter og tjenester.

## Slik blir det

Øverst: Lara-banneret som i dag ("Lara har en anbefaling til deg").

Under banneret to kort side om side (stables på mobil):

```text
+-------------------------------+  +--------------------------------+
| Regelverk leverandøren skal   |  | Anbefalte tiltak      [Lara]   |
| etterleve   [Initiell KI-vurd]|  |                                |
|                               |  | • Be om ISO 27001-sertifikat   |
| Lovpålagte:  GDPR  NIS2       |  |   Dekker: NIS2 art. 21         |
| Anbefalte:   ISO 27001  DORA  |  |   [Be om dokumentasjon]        |
|                               |  | • Inngå databehandleravtale    |
| + Legg til regelverk,         |  |   Dekker: GDPR art. 28         |
|   standard eller retningslinje|  |   [Opprett aktivitet]          |
+-------------------------------+  +--------------------------------+
```

**Venstre kort — regelverk:** pill-liste delt i Lovpålagte (grønn) og Anbefalte (oker), forslått av Lara ut fra leverandørens type, bransje, land og kritikalitet. Brukeren kan legge til flere regelverk, standarder og retningslinjer selv; egne valg merkes og kan fjernes.

**Høyre kort — anbefalte tiltak:** tiltakene utledes av regelverkene til venstre. Hvert tiltak viser hvilket krav/artikkel det dekker, hvor kritisk det er, og en kort Lara-begrunnelse ved hover. To handlinger per tiltak:
- **Be om dokumentasjon** — åpner eksisterende forespørselsdialog med riktig dokumenttype, frist og forhåndsutfylt melding.
- **Opprett aktivitet** — åpner eksisterende aktivitetsdialog forhåndsutfylt fra forslaget.

Legger man til et nytt regelverk, dukker tiltakene for det opp umiddelbart i høyre kort — det er koblingen som gjør løsningen agentisk. Øverst i høyre kort står en teller ("4 tiltak · 2 kritiske") og en «Be om alt som mangler»-knapp som samler dokumentasjonsforespørslene i én sending.

Aktive dokumentasjonsforespørsler (frist/purring) vises kompakt rett under tiltakene, slik at man ser hva som allerede er sendt.

Modenhetskort, tidslinje og aktivitetslogg blir stående uendret under.

## Teknisk

- Ny `src/lib/vendorFrameworkSuggestions.ts`: utleder regelverksforslag (id, label, confidence high/medium) for en leverandør, og mapper regelverk → tiltak (tittel, dekket krav, kritikalitet, dokumenttype, begrunnelse). Deterministisk demo-logikk i samme stil som `offerSuggestions.ts`.
- Nye komponenter under `src/components/asset-profile/guidance/`: `VendorFrameworkCard.tsx` og `VendorRecommendedActionsCard.tsx`, visuelt modellert etter `src/components/msp/guidance/CustomerFrameworkRecommendationsCard.tsx` (samme pill-stil og `recommend`-token).
- `MynderGuidanceTab.tsx` får grid-raden med de to kortene, holder valgte regelverk i lokal state (per `assetId` i localStorage), og kobler tiltak til eksisterende `RegisterActivityDialog` og `RequestUpdateDialog`.
- Gjenbruker `DocumentRequestsSection` for aktive forespørsler.
- Ingen databaseendringer; forespørsler skrives fortsatt via eksisterende `vendor_document_requests`-flyt i `RequestUpdateDialog`.
- Tekster på norsk/engelsk via samme `isNb`-mønster som i dagens fane.
