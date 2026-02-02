-- Seed compliance_requirements with ISO 27001, GDPR, and AI Act controls
-- First, ensure we have the data populated from complianceRequirementsData.ts

-- Insert ISO 27001 Controls (93 total - key samples to demonstrate)
INSERT INTO public.compliance_requirements (framework_id, requirement_id, category, name, name_no, description, description_no, priority, domain, sla_category, agent_capability, sort_order, is_active)
SELECT * FROM (VALUES
  -- Organizational Controls (A.5)
  ('iso27001', 'A.5.1', 'organizational', 'Policies for information security', 'Retningslinjer for informasjonssikkerhet', 'Information security policy and topic-specific policies shall be defined, approved by management.', 'Retningslinjer for informasjonssikkerhet og tematiske retningslinjer skal defineres og godkjennes.', 'critical', 'security', 'organization_governance', 'full', 1, true),
  ('iso27001', 'A.5.2', 'organizational', 'Information security roles and responsibilities', 'Roller og ansvar for informasjonssikkerhet', 'Information security roles and responsibilities shall be defined and allocated.', 'Roller og ansvar for informasjonssikkerhet skal defineres og tildeles.', 'high', 'security', 'roles_access', 'assisted', 2, true),
  ('iso27001', 'A.5.3', 'organizational', 'Segregation of duties', 'Funksjonsadskillelse', 'Conflicting duties and areas of responsibility shall be segregated.', 'Motstridende plikter og ansvarsområder skal adskilles.', 'high', 'security', 'roles_access', 'assisted', 3, true),
  ('iso27001', 'A.5.4', 'organizational', 'Management responsibilities', 'Ledelsesansvar', 'Management shall require all personnel to apply information security.', 'Ledelsen skal kreve at alt personell anvender informasjonssikkerhet.', 'high', 'security', 'organization_governance', 'manual', 4, true),
  ('iso27001', 'A.5.5', 'organizational', 'Contact with authorities', 'Kontakt med myndigheter', 'The organization shall establish contact with relevant authorities.', 'Organisasjonen skal etablere kontakt med relevante myndigheter.', 'medium', 'security', 'organization_governance', 'assisted', 5, true),
  ('iso27001', 'A.5.6', 'organizational', 'Contact with special interest groups', 'Kontakt med interessegrupper', 'The organization shall maintain contact with special interest groups.', 'Organisasjonen skal vedlikeholde kontakt med interessegrupper.', 'low', 'security', 'organization_governance', 'manual', 6, true),
  ('iso27001', 'A.5.7', 'organizational', 'Threat intelligence', 'Trusseletterretning', 'Information relating to security threats shall be collected and analysed.', 'Informasjon om sikkerhetstrusler skal samles inn og analyseres.', 'high', 'security', 'systems_processes', 'full', 7, true),
  ('iso27001', 'A.5.8', 'organizational', 'Information security in project management', 'Informasjonssikkerhet i prosjektledelse', 'Information security shall be integrated into project management.', 'Informasjonssikkerhet skal integreres i prosjektledelse.', 'medium', 'security', 'organization_governance', 'assisted', 8, true),
  ('iso27001', 'A.5.9', 'organizational', 'Inventory of information and assets', 'Oversikt over informasjon og eiendeler', 'An inventory of information and assets shall be maintained.', 'En oversikt over informasjon og eiendeler skal vedlikeholdes.', 'critical', 'security', 'systems_processes', 'full', 9, true),
  ('iso27001', 'A.5.10', 'organizational', 'Acceptable use of assets', 'Akseptabel bruk av eiendeler', 'Rules for acceptable use of assets shall be documented.', 'Regler for akseptabel bruk av eiendeler skal dokumenteres.', 'high', 'security', 'organization_governance', 'full', 10, true),
  ('iso27001', 'A.5.11', 'organizational', 'Return of assets', 'Retur av eiendeler', 'Personnel shall return assets upon termination.', 'Personell skal returnere eiendeler ved avslutning.', 'medium', 'security', 'roles_access', 'assisted', 11, true),
  ('iso27001', 'A.5.12', 'organizational', 'Classification of information', 'Klassifisering av informasjon', 'Information shall be classified according to security needs.', 'Informasjon skal klassifiseres etter sikkerhetsbehov.', 'high', 'security', 'systems_processes', 'assisted', 12, true),
  ('iso27001', 'A.5.13', 'organizational', 'Labelling of information', 'Merking av informasjon', 'Procedures for labelling shall be implemented.', 'Prosedyrer for merking skal implementeres.', 'medium', 'security', 'systems_processes', 'assisted', 13, true),
  ('iso27001', 'A.5.14', 'organizational', 'Information transfer', 'Informasjonsoverføring', 'Information transfer rules shall be in place.', 'Regler for informasjonsoverføring skal være på plass.', 'high', 'security', 'systems_processes', 'full', 14, true),
  ('iso27001', 'A.5.15', 'organizational', 'Access control', 'Tilgangskontroll', 'Rules to control access shall be established.', 'Regler for tilgangskontroll skal etableres.', 'critical', 'security', 'roles_access', 'full', 15, true),
  ('iso27001', 'A.5.16', 'organizational', 'Identity management', 'Identitetsadministrasjon', 'The full life cycle of identities shall be managed.', 'Hele livssyklusen til identiteter skal administreres.', 'high', 'security', 'roles_access', 'full', 16, true),
  ('iso27001', 'A.5.17', 'organizational', 'Authentication information', 'Autentiseringsinformasjon', 'Allocation of authentication info shall be controlled.', 'Tildeling av autentiseringsinformasjon skal kontrolleres.', 'high', 'security', 'roles_access', 'full', 17, true),
  ('iso27001', 'A.5.18', 'organizational', 'Access rights', 'Tilgangsrettigheter', 'Access rights shall be provisioned and reviewed.', 'Tilgangsrettigheter skal tildeles og gjennomgås.', 'high', 'security', 'roles_access', 'full', 18, true),
  ('iso27001', 'A.5.19', 'organizational', 'Information security in supplier relationships', 'Informasjonssikkerhet i leverandørforhold', 'Processes to manage supplier security risks.', 'Prosesser for å håndtere leverandørsikkerhetsrisikoer.', 'high', 'security', 'systems_processes', 'full', 19, true),
  ('iso27001', 'A.5.20', 'organizational', 'Addressing security in supplier agreements', 'Adressering av sikkerhet i leverandøravtaler', 'Security requirements shall be agreed with suppliers.', 'Sikkerhetskrav skal avtales med leverandører.', 'high', 'security', 'systems_processes', 'assisted', 20, true),
  ('iso27001', 'A.5.21', 'organizational', 'Managing security in ICT supply chain', 'Administrasjon av sikkerhet i IKT-leverandørkjeden', 'Manage security risks in ICT supply chain.', 'Håndtere sikkerhetsrisikoer i IKT-leverandørkjeden.', 'high', 'security', 'systems_processes', 'full', 21, true),
  ('iso27001', 'A.5.22', 'organizational', 'Monitoring supplier services', 'Overvåking av leverandørtjenester', 'Monitor and review supplier services.', 'Overvåke og gjennomgå leverandørtjenester.', 'medium', 'security', 'systems_processes', 'full', 22, true),
  ('iso27001', 'A.5.23', 'organizational', 'Information security for cloud services', 'Informasjonssikkerhet for skytjenester', 'Processes for cloud service security.', 'Prosesser for skytjenestesikkerhet.', 'high', 'security', 'systems_processes', 'full', 23, true),
  ('iso27001', 'A.5.24', 'organizational', 'Incident management planning', 'Planlegging av hendelseshåndtering', 'Plan and prepare for managing incidents.', 'Planlegge og forberede hendelseshåndtering.', 'critical', 'security', 'organization_governance', 'manual', 24, true),
  ('iso27001', 'A.5.25', 'organizational', 'Assessment of security events', 'Vurdering av sikkerhetshendelser', 'Assess security events and categorize.', 'Vurdere sikkerhetshendelser og kategorisere.', 'high', 'security', 'systems_processes', 'assisted', 25, true),
  ('iso27001', 'A.5.26', 'organizational', 'Response to incidents', 'Respons på hendelser', 'Respond to incidents according to procedures.', 'Respondere på hendelser i henhold til prosedyrer.', 'critical', 'security', 'systems_processes', 'assisted', 26, true),
  ('iso27001', 'A.5.27', 'organizational', 'Learning from incidents', 'Læring fra hendelser', 'Gain knowledge from incident handling.', 'Oppnå kunnskap fra hendelseshåndtering.', 'high', 'security', 'systems_processes', 'full', 27, true),
  ('iso27001', 'A.5.28', 'organizational', 'Collection of evidence', 'Innsamling av bevis', 'Procedures for evidence collection.', 'Prosedyrer for innsamling av bevis.', 'medium', 'security', 'systems_processes', 'assisted', 28, true),
  ('iso27001', 'A.5.29', 'organizational', 'Business continuity security', 'Sikkerhet ved forretningskontinuitet', 'Security during business disruption.', 'Sikkerhet under forretningsavbrudd.', 'high', 'security', 'organization_governance', 'assisted', 29, true),
  ('iso27001', 'A.5.30', 'organizational', 'ICT readiness for business continuity', 'IKT-beredskap for forretningskontinuitet', 'ICT services shall support business continuity.', 'IKT-tjenester skal støtte forretningskontinuitet.', 'high', 'security', 'systems_processes', 'full', 30, true),
  ('iso27001', 'A.5.31', 'organizational', 'Legal and regulatory requirements', 'Juridiske og regulatoriske krav', 'Identify applicable requirements.', 'Identifisere gjeldende krav.', 'critical', 'security', 'organization_governance', 'full', 31, true),
  ('iso27001', 'A.5.32', 'organizational', 'Intellectual property rights', 'Immaterielle rettigheter', 'Protect intellectual property.', 'Beskytte immaterielle rettigheter.', 'medium', 'security', 'organization_governance', 'assisted', 32, true),
  ('iso27001', 'A.5.33', 'organizational', 'Protection of records', 'Beskyttelse av registre', 'Protect records from loss.', 'Beskytte registre mot tap.', 'high', 'security', 'systems_processes', 'full', 33, true),
  ('iso27001', 'A.5.34', 'organizational', 'Privacy and PII protection', 'Personvern og PII-beskyttelse', 'Ensure privacy and PII protection.', 'Sikre personvern og PII-beskyttelse.', 'critical', 'security', 'systems_processes', 'full', 34, true),
  ('iso27001', 'A.5.35', 'organizational', 'Independent review of security', 'Uavhengig gjennomgang av sikkerhet', 'Independent review of security approach.', 'Uavhengig gjennomgang av sikkerhetstilnærming.', 'medium', 'security', 'organization_governance', 'manual', 35, true),
  ('iso27001', 'A.5.36', 'organizational', 'Compliance with policies', 'Samsvar med retningslinjer', 'Ensure compliance with security policies.', 'Sikre samsvar med sikkerhetsretningslinjer.', 'high', 'security', 'organization_governance', 'full', 36, true),
  ('iso27001', 'A.5.37', 'organizational', 'Documented operating procedures', 'Dokumenterte driftsprosedyrer', 'Operating procedures shall be documented.', 'Driftsprosedyrer skal dokumenteres.', 'medium', 'security', 'systems_processes', 'full', 37, true),
  
  -- People Controls (A.6) - 8 controls
  ('iso27001', 'A.6.1', 'people', 'Screening', 'Bakgrunnssjekk', 'Background verification checks on candidates.', 'Bakgrunnskontroller på kandidater.', 'high', 'security', 'roles_access', 'assisted', 38, true),
  ('iso27001', 'A.6.2', 'people', 'Terms and conditions of employment', 'Ansettelsesvilkår', 'Contractual agreements for security.', 'Kontraktuelle avtaler for sikkerhet.', 'high', 'security', 'roles_access', 'full', 39, true),
  ('iso27001', 'A.6.3', 'people', 'Information security awareness', 'Sikkerhetsbevissthet', 'Awareness, education and training.', 'Bevissthet, utdanning og opplæring.', 'critical', 'security', 'roles_access', 'manual', 40, true),
  ('iso27001', 'A.6.4', 'people', 'Disciplinary process', 'Disiplinærprosess', 'Disciplinary process for violations.', 'Disiplinærprosess for brudd.', 'medium', 'security', 'organization_governance', 'manual', 41, true),
  ('iso27001', 'A.6.5', 'people', 'Responsibilities after termination', 'Ansvar etter avslutning', 'Security responsibilities after termination.', 'Sikkerhetsansvar etter avslutning.', 'medium', 'security', 'roles_access', 'assisted', 42, true),
  ('iso27001', 'A.6.6', 'people', 'Confidentiality agreements', 'Taushetserklæringer', 'Confidentiality or NDA agreements.', 'Taushetserklæringer eller NDA-avtaler.', 'high', 'security', 'roles_access', 'full', 43, true),
  ('iso27001', 'A.6.7', 'people', 'Remote working', 'Fjernarbeid', 'Security measures for remote working.', 'Sikkerhetstiltak for fjernarbeid.', 'high', 'security', 'systems_processes', 'full', 44, true),
  ('iso27001', 'A.6.8', 'people', 'Information security event reporting', 'Rapportering av sikkerhetshendelser', 'Reporting mechanism for events.', 'Rapporteringsmekanisme for hendelser.', 'high', 'security', 'systems_processes', 'full', 45, true),
  
  -- Physical Controls (A.7) - 14 controls
  ('iso27001', 'A.7.1', 'physical', 'Physical security perimeters', 'Fysiske sikkerhetsperimetere', 'Security perimeters shall be defined.', 'Sikkerhetsperimetere skal defineres.', 'high', 'security', 'systems_processes', 'manual', 46, true),
  ('iso27001', 'A.7.2', 'physical', 'Physical entry', 'Fysisk adgang', 'Secure areas shall be protected.', 'Sikre områder skal beskyttes.', 'high', 'security', 'systems_processes', 'manual', 47, true),
  ('iso27001', 'A.7.3', 'physical', 'Securing offices and facilities', 'Sikring av kontorer og fasiliteter', 'Physical security for offices.', 'Fysisk sikkerhet for kontorer.', 'medium', 'security', 'systems_processes', 'manual', 48, true),
  ('iso27001', 'A.7.4', 'physical', 'Physical security monitoring', 'Fysisk sikkerhetsovervåking', 'Premises shall be monitored.', 'Lokaler skal overvåkes.', 'high', 'security', 'systems_processes', 'assisted', 49, true),
  ('iso27001', 'A.7.5', 'physical', 'Protecting against threats', 'Beskyttelse mot trusler', 'Protection against physical threats.', 'Beskyttelse mot fysiske trusler.', 'medium', 'security', 'systems_processes', 'assisted', 50, true),
  ('iso27001', 'A.7.6', 'physical', 'Working in secure areas', 'Arbeid i sikre områder', 'Security measures for secure areas.', 'Sikkerhetstiltak for sikre områder.', 'medium', 'security', 'systems_processes', 'manual', 51, true),
  ('iso27001', 'A.7.7', 'physical', 'Clear desk and clear screen', 'Ryddig pult og skjerm', 'Clear desk and screen policy.', 'Policy for ryddig pult og skjerm.', 'medium', 'security', 'systems_processes', 'assisted', 52, true),
  ('iso27001', 'A.7.8', 'physical', 'Equipment siting and protection', 'Plassering og beskyttelse av utstyr', 'Protect equipment from threats.', 'Beskytte utstyr mot trusler.', 'medium', 'security', 'systems_processes', 'assisted', 53, true),
  ('iso27001', 'A.7.9', 'physical', 'Security of assets off-premises', 'Sikkerhet for eiendeler utenfor lokaler', 'Protect assets off-premises.', 'Beskytte eiendeler utenfor lokaler.', 'medium', 'security', 'systems_processes', 'assisted', 54, true),
  ('iso27001', 'A.7.10', 'physical', 'Storage media', 'Lagringsmedier', 'Manage storage media securely.', 'Håndtere lagringsmedier sikkert.', 'high', 'security', 'systems_processes', 'full', 55, true),
  ('iso27001', 'A.7.11', 'physical', 'Supporting utilities', 'Støttefasiliteter', 'Protect from utility failures.', 'Beskytte mot verktøyfeil.', 'medium', 'security', 'systems_processes', 'assisted', 56, true),
  ('iso27001', 'A.7.12', 'physical', 'Cabling security', 'Kabelsikkerhet', 'Protect power and network cables.', 'Beskytte strøm- og nettverkskabler.', 'medium', 'security', 'systems_processes', 'manual', 57, true),
  ('iso27001', 'A.7.13', 'physical', 'Equipment maintenance', 'Vedlikehold av utstyr', 'Maintain equipment correctly.', 'Vedlikeholde utstyr korrekt.', 'medium', 'security', 'systems_processes', 'assisted', 58, true),
  ('iso27001', 'A.7.14', 'physical', 'Secure disposal or re-use', 'Sikker avhending eller gjenbruk', 'Securely dispose or re-use equipment.', 'Sikker avhending eller gjenbruk av utstyr.', 'high', 'security', 'systems_processes', 'assisted', 59, true),
  
  -- Technological Controls (A.8) - 34 controls (first 20)
  ('iso27001', 'A.8.1', 'technological', 'User endpoint devices', 'Brukerendepunkter', 'Protect information on endpoint devices.', 'Beskytte informasjon på endepunkter.', 'high', 'security', 'systems_processes', 'full', 60, true),
  ('iso27001', 'A.8.2', 'technological', 'Privileged access rights', 'Privilegerte tilgangsrettigheter', 'Restrict and manage privileged access.', 'Begrense og administrere privilegert tilgang.', 'critical', 'security', 'roles_access', 'full', 61, true),
  ('iso27001', 'A.8.3', 'technological', 'Information access restriction', 'Informasjonstilgangsbegrensning', 'Restrict access to information.', 'Begrense tilgang til informasjon.', 'high', 'security', 'roles_access', 'full', 62, true),
  ('iso27001', 'A.8.4', 'technological', 'Access to source code', 'Tilgang til kildekode', 'Restrict access to source code.', 'Begrense tilgang til kildekode.', 'high', 'security', 'systems_processes', 'full', 63, true),
  ('iso27001', 'A.8.5', 'technological', 'Secure authentication', 'Sikker autentisering', 'Secure authentication technologies.', 'Sikre autentiseringsteknologier.', 'critical', 'security', 'systems_processes', 'full', 64, true),
  ('iso27001', 'A.8.6', 'technological', 'Capacity management', 'Kapasitetsstyring', 'Monitor and adjust capacity.', 'Overvåke og justere kapasitet.', 'medium', 'security', 'systems_processes', 'full', 65, true),
  ('iso27001', 'A.8.7', 'technological', 'Protection against malware', 'Beskyttelse mot skadevare', 'Implement malware protection.', 'Implementere beskyttelse mot skadevare.', 'critical', 'security', 'systems_processes', 'full', 66, true),
  ('iso27001', 'A.8.8', 'technological', 'Management of technical vulnerabilities', 'Håndtering av tekniske sårbarheter', 'Manage technical vulnerabilities.', 'Håndtere tekniske sårbarheter.', 'critical', 'security', 'systems_processes', 'full', 67, true),
  ('iso27001', 'A.8.9', 'technological', 'Configuration management', 'Konfigurasjonsstyring', 'Manage security configurations.', 'Håndtere sikkerhetskonfigurasjoner.', 'high', 'security', 'systems_processes', 'full', 68, true),
  ('iso27001', 'A.8.10', 'technological', 'Information deletion', 'Sletting av informasjon', 'Delete information when no longer required.', 'Slette informasjon når den ikke lenger trengs.', 'high', 'security', 'systems_processes', 'assisted', 69, true),
  ('iso27001', 'A.8.11', 'technological', 'Data masking', 'Datamaskering', 'Mask data according to requirements.', 'Maskere data i henhold til krav.', 'medium', 'security', 'systems_processes', 'assisted', 70, true),
  ('iso27001', 'A.8.12', 'technological', 'Data leakage prevention', 'Forebygging av datalekkasje', 'Apply data leakage prevention.', 'Anvende forebygging av datalekkasje.', 'high', 'security', 'systems_processes', 'full', 71, true),
  ('iso27001', 'A.8.13', 'technological', 'Information backup', 'Sikkerhetskopiering av informasjon', 'Maintain backup copies of information.', 'Vedlikeholde sikkerhetskopier av informasjon.', 'critical', 'security', 'systems_processes', 'full', 72, true),
  ('iso27001', 'A.8.14', 'technological', 'Redundancy of information processing', 'Redundans av informasjonsbehandling', 'Implement redundancy for processing.', 'Implementere redundans for behandling.', 'high', 'security', 'systems_processes', 'assisted', 73, true),
  ('iso27001', 'A.8.15', 'technological', 'Logging', 'Logging', 'Produce and protect logs.', 'Produsere og beskytte logger.', 'high', 'security', 'systems_processes', 'full', 74, true),
  ('iso27001', 'A.8.16', 'technological', 'Monitoring activities', 'Overvåkingsaktiviteter', 'Monitor networks and systems.', 'Overvåke nettverk og systemer.', 'high', 'security', 'systems_processes', 'full', 75, true),
  ('iso27001', 'A.8.17', 'technological', 'Clock synchronization', 'Klokkesynkronisering', 'Synchronize clocks across systems.', 'Synkronisere klokker på tvers av systemer.', 'low', 'security', 'systems_processes', 'full', 76, true),
  ('iso27001', 'A.8.18', 'technological', 'Use of privileged utility programs', 'Bruk av privilegerte hjelpeprogrammer', 'Restrict and control utility programs.', 'Begrense og kontrollere hjelpeprogrammer.', 'medium', 'security', 'systems_processes', 'assisted', 77, true),
  ('iso27001', 'A.8.19', 'technological', 'Installation of software', 'Installasjon av programvare', 'Control software installation.', 'Kontrollere programvareinstallasjon.', 'high', 'security', 'systems_processes', 'full', 78, true),
  ('iso27001', 'A.8.20', 'technological', 'Networks security', 'Nettverkssikkerhet', 'Manage network security.', 'Håndtere nettverkssikkerhet.', 'critical', 'security', 'systems_processes', 'full', 79, true),
  ('iso27001', 'A.8.21', 'technological', 'Security of network services', 'Sikkerhet for nettverkstjenester', 'Secure network services.', 'Sikre nettverkstjenester.', 'high', 'security', 'systems_processes', 'full', 80, true),
  ('iso27001', 'A.8.22', 'technological', 'Segregation of networks', 'Segmentering av nettverk', 'Segregate groups of services.', 'Segmentere grupper av tjenester.', 'high', 'security', 'systems_processes', 'full', 81, true),
  ('iso27001', 'A.8.23', 'technological', 'Web filtering', 'Webfiltrering', 'Filter access to external websites.', 'Filtrere tilgang til eksterne nettsteder.', 'medium', 'security', 'systems_processes', 'full', 82, true),
  ('iso27001', 'A.8.24', 'technological', 'Use of cryptography', 'Bruk av kryptografi', 'Define and implement cryptography rules.', 'Definere og implementere kryptografiregler.', 'critical', 'security', 'systems_processes', 'full', 83, true),
  ('iso27001', 'A.8.25', 'technological', 'Secure development life cycle', 'Sikker utviklingslivssyklus', 'Establish secure development rules.', 'Etablere regler for sikker utvikling.', 'high', 'security', 'systems_processes', 'assisted', 84, true),
  ('iso27001', 'A.8.26', 'technological', 'Application security requirements', 'Applikasjonssikkerhetskrav', 'Identify and specify security requirements.', 'Identifisere og spesifisere sikkerhetskrav.', 'high', 'security', 'systems_processes', 'assisted', 85, true),
  ('iso27001', 'A.8.27', 'technological', 'Secure system architecture', 'Sikker systemarkitektur', 'Principles for secure architecture.', 'Prinsipper for sikker arkitektur.', 'high', 'security', 'systems_processes', 'assisted', 86, true),
  ('iso27001', 'A.8.28', 'technological', 'Secure coding', 'Sikker koding', 'Apply secure coding principles.', 'Anvende sikre kodingsprinsipper.', 'high', 'security', 'systems_processes', 'full', 87, true),
  ('iso27001', 'A.8.29', 'technological', 'Security testing in development', 'Sikkerhetstesting i utvikling', 'Test security during development.', 'Teste sikkerhet under utvikling.', 'high', 'security', 'systems_processes', 'full', 88, true),
  ('iso27001', 'A.8.30', 'technological', 'Outsourced development', 'Utkontraktert utvikling', 'Supervise outsourced development.', 'Overvåke utkontraktert utvikling.', 'medium', 'security', 'systems_processes', 'assisted', 89, true),
  ('iso27001', 'A.8.31', 'technological', 'Separation of development environments', 'Separasjon av utviklingsmiljøer', 'Separate development environments.', 'Separere utviklingsmiljøer.', 'high', 'security', 'systems_processes', 'full', 90, true),
  ('iso27001', 'A.8.32', 'technological', 'Change management', 'Endringsstyring', 'Control changes to systems.', 'Kontrollere endringer i systemer.', 'high', 'security', 'systems_processes', 'full', 91, true),
  ('iso27001', 'A.8.33', 'technological', 'Test information', 'Testinformasjon', 'Protect test information.', 'Beskytte testinformasjon.', 'medium', 'security', 'systems_processes', 'assisted', 92, true),
  ('iso27001', 'A.8.34', 'technological', 'Protection of audit information', 'Beskyttelse av revisjonsinformasjon', 'Protect information systems during audits.', 'Beskytte informasjonssystemer under revisjoner.', 'medium', 'security', 'systems_processes', 'full', 93, true),

  -- GDPR Requirements (12 key articles)
  ('gdpr', 'Art.5', 'legal', 'Principles of data processing', 'Prinsipper for databehandling', 'Lawfulness, fairness, transparency and purpose limitation.', 'Lovlighet, rettferdighet, åpenhet og formålsbegrensning.', 'critical', 'privacy', 'organization_governance', 'assisted', 1, true),
  ('gdpr', 'Art.6', 'legal', 'Lawfulness of processing', 'Lovlighet av behandling', 'Legal basis for processing personal data.', 'Rettslig grunnlag for behandling av personopplysninger.', 'critical', 'privacy', 'organization_governance', 'assisted', 2, true),
  ('gdpr', 'Art.13', 'governance', 'Information to data subjects', 'Informasjon til registrerte', 'Provide information when collecting data.', 'Gi informasjon ved innsamling av data.', 'high', 'privacy', 'systems_processes', 'full', 3, true),
  ('gdpr', 'Art.15', 'legal', 'Right of access', 'Innsynsrett', 'Data subjects right to access their data.', 'Registrertes rett til innsyn i sine data.', 'high', 'privacy', 'systems_processes', 'full', 4, true),
  ('gdpr', 'Art.17', 'legal', 'Right to erasure', 'Rett til sletting', 'Right to be forgotten and data erasure.', 'Retten til å bli glemt og sletting av data.', 'high', 'privacy', 'systems_processes', 'full', 5, true),
  ('gdpr', 'Art.25', 'governance', 'Data protection by design', 'Innebygd personvern', 'Implement privacy by design and default.', 'Implementere innebygd personvern og standardinnstillinger.', 'critical', 'privacy', 'systems_processes', 'assisted', 6, true),
  ('gdpr', 'Art.28', 'governance', 'Processor agreements', 'Databehandleravtaler', 'Written agreements with data processors.', 'Skriftlige avtaler med databehandlere.', 'critical', 'privacy', 'systems_processes', 'full', 7, true),
  ('gdpr', 'Art.30', 'governance', 'Records of processing activities', 'Protokoll for behandlingsaktiviteter', 'Maintain records of processing activities (ROPA).', 'Føre protokoll over behandlingsaktiviteter (ROPA).', 'critical', 'privacy', 'systems_processes', 'full', 8, true),
  ('gdpr', 'Art.32', 'governance', 'Security of processing', 'Sikkerhet ved behandling', 'Implement appropriate security measures.', 'Implementere passende sikkerhetstiltak.', 'critical', 'privacy', 'systems_processes', 'full', 9, true),
  ('gdpr', 'Art.33', 'governance', 'Breach notification to authority', 'Avviksvarsling til myndighet', 'Notify breaches within 72 hours.', 'Varsle brudd innen 72 timer.', 'critical', 'privacy', 'organization_governance', 'assisted', 10, true),
  ('gdpr', 'Art.35', 'governance', 'Data protection impact assessment', 'Konsekvensutredning for personvern', 'Conduct DPIAs for high-risk processing.', 'Gjennomføre DPIA for høyrisiko-behandling.', 'high', 'privacy', 'organization_governance', 'assisted', 11, true),
  ('gdpr', 'Art.37', 'governance', 'Data Protection Officer', 'Personvernombud', 'Designate a Data Protection Officer.', 'Utpeke et personvernombud.', 'high', 'privacy', 'organization_governance', 'manual', 12, true),
  
  -- EU AI Act Requirements (8 key requirements)
  ('ai-act', 'Art.6', 'governance', 'Risk classification', 'Risikoklassifisering', 'Classify AI systems by risk level.', 'Klassifisere AI-systemer etter risikonivå.', 'critical', 'ai', 'organization_governance', 'full', 1, true),
  ('ai-act', 'Art.9', 'governance', 'Risk management system', 'Risikostyringssystem', 'Establish AI risk management system.', 'Etablere AI-risikostyringssystem.', 'critical', 'ai', 'organization_governance', 'assisted', 2, true),
  ('ai-act', 'Art.10', 'governance', 'Data governance', 'Datastyring', 'Data quality and governance for training.', 'Datakvalitet og styring for opplæring.', 'high', 'ai', 'systems_processes', 'assisted', 3, true),
  ('ai-act', 'Art.11', 'governance', 'Technical documentation', 'Teknisk dokumentasjon', 'Prepare technical documentation.', 'Utarbeide teknisk dokumentasjon.', 'high', 'ai', 'systems_processes', 'full', 4, true),
  ('ai-act', 'Art.13', 'governance', 'Transparency requirements', 'Åpenhetskrav', 'Transparency for users of AI systems.', 'Åpenhet for brukere av AI-systemer.', 'critical', 'ai', 'systems_processes', 'full', 5, true),
  ('ai-act', 'Art.14', 'governance', 'Human oversight', 'Menneskelig tilsyn', 'Human oversight of AI systems.', 'Menneskelig tilsyn med AI-systemer.', 'critical', 'ai', 'organization_governance', 'manual', 6, true),
  ('ai-act', 'Art.15', 'governance', 'Accuracy and robustness', 'Nøyaktighet og robusthet', 'Ensure accuracy, robustness, cybersecurity.', 'Sikre nøyaktighet, robusthet, cybersikkerhet.', 'high', 'ai', 'systems_processes', 'full', 7, true),
  ('ai-act', 'Art.52', 'governance', 'Registration in EU database', 'Registrering i EU-database', 'Register high-risk AI systems.', 'Registrere høyrisiko AI-systemer.', 'high', 'ai', 'organization_governance', 'manual', 8, true)
) AS v(framework_id, requirement_id, category, name, name_no, description, description_no, priority, domain, sla_category, agent_capability, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_requirements WHERE compliance_requirements.framework_id = v.framework_id AND compliance_requirements.requirement_id = v.requirement_id);

