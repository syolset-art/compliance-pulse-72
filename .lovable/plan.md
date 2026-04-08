

## Forenkling av leverandør Trust Profile-faner

### Nåværende fanestruktur (for leverandører/vendors)

Primærfaner:
1. Validering fra Mynder
2. Kontroller
3. Datahåndtering
4. Revisjon og risiko
5. Avvik og hendelser
6. Relasjoner
7. Dokumenter

Overflow-faner:
8. Innboks
9. NIS2 Vurdering (kun for self)
10. Sikkerhetstjenester (kun for self)
11. Forespørsler (kun for self)

### Hva ISO 27001 og PESB krever for leverandørstyring

ISO 27001 Annex A.15 (Leverandørrelasjoner) og tilhørende kontroller krever i praksis fire dimensjoner:

1. **Kontroller og samsvar** — Dokumentert vurdering av leverandørens sikkerhetskontroller mot kravsettet (A.15.1.1, A.15.2.1)
2. **Datahåndtering** — Personvernvilkår, databehandleravtale, overføringsmekanismer (A.15.1.2, GDPR Art. 28)
3. **Risiko og revisjon** — Risikovurdering, revisjonsrettigheter, hendelseshåndtering (A.15.2.1, A.15.2.2)
4. **Dokumentasjon** — Avtaler, sertifiseringer, policies, SLA-er (A.15.1.2)

### Foreslått forenklet struktur — 4 faner

| Ny fane | Innhold | Dekker |
|---|---|---|
| **Oversikt** | Validering fra Mynder + kontrollstatus sammendrag + relasjoner | Fane 1, 2, 6 |
| **Datahåndtering** | DPA-status, personvern, dataflyt | Fane 3 |
| **Risiko og revisjon** | Risikovurdering, avvik, hendelser, revisjonslogg | Fane 4, 5 |
| **Dokumenter** | Avtaler, policies, sertifiseringer, innboks | Fane 7, 8 |

### Teknisk endring

**Fil:** `src/pages/AssetTrustProfile.tsx`

- Slå sammen «Validering fra Mynder», «Kontroller» og «Relasjoner» til en **Oversikt**-fane
- Slå sammen «Revisjon og risiko» og «Avvik og hendelser» til én fane
- Flytte «Innboks» inn under «Dokumenter»-fanen
- Fjerne overflow-meny for leverandører (NIS2/Sikkerhetstjenester/Forespørsler er kun for self)

Dette reduserer fra 7+4 faner til 4 tydelige faner som speiler ISO-strukturen.

