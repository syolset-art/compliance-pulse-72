## Endring: Lara kartlegger også "Hendelser og kontinuitet"

Du har rett — hendelseshåndtering og forretningskontinuitet (RTO/RPO, backup, varsling) er typisk informasjon Lara kan trekke ut fra:
- Personvernerklæring (varsling ved brudd, GDPR Art. 33/34)
- Databehandleravtale (SLA, gjenoppretting, underleverandører)
- Sikkerhetspolicy / Incident Response-policy
- ISO 27001/27701-sertifikater og SOC 2-rapporter

### Hva jeg gjør

**Fil:** `src/components/trust-center/edit/IncidentsSection.tsx`

1. Importer `LaraAutoFillBanner`
2. Legg til banneret rett under tittelen "Hendelser og kontinuitet" (samme mønster som Datalagring, Personvern og Sikkerhetstiltak)
3. Fjern den eksisterende statiske undertittelen ("Hva skjer når noe går galt — varsling, gjenoppretting og kontinuitet.") siden banneret erstatter den
4. Behold tekstfeltene for `handling` og `continuity` slik at brukeren kan korrigere Laras forslag

**Tekst i banneret:**
> "Lara henter hendelseshåndtering, varslingsrutiner og kontinuitetsplaner fra personvernerklæring, databehandleravtale og sikkerhetsdokumentasjon."

Ingen andre filer endres. Ren UI-endring.