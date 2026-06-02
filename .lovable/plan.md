# Plan: Samlet "Legg til aktivitet" for partner

## Mål
Gjøre det åpenbart hva partneren kan gjøre på en kunde — samle alle handlinger ett sted i stedet for å spre knapper utover Trust Profile-fanen. Partneren skal se mulighetene uten å lete.

## Plassering

Knappen plasseres to steder, med samme innhold:

1. **Øverst til høyre på kundekortet** — i `CustomerStatusBanner`-raden, ved siden av kundenavnet. Alltid synlig uansett fane.
2. **Øverst i Veiledning fra Mynder-fanen** — som primær CTA over Lara-anbefalingene, slik at det føles som en naturlig forlengelse av Laras forslag.

Den eksisterende "Last opp partner-bevis"-knappen i Trust Profile-headeren fjernes — funksjonen flyttes inn i menyen.

## Komponent: `PartnerActionMenu`

En primær knapp `[+ Legg til aktivitet ▾]` (variant primary, Sparkles-ikon) som åpner en `DropdownMenu` gruppert i tre seksjoner:

**Bevis & dokumentasjon**
- Last opp partner-bevis (pentest, audit, DPIA …) → åpner `PartnerEvidenceUploadDialog`
- Be om dokument fra kunden → åpner ny "Send forespørsel"-dialog (gjenbruker `MSPCustomerMessagesTab`-flow)

**Analyse & vurdering**
- Kjør gap-analyse mot regelverk → navigerer til Regelverk-fanen med "ny analyse"-state
- Start sikkerhetsvurdering → setter aktiv fane til `assessment`
- Be Lara om en anbefaling → trigger Lara-modal med kontekst om kunden

**Forretning & kommunikasjon**
- Lag tilbud (oppgradering / nytt regelverk) → åpner enkel tilbudsdialog (lokal demo)
- Send melding til kunde → åpner Meldinger-fanen med ny melding pre-utfylt
- Planlegg oppfølging → enkel datovelger som lager en aktivitet (lokal demo)

Hver rad har ikon + tittel + kort en-linjes forklaring, slik at partneren skjønner hva valget betyr uten å klikke.

## UX-detaljer

- Menyen viser badge "Anbefalt" på de 1–2 handlingene Lara mener er mest relevant nå (basert på `tasks`-listen som allerede beregnes i `MSPCustomerDetail`).
- Etter en handling vises en toast "Aktivitet lagt til på kunden", og handlingen logges i en lett aktivitetslogg (lokal demo, samme localStorage-mønster som `partnerEvidence.ts`).
- Knappen i Veiledning-fanen får en kort introtekst: "Alt du kan gjøre for {kundenavn} — på ett sted."

## Tekniske endringer

- Ny fil: `src/components/msp/PartnerActionMenu.tsx` — dropdown med alle handlinger, mottar `customerId`, `customerName`, `onOpenEvidence`, `onSwitchTab` osv.
- Ny fil: `src/lib/partnerActivityLog.ts` — enkel localStorage-logg for "siste aktiviteter" (demo).
- Rediger `src/components/msp/CustomerStatusBanner.tsx` — legg til `PartnerActionMenu` øverst til høyre.
- Rediger `src/pages/MSPCustomerDetail.tsx` — montér `PartnerActionMenu` øverst i `guidance`-TabsContent, koble `setActiveTab` og åpne-dialog-callbacks. Sentralisér `evidenceOpen`-state her i stedet for i Trust Profile-kortet.
- Rediger `src/components/msp/MSPCustomerTrustProfileCard.tsx` — fjern den lokale "Last opp partner-bevis"-knappen i headeren (funksjonen flyttes til menyen). `PartnerEvidenceSection` beholdes som visning av opplastede bevis, men uten egen opplastingsknapp.

## Ikke i scope

- Ingen endringer i datamodell eller edge functions.
- Ingen ekte tilbuds-/CRM-integrasjon — "Lag tilbud" og "Planlegg oppfølging" er demo-flows som lagrer lokalt.
- Ingen endringer i andre faner enn det som trengs for å koble menyvalgene til riktig tab/dialog.
