## E-postsystem for Mynder

Ny side `/msp-emails` (med header-tall "6" i sidekortet på MSP-kundeoversikten) som lar brukeren bygge, forhåndsvise og sende transaksjonelle e-poster basert på en delt layout.

### 1. Datamodell (Lovable Cloud)

Migrasjon som oppretter to tabeller (med GRANTs + RLS for `authenticated`):

**`email_templates`**
- `id`, `type` (`offer` | `vendor_trust_profile` | `customer_profile` | `custom`)
- `language` (`no` | `en`)
- `subject`, `body` (markdown/HTML), `cta_text`, `cta_url`
- `is_default` (bool), `created_by` (uuid), `created_at`, `updated_at`

**`email_sends`**
- `id`, `template_id` (fk), `recipient_name`, `recipient_email`
- `variables` (jsonb), `status` (`queued` | `sent` | `failed`)
- `sent_at`, `error`, `created_by`

### 2. Gjenbrukbar `EmailLayout`-komponent

`src/components/email/EmailLayout.tsx` — ren HTML/Tailwind komponent (maks 600px, responsiv), brukt både i preview og ved generering av sendt HTML.

Slots: `subject`, `body`, `cta` (tekst + url), `senderOrganization`, `language`.

Struktur:
- **Header**: Mynder-logo (`/mynder-logo.svg`) øverst venstre, tynn `border-b`.
- **Body-area**: hvit bakgrunn, generøs padding (32–40px), seriøs typografi.
- **CTA**: avrundet primærknapp (`bg-primary` deep purple, hvit tekst, `rounded-lg`, `px-6 py-3`).
- **Footer**: liten muted tekst — "Sendt via Mynder – infrastrukturen for tillit mellom virksomheter." + lenker (Personvern · Avmelding · mynder.no) + avsenderorganisasjonens navn. Engelsk variant byttes ut når `language === 'en'`.

### 3. Sider og UI

**`src/pages/EmailTemplates.tsx`** (rute `/emails`):
- H1 "E-postmaler" + kort beskrivelse.
- Grid med tre scenariokort:
  1. **Tilbud** (`offer`)
  2. **Trust Profile (leverandør)** (`vendor_trust_profile`)
  3. **Kunde Profile** (`customer_profile`)
- Hvert kort: ikon, tittel, kort beskrivelse, badge for språk (NO/EN), knapper **Forhåndsvis** og **Send**.

**`PreviewDialog`**: åpner modal med `EmailLayout` rendret som mottakeren ser den (rammet "inbox preview" med grå bakgrunn, hvit e-postcontainer). Språkbytter NO/EN i toppen av dialogen.

**`SendDialog`**: skjema med mottakernavn, mottaker-e-post, valgfri overstyring av subject/body/cta, språkvalg. Sender via edge function og lagrer rad i `email_sends`.

**`EmailEditor`** (inline på malsiden eller separat rute): rediger subject/body/cta/url, lagre som mal, sett som standard. Live preview i høyre kolonne.

### 4. Header "6" på MSP Customer View

På `/msp-customer-view` legges et nytt nummerert kort/widget (#6) "E-postmaler" som lenker til `/emails`, i tråd med eksisterende nummererte seksjoner.

### 5. Sending (edge function)

Ny edge function `send-email` som tar `{ template_id, recipient_name, recipient_email, variables, language }`, rendrer `EmailLayout` til HTML, og sender via Lovable Emails (default). Lagrer `email_sends`-rad med status.

Krever oppsett av e-postdomene — håndteres ved første sending via `<presentation-open-email-setup>` om det ikke er konfigurert.

### 6. Norsk/engelsk

`EmailLayout` tar `language`-prop som styrer footer-tekst og CTA-fallback. Maler lagres per språk (samme `type` kan ha både NO og EN rad). UI-bryter i preview og send-dialog.

### Filer som opprettes/endres

**Nye**
- `supabase/migrations/<ts>_email_system.sql`
- `src/components/email/EmailLayout.tsx`
- `src/components/email/EmailPreviewFrame.tsx` (inbox-ramme rundt layout)
- `src/components/email/EmailEditor.tsx`
- `src/components/email/PreviewDialog.tsx`
- `src/components/email/SendDialog.tsx`
- `src/lib/emailTemplates.ts` (default-maler for de tre scenariene, NO+EN)
- `src/pages/EmailTemplates.tsx`
- `supabase/functions/send-email/index.ts`

**Endres**
- `src/App.tsx` (route `/emails`)
- `src/components/Sidebar.tsx` (lenke til E-postmaler under MSP-seksjonen)
- `src/pages/MSPCustomerView.tsx` (nummerert kort "6 – E-postmaler")

### Teknisk valg

- Default e-postløsning: **Lovable Emails** (innebygd). Brukeren slipper å sette opp eksterne nøkler.
- Layout rendres som HTML-string i edge function via en enkel template-funksjon som speiler `EmailLayout` (slik at preview og faktisk sendt e-post er visuelt identiske).
