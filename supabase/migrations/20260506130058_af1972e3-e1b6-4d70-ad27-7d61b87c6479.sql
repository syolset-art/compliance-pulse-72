UPDATE public.company_profile
SET name = 'Mynder AS',
    org_number = '831377372',
    domain = 'mynder.io',
    industry = 'Programvare og SaaS'
WHERE name ILIKE 'Dintero%';

UPDATE public.assets
SET name = 'MYNDER AS',
    org_number = '831377372',
    url = 'https://mynder.io',
    logo_url = 'https://yyvadlijsovebszximjv.supabase.co/storage/v1/object/public/company-logos/mynder-logo.svg'
WHERE id = '0cc37a2b-6219-42ff-944f-ce7f929c60c3';

UPDATE public.assets
SET logo_url = 'https://yyvadlijsovebszximjv.supabase.co/storage/v1/object/public/company-logos/mynder-logo.svg'
WHERE id = 'f9a60397-2402-4f19-af9f-cd1625deda3d';