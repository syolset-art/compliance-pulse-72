UPDATE public.terms_versions
SET content_md = regexp_replace(
  content_md,
  '\n---\n\n## Relaterte dokumenter\n\n- Databehandleravtale — Mynder AS og sluttkunde\n- Vedlegg B — Underdatabehandlere\n- Vilkår for partnere — Mynder AS\n- Personvernerklæring — Mynder AS\n*$',
  ''
)
WHERE id = '812d2372-22a0-4906-8ceb-662229a40d4d';