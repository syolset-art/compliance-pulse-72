

# Implementasjon: Seed-data for eiendeler i prototypen

## Oppsummering

Legger inn realistiske dummy-data i `assets`-tabellen slik at prototypen alltid har innhold å vise. Dataene er basert på:
- **Firmaet**: HULT IT AS (IT-konsulentfirma)
- **Eksisterende arbeidsområder**: IT, HR, Økonomi, Ledelse, Produktutvikling
- **Asset types**: System, Leverandør, Lokasjon, Nettverk, Maskinvare, Data, Kontrakt

---

## Demo-data som legges inn

| Navn | Type | Kategori | Arbeidsområde | Risiko | Compliance |
|------|------|----------|---------------|--------|------------|
| Microsoft 365 | System | Produktivitet | IT og systemer | medium | 85 |
| Azure DevOps | System | Utviklingsverktøy | Produktutvikling | low | 92 |
| Jira Service Management | System | Prosjektstyring | Produktutvikling | low | 88 |
| GitHub Enterprise | System | Kodeversjonering | Produktutvikling | medium | 78 |
| Visma Lønn | System | HR/Lønn | HR og personal | low | 95 |
| Tripletex | System | Regnskap | Økonomi og regnskap | low | 90 |
| Hovedkontor Oslo | Lokasjon | Kontor | Ledelse | low | 100 |
| Bedriftsnettverk | Nettverk | LAN | IT og systemer | medium | 72 |
| Microsoft Corporation | Leverandør | Cloud-leverandør | IT og systemer | low | 88 |
| Atlassian | Leverandør | SaaS-leverandør | Produktutvikling | low | 85 |
| Utvikler-laptoper | Maskinvare | Arbeidsstasjoner | IT og systemer | medium | 65 |
| Kundedata | Data | Personopplysninger | Ledelse | high | 70 |
| Azure-avtale | Kontrakt | Enterprise Agreement | IT og systemer | low | 100 |

---

## Teknisk implementasjon

### Database-migrering

Oppretter en SQL-migrering som:
1. Sjekker om det finnes eksisterende assets (for å unngå duplikater)
2. Inserter demo-data kun hvis tabellen er tom
3. Kobler assets til riktige arbeidsområder via `work_area_id`

```sql
INSERT INTO assets (
  asset_type, name, description, category, vendor,
  lifecycle_status, risk_level, criticality, 
  compliance_score, work_area_id, asset_owner
) VALUES
  ('system', 'Microsoft 365', 'E-post, Teams, SharePoint og Office-pakke', 
   'Produktivitet', 'Microsoft', 'active', 'medium', 'high', 85, 
   '27056e97-5c80-4817-9dc6-51ef68aece17', 'IT-ansvarlig'),
  -- ... flere rader
```

### Arbeidsområde-kobling

| Arbeidsområde | UUID |
|---------------|------|
| IT og systemer | 27056e97-5c80-4817-9dc6-51ef68aece17 |
| HR og personal | 13fa06fd-d980-4823-8562-299360bf9130 |
| Økonomi og regnskap | e6a1a675-a89f-429c-9217-0cdf1658e9da |
| Ledelse og administrasjon | 5acc39b4-288f-4f2c-9609-4734909e44d3 |
| Produktutvikling | ea7b5a07-d56d-472e-b0c8-504fd18b67ea |

---

## Fordeler

1. **Umiddelbart synlig innhold** - Assets-siden viser data med en gang
2. **Variert demo-data** - Dekker alle asset types for å vise bredden
3. **Realistisk kontekst** - Basert på IT-konsulentfirma (HULT IT AS)
4. **Koblet til arbeidsområder** - Viser relasjoner mellom data
5. **Varierte risikonivåer** - Demonstrerer risk- og compliance-scoring

---

## Fil-endringer

| Fil | Handling |
|-----|----------|
| `supabase/migrations/xxx_seed_demo_assets.sql` | Ny - Seed-migrering |

