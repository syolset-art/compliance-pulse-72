## Overta kundens Trust Profile (Veiledning fra Mynder)

Legg til et nytt kort øverst på fanen «Veiledning fra Mynder» i `MSPCustomerDetail.tsx` som lar partner overta kundens Trust Profile på to måter:

1. **Bekreft eksisterende avtale** — partner huker av at de allerede har en signert leveranseavtale med kunden, og bekrefter overtakelse umiddelbart.
2. **Be om fullmakt fra kunden** — partner sender en e-post til kunden som ber dem gi fullmakt. Status settes til «Venter på fullmakt».

### Ny komponent
`src/components/msp/TakeoverTrustProfileCard.tsx`
- Header: «Overta kundens Trust Profile» med Lara-/`ShieldCheck`-ikon og kort forklaring: «For å jobbe i kundens profil må du ha fullmakt — enten via signert avtale, eller ved å be kunden bekrefte direkte.»
- Tre tilstander (lagret i `localStorage`-nøkkel `mynder:takeover:<customerId>` for demo):
  - **`none`** — viser to CTA-knapper:
    - «Jeg har avtale med kunden» (primær) → åpner en `Dialog` med avkrysning av to vilkår («Vi har signert leveranseavtale» + «Jeg bekrefter at jeg har fullmakt på vegne av kunden»), aktiverer «Bekreft overtakelse».
    - «Be kunden om fullmakt» (sekundær) → åpner en `Dialog` med forhåndsutfylt e-postutkast (emne/innhold som matcher Kundevisning > Overlevering-e-posten), redigerbart, og «Send forespørsel».
  - **`pending`** — viser status-pille «Venter på fullmakt fra [kontaktnavn]», tidspunkt sendt, knapper «Send påminnelse» og «Avbryt forespørsel».
  - **`granted`** — viser grønn status «Fullmakt aktiv» med kilde («Signert avtale bekreftet …» eller «Kunde ga fullmakt …»), tidspunkt, og knapp «Trekk tilbake».

### Endringer i `MSPCustomerDetail.tsx`
- Importer og monter `<TakeoverTrustProfileCard customerId={customerId} customerName={...} contactName={...} contactEmail={...} />` som første element i `<TabsContent value="guidance">`, før `LaraRecommendationBanner`.
- Ingen andre endringer i sidens logikk.

### Implementering / scope
- Kun frontend. Demo-state i `localStorage`, ingen database-/edge-endringer.
- Bruker eksisterende shadcn-komponenter (`Card`, `Dialog`, `Button`, `Checkbox`, `Textarea`, `Input`, `Badge`) og semantiske design-tokens (primær lilla, `bg-success`/`bg-warning`).
- E-postutkastet i fullmakts-dialogen gjenbruker tekstmalen fra `HandoverEmailView` (samme språk: «gi [Partner] fullmakt til å jobbe i profilen»), men sendes ikke faktisk — vi viser bare en `toast.success` for demo.

### Filer
- Opprettes: `src/components/msp/TakeoverTrustProfileCard.tsx`
- Endres: `src/pages/MSPCustomerDetail.tsx` (én import + ett element øverst i guidance-tabben)
