-- Update self-assets with old DIPS Arena description to new Mynder description
UPDATE public.assets
SET description = 'Mynder er en agentisk compliance-plattform som hjelper virksomheter å kartlegge, dokumentere og etterleve regelverk — med Lara som din AI-assistent.',
    name = 'Mynder AS'
WHERE description ILIKE '%DIPS Arena AS leverer digitale helseløsninger%'
   OR description ILIKE '%Norges ledende leverandør av elektroniske pasientjournalsystemer%'
   OR name = '';

-- Update company_profile name if empty
UPDATE public.company_profile
SET name = 'Mynder AS',
    org_number = '831377372',
    industry = 'Programvare og SaaS'
WHERE name IS NULL OR name = '';
