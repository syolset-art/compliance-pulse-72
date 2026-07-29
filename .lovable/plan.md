## Plan: Rydde kundekortet (CustomerStatusBanner)

### Bakgrunn
`src/components/msp/CustomerStatusBanner.tsx` er i dag rotete: den viser logo, vertikal stripe, kontekstbanner, donut-diagram, ramme-badge, kontaktinfo og ansvarlig i én lang blanding. Referansebildet viser en langt renere variant med tydelige seksjoner og redigerbare rader.

### Mål
Behold den grønne vertikale stripen helt til venstre, men ellers redesigne kortet til å ligne på referansebildet:
- Tydelig header med selskapsnavn, status og modenhet.
- To kolonner: **Om virksomheten** og **Ansvar og kontakt**.
- Redigering med blyant-ikon på hver rad (ikke hele feltet som redigeres i headeren).
- Kortfattet fotnote om at nettsted/beskrivelse er hentet automatisk.

### Endringer

1. **Header-område (toppraden)**
   - Selskapsnavn som H1/hovedtittel.
   - Statusmerke: grønt med sjekk-ikon + "Aktiv kunde" (eller tilsvarende for andre statuser).
   - Modenhet: tekstbasert, f.eks. "78 % Høy", høyrejustert.
   - Underheader: Org.nr · bransje · antall ansatte · aktive regelverk · siste aktivitet.
   - Fjerne logo, donut-diagram og separat kontekstbanner (informasjonen innarbeides i underheader/status).

2. **To-kolonne layout**
   - Venstre kolonne: **Om virksomheten**
     - Nettsted (lenke, redigerbar)
     - Beskrivelse (redigerbar, maks 500 tegn)
   - Høyre kolonne: **Ansvar og kontakt**
     - Kontaktperson hos kunden (navn, e-post, rolle)
     - Kundeansvarlig hos oss (partner-team)
   - Hver rad får label, verdi og blyant-knapp for å redigere.

3. **Redigeringsmodus per rad**
   - Når brukeren klikker blyanten, vises input/textarea + lagre/avbryt-knapper på den aktuelle raden.
   - E-post-raden beholdes med "send e-post / kopier"-popover.
   - Rolle beholdes som popover med forhåndsdefinerte roller.
   - Kundeansvarlig beholdes som partner-team-popover.

4. **Fotnote**
   - Legge til en liten, subtil tekst under kolonnene: "Nettsted og beskrivelse ble hentet automatisk da kunden ble lagt til. Rediger ved behov."

5. **Fjerne/forenkle elementer**
   - Fjerne logo.
   - Fjerne donut-diagram for modenhet.
   - Fjerne separat kontekstbanner.
   - Fjerne "Kontakt: / KUNDEKONTAKT:"-footeren (flyttes inn i kolonnene).
   - Beholde `actionSlot`-støtte for fremtidig bruk.

### Fil som endres
- `src/components/msp/CustomerStatusBanner.tsx`

### Utenom scope
- Ingen endringer i data-modell, backend eller `MSPCustomerDetail.tsx`.
- Ingen endringer i redigeringslogikk bortsett fra å flytte/redesigne input-feltene.

### Verifisering
- Kjøre `bun run build` for å sikre at komponenten kompilerer.
- Sjekke forhåndsvisning av kundeside for å bekrefte at kortet matcher referansebildet.