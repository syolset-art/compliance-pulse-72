UPDATE public.terms_versions
SET content_md = regexp_replace(content_md, E'\n---\n\n## Relaterte dokumenter[\\s\\S]*$', '')
WHERE doc_type = 'partner';