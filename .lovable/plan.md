# Samlede vilkår med akseptlogg

Ett felles vilkårsdokument for alle Mynder-produkter. Brukeren møter det som en lenke + avkryssingsboks ved aktivering av modul og ved kjøp av lisenser. Hver aksept logges med versjon.

## Brukerflyt

1. Bruker aktiverer en modul eller kjøper lisenser.
2. Nederst i dialogen: en enkelt linje med sjekkboks — "Jeg godtar [Vilkår og betingelser]" (lenken åpner vilkårene i eget vindu/drawer).
3. Bekreft-knappen er deaktivert til boksen er huket av.
4. Ved bekreftelse lagres aksepten (bruker, versjon, tidspunkt, hva som ble aktivert/kjøpt).
5. Har brukeren allerede godtatt gjeldende versjon, vises boksen forhåndsavkrysset som en rolig bekreftelseslinje (ingen ekstra friksjon), men ny versjon krever ny aksept.

## Hvor vilkårene bor

- Ett dokument: `/terms` (offentlig lesbar side, versjonsnummer og dato øverst).
- `Innstillinger → Betingelser og samtykke` viser gjeldende versjon, når du godtok, og hele historikken over dine aksepter.

## Teknisk

**Database**
- Ny tabell `terms_versions`: `id`, `version` (unik), `effective_date`, `content_md`, `created_at`. Kun lesbar for alle innloggede; skriving via service_role.
- Ny tabell `terms_acceptances`: `id`, `user_id`, `terms_version_id`, `context` (f.eks. `module_activation`, `license_purchase`, `signup`), `context_ref` (modulnavn/lisens-id), `accepted_at`, `ip_hint`. RLS: bruker kan lese og sette inn egne rader; service_role full tilgang. GRANT for `authenticated` og `service_role` i samme migrasjon.

**Frontend**
- `src/hooks/useTerms.ts`: henter gjeldende versjon + brukerens siste aksept, og `acceptTerms(context, ref)`.
- `src/components/legal/TermsAcceptRow.tsx`: gjenbrukbar sjekkbokslinje med lenke til vilkårene. Kompakt, én linje, ingen bokser eller farger.
- `src/pages/Terms.tsx`: rendrer gjeldende vilkårstekst fra databasen (rute `/terms`).
- Kobles inn i: `SystemActivateDialog.tsx`, aktivering i `ModuleCard.tsx`/`Subscriptions.tsx`, `PurchaseLicensesDialog.tsx` og `AssignLicenseDialog.tsx`.
- `TermsAndConsent.tsx` oppdateres til å vise ett dokument med versjon + personlig aksepthistorikk i stedet for de fire hardkodede dokumentene.

Vilkårsteksten legges inn som versjon 1.0 med et nøytralt utkast som dere kan erstatte med endelig juridisk tekst.
