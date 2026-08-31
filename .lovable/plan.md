# Agentsiden som «butikk»: to-kolonners topp + kontinuerlig compliance

Toppen er i dag én bred kolonne (hero) med en separat, lukket seksjon under. Den slås sammen til én tydelig topp-seksjon delt i to, og får et nytt hovedbudskap: kontinuerlig compliance starter med at du ber agenten lage en plan.

## Ny topp — to kolonner

```text
+-------------------------------+-------------------------------+
| VENSTRE                       | HØYRE                         |
| Illustrasjon (byoa-agent-hero)| «Dette kan agenten gjøre»     |
| Tittel + ingress              | 5 rader, klarspråk            |
| 3 verdipunkter                | ikon · navn · Leser/Endrer    |
| [Koble til agenten min]       | én linje forklaring pr rad    |
| [Hva agenten får se]          | «Dette er alt i dag …»        |
+-------------------------------+-------------------------------+
```

- Venstre: ekte illustrasjon (`src/assets/byoa-agent-hero.png`) i stedet for dagens plugg-ikon på flate.
- Høyre: listen fra «Hva agenten kan gjøre» flyttes opp og vises **åpen** som en stram liste (ikke kortrutenett, ikke lukket). Teller øverst: «5 oppgaver · 4 leser · 1 endrer».
- Eksempelspørsmål per oppgave flyttes til tooltip/hover, så listen holder seg kort.
- Under listen: «Dette er alt agenten kan i dag. Flere kommer — blant annet avvik og RoPA.»
- Utviklerdetaljer (endepunkt, transport, auth) beholdes bak «For utviklere», flyttet ned under to-kolonnen.

## Ny seksjon: Kontinuerlig compliance — første steg

Rett under toppen, før «Dine agenter»: et bredt, rolig kort som forklarer hva man gjør *etter* tilkobling.

- Tittel: **Første steg: be agenten lage en plan**
- Ingress: «Compliance er ikke et engangsprosjekt. Når agenten er koblet til, ber du den lage en plan — så tar den deg steg for steg gjennom kartlegging og dokumentasjon av regelverkene du har aktivert i Mynder.»
- Tre steg i rad:
  1. **Be om planen** — ferdig setning å lime inn: «Lag en plan for kontinuerlig leverandørstyring basert på regelverkene vi har aktivert i Mynder.» (med kopiknapp + hover-tekst om å lime inn i agenten)
  2. **Agenten kartlegger** — den leser leverandører, krav og dokumentasjonsstatus og finner hullene.
  3. **Dere jobber videre løpende** — agenten oppretter aktiviteter med frist og ansvarlig, og du gjentar planen f.eks. hver måned.
- To flere ferdige oppdrag som «pills» med kopiknapp: «Lag en plan for GDPR-dokumentasjon» og «Hva mangler vi før neste revisjon?»

## Teknisk

- `ByoaAgentHero.tsx`: bygges om til to-kolonners grid (`md:grid-cols-2`), importerer `byoa-agent-hero.png` som ES6-import med `alt`-tekst, og rendrer kapabilitetslisten i høyre kolonne.
- `AgentCapabilitiesList.tsx`: `Collapsible`-innpakningen fjernes; komponenten deles i en kompakt `CapabilityList` (brukes i heroen) og en `DeveloperDetails`-blokk som fortsatt ligger nedenfor. Datalisten (`CAPABILITIES` koblet til `MCP_EXPOSED_TOOLS`) beholdes uendret.
- Ny `src/components/integrations/ContinuousComplianceCard.tsx` med de tre stegene og kopierbare oppdrag (gjenbruker samme kopimønster/tooltip som veiviseren).
- `src/pages/Integrations.tsx`: rekkefølge blir Hero (2 kol.) → Kontinuerlig compliance → Dine agenter → utviklerdetaljer → Sara → MCP.
- Alle nye strenger som i18n-nøkler under `byoa.*` i `nb.json` og `en.json`. Kun semantiske design-tokens.
