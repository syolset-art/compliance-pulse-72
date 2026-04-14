

## Plan: Reorganiser sidebar-navigasjon

### Analyse av brukerens poeng

Kunder starter typisk med **Trust Profile**, deretter utvider de til Mynder Core. Navigasjonen bør speile denne reisen. Noen menypunkter er feilplassert:

| Nåværende plassering | Menypunkt | Riktig plassering | Begrunnelse |
|---|---|---|---|
| Styringsverktøy | Regelverk | **Global** (toppnivå) | Regelverk gjelder hele virksomheten, ikke bare Core |
| Styringsverktøy | Forespørsler | **Global** (toppnivå, omdøpt) | Meldinger mellom alle parter |
| Styringsverktøy | Arbeidsområder, Oppgaver, Avvik, Rapporter | **Mynder Core** | Korrekt — dette er kontekstuelt arbeid |

### Ny sidebar-struktur

```text
┌─────────────────────────────────┐
│  [Logo]            [🌐] [🌙]   │
├─────────────────────────────────┤
│  ● Dashboard                    │
│                                 │
│  🌍 Trust Center           ▾   │
│     Trust Profile               │
│     Rediger profil              │
│     Products & Services         │
│     Dokumentasjon & Evidens     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ⚖️ Regelverk & krav            │  ← Global toppnivå
│  ✉️ Meldinger                   │  ← Omdøpt, global toppnivå
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  📋 Mynder Core             ▾   │  ← Omdøpt fra "Styringsverktøy"
│     Arbeidsområder              │
│     Oppgaver                    │
│     Avvik                       │
│     Rapporter                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  🗄️ Registre                ▾   │
│     Leverandører                │
│     Systemer                    │
│     Enheter                     │
└─────────────────────────────────┘
```

### Endringer i `src/components/Sidebar.tsx`

1. **Flytt «Regelverk» og «Forespørsler» ut av `managementNav`** — gjør dem til egne toppnivå-lenker mellom Trust Center og Mynder Core
2. **Omdøp «Forespørsler» til «Meldinger»** — oppdater i18n-nøkkel (`nav.messages`) og ikon til `MessageSquare` (fra lucide-react)
3. **Omdøp seksjonen «Styringsverktøy» til «Mynder Core»** — oppdater i18n-nøkkel (`nav.mynderCore`)
4. **Oppdater `managementNav`-arrayet** — behold kun Arbeidsområder, Oppgaver, Avvik, Rapporter
5. **Legg til ny global nav-array** med Regelverk og Meldinger, rendret som enkeltstående lenker med samme styling som Dashboard

### Tekniske detaljer
- Kun endringer i `Sidebar.tsx`
- Oppdater i18n-filer (nb.json, en.json) med nye nøkler: `nav.messages`, `nav.mynderCore`
- Nytt ikon-import: `MessageSquare` fra lucide-react
- Ingen endring i ruter eller sidekomponenter

