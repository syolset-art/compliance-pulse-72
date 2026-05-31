## Utvide partnerkatalogen i prototypen

Legg til flere valgmuligheter i `PARTNER_DIRECTORY` i `src/components/company/CompanyInfoForm.tsx` (linje 45–53). Autocomplete-listen filtrerer allerede på navn, så det holder å utvide arrayen.

### Nye oppføringer som legges til

- Hult-IT (it_partner) — IT-drift, support og brukerstøtte
- Hult-IT Security (mssp) — sikkerhetsovervåking og hendelseshåndtering
- 7 Security MSP (msp) — drift av sikkerhetsplattformer
- (7 Security som mssp finnes allerede)
- Visma Sikkerhet (mssp)
- TietoEvry Managed Security (mssp)
- Crayon Managed Services (msp)
- Itera Cybersecurity (mssp)
- Advania Operations (msp)
- Basefarm Managed Cloud (msp)
- Netsecurity (mssp)

Totalt ~13 oppføringer (de 7 eksisterende + nye), slik at både MSP- og MSSP-alternativer er rikelig representert opp mot grensen på ~10 ekstra. Skriving av "hult-" treffer begge Hult-IT-variantene; "7-se" treffer både 7 Security (MSSP) og 7 Security MSP.

### Teknisk

- Kun endring i `PARTNER_DIRECTORY`-arrayen.
- Ingen endringer i UI-logikk, autocomplete eller datamodell.
