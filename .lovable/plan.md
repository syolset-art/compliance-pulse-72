## Hva som er galt

`CustomerStatusBanner` lagrer faktisk til databasen (kolonnene `url` og `business_description` finnes, og RLS tillater oppdatering), men på kundeprofilen rendres kortet uten `onUpdate`-callback:

```text
src/pages/MSPCustomerDetail.tsx:311
<CustomerStatusBanner customer={customer} />        ← mangler onUpdate
src/pages/MSPCustomerDetail.tsx:561
... onUpdate={() => queryClient.invalidateQueries(...)}   ← finnes bare her
```

React Query-cachen (`["msp-customer", customerId]`) blir derfor aldri invalidert, feltet faller tilbake til gammel verdi, og det ser ut som lagringen ikke gikk gjennom.

## Fiks 1 — nettadressen lagres synlig

- Send `onUpdate={() => queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] })}` til `CustomerStatusBanner` på linje 311.
- I `saveEdit` i `CustomerStatusBanner.tsx`: legg til `.select().single()` på oppdateringen og bruk resultatet til å oppdatere et lokalt overstyringsobjekt, slik at verdien vises umiddelbart selv før refetch er ferdig.
- Vis konkret feilmelding fra backend i toasten i stedet for bare «Kunne ikke lagre», så reelle feil blir synlige.

## Fiks 2 — Lara henter beskrivelse automatisk

Når nettadressen lagres og `business_description` er tom:

1. Kortet viser en diskret linje under Beskrivelse: «Lara henter beskrivelse fra nettstedet…» med Sparkles-ikon (spinner).
2. Kall eksisterende edge-funksjon `suggest-company-description` med `companyName`, `industry`, `website` (ny valgfri parameter) og `language: "nb"`.
3. Lagre forslaget på `business_description` for kunden, invalidér spørringen og vis toast: «Lara la til en beskrivelse — klikk på blyanten for å justere».
4. Feiler kallet (429/402/nett), gjør vi ingenting utover en stille info-toast; nettadressen er allerede lagret.

Beskrivelsen overskrives aldri hvis den finnes fra før.

## Teknisk

- `src/pages/MSPCustomerDetail.tsx`: legg til `onUpdate` på `CustomerStatusBanner` (linje 311).
- `src/components/msp/CustomerStatusBanner.tsx`: forbedret `saveEdit` (feilmelding + lokal ekko-verdi), ny `maybeGenerateDescription(url)`-funksjon og `generatingDesc`-state med inline statuslinje.
- `supabase/functions/suggest-company-description/index.ts`: ta imot valgfri `website` og ta den med i prompten; ingen endring i responsformatet (`{ suggestion }`).
- Ingen databaseendringer.
