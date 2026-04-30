## Mål

Gjøre "Gap og foreslåtte tiltak" på leverandørsiden mer agentisk og inline. Ingen store modaler — Lara skal selv foreslå konkrete tiltak rett under hvert gap, og brukeren bekrefter, justerer eller ber om mer info i samme rad.

## Hva som er i dag

`VendorGapAnalysisTab.tsx` viser per krav: status, rationale, evidens, og en `Neste steg`-tekst med en passiv knapp `La Lara håndtere` (gjør ingenting). Tiltaket er kun en setning — ikke et reelt agentforslag man kan handle på.

## Endringer

### 1. Inline agent-forslag per gap (ingen modal)

For hvert krav med status `partial` eller `missing` erstattes "Neste steg + knapp" med en kompakt agent-rad direkte i kortet:

```text
┌──────────────────────────────────────────────────────────┐
│ [✦] Lara foreslår: Be om SOC 2 Type II-rapport (2024)    │
│     Jeg sender forespørsel til kontaktperson hos Acme    │
│     med 14 dagers frist. Knyttes til krav NS.4.2.        │
│                                                          │
│     [Bekreft og start]  [Endre]  [Trenger mer info]  [⋯] │
└──────────────────────────────────────────────────────────┘
```

- Forslaget er forhåndsutfylt fra `next_action` + leverandørens kontekst (kontaktperson, dokumenttype som mangler, frist).
- Tre primære valg, alle inline:
  - **Bekreft og start** — oppretter tiltaket umiddelbart (dokumentforespørsel, oppgave eller policy-utkast) og rader endrer seg til "Startet av Lara · venter på leverandør".
  - **Endre** — utvider raden inline (ikke dialog) med 2-3 felt: mottaker, frist, fritekst-instruksjon. Lagre/Avbryt i samme rad.
  - **Trenger mer info** — Lara stiller ett konkret spørsmål inline (f.eks. "Hvem er riktig kontakt for sikkerhetsdokumentasjon?"). Svaret oppdaterer forslaget.
- En "⋯"-meny gir sekundære valg: `Avvis forslag`, `Marker som ikke relevant`, `Lag manuell oppgave`.

### 2. Tiltakstyper Lara kan foreslå

Basert på gap-type velger agenten automatisk én av disse aksjonene (vises i forslagsteksten):

| Gap-signal | Foreslått tiltak |
|---|---|
| Mangler dokument (SOC2, ISO, DPA, pentest) | Send dokumentforespørsel til kontaktperson |
| Delvis dokument utdatert | Be om fornyet versjon med ny frist |
| Mangler intern policy/rutine | Generer policy-utkast for godkjenning |
| Mangler kategorisering/metadata | Forhåndsutfyll felt på leverandøren — bekreft inline |
| Mangler kontaktperson/DPO | Slå opp via Lara web-søk + foreslå kontakt |
| Risiko-signal (brudd, sanksjon) | Opprett gjennomgangsoppgave til Vendor Manager |

### 3. Toppnivå plan-stripe (kort, ikke modal)

Over selve gap-listen vises en smal stripe når det finnes uløste gap:

```text
Lara har 7 forslag klare · 4 dokumentforespørsler, 2 policy-utkast, 1 oppfølging
[Gjennomgå én etter én]   [Bekreft alle dokumentforespørsler]
```

- Ingen dialog. "Gjennomgå én etter én" scroller til første ubekreftede forslag og fokuserer raden.
- "Bekreft alle dokumentforespørsler" utfører bulk-aksjon på de tryggeste tiltakene (kun dokumentforespørsler til kjent kontakt med standard frist).

### 4. Tilstand per forslag

Hver forslagsrad har én av disse tilstandene, vist med liten ikon/tekst — ingen fargete bannere:

- `Forslag` (default, agent foreslår)
- `Avklaring` (Lara venter på svar fra brukeren inline)
- `Startet` (tiltak er igangsatt, vis lenke til oppgave/forespørsel)
- `Avvist` (kollapset, kan gjenåpnes)

### 5. Fjernes / forenkles

- Den nåværende "Neste steg: …" + passiv `La Lara håndtere`-knapp fjernes.
- Ingen ny dialog/modal åpnes noe sted i denne fanen.
- "Eksporter PDF"-knappen beholdes som i dag.

## Tekniske detaljer

- Filendring: `src/components/asset-profile/tabs/VendorGapAnalysisTab.tsx` — bytt ut `next_action`-blokken (linje 254–264) med ny inline-komponent.
- Ny komponent: `src/components/asset-profile/gap/InlineAgentProposal.tsx` — håndterer tilstand `proposal | clarify | editing | started | dismissed` lokalt, med callbacks ut.
- Ny komponent: `src/components/asset-profile/gap/AgentPlanStrip.tsx` — toppstripe med aggregat og bulk-aksjon.
- Forslagstekst genereres klientside fra `item.next_action` + `item.signal_key` + leverandørens `contact_person`/`name`. Ingen ny edge-funksjon i denne runden — vi gjenbruker `request-vendor-document` for "Bekreft og start" på dokumenttiltak, og oppretter en aktivitet (`activity`) for øvrige tiltak via eksisterende mønster.
- Bulk-bekreft kaller samme handler i loop med liten throttle og viser progress inline i stripen (ikke toast-spam — én oppsummerende toast på slutten).
- Stil følger memory: ingen lilla/grønn/oransje fyll. Bruk `bg-muted/40`, `border-border`, ikon med `text-muted-foreground`. Statusikoner (✓ ! ✗) beholder sine semantiske farger kun som små glyfer, ikke flater.
- i18n: nye nøkler under `vendor.gap.agent.*` for både `nb` og `en`.

## Ikke i scope

- Ingen endring av selve gap-analysen / edge-funksjonen.
- Ingen endring av domeneoppsummeringen eller score-kortet.
- Ingen ny PDF-eksport.