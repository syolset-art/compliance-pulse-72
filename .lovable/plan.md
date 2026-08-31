# «Hva agenten kan gjøre» — fra pilleliste til produktseksjon

Dagens seksjon viser fem grå piller uten forklaring, alltid åpen. Den skal bli en profesjonell, salgbar oversikt i klarspråk der hver evne forklares konkret — og der det er tydelig at dette er hele listen i dag, ikke et utvalg.

## Ny struktur

Seksjonen er lukket som standard. Én rad øverst:

```text
Hva agenten kan gjøre for deg          5 oppgaver · 4 leser · 1 endrer     [Vis]
```

Kort ingress under tittelen (synlig også når seksjonen er lukket):
«Agenten din jobber i Mynder på dine vegne. Den kan hente svar fra leverandør- og regelverksdataene dine, og opprette oppfølging. Alt skjer innenfor din tilgang, og du kan trekke tilbake koden når som helst.»

## Innhold når seksjonen åpnes

Fem kort i rutenett (2 kolonner på desktop, 1 på mobil). Hvert kort:

- Ikon + navn i klarspråk (ikke verktøynavn)
- Én setning: hva agenten gjør
- Én linje «Slik bruker du det»: et konkret spørsmål brukeren kan stille
- Merkelapp: **Leser** (nøytral) eller **Endrer** (fremhevet)

| Kort | Klarspråk | Spør agenten om |
|---|---|---|
| Leverandøroversikt | «Får full oversikt over leverandørene dine, hvor kritiske de er og hvilken risiko de har.» | «Hvilke leverandører er kritiske og mangler dokumentasjon?» |
| Krav i regelverkene dine | «Slår opp krav og artikler i regelverkene du har aktivert, og forklarer hva de betyr.» | «Hva krever NIS2 av oss om leverandøroppfølging?» |
| Dokumentasjonsstatus | «Ser hvor langt du er kommet per regelverk og hva som mangler.» | «Hvor står vi på GDPR akkurat nå?» |
| Rapporter dekning | «Har du dokumentasjon liggende i egne systemer, kan agenten melde inn hva den dekker — uten å laste opp filen.» | «Registrer at policyen vår dekker artikkel 32.» |
| Opprett aktivitet (Endrer) | «Oppretter oppfølgingsoppgaver i Mynder, med frist og ansvarlig.» | «Lag en oppgave om å innhente DPA fra Visma innen fredag.» |

Under kortene, én avsluttende linje som svarer på «er dette alt?»:
«Dette er alle oppgavene agenten kan gjøre i dag. Flere kommer — blant annet avvik og databehandlingsprotokoll (RoPA).»

Teknisk detalj (endepunkt, transport, auth) beholdes som i dag bak «For utviklere», nederst i den åpnede seksjonen.

## Teknisk

- Kun `src/components/integrations/AgentCapabilitiesList.tsx` endres: pilleliste erstattes av `Collapsible` (lukket som standard) med kortrutenett; utviklerblokken flyttes inn i samme åpne tilstand.
- Innholdet for de fem kortene legges som en typet liste i komponenten, med `name` som matcher `MCP_EXPOSED_TOOLS` slik at listen holder seg i takt med verktøyene serveren faktisk eksponerer.
- Alle nye strenger som i18n-nøkler under `byoa.tools.*` i `src/locales/nb.json` og `en.json`.
- Kun semantiske design-tokens (`muted`, `accent`, `border`, `foreground`) — ingen hardkodede farger.
