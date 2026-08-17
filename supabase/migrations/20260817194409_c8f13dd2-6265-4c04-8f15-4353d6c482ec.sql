UPDATE public.terms_versions
SET content_md = replace(
  content_md,
  '**Vedlegg B — Underdatabehandlere**',
  '[Vedlegg B — Underdatabehandlere](https://mynder.no/sub-processors)'
)
WHERE id = '812d2372-22a0-4906-8ceb-662229a40d4d';