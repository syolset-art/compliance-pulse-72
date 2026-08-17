UPDATE public.terms_versions
SET content_md = replace(
  content_md,
  E'## 19. Kontaktinformasjon\n\n**Mynder AS**  \nOrg.nr. 831 377 372  \nEdvard Griegs vei 3C  \n5059 Bergen  \nE-post: personvern@mynder.no  \nNettside: mynder.no\n',
  E'## 19. Kontaktinformasjon\n\n- **Mynder AS**\n- Org.nr. 831 377 372\n- Edvard Griegs vei 3C\n- 5059 Bergen\n- E-post: [personvern@mynder.no](mailto:personvern@mynder.no)\n- Nettside: [mynder.no](https://mynder.no)\n'
)
WHERE id = '812d2372-22a0-4906-8ceb-662229a40d4d';