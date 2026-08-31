# Koble din egen agent til Mynder (BYOA)

Toppseksjonen på «Datakilder og agenter» bytter rolle. I dag står «Sara jobber hos deg» øverst — en agent som kjører hos kunden, og som ikke finnes ennå. Den flyttes ned som en «kommer senere»-notis. Øverst kommer i stedet det som faktisk virker i dag: kunden kobler sin egen AI-agent (Claude, ChatGPT eller annet) til Mynder og gjør compliance-arbeid uten å logge inn i plattformen.

## Ny toppseksjon

Samme annonseformat som i dag: illustrasjon til venstre, tekst og CTA til høyre.

- Tittel: **Bruk din egen agent i Mynder**
- Ingress i klartekst, uten sjargong: «Har du Claude eller ChatGPT? Koble den til Mynder én gang, så kan du spørre den om leverandører, krav og dokumentasjon — og be den opprette aktiviteter for deg. Du trenger ikke logge inn i Mynder.»
- Tre korte punkter med ikon: *Les leverandører og krav* · *Opprett aktiviteter* · *Du styrer tilgangen, og kan trekke den tilbake når som helst*
- Knapper: **Koble til agenten min** (åpner veiviser) og **Hva agenten får se** (åpner eksisterende tillitsgrense-forklaring)
- Ny illustrasjon som viser en ekstern agent som snakker med Mynder (erstatter Sara-bildet i denne seksjonen; Sara-bildet følger med Sara ned).

## Veiviseren — tre steg, ingen teknisk forkunnskap

```text
1. Velg hvor agenten din bor      Claude · ChatGPT · Annet (MCP-klient)
2. Lag din personlige kode        [Lag kode]  →  vises én gang, kopier
3. Lim inn i agenten              adresse + kode, med skjermbilde-lignende steg
```

**Steg 1 – Velg klient.** Tre store, klikkbare kort. Valget styrer bare hvilken oppskrift som vises i steg 3; alt annet er likt.

**Steg 2 – Personlig kode.** Én knapp «Lag koden min». Koden vises i et felt med kopiknapp og teksten «Dette er som et passord. Vi viser den bare nå — mister du den, lager du bare en ny.» Under: liste over kodene du har laget (navn, opprettet, sist brukt) med «Trekk tilbake».

**Steg 3 – Lim inn.** To felt med kopiknapp: **Adresse** (endepunktet) og **Din kode**. Under, tilpasset valgt klient:
- *Claude*: nummererte steg for Innstillinger → Koblinger → Legg til, med feltnavnene brukeren faktisk ser.
- *ChatGPT*: tilsvarende steg for egendefinert kobling.
- *Annet*: et ferdig konfigurasjonsutklipp til kopiering.

Nederst: «Slik sjekker du at det virker» — én setning brukeren kan lime inn i agenten sin, f.eks. «Hvilke leverandører har jeg i Mynder?», og hva svaret skal se ut som.

## Hva agenten kan gjøre

Under veiviseren, en enkel liste (ikke tabell) over de fem verktøyene i klartekst, med tydelig skille lese/skrive:
les leverandører · les krav i regelverkene dine · les dokumentasjonsstatus · rapporter dekningsgrad · **opprett aktivitet** (eneste som endrer noe).

## Sara flyttes ned

«Sara jobber hos deg» blir et lavmælt kort nederst, over MCP-seksjonen, med «Kommer senere»-merke: kort forklaring på at Sara skal kjøre i din egen infrastruktur og lese dokumenter lokalt, og en «Hold meg oppdatert»-knapp. Nedlasting/«Kom i gang» fjernes som handling. Sara-detaljene og onboardingdialogen beholdes bak «Les mer», uendret innhold.

## Rekkefølge på siden etter endringen

```text
1. Bruk din egen agent (BYOA)  ← ny topp
2. Hva agenten kan gjøre
3. Tilkoblede kilder / kildekart / neste steg  (uendret)
4. Sara — kommer senere        ← flyttet ned, nedtonet
5. Agentkoblinger (MCP)        (uendret, nederst)
```

## Teknisk

- Ny `src/components/integrations/ByoaAgentHero.tsx` og `ByoaConnectWizard.tsx`; `LocalAgentCard.tsx` skrives om til nedtonet «kommer senere»-kort og flyttes ned i `src/pages/Integrations.tsx`.
- Endepunktet hentes fra eksisterende `mcpServerUrl()` i `src/lib/mcpAgentConnections.ts`. Verktøylisten gjenbruker `MCP_EXPOSED_TOOLS`.
- Personlige koder: ny tabell `agent_access_tokens` (id, user_id, org, navn, token_hash, prefiks, opprettet, sist brukt, tilbaketrukket) med GRANT-er og RLS som binder rader til `auth.uid()`. Kun hash lagres; klarteksten returneres én gang fra en edge-funksjon som lager koden. MCP-endepunktet aksepterer koden i tillegg til dagens OAuth-pålogging.
- Ny illustrasjon genereres til `src/assets/`; Sara-bildet beholdes til Sara-kortet.
- Alle nye strenger legges i i18n (NO/EN) etter mønsteret på siden.