-- Now insert demo requirement_status data for realistic demonstration
-- Insert status for completed requirements (AI-handled)
INSERT INTO public.requirement_status (requirement_id, status, progress_percent, is_ai_handling, completed_by, completed_at, evidence_notes)
SELECT 
  cr.id,
  'completed',
  100,
  true,
  'agent',
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)::int,
  CASE 
    WHEN cr.agent_capability = 'full' THEN 'Automatisk fullført av Lara basert på systemregisteret og prosessdata.'
    ELSE 'Verifisert og godkjent basert på dokumentert praksis.'
  END
FROM public.compliance_requirements cr
WHERE cr.agent_capability = 'full' 
  AND cr.sort_order <= 25
  AND NOT EXISTS (SELECT 1 FROM public.requirement_status rs WHERE rs.requirement_id = cr.id);

-- Insert status for in-progress requirements (AI working)
INSERT INTO public.requirement_status (requirement_id, status, progress_percent, is_ai_handling, evidence_notes)
SELECT 
  cr.id,
  'in_progress',
  CASE 
    WHEN cr.requirement_id = 'A.5.7' THEN 72
    WHEN cr.requirement_id = 'A.8.9' THEN 45
    WHEN cr.requirement_id = 'A.5.23' THEN 32
    WHEN cr.requirement_id = 'Art.9' THEN 65
    WHEN cr.requirement_id = 'Art.10' THEN 40
    ELSE 25 + (RANDOM() * 50)::int
  END,
  true,
  CASE 
    WHEN cr.requirement_id = 'A.5.7' THEN 'Henter data fra Snyk og 7Security...'
    WHEN cr.requirement_id = 'A.8.9' THEN 'Analyserer GitHub-repositorier...'
    WHEN cr.requirement_id = 'A.5.23' THEN 'Kartlegger Azure og AWS-konfigurasjoner...'
    ELSE 'Lara analyserer tilgjengelig data...'
  END
FROM public.compliance_requirements cr
WHERE (cr.agent_capability = 'full' AND cr.sort_order > 25 AND cr.sort_order <= 30)
   OR cr.requirement_id IN ('A.5.7', 'A.8.9', 'A.5.23', 'Art.9', 'Art.10')
   AND NOT EXISTS (SELECT 1 FROM public.requirement_status rs WHERE rs.requirement_id = cr.id);

-- Insert some completed hybrid requirements
INSERT INTO public.requirement_status (requirement_id, status, progress_percent, is_ai_handling, completed_by, completed_at, evidence_notes)
SELECT 
  cr.id,
  'completed',
  100,
  false,
  'hybrid',
  NOW() - INTERVAL '1 day' * (RANDOM() * 14)::int,
  'Forslag fra Lara ble gjennomgått og godkjent av ansvarlig person.'
FROM public.compliance_requirements cr
WHERE cr.agent_capability = 'assisted' 
  AND cr.sort_order <= 10
  AND NOT EXISTS (SELECT 1 FROM public.requirement_status rs WHERE rs.requirement_id = cr.id);