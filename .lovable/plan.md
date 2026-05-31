## Mål
Legg til en tredje arkfane **"Hvordan virker det"** på siden Tjenester (`/msp-services`) som forklarer hele verdikjeden fra tjenestedefinisjon til levert sluttrapport, og hvordan dette beriker kundens trust profile.

## Endringer

### 1. `src/pages/MSPServiceCatalog.tsx`
- Legg til tredje `TabsTrigger` + `TabsContent` med `value="how-it-works"`, label **"Hvordan virker det"**.
- Rekkefølge: Tjenestekatalog → Innstillinger → Hvordan virker det.

### 2. Ny komponent `src/components/msp/MSPServiceHowItWorksTab.tsx`
Pedagogisk side med 5 steg + outcomes-seksjon nederst. Apple-aktig minimal stil, bruker semantiske tokens.

**Hero-intro (kort):**
> "Gjør dine eksisterende IT- og sikkerhetstjenester om til målbar compliance-leveranse."
> Underlinje: "Tjenestene du allerede leverer, mappes mot kontrollpunkter i kundens valgte regelverk – og dokumenteres automatisk."

**5 steg som vertikale kort med ikon + tittel + tekst** (én kolonne, kompakte kort med `Card`):

1. **Definer dine tjenester** (`Wrench`) — "Beskriv IT- og sikkerhetstjenestene du allerede leverer i dag — backup, MDR, identitetsstyring, drift osv. Du legger inn aktiviteter, estimat og hvilke kontroller de dekker."
2. **Auto-mapping mot regelverk** (`GitBranch`) — "Lara mapper hver tjeneste mot kontrollpunkter på tvers av kundens valgte regelverk (NIS2, ISO 27001, GDPR osv.) — én tjeneste kan dekke kontroller i flere regelverk samtidig."
3. **Bli en del av tilbudet** (`FileText`) — "Tjenestene blir byggeklosser i tilbudet til kunden. Pris og omfang beregnes fra dine standard timesatser, og kunden ser tydelig hvilke kontrollpunkter som dekkes."
4. **Lever og dokumenter underveis** (`ClipboardCheck`) — "Når du utfører arbeidet, besvarer du korte spørsmål knyttet til hver aktivitet. Svarene mappes automatisk til kontrollpunkter — på tvers av alle valgte regelverk — uten dobbeltarbeid."
5. **Sluttrapport til kunden** (`FileDown`) — "Når leveransen er ferdig, genereres en sluttrapport automatisk med utført arbeid, bevis og oppdatert modenhetsstatus. Last ned og send til kunden i ett klikk."

**Outcomes-seksjon "Slik berikes kundens trust profile"** (3 små kort i grid):
- **Modenhet øker** (`TrendingUp`, success-token) — "Hvert kontrollpunkt du leverer på, hever kundens modenhetsnivå (0–4) i berørte regelverk."
- **Synlig leverandør** (`Users`, primary-token) — "Kunden ser tydelig hvilke kontroller du som partner står bak — du blir en synlig del av deres compliance-historie."
- **Automatisk bevis** (`ShieldCheck`, primary-token) — "Svar og dokumentasjon fra leveransen blir bevis i kundens trust profile — alltid oppdatert, alltid sporbar."

**Avslutningsstripe** med to CTA-knapper:
- Primær: "Gå til tjenestekatalog" → bytter til `catalog`-fanen (via callback prop fra `MSPServiceCatalog.tsx` som setter `Tabs.value`).
- Sekundær (outline): "Sett standard timepris" → bytter til `settings`-fanen.

For å støtte navigering mellom faner, gjør `Tabs` i `MSPServiceCatalog.tsx` controlled (`value`/`onValueChange` med lokal `useState`), og send en `onNavigate(tab: string)` prop til `MSPServiceHowItWorksTab`.

## Teknisk
- Kun frontend, ingen DB-endringer.
- Bruker eksisterende `Card`, `Button`, `Tabs` fra shadcn og `lucide-react` ikoner.
- Alle farger via semantiske tokens (`text-primary`, `bg-primary/10`, `text-success`, `text-muted-foreground`).
- Maks bredde matcher container (`max-w-5xl`); steg-kort er fulle bredde, outcomes er `md:grid-cols-3`.
