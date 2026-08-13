# Kun Acronis i integrasjonslisten og «Oppdag systemer»

I dag viser partner-innstillingen **Integrasjoner** Acronis pluss fire direkte-API-plassholdere (Azure AD, SharePoint, Intune, ServiceNow). Dialogen **Oppdag systemer** viser Microsoft, Google og Excel som integrasjonsvalg, selv om de ikke er reelle integrasjoner i produktet. Brukeren har bekreftet at Mynder i dag bare har Acronis, og at vi inntil videre ikke skal vise flere.

## Mål

- Partner-innstillingen **Integrasjoner** skal bare vise **Acronis**.
- Dialogen **Oppdag systemer** skal bare tilby **Acronis** og **Manuell** registrering.
- Eksisterende kode som beskriver andre leverandører, skal fjernes eller skjules.

## Endringer

### 1. Database: deaktiver plassholder-leverandører

Oppdatere `public.integration_providers` slik at kun `acronis` er `is_active = true`. De fire andre settes til `is_active = false`. Dette filtrerer dem automatisk ut av spørringen i `PartnerIntegrationsTab`, som allerede bruker `.eq("is_active", true)`.

```sql
UPDATE public.integration_providers
SET is_active = false
WHERE name IN ('azure-ad', 'sharepoint', 'intune', 'servicenow');
```

Migrasjonen beholdes uavhengig, slik at plassholderne kan aktiveres senere når de faktiske integrasjonene er klare.

### 2. Frontend: `PartnerIntegrationsTab.tsx`

- Fjerne `azure-ad`, `sharepoint`, `intune` og `servicenow` fra `PROVIDER_USAGE`.
- Beholde kun `acronis`-oppføringen, som beskriver at Acronis henter enheter og backup-status.
- Eventuelt justere ledeteksten øverst, slik at den ikke antyder at flere leverandører er tilgjengelige.

### 3. Frontend: `DiscoverSystemsDialog.tsx`

- Erstatte kildelisten (`sources`) med to alternativer:
  1. **Acronis** – beskrives som import av enheter/backup-status via 7 Security-agenten.
  2. **Manuell** – beholdes som fallback.
- Fjerne Microsoft, Google og Excel fra dialogen.
- Bruke semantiske farger (f.eks. `text-primary` / `bg-primary/10`) i stedet for merkevarespesifikke hardkodede farger.
- Valg av Acronis skal trigge samme type informasjonstoast som i dag for Microsoft/Google, eller eventuelt åpne Acronis-tilkoblingsflyten dersom den finnes på det aktive kundekortet.

## Verifisering

- Åpne **Innstillinger → Integrasjoner** i partner-modus: kun Acronis-kortet vises.
- Åpne **Oppdag systemer** fra systemlisten: kun Acronis og Manuell vises.
- Sjekke at ingen hardkodede farger eller gamle leverandørbeskrivelser ligger igjen i de to filene.

## Tekniske detaljer

- Tabell: `public.integration_providers` (reference data, RLS-policy for lesing finnes fra tidligere migrasjon).
- Filer: `src/components/msp/PartnerIntegrationsTab.tsx`, `src/components/systems/DiscoverSystemsDialog.tsx`.
- Migrasjon: ny fil under `supabase/migrations/` som oppdaterer `is_active` for de aktuelle radene.
