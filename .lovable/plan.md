# Kildesystemer flyttes til Innstillinger

## Hva som endres

**1. Fjern MCP-boksen fra dokumentasjonsdialogen**
I dialogen «Legg til dokumentasjon» (regelverk) fjernes hele blokken «Hent fra agentisk kilde (MCP)» med kildeknappene og lenken «Administrer agentkoblinger». Dialogen blir ren: dra fil hit eller velg fil.

**2. Nytt menypunkt under Innstillinger: «Kildesystemer»**
Egen side der brukeren kobler Mynder til sine egne kildesystemer (Notion, SharePoint, Google Drive, Confluence, m.fl.). Siden presenteres profesjonelt og rolig:

- Kort intro: hva en kobling gjør — Lara leser kildene, kartlegger relevante systemer og fanger opp dokumentasjon automatisk.
- Rutenett med kildekort: logo/ikon, navn, kort beskrivelse, status (Tilkoblet / Ikke tilkoblet) og knapp «Koble til».
- Tilkoblede kilder øverst med sist synkronisert-tidspunkt og meny for å synkronisere på nytt eller koble fra.
- Seksjon «Hva Lara gjør med kildene» — kollapset som standard, i klarspråk: finner systemer og leverandører, foreslår dokumentasjon til kontrollkrav, holder oversikten oppdatert. Brukeren godkjenner alltid.
- Lenke videre til MCP-integrasjon (agentkoblinger) for de som kobler egen agent.

**3. Navigasjon**
«Kildesystemer» legges inn i sidemenyens innstillingsseksjon ved siden av «MCP integrasjon». Steder som i dag peker mot MCP for kildekobling (f.eks. avvik og Lara-widgets) peker mot Kildesystemer der det handler om datakilder.

## Teknisk

- Rediger `src/components/regulations/AttachEvidenceDialog.tsx`: fjern MCP-blokk, `MCP_SOURCES`, ubrukte importer (`Plug`, evt. `navigate`).
- Ny side `src/pages/SourceSystems.tsx` + rute `/settings/source-systems` i `src/App.tsx`.
- Kildekatalog som konstant i `src/lib/sourceSystems.ts` (id, navn, beskrivelse, kategori, ikon).
- Tilkoblingsstatus lagres i eksisterende backend-tabell hvis en passende finnes; ellers ny tabell `source_connections` (org-scoped, RLS + GRANTs) med felt for kilde, status, sist synkronisert. Selve OAuth-koblingen mockes i første versjon (status settes lokalt) — reell autentisering per kilde kommer som eget steg.
- Sidemenyoppføring i `src/components/Sidebar.tsx`, i18n-nøkler for NO/EN.
- Semantiske tokens, ingen hardkodede farger; responsivt kortrutenett.

## Spørsmål jeg antar svaret på
Første versjon gir ekte UI og lagret status, men ikke ferdig OAuth mot hver leverandør. Si fra hvis en spesifikk kilde (f.eks. SharePoint) skal kobles skikkelig først.
