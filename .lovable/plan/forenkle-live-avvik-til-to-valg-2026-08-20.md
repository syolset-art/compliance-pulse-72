# Forenkle "Live avvik" til to valg

Dagens utvidede panel på avvikssiden viser tre forklaringsbokser, en fire-stegs flyt og en lang pilleliste med ti kilder. Det er for mye. Det erstattes av to tydelige valg.

## Ny struktur

Når brukeren åpner "Hvordan fungerer det?" vises to kort side om side:

**1. Sara – lokal agent**
Fanger avvik direkte i kundens egen infrastruktur. Ingen data forlater huset før brukeren godkjenner. CTA: Installer Sara (eller "Aktiv" hvis allerede installert).

**2. Koble til en tjeneste**
Motta hendelser fra en ekstern leverandør. I dag er MDR det eneste tilgjengelige området, med 7 Security som tjenestetilbyder. CTA: Be om tilkobling.

Under de to kortene: én kort linje som sier at flere områder (ITSM, e-post/webhook, SIEM, ansattapp) kommer senere — ingen liste med pillene per leverandør.

Alt annet i det utvidede panelet (de tre ikonboksene og fire-stegs flyten) fjernes.

## Tilkoblingsflyt for MDR / 7 Security

Klikk på "Be om tilkobling" åpner en liten dialog som er tydelig på at dette kommer:

- Område: MDR (Managed Detection & Response)
- Tjenestetilbyder: 7 Security
- Godkjenning: leverandøren må godkjenne koblingen før hendelser flyter
- Kostnad: prises av tjenestetilbyder — oppgis før aktivering
- Vilkår: egne vilkår for datadeling må aksepteres
- Statusmerke "Kommer" øverst, og en primærknapp "Meld interesse" som kun bekrefter at ønsket er registrert (ingen backend-kobling nå)

## Teknisk

- Endringer i `src/pages/Deviations.tsx`: erstatt innholdet i `liveInfoExpanded`-blokken (linje ~524–631) med de to kortene; fjern bruken av `incidentSources`-pillene der.
- Ny komponent `src/components/deviations/ConnectIncidentServiceDialog.tsx` for MDR-forespørselen (godkjenning, kostnad, vilkår, "kommer").
- Sara-kortet gjenbruker eksisterende `useSaraAgent`-status og `SaraOnboardingDialog`.
- `SaraLiveDeviationsPanel` beholdes uendret for brukere som har Sara installert.
- Norsk og engelsk tekst via eksisterende i18n-mønster på siden.
