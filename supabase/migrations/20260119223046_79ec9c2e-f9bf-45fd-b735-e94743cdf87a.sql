-- Add industry-specific work area templates

-- Helse (Health)
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('Helse', 'Pasientbehandling', 'Klinisk virksomhet, pasientforløp og behandlingskvalitet', 'HeartPulse', 1),
('Helse', 'Medisinsk dokumentasjon', 'Journalføring, EPJ-systemer og dokumentasjonskrav', 'FileText', 2),
('Helse', 'Legemiddelhåndtering', 'Medisinering, apotek og legemiddelsikkerhet', 'Pill', 3),
('Helse', 'Smittevern og hygiene', 'Infeksjonskontroll, renhold og hygienerutiner', 'Shield', 4);

-- Teknologi / SaaS
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('Tech / SaaS', 'Produktutvikling', 'Utvikling, testing og lansering av programvare', 'Code', 1),
('Tech / SaaS', 'Kundesuksess', 'Onboarding, support og kundetilfredshet', 'Users', 2),
('Tech / SaaS', 'DevOps og infrastruktur', 'Skyinfrastruktur, CI/CD og driftsstabilitet', 'Server', 3),
('Tech / SaaS', 'Datasikkerhet', 'Personvern, GDPR og informasjonssikkerhet', 'Lock', 4);

-- Finans (Finance)
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('Finans', 'Kreditt og utlån', 'Kredittvurdering, låneprosesser og risikostyring', 'CreditCard', 1),
('Finans', 'Compliance og AML', 'Hvitvasking, sanksjoner og regulatorisk etterlevelse', 'Scale', 2),
('Finans', 'Kundeforvaltning', 'Rådgivning, kundeportefølje og relasjonsbygging', 'Handshake', 3),
('Finans', 'Verdipapir og investering', 'Fondsforvaltning, handel og markedsoperasjoner', 'TrendingUp', 4);

-- Energi (Energy)
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('Energi', 'Kraftproduksjon', 'Produksjonsanlegg, vedlikehold og driftsoptimalisering', 'Zap', 1),
('Energi', 'Nettdrift', 'Strømnett, infrastruktur og leveringssikkerhet', 'Network', 2),
('Energi', 'HMS og sikkerhet', 'Arbeidsmiljø, sikkerhet og beredskap', 'HardHat', 3),
('Energi', 'Miljø og bærekraft', 'Utslipp, miljørapportering og grønn omstilling', 'Leaf', 4);

-- Offentlig sektor (Public sector)
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('Offentlig sektor', 'Innbyggertjenester', 'Søknadsbehandling, vedtak og publikumskontakt', 'Users', 1),
('Offentlig sektor', 'Arkiv og dokumentasjon', 'Arkivering, journalføring og offentlighet', 'Archive', 2),
('Offentlig sektor', 'Plan og bygg', 'Arealplanlegging, byggesaker og tilsyn', 'Building2', 3),
('Offentlig sektor', 'Anskaffelser', 'Innkjøp, anbud og leverandøroppfølging', 'ShoppingCart', 4);