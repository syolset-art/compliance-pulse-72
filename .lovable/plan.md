# Roller: omfang per rolle og rollekrav ved invitasjon

## Mål
1. Kundeansvarlig skal — som driftspartner — kunne gjelde for **alle kunder** eller **utvalgte kunder**.
2. Begge roller skal også kunne settes direkte på **kundekortet**, slik at tilgangsstyringen ikke er eneste sted det gjøres.
3. Ved invitasjon må brukeren ha **minst én rolle** før invitasjonen kan sendes.

## Slik blir det

### Tilgangsstyring (Innstillinger > Tilgangsstyring)
- Hver rolle-rad (Kundeansvarlig og Driftspartner) får sitt eget omfangsvalg: «Alle kunder» eller «Valgte kunder» med kundeplukker — i dag finnes dette bare for Driftspartner.
- Omfang og tilgangsnivå settes uavhengig per rolle.
- Sammendragslinjen under navnet viser omfang for begge roller, f.eks. «Medlem · Kundeansvarlig (lese og skrive, alle kunder) · Driftspartner (lese, 3 kunder)».

### Invitasjon
- Minst én rolle må velges før «Send invitasjon» blir aktiv, med kort hjelpetekst: brukeren blir medlem, men trenger en rolle for å kunne jobbe.
- Hvis en valgt rolle har omfang «Valgte kunder», må minst én kunde velges (gjelder nå begge roller).

### Kundekortet (kundens detaljside)
- Feltet «Kundeansvarlig hos oss» beholdes og fortsetter å skrive tilbake til teamdataene.
- I tillegg får kortet et tilsvarende valg for **Driftspartner** for denne kunden: velg teammedlem, som da legges til rollen med omfang «Valgte kunder» og denne kunden i listen.
- Endringer her og i Tilgangsstyring peker mot samme datakilde, så de holdes i synk.

## Teknisk
- `src/lib/partnerTeam.ts`: endre `scope`/`customerIds` fra ett felt til per-rolle-struktur (`roleScope: Record<PartnerRole, PartnerScope>`, `roleCustomerIds: Record<PartnerRole, string[]>`). Oppdater `describeMemberAccess` og `canOperateCustomer`, og legg til `canManageCustomer` for kundeansvarlig.
- Legg til hjelpefunksjon `assignRoleForCustomer(memberId, role, customerId)` som setter rollen med scope «selected» og legger kunden i listen, samt lagrer i localStorage (samme mønster som `setAccountManagerOverride`) og sender et event slik at åpne visninger oppdateres.
- `src/pages/MSPPartnerSettings.tsx`: rendre omfangsvelger + kundeplukker i begge rolle-rader; oppdatere `InviteDraft` og `inviteValid` (krev minst én rolle og gyldig omfang per rolle).
- `src/components/msp/CustomerStatusBanner.tsx`: legge til driftspartner-velger som bruker den nye hjelpefunksjonen, og la eksisterende kundeansvarlig-valg gå gjennom samme API.
- Demo-data i `PARTNER_TEAM` migreres til den nye strukturen.
