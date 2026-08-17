# Vilkår oppdatert fra Notion + partnervilkår, og én kilde for personvern/DPA/sikkerhet

## Hva som er situasjonen i dag

- `/legal` viser fire faner: Vilkår, Personvernerklæring, Sikkerhet, Databehandleravtale.
- I databasen ligger tre dokumenter, alle korte utkast fra 3.–5. august: `terms` v1.0 («Utkast – erstattes med endelig juridisk tekst»), `privacy` v1.0 og `dpa` v1.0. Sikkerhet er hardkodet tekst i `Legal.tsx`.
- På mynder.no finnes `/personvern`, `/databehandleravtale` og `/trust-center`. Det finnes ingen vilkårsside på nettsiden — vilkårene hører derfor hjemme i plattformen.
- Notion har to gjeldende dokumenter: Sluttkundevilkår v1.2 (14. august 2026) og Vilkår for partnere v1.0 (verifisert 17. august 2026), begge med engelske versjoner.

Resultatet i dag er dobbeltlagring: personvern og databehandleravtale finnes både i appen og på mynder.no, og vilkårene i appen er utdaterte utkast.

## Hva som endres

**1. Sluttkundevilkår v1.2**
Full tekst fra Notion legges inn som ny versjon (v1.2, gjelder fra 14. august 2026) og settes som gjeldende. v1.0 beholdes som historikk, slik at tidligere aksepter fortsatt peker på riktig versjon. Brukere som har godtatt v1.0 må godta v1.2 ved neste aktivering eller kjøp — det er allerede slik akseptlogikken virker.

**2. Nye partnervilkår**
Ny dokumenttype «Partnervilkår» med teksten fra Notion (v1.0). Fanen vises kun i partner-arbeidsflaten, slik at vanlige kunder ikke møter et dokument som ikke gjelder dem.

**3. Personvern, databehandleravtale og sikkerhet får én kilde**
De tre fanene erstattes av korte kort som lenker til mynder.no:

```text
Dokumenter
[ Vilkår ]  [ Partnervilkår ]

Vilkår og betingelser
Versjon 1.2 · gjelder fra 14. august 2026        [Last ned PDF]
Godtatt av deg 5. august 2026
<dokumentinnhold>

—————
Personvern og sikkerhet
Personvernerklæring        mynder.no/no/personvern        ↗
Databehandleravtale        mynder.no/no/databehandleravtale ↗
Sikkerhet og Trust Center  mynder.no/no/trust-center       ↗
```

Lenkene åpnes i ny fane og følger språkvalget (`/no/…` eller `/en/…`). Dagens `privacy`- og `dpa`-rader i basen tas ut av visningen (settes ikke lenger som gjeldende), men slettes ikke — akseptloggen skal fortsatt kunne vise hva som ble godtatt tidligere.

**4. Akseptlogg**
Historikken nederst beholdes uendret og viser nå også partnervilkår.

## Teknisk

- **Migrasjon:** utvid `doc_type`-verdiene med `partner`. Sett inn `terms` v1.2 og `partner` v1.0 med full markdown fra Notion, `is_current = true`; sett `terms` v1.0 til `is_current = false`, og `privacy`/`dpa` v1.0 til `is_current = false`.
- **`src/hooks/useTerms.ts`:** `LegalDocType` utvides med `"partner"`; `security` fjernes fra typen. `current`/`acceptTerms` peker fortsatt på `terms`, så `TermsGateDialog`, `TermsAcceptRow` og kjøpsdialogene er uendret. `acceptances` hentes uten `is_current`-filter slik at historikk mot v1.0 fortsatt vises — henter da også de historiske versjonene for etikettbruk.
- **`src/pages/Legal.tsx`:** faneliste blir `terms` + `partner` (sistnevnte kun når brukeren er i partnerkontekst, via eksisterende partner-/rollehook). `STATIC_DOCS` med sikkerhetsteksten fjernes. Ny seksjon «Personvern og sikkerhet» med tre eksterne lenker under fanene.
- **Engelsk:** de engelske Notion-versjonene legges inn som eget felt senere; i denne omgangen legges norsk tekst inn, og lenkene til mynder.no språktilpasses.
- Ingen endring i `terms_acceptances`, RLS eller aksept-flyten.

## Merk

Sluttkundevilkår v1.2 er markert i Notion som «endelig utkast — klart for godkjenning», ikke som endelig godkjent avtaleverk. Teksten legges inn som gjeldende versjon slik den står; si fra hvis den heller skal ligge inne uten å bli satt som gjeldende før daglig leder har godkjent publisering.
