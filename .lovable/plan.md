
## Mål
Hver kobling mellom en tjeneste og et krav skal vise hvilken **rolle** tjenesten har mot kravet, slik at partner og kunde forstår om tjenesten faktisk gjennomfører tiltaket, muliggjør det, dokumenterer eller vurderer status.

Roller:
- **Direkte tiltak** — tjenesten utfører selve kravet (f.eks. drift av MFA).
- **Muliggjørende** — tjenesten legger til rette for at kravet kan oppfylles (f.eks. verktøyoppsett).
- **Dokumenterende** — tjenesten produserer bevis/dokumentasjon (f.eks. rapport, policy).
- **Vurderende** — tjenesten vurderer status/modenhet (f.eks. pentest, revisjon).

En kobling kan ha én eller flere roller (f.eks. pentest = vurderende + dokumenterende).

## Datamodell
I `src/lib/serviceLibrary.ts`:
- Utvid `ServiceMapping` med `roles: ServiceRole[]` (påkrevd, minst én).
- Definer `type ServiceRole = "direct" | "enabling" | "documenting" | "assessing"` med `ROLE_META` (label, kort beskrivelse, farge-token, ikon).
- Fyll ut `roles` på alle eksisterende mappings i biblioteket ut fra tjenestens natur (pentest → assessing+documenting, MFA-drift → direct, DPO-tjeneste → enabling+documenting, osv.).

Samme felt legges på `ServiceMapping` som brukes i `CustomServiceDialog.tsx` — brukeren må velge minst én rolle når de mapper et krav manuelt.

## UI-endringer

### 1. Tjenestetabellen (`MSPServiceCatalogTab.tsx`)
I «Krav tjenesten støtter»-cellen: under hver framework-chip vises et lite rolle-merke (samme linje eller rett under), f.eks. `GDPR · Art.5, Art.6  ·  Dokumenterende`. Rollen vises som liten muted tekst eller minipille — subtil, ikke støyende. Tooltip på chipen utvides med én linje: «Rolle: Vurderende, Dokumenterende».

### 2. Preview / Custom-dialog (`CustomServiceDialog.tsx`)
Ved siden av hver mapping-rad legges en kompakt multi-select for roller (fire toggles med ikon). Minst én må være valgt før mapping kan lagres.

### 3. Foreslåtte tjeneste-preview (adopt flow)
Vises i sammendraget som `Penetrasjonstest – vurderer og dokumenterer status mot NIS2 Art.21` — bygges automatisk fra rollene på mappingen.

## Design
- Roller vises som tekst i muted farge (12–13px), ikke fargede pills, for å holde tabellen stram.
- Ikoner i dialogen: `Wrench` (direkte), `Plug` (muliggjørende), `FileText` (dokumenterende), `ClipboardCheck` (vurderende).
- Ingen nye farger — bruker eksisterende semantiske tokens.

## Ut av scope
- Ingen backend-endring (prototype, alt i biblioteksfilen).
- Ingen endring i selve compliance-kravslisten.
- Rollene brukes ikke ennå til å påvirke gap-analyse-scoring — kun visning. Kan kobles inn senere.
