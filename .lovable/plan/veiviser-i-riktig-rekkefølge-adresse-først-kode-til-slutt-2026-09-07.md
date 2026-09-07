# Veiviser i riktig rekkefølge: adresse først, kode til slutt

Veiviseren skal følge det brukeren faktisk gjør i Claude: først kopiere adressen, så legge inn koblingen i agenten, og til slutt lime inn den personlige koden når agenten spør om pålogging.

## Ny stegrekkefølge (4 trinn)

```text
1. Velg hvor agenten din bor      Claude · ChatGPT · Annet
2. Kopier adressen til Mynder     ett felt + kopiknapp
3. Legg til koblingen i agenten   Innstillinger → Capabilities → Connectors → Add
4. Lag koden din og lim den inn   koden vises én gang, limes inn etter "Connect"
```

### Trinn 1 – Velg agent
Som i dag: tre kort (Claude, ChatGPT, Annet). Valget styrer bare ordlyden i trinn 3.

### Trinn 2 – Kopier adressen
Ett tydelig felt med adressen og stor kopiknapp, én setning: «Dette er adressen til Mynder. Kopier den nå — du skal lime den inn i agenten din i neste steg.» Neste-knappen heter «Jeg har kopiert adressen».

### Trinn 3 – Legg til koblingen i Claude
Nummererte steg i klarspråk, med feltnavnene brukeren faktisk ser på skjermen:

1. Åpne Claude og gå til **Innstillinger**
2. Velg **Capabilities** (Funksjoner)
3. Finn **Connectors** og trykk **Add** / **Legg til**
4. Skriv navnet: **Mynder Partner** (vises som kopierbart felt)
5. Lim inn adressen du kopierte
6. Trykk **Connect**

Adresse og navn ligger som kopierbare felt rett i steget, så brukeren slipper å bla tilbake. ChatGPT og «Annet» får tilsvarende tilpasset ordlyd (for «Annet» også konfigurasjonsutklippet).

### Trinn 4 – Lag koden og logg inn
Forklaring først: «Når du trykker Connect, spør agenten om en kode. Den lager du her.»
- Navn på agenten (forhåndsutfylt «Mynder Partner») og varighet (30/90 dager/aldri)
- Knapp «Lag koden min» → koden vises én gang, med kopiknapp og advarsel om at den er som et passord
- Under koden: «Lim koden inn i agenten. Du får da nøyaktig samme tilgang som du har når du logger inn i Mynder selv — verken mer eller mindre.»
- Avslutning: en ferdig testsetning å lime inn i agenten («Hvilke leverandører har jeg i Mynder?») og hva svaret bør se ut som.

## Konsistens ellers på siden

Stegstripen i toppseksjonen oppdateres til samme fire steg, så forsiden og veiviseren forteller samme historie.

## Teknisk

- Kun frontend. `ByoaConnectWizard.tsx` utvides fra 3 til 4 trinn: adresse-steg skilles ut, kodeoppretting flyttes til siste trinn, klientinstruksjonene får de faktiske menynavnene og et kopierbart tilkoblingsnavn.
- `ByoaAgentHero.tsx` får fire steg i steglisten i stedet for tre.
- Alle nye/endrede tekster legges i `nb.json` og `en.json` under `byoa.*`; ingen hardkodede strenger eller farger.
- Ingen endringer i `agentTokens.ts`, edge-funksjonen eller databasen.
