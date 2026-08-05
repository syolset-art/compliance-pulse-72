# Aktivering av Trust Center hos kunde

Når partneren klikker "Aktiver" på Trust Center-kortet i kundens Produkter og tjenester, skal det starte en kort veiviser i et modalt vindu i stedet for dagens enkle bekreftelse.

## Flyten (3 steg)

**Steg 1 – Vilkår**
- Bekreft vilkår for aktivering (samme vilkårsdokument som i dag, med versjon).
- Hvis partneren ikke allerede har godkjent Driftspartner-rollen, vises også dette avkryssingsfeltet med kort forklaring: som driftspartner kan de arbeide med compliance i kundens egen virksomhetsprofil.
- Har de godkjent rollen tidligere, vises den bare som allerede bekreftet (ingen ny avkryssing).

**Steg 2 – Slik settes Trust Center opp**
Kort, punktvis oppsett av hva som praktisk må gjøres:
- Kunden må claime sin Trust Profil. Det sendes en e-post til kundens kontaktperson som må godkjenne.
- Anbefaling: claim når modenheten er rundt 55 % eller høyere — partneren vurderer selv. Kundens nåværende modenhet vises med anbefalt/ikke-anbefalt markering.
- Inntil kunden har claimet, kan partneren som driftspartner arbeide med Trust Profilen i kundens organisasjonsprofil.
- Valg: send claim-e-post nå, eller vent (kan sendes senere fra kundens profil).

**Steg 3 – Aktivert, hva nå?**
- Bekreftelse på at Trust Center er aktivert.
- To valg: "Bytt til kundens profil og jobb med Trust Profilen" (bruker eksisterende kontekstbytte og lander på Trust Profil), eller "Bli her".

## Teknisk

- Ny komponent `src/components/msp/ActivateTrustCenterDialog.tsx` som styrer de tre stegene.
- Gjenbruker `useTerms` (`acceptTerms` med kontekst `module_activation`, `operator_role`) og `TermsAcceptRow` for vilkår og driftspartner-avkryssing — ingen ny vilkårslogikk.
- Aktivering skjer via eksisterende `moduleActivationState` (samme kall som `ActivateRecommendationsDialog` gjør i dag) og sender `modules:changed`.
- Kontekstbytte gjenbruker `EnterCustomerContextDialog`-logikken (`enterCustomerOrg` + `entryRouteFor` med `moduleKey: "trust"` → `/trust-center/profile`).
- Modenhetsverdien hentes fra samme kilde som modenhetsspeilet på kundekortet; claim-e-post markeres som sendt i demo-tilstand (ingen ny backend-tabell).
- I `CustomerServicesAndProductsTab.tsx` rutes kun `trust`-produktet til den nye dialogen; øvrige produkter beholder dagens flyt.
