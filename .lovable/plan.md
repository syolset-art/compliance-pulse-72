

## Plan: Godkjenningsdialog etter dokumentgodkjenning i Lara Innboks

### Problem
Når brukeren godkjenner et dokument i Lara Innboks, vises bare en liten toast-melding. Brukeren får ingen oversikt over hva som skjedde, hvor dokumentet havnet, eller hvordan det påvirker compliance-scoren.

### Løsning
Erstatt toast-meldingen med en rik bekreftelses-dialog som viser:
- Hva som ble godkjent (dokumentnavn og type)
- Hvor det ble plassert (leverandørprofil med klikkbar lenke)
- Score-påvirkning (visuell indikator for forbedret compliance-score)
- Knapp for å navigere til dokumentet i leverandørens profil

### Endringer

| Fil | Endring |
|-----|---------|
| `src/components/ApprovalSuccessDialog.tsx` | **Ny** — Dialog-komponent med: ikon, tittel, dokumenttype-badge, lenke til asset-profil, score-indikator, og «Lukk»/«Gå til profil»-knapper |
| `src/pages/LaraInbox.tsx` | Legg til state for å vise dialogen etter godkjenning (dokument og hendelse). Erstatt `toast.success` med å åpne dialogen med info om godkjent element |
| `src/components/asset-profile/tabs/LaraInboxTab.tsx` | Samme endring — vis dialog etter godkjenning i asset-kontekst |

### Dialog-innhold
- **Tittel**: «Dokument godkjent» / «Avvik opprettet»
- **Ikon**: Grønn sjekkmerke-sirkel
- **Detaljer**:
  - Dokumenttype (f.eks. «ISO 27001-sertifikat»)
  - Leverandørnavn med lenke
  - Tekst om at compliance-score oppdateres (f.eks. «+5 poeng estimert»)
  - For hendelser: «Avviket er opprettet og synlig under Hendelser på systemets profil»
- **Handlinger**:
  - «Se i profilen» → navigerer til `/assets/{id}` med riktig fane
  - «Lukk» → lukker dialogen

### Teknisk
- Gjenbruk `AlertDialog` fra shadcn/ui
- State: `approvedItem` (null = lukket, objekt = åpen med data)
- `onSuccess` i mutasjoner setter `approvedItem` i stedet for toast
- Lenke bruker `useNavigate` med query-param for å åpne riktig fane (dokumenter/hendelser)

