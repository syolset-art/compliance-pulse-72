## Mål
Informer brukeren på "Modenhet per kontrollområde" (på rediger-siden) om at kontrollområdene drives av rammeverkene som er aktivert under menypunktet **Regelverk**, og gi enkel snarvei dit.

## Endring i `src/pages/TrustCenterEditProfile.tsx`
Like under section-headeren for "Modenhet per kontrollområde" (etter `</div>` på linje ~304, før kontrollområde-listen) legges et lite info-kort:

- Stil: `bg-primary/5 border-primary/20` (samme Lara-aktige stil som de andre infokortene), `Info`-ikon i lilla.
- Tekst (NB):
  > "Kontrollområdene speiler rammeverkene du har aktivert under **Regelverk** ({frameworkNames eller antall}). Skore beregnes ut fra disse. Trenger du flere eller andre rammeverk? Oppdater i Regelverk – så reflekteres det her."
- Tekst (EN): tilsvarende oversettelse.
- CTA: liten outline-knapp **"Gå til Regelverk"** / "Go to Frameworks" som navigerer til `/frameworks` (eller den eksisterende ruten – verifiseres i implementasjonen).
- Henter aktive rammeverk fra eksisterende `frameworks`-query (linje 83-87) og viser opptil 3 navn + "+N flere".

Ingen andre endringer, ingen DB-endringer.
