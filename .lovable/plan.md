

# Vendor Onboarding Demo -- "Motta forespørsel og svar"

## Hva dette er
Et nytt menypunkt og en dedikert side som simulerer hele reisen fra en leverandørs perspektiv: De mottar en e-post fra HULT IT som ber om oppdatert databehandleravtale, og vi guider dem gjennom prosessen -- fra e-posten til de lander på sin egen Trust Profil og laster opp dokumentet.

## Brukerreisen (steg-for-steg)

```text
Steg 1: E-postvisning
  "Du har mottatt en forespørsel fra HULT IT AS"
  Simulert e-post med Mynder-branding, frist, og CTA-knapp
            |
            v
Steg 2: Landingsside -- Valg
  "HULT IT ber om oppdatert databehandleravtale"
  Tre alternativer:
    A) Last opp dokument direkte (raskest)
    B) Opprett gratis Trust Profil og selverklaer
    C) Allerede Mynder-bruker? Logg inn
            |
            v
Steg 3A: Direkte opplasting
  Enkel opplastingsflyt med drag-and-drop
  Bekreftelse: "Dokumentet er sendt til HULT IT"
            |
Steg 3B: Trust Profil-verifisering
  Org.nr-oppslag via Brreg
  Bekreft at du representerer selskapet
  E-postverifisering (simulert)
            |
            v
Steg 4: Trust Profil opprettet
  Lander paa sin egen Trust Profil
  Kan laste opp DPA og andre dokumenter
  Ser innkommende foresporsler fra HULT IT
```

## Hva som bygges

### 1. Ny side: `VendorResponseDemo.tsx`
En fullskjerm-side (uten sidebar) som simulerer leverandorens opplevelse med foelgende steg:

**Steg 1 -- E-posten**: Realistisk e-postvisning med Mynder-header, avsender "HULT IT AS via Mynder", innhold som forklarer foresporselen, frist, og en primaer CTA-knapp "Se foresporselen".

**Steg 2 -- Landingssiden**: Mynder-brandet side med foresporselsdetaljer og tre valgmuligheter i kort-layout.

**Steg 3A -- Rask opplasting**: Drag-and-drop-sone for aa laste opp DPA direkte uten konto. Bekreftelsesvisning med suksess-melding.

**Steg 3B -- Trust Profil-opprettelse**: Tre-trinns verifisering:
1. Org.nr + selskapsnavn (Brreg-oppslag gjenbrukes)
2. Kontaktperson og e-post
3. Bekreftelse og "profil opprettet"-animasjon

**Steg 4 -- Trust Profilen**: Simulert visning av den nyopprettede Trust Profilen med innkommende foresporsler og mulighet til aa laste opp dokumenter.

### 2. Nytt menypunkt i Sidebar
Legge til "Leverandordemo" i sidebaren med et eget ikon (Play/ExternalLink) -- posisjonert nede ved "Ressurser" som en demo/guide-lenke.

### 3. Ny rute i App.tsx
`/vendor-response-demo` som peker til den nye siden.

## Tekniske detaljer

### Komponenter som gjenbrukes
- E-postvisningen er ren JSX (ingen ny avhengighet)
- Opplastingsflyten gjenbruker moenstre fra `UploadDocumentDialog`
- Brreg-oppslaget gjenbruker `useBrregLookup`-hooken
- Trust Profil-visningen henter moenstre fra `AssetTrustProfile`

### Ingen databaseendringer
Hele flyten er en klientside-demo med simulerte data. Ingen nye tabeller eller migrasjoner.

### Filendringer
- **Ny**: `src/pages/VendorResponseDemo.tsx` -- hovedsiden med alle stegene
- **Endret**: `src/App.tsx` -- ny rute
- **Endret**: `src/components/Sidebar.tsx` -- nytt menypunkt

