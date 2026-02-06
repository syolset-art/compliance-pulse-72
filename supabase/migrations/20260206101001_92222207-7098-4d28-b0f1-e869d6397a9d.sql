-- Seed demo assets for HULT IT AS prototype
-- Only insert if no assets exist (to avoid duplicates on re-run)

INSERT INTO assets (
  asset_type, name, description, category, vendor,
  lifecycle_status, risk_level, criticality, 
  compliance_score, work_area_id, asset_owner, asset_manager
)
SELECT * FROM (VALUES
  -- IT og systemer (27056e97-5c80-4817-9dc6-51ef68aece17)
  ('system', 'Microsoft 365', 'E-post, Teams, SharePoint og Office-pakke for hele organisasjonen', 
   'Produktivitet', 'Microsoft', 'active', 'medium', 'high', 85, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'IT-avdelingen'),
  
  ('system', 'Slack', 'Intern kommunikasjonsplattform for team-samarbeid', 
   'Kommunikasjon', 'Slack Technologies', 'active', 'low', 'medium', 90, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'IT-avdelingen'),
  
  ('network', 'Bedriftsnettverk', 'Hovednettverk med VPN og brannmur', 
   'LAN', NULL, 'active', 'medium', 'high', 72, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'IT-avdelingen'),
  
  ('hardware', 'Utvikler-laptoper', 'MacBook Pro og ThinkPad arbeidsstasjoner for utviklere', 
   'Arbeidsstasjoner', 'Apple/Lenovo', 'active', 'medium', 'medium', 65, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'IT-avdelingen'),
  
  ('vendor', 'Microsoft Corporation', 'Strategisk cloud- og produktivitetsleverandør', 
   'Cloud-leverandør', 'Microsoft', 'active', 'low', 'high', 88, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'Innkjøp'),
  
  ('contract', 'Azure Enterprise Agreement', 'Hovedavtale for Microsoft Azure-tjenester', 
   'Enterprise Agreement', 'Microsoft', 'active', 'low', 'high', 100, 
   '27056e97-5c80-4817-9dc6-51ef68aece17'::uuid, 'Lars Hansen', 'Økonomi'),

  -- Produktutvikling (ea7b5a07-d56d-472e-b0c8-504fd18b67ea)
  ('system', 'Azure DevOps', 'CI/CD, repos og prosjektstyring for utviklingsteamet', 
   'Utviklingsverktøy', 'Microsoft', 'active', 'low', 'high', 92, 
   'ea7b5a07-d56d-472e-b0c8-504fd18b67ea'::uuid, 'Kari Olsen', 'Utviklingsavdelingen'),
  
  ('system', 'Jira Service Management', 'Prosjektstyring og issue tracking', 
   'Prosjektstyring', 'Atlassian', 'active', 'low', 'medium', 88, 
   'ea7b5a07-d56d-472e-b0c8-504fd18b67ea'::uuid, 'Kari Olsen', 'Utviklingsavdelingen'),
  
  ('system', 'GitHub Enterprise', 'Kodeversjonering og samarbeid', 
   'Kodeversjonering', 'GitHub/Microsoft', 'active', 'medium', 'high', 78, 
   'ea7b5a07-d56d-472e-b0c8-504fd18b67ea'::uuid, 'Kari Olsen', 'Utviklingsavdelingen'),
  
  ('vendor', 'Atlassian', 'Leverandør av Jira, Confluence og andre samarbeidsverktøy', 
   'SaaS-leverandør', 'Atlassian', 'active', 'low', 'medium', 85, 
   'ea7b5a07-d56d-472e-b0c8-504fd18b67ea'::uuid, 'Kari Olsen', 'Innkjøp'),

  -- HR og personal (13fa06fd-d980-4823-8562-299360bf9130)
  ('system', 'Visma Lønn', 'Lønn- og HR-administrasjon', 
   'HR/Lønn', 'Visma', 'active', 'low', 'high', 95, 
   '13fa06fd-d980-4823-8562-299360bf9130'::uuid, 'Marte Berg', 'HR-avdelingen'),
  
  ('system', 'Recruitee', 'Rekrutteringsportal og ATS', 
   'Rekruttering', 'Recruitee', 'active', 'low', 'medium', 82, 
   '13fa06fd-d980-4823-8562-299360bf9130'::uuid, 'Marte Berg', 'HR-avdelingen'),
  
  ('data', 'Personaldata', 'Ansattinformasjon inkludert kontrakter og personnummer', 
   'Personopplysninger', NULL, 'active', 'high', 'high', 75, 
   '13fa06fd-d980-4823-8562-299360bf9130'::uuid, 'Marte Berg', 'HR-avdelingen'),

  -- Økonomi og regnskap (e6a1a675-a89f-429c-9217-0cdf1658e9da)
  ('system', 'Tripletex', 'Regnskapssystem for fakturering og bilag', 
   'Regnskap', 'Tripletex', 'active', 'low', 'high', 90, 
   'e6a1a675-a89f-429c-9217-0cdf1658e9da'::uuid, 'Ole Pettersen', 'Økonomiavdelingen'),
  
  ('system', 'Nets', 'Betalingsløsning og fakturahåndtering', 
   'Betaling', 'Nets', 'active', 'low', 'high', 88, 
   'e6a1a675-a89f-429c-9217-0cdf1658e9da'::uuid, 'Ole Pettersen', 'Økonomiavdelingen'),

  -- Ledelse og administrasjon (5acc39b4-288f-4f2c-9609-4734909e44d3)
  ('location', 'Hovedkontor Oslo', 'Hovedkontor i Storgata 15, Oslo med 45 arbeidsplasser', 
   'Kontor', NULL, 'active', 'low', 'high', 100, 
   '5acc39b4-288f-4f2c-9609-4734909e44d3'::uuid, 'Per Nilsen', 'Administrasjon'),
  
  ('data', 'Kundedata', 'Kundeinformasjon fra CRM og prosjektsystemer', 
   'Personopplysninger', NULL, 'active', 'high', 'high', 70, 
   '5acc39b4-288f-4f2c-9609-4734909e44d3'::uuid, 'Per Nilsen', 'Salgsavdelingen'),
  
  ('system', 'HubSpot CRM', 'Kunde- og salgsstyringsverktøy', 
   'CRM', 'HubSpot', 'active', 'medium', 'high', 80, 
   '5acc39b4-288f-4f2c-9609-4734909e44d3'::uuid, 'Per Nilsen', 'Salgsavdelingen')

) AS v(asset_type, name, description, category, vendor, lifecycle_status, risk_level, criticality, compliance_score, work_area_id, asset_owner, asset_manager)
WHERE NOT EXISTS (SELECT 1 FROM assets LIMIT 1);