## Oppdater "Utforsk Trust Center"-lenken til å være tilstandsavhengig

I `src/pages/TrustCenterProfile.tsx` erstattes den nåværende anchor-lenken med en betinget visning basert på `isPublished`-status.

### Publisert tilstand
Aktiv lenke til `/trust-engine/profile/${asset.id}` med `ArrowRight`-ikon (åpnes i ny fane).

### Ikke-publisert tilstand
Muted `<span>` med `Lock`-ikon, pakket i `Tooltip` som forklarer:
- NB: "Trust Centeret aktiveres når du publiserer profilen. Da kan kunder og partnere se all informasjonen du har valgt å dele — dokumenter, sertifiseringer, modenhet og kontaktinfo — samlet på ett sted."
- EN: tilsvarende engelsk versjon.

### Fil som endres
- `src/pages/TrustCenterProfile.tsx` — bytt ut eksisterende anchor med betinget Tooltip/lenke. Importer `Lock` fra lucide-react og `Tooltip`, `TooltipTrigger`, `TooltipContent` fra `@/components/ui/tooltip`.

Ingen andre filer eller DB-endringer.