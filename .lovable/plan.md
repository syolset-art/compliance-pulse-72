## Mål
Gjøre det umiddelbart synlig hvilke regelverkskontroller kunden får evidens på når en tjeneste leveres — uten å åpne tjenesten eller hovre over en badge.

## Endring i UI (per tjenestekort i `MSPServiceCatalogTab.tsx`)

Erstatte dagens flate rad med små badges (`GDPR · Art.35`, `ISO 27001 · A.5.1, A.5.4 …`) med et tydeligere "Evidens"-felt:

1. **Egen seksjon med ledende ikon + label**  
   Under beskrivelsen, en liten boks med `ShieldCheck`-ikon og teksten **"Kunden får evidens på:"**. Dette gjør det eksplisitt hva badgene betyr — ingen hover nødvendig.

2. **Per regelverk: logo/forkortelses-chip + kontrollpunkter som chips**  
   Hver framework-mapping rendres som en gruppe:
   ```text
   [GDPR]  Art.35
   [ISO 27001]  A.5.1   A.5.4   A.6.1
   [NIS2]  Art.20   Art.21
   ```
   - Venstre: en farget framework-pille (bruker eksisterende fargesystem — primary/muted, ingen nye tokens).
   - Høyre: hver `controlId` som egen liten chip, klikkbar (tooltip viser kort hva kontrollen handler om der vi har data, ellers bare ID).
   - Maks 4 kontrollpunkter vises per rad, resten samles i `+N flere` chip som expander on click.

3. **Liten "evidens-teller" badge i tittelraden**  
   Ved siden av "X leveransepunkter" i toppen: `ShieldCheck` ikon + `N kontrollpunkter` (sum på tvers av rammeverk). Gir én-blikks-oversikt over verdien.

4. **Tom-tilstand**  
   Når `frameworkMappings` er tom: vis en svak prompt-rad: *"Lara har ikke koblet denne tjenesten til regelverk ennå — rediger for å legge til."* med en liten "Koble til regelverk"-knapp som åpner ServiceForm.

## Samme oppgradering i Lara-forslag (`MSPLaraServiceSuggestions.tsx`)
Speil samme "Kunden får evidens på:"-blokk i hvert forslagskort, slik at brukeren ser verdien før de aksepterer forslaget.

## Hva som IKKE endres
- Datamodellen (`PartnerService`, `frameworkMappings`, `controlIds`) er uendret.
- `serviceCatalog.ts` mappingen endres ikke.
- Eksisterende synlighets-toggle, pris, rediger-knapp og leveransepunkter-badge beholdes som i dag.
- Ingen nye dependencies, ingen designtokens — bruker eksisterende `primary`, `muted`, `border`, `ShieldCheck`/`Shield` fra lucide.

## Filer som endres
- `src/components/msp/MSPServiceCatalogTab.tsx` — erstatt nåværende framework-badge-rad (linje 215–235) med ny "Evidens"-seksjon; legg til kontrollpunkt-teller i tittelraden (linje 171–212).
- `src/components/msp/MSPLaraServiceSuggestions.tsx` — speil samme komponent for forslagsvisningen (linje 96–113).

Resultat: en partner ser umiddelbart, uten å hovre, at f.eks. *Awareness-programmet* gir kunden evidens på `ISO 27001 A.6.3, A.5.10` og `NIS2 Art.20` — koblingen mellom tjenesteleveranse og compliance-verdi blir visuell og selvforklarende.