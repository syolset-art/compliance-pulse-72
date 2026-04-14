

## Plan: Fjern duplisert «Innstillinger»-seksjon

### Gap-analyse
| Menyvalg | Innstillinger (midt) | Virksomhetsmeny (bunn) |
|---|---|---|
| Organisasjon | ✅ | ✅ |
| Tilgangsstyring | ✅ | ✅ |
| Varsler | ✅ | ✅ |
| Abonnement | ✅ | ✅ |
| Start demo på nytt | ✅ | ❌ |

Alt unntatt «Start demo på nytt» finnes allerede begge steder.

### Endringer i `src/components/Sidebar.tsx`

1. **Fjern hele «Innstillinger»-seksjonen** (linje 378-445) — inkludert `settingsMenuOpen` state, `isSettingsActive`, og `Settings`-ikonet
2. **Flytt «Start demo på nytt»** (AlertDialog) inn i virksomhets-undermenyen, mellom settingsMenu-items og Partner-seksjonen
3. **Fjern ubrukte imports**: `Settings`-ikonet fra lucide-react

Resultatet blir en renere meny der all virksomhetsadministrasjon samles under firmanavnet nederst.

