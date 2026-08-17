UPDATE public.terms_versions 
SET content_md = REPLACE(content_md, '# Sluttkundevilkår for Mynder AS v1.2', '# Sluttkundevilkår for Mynder AS')
WHERE doc_type = 'terms' AND is_current = true;

UPDATE public.terms_versions 
SET content_md = REPLACE(content_md, '# Vilkår for partnere — Mynder AS v1.0', '# Vilkår for partnere — Mynder AS')
WHERE doc_type = 'partner' AND is_current = true;