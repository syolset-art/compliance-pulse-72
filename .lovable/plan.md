## Mål

Erstatte dagens kort-/listevisning på `/vendors` (fanen «Alle») med en ny radbasert oversikt som matcher det opplastede bildet. Hver leverandør vises som én bred rad med en tydelig **statuspille** (farget prikk + tekst), kategori-chip, nøkkelinformasjon, modenhets-donut og kontekstuell handlingsknapp – slik at brukeren med et øyekast ser om en leverandør er Godkjent, Krever tiltak, Under oppfølging, Invitert eller Utkast.

## Statusmodell

Vi avleder status fra eksisterende felter (ingen DB-endringer). Mapping:

| Status | Farge (prikk + tekst) | Avledet fra |
|---|---|---|
| Godkjent | success (grønn) | `compliance_score ≥ 75` og ingen utløpte dokumenter |
| Krever tiltak | destructive (rød) | utløpte dokumenter ELLER `risk_level=high` ELLER `compliance_score < 40` |
| Under oppfølging | warning (oransje/amber) | `compliance_score 40–74` med åpne gap |
| Invitert | primary (blå/lilla) | `lifecycle_status='invited'` (ny verdi, settes når invitasjon sendes – fallback: tag i `metadata`) |
| Utkast | warning-dot (oransje) | `lifecycle_status='draft'` eller nylig opprettet uten data |
| Lara kartlegger… | accent-chip med spinner | `inboxCount > 0` på en utkast-rad |

For demo-formål mapper vi også eksisterende vendors til disse statene basert på score/risk slik at oversikten ser realistisk ut umiddelbart.

## Rad-layout (matcher bildet)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Navn  [• Status]  [Kategori]               ◯ 86%  Modenhet    Sist 22.04 │
│   Org. 987 654 321 · acme.no · GDPR + ISO 27001 + DORA           [Åpne →] │
│   Kontakt: Maya Berg · Ansvarlig hos oss: Synnøve Olset                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Venstre kant**: 3 px farget stripe i statusfargen (subtil, kun synlig på hover for ren look – eller alltid synlig som i bildet via en liten prikk i venstre marg).
- **Linje 1**: Navn (bold) + statuspille (prikk + tekst i farge) + kategori-chip (lilla, soft).
- **Linje 2**: `Org.nr · domene · regelverk-liste` (muted).
- **Linje 3 (kontekstuell)**:
  - Godkjent → `Kontakt: X · Ansvarlig hos oss: Y`
  - Krever tiltak → rød tekst med konkret årsak: `⚠ 2 åpne gap · DPA utløpt 18.04.2026`
  - Under oppfølging → `1 gap under oppfølging · Kontakt: X`
  - Invitert → `Invitasjon sendt 21.04.2026 · utløper om 5 dager`
  - Utkast → Lara-kartlegger-chip når aktiv
- **Høyre side**: SVG-donut (gjenbrukes fra `VendorCard`) med modenhets-prosent, label «Modenhet», dato for siste aktivitet over knapp.
- **Handlingsknapp** (kontekstuell, varierer per status):
  - Godkjent / Under oppfølging → `Åpne →` (outline)
  - Krever tiltak → `Åpne gap →` (destructive solid)
  - Invitert → `Påminnelse` + `Kopier lenke` (to outline-knapper stablet)
  - Utkast → `Inviter leverandør` (primary solid)

## Filtere og toolbar

Beholder eksisterende toolbar (søk, filter-popover, antall, donut/label-toggle). Legger til **status-filter** i popoveren (multi-select: Godkjent, Krever tiltak, Under oppfølging, Invitert, Utkast). Fjerner kort/liste-veksleren – den nye raden er den primære (og eneste) visningen for fanen «Alle». Listevisning beholdes ikke siden den nye raden allerede er kompakt og informativ.

## Filer som endres / opprettes

- **Ny**: `src/components/vendor-dashboard/VendorStatusRow.tsx` – komponenten for én rad med all status-logikk og kontekstuelle handlinger.
- **Ny**: `src/lib/vendorStatus.ts` – ren funksjon `deriveVendorStatus(vendor, { expiredDocsCount, inboxCount })` som returnerer `{ key, label, dotClass, textClass }`. Brukes også av andre widgets senere.
- **Endres**: `src/components/vendor-dashboard/VendorListTab.tsx` – erstatter både kort- og listerendring med `<VendorStatusRow />`-mapping; fjerner view-mode-toggle; legger til status-filter.
- **Endres (lite)**: `src/components/vendor-dashboard/VendorCard.tsx` – ingen endring; brukes fortsatt i Oversikt-fanen.

## Tekniske detaljer

- Bruker eksisterende design tokens: `success`, `warning`, `destructive`, `primary`, `accent` – ingen nye farger i `index.css`.
- SVG-donut gjenbrukes fra `VendorCard` (samme stroke-logikk og farge basert på score-tone). Tom donut for invitert/utkast viser grå sirkel med en strek (–) som i bildet.
- Statuspille = `<Badge variant="outline">` med farget prikk (`<span className="h-1.5 w-1.5 rounded-full bg-{tone}" />`) + tekst i samme tone, lett bakgrunn (`bg-{tone}/10`).
- «Lara kartlegger…»-chip bruker `Sparkles`-ikon med subtil pulse og lilla `bg-primary/10`.
- Kontaktnavn og «Ansvarlig hos oss» hentes fra `vendor.contact_name` (fallback skjul linjen) og work-area-eier (`asset_owner` / `work_area.responsible_person`).
- Utløpte dokumenter og inbox-counts hentes fra eksisterende queries i `VendorListTab`.
- Ingen DB-migrasjon nødvendig – all status er avledet i frontend.
