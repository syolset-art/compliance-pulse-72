-- Add universal default work area templates that apply to ALL industries
INSERT INTO work_area_templates (industry, name, description, icon, sort_order) VALUES
('default', 'Økonomi og regnskap', 'Budsjett, fakturering, regnskapsføring og økonomistyring', 'Calculator', 1),
('default', 'HR og personal', 'Rekruttering, lønn, personalforvaltning og kompetanseutvikling', 'UserCheck', 2),
('default', 'IT og systemer', 'IT-drift, informasjonssikkerhet og systemforvaltning', 'Monitor', 3),
('default', 'Ledelse og administrasjon', 'Strategi, styring og overordnet compliance', 'Building2', 4);