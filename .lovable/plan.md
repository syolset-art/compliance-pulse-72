## Mål

Fjerne "Meldinger"-knappen fra Trust Profile (vendor-visning) og styrke "Registrer aktivitet" som hovedinngang. Når brukeren velger e-post som aktivitetstype, skal det vises:
1. Maler som kan brukes / lastes opp
2. Tre Lara-forslag (agentisk) som kan velges og bekreftes med ett klikk

## Endringer

### 1. Fjerne "Meldinger"-knapp tre steder
- `src/pages/AssetTrustProfile.tsx` (topp-toolbar, linje ~361–369): fjerner Meldinger-knappen, beholder "Registrer aktivitet". Fjerner også `requestDialogOpen`-state og `RequestUpdateDialog` hvis den kun brukes herfra.
- `src/components/asset-profile/AssetMetrics.tsx` (linje ~108–116): bytter "Meldinger"-knappen ved utløpte dokumenter til "Registrer aktivitet" som åpner RegisterActivityDialog (forhåndsutfylt med tema=DPA/dokumentfornyelse, type=email).
- `src/components/asset-profile/tabs/VendorOverviewTab.tsx` (linje ~320–328): samme — bytter til "Registrer aktivitet".

### 2. Utvide RegisterActivityDialog med e-post-funksjonalitet
Fil: `src/components/asset-profile/RegisterActivityDialog.tsx`

Når `type === "email"` vises en ny seksjon "E-post" mellom "Type og kontekst" og "Innhold":

**A. Lara-forslag (3 stk, agentisk)**
- Banner med Sparkles-ikon: "Lara foreslår 3 e-poster basert på leverandørens status"
- Tre kort på rad med:
  - Tittel (f.eks. "Be om oppdatert DPA", "Etterspør SOC 2-rapport", "Bekreft databehandleravtale")
  - Kort beskrivelse (1 linje)
  - Knapp "Bruk denne" → fyller `title`, `description`, setter `theme`, `criticality`, `level` automatisk og scroller ned
- Forslagene genereres lokalt fra leverandørkontekst (asset name, manglende dokumenttyper). Demo: hardkodet liste i ny fil `src/utils/laraEmailSuggestions.ts` med 3 forslag på NB/EN.

**B. Maler**
- Dropdown "Velg mal" med 4 standardmaler: Forespørsel om dokumentasjon, Påminnelse forfalt dokumentasjon, Hendelsesvarsling, Generell oppfølging
- Knapp "Last opp egen mal" (input type="file", .docx/.pdf/.txt) — i demo lagres filnavn i lokal state og vises som "Mal: filename.docx" under feltet (ingen faktisk opplasting til storage i denne iterasjonen)
- Når en mal velges, fylles `title` og `description` med malens tekst

**C. Bekreftelses-CTA**
- Når et Lara-forslag er valgt eller mal er valgt, endres primærknappen i footer til "Bekreft og registrer" (fra "Lagre"), og det vises en liten `Sparkles`-indikator + tekst "Forhåndsutfylt av Lara".

### 3. Datafil for Lara-forslag (ny)
`src/utils/laraEmailSuggestions.ts`:
```ts
export interface LaraEmailSuggestion {
  id: string;
  titleNb: string; titleEn: string;
  bodyNb: string; bodyEn: string;
  theme: "dpa" | "infosec" | "sla" | "revisjon" | "generell";
  criticality: "lav" | "medium" | "hoy" | "kritisk";
  level: "operasjonelt" | "taktisk" | "strategisk";
  reasonNb: string; reasonEn: string;
}
export const LARA_EMAIL_SUGGESTIONS: LaraEmailSuggestion[] = [ /* 3 forslag */ ];
```

### 4. Maler (ny)
Samme fil eller egen `src/utils/emailTemplates.ts` med 4 forhåndsdefinerte maler (tittel + body NB/EN).

## Tekniske detaljer

- Ingen DB-endringer. All ny logikk er klient-side demo.
- Opplasting av egen mal: kun frontend-state i denne iterasjonen (filename vises). Hvis ekte lagring trengs senere, kan vi koble til `documents` storage bucket.
- Beholder eksisterende `RequestUpdateDialog`-import kun hvis det brukes andre steder; ellers fjernes import.
- i18n: alle nye strenger som NB/EN-litteraler i komponentene (samme mønster som resten av filen).

## Akseptansekriterier

1. "Meldinger"-knapp er borte fra topp-toolbar, AssetMetrics-banner og VendorOverviewTab-banner.
2. "Registrer aktivitet" åpner dialogen som før.
3. Når brukeren velger E-post som type, vises 3 Lara-forslag + mal-velger + opplastingsknapp.
4. Klikk på "Bruk denne" på et Lara-forslag fyller skjemaet og viser bekreftelses-CTA.
5. Valg av mal fyller tittel + beskrivelse.
6. Eksisterende manuell flyt (uten Lara/mal) fungerer uendret.
