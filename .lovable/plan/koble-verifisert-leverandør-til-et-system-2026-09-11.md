# Koble verifisert leverandør til et system

## Målet

På et systemkort skal brukeren kunne koble systemet til en verifisert leverandør. Lara foreslår leverandøren automatisk, brukeren kan overstyre og selv søke. Er ikke Leverandørmodulen aktivert, får brukeren først det samme gratis-tilbudet som på produktsiden (inntil 5 leverandører gratis) og må godkjenne før koblingen fullføres.

## Slik blir flyten

1. **Diskret knapp i systemhodet.** Der leverandørnavnet står i dag legges en liten handling: «Koble leverandør» (eller kun et lite plussikon om navnet allerede finnes). Ingen ny boks, ingen banner.

2. **Lara foreslår.** Dialogen åpner med Laras forslag øverst — basert på systemets navn, nettadresse og eksisterende leverandørtekst, med samme oppslag som «Legg til leverandør» bruker (Brønnøysund/registerdata). Forslaget vises som ett kort med navn, org.nr., land og bransje, merket «Foreslått av Lara».

3. **Brukeren bestemmer.** Under forslaget: «Ikke riktig? Søk selv» med et søkefelt som gir treff fra samme kilder. Brukeren velger, ser detaljene og bekrefter — verifiseringen er brukerens aktive valg.

4. **Oppsalg når modulen ikke er aktiv.** Er Leverandørmodulen ikke aktivert, kommer et mellomsteg før bekreftelse: kort forklaring av hva modulen gir, «Inntil 5 leverandører gratis», pris for neste nivå og en godkjenn-knapp. Samme innhold og nivågrenser som produktsiden. Er grensen allerede nådd, vises oppgraderingsvalget i stedet.

5. **Resultatet vises subtilt.** Etter kobling erstattes leverandørmerket i systemhodet med leverandørnavn + liten hake og tekst «Verifisert» ved hover: «Verifisert leverandør koblet til systemet — bekreftet av <navn>, <dato>». Klikk går til leverandørprofilen. Ingen ekstra kort eller striper i skjermbildet.

## Teknisk

- Ny komponent `src/components/system-profile/LinkVendorDialog.tsx`: forslagssteg (gjenbruker `useVendorLookup`), søkesteg, aktiveringssteg, bekreftelsessteg.
- Systemhodet (`SystemHeader.tsx`) får handlingen og den nye «verifisert»-visningen ved siden av eksisterende leverandørbadge.
- Aktivering gjenbruker `moduleActivationState` (`isModuleDeactivated`/`activateModule`, `getModuleTier`) og `vendorCapacity` (`resolveVendorCapacity`) — samme grenser og tekst som produktsiden, ingen egen 5-konstant.
- Kobling lagres i eksisterende tabeller: leverandøren opprettes/gjenbrukes i `assets` (`asset_type = 'vendor'`) via samme kapasitetssjekk som `AddVendorDialog`, og koblingen skrives til `system_vendors` (`system_id`, `name`, `source`), i tillegg til at `systems.vendor` settes til valgt navn.
- Verifiseringsdetaljer (hvem/når) lagres i `system_vendors.purpose`-fri metadata er ikke egnet; i stedet brukes `source` = `verified:<kilde>` og bekreftelsesdato utledes av `created_at`. Ingen skjemaendringer.
- Norsk og engelsk tekst via eksisterende i18n-mønster i systemprofilen.
