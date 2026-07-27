## Nytt menypunkt: «Moduler» på kundeprofilen

Legger til en ny fane «Moduler» i kundedetalj-visningen (`MSPCustomerDetail.tsx`, rute `/msp-dashboard/:id`). Fanen viser hvilke Mynder-moduler som er aktivert for den spesifikke kunden, i samme visuelle stil som skjermbildet partneren delte (Mynder Core, Regelverk, Leverandørmodul, Assets, Trust Profile).

### Hva som bygges

1. **Ny TabsTrigger «Moduler»** ved siden av eksisterende faner (Veiledning, Kartlegging, Meldinger, Trust Profile, Dokumentasjon, Regelverk). Synkroniseres med `?tab=modules` i URL som de andre.

2. **Ny komponent `CustomerModulesTab.tsx`** (under `src/components/msp/`) som viser en liste med modulkort:
   - **Mynder Core** – status (Aktivert/Ikke aktivert), kort beskrivelse, bruksindikator (f.eks. «21 av 50 systemer i bruk» med progress-bar), månedspris, handlinger «Avbestill» / «Endre nivå».
   - **Regelverk** – antall aktive regelverk + liste (GDPR, ISO 27001, …), pris, «Legg til regelverk».
   - **Leverandørmodul** – antall registrerte leverandører, pris, «Åpne modulen».
   - **Assets** – antall registrerte eiendeler, pris, «Åpne modulen».
   - **Trust Profile** – markert «Inkludert» / Gratis, viser public URL (`trust.mynder.no/<slug>`), «Åpne modulen».
   
   Header med tittel «Moduler» og hjelpetekst: «Se hva denne kunden har aktivert, og hva som kan legges til. Endringer påvirker månedsprisen.»

3. **Datakilde (prototype)**: leser aktiverings-flagg og tellere fra data som allerede finnes på kunden (aktive regelverk, antall systemer/leverandører/assets fra eksisterende hooks). Der data mangler i prototypen brukes rimelige demo-verdier slik at kortene ser komplette ut – i tråd med prototype-praksis i prosjektet.

4. **Ingen backend-endringer** i denne runden – kun UI-fane. Faktisk aktivering/avbestilling kan kobles på senere; knappene viser toast som placeholder («Kommer»).

### Ikke i scope
- Global sidebar-endring (menypunktet ligger i kundens tab-rad, ikke i venstre sidebar).
- Ny tabell/kolonne i databasen for modul-abonnement per kunde.
- Faktisk betalings-/prisberegning.

### Filer som endres/opprettes
- `src/pages/MSPCustomerDetail.tsx` – ny TabsTrigger + TabsContent «modules».
- `src/components/msp/CustomerModulesTab.tsx` – ny komponent.
