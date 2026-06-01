import { Mail, FileText, Download, Reply } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_PARTNER_NAME } from "./demoServices";

export function EmailOfferView() {
  return (
    <PreviewFrame
      title="E-post med tilbud"
      subtitle="Enkel e-post fra partner med tilbudet vedlagt som PDF. Kunden godkjenner ved å svare «OK»."
      channel="E-post"
      surface="muted"
      note={{
        file: "src/components/msp/ShareOfferDialog.tsx",
        component: "<SendOfferEmail />",
        channel: "Utgående transaksjonell e-post med PDF-vedlegg",
        trigger: "Partner klikker «Send tilbud» i ShareOfferDialog",
        propsExample: `await supabase.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'partner-offer',
    recipientEmail: customer.email,
    idempotencyKey: 'offer-' + offer.id,
    templateData: {
      partnerName: '${DEMO_PARTNER_NAME}',
      customerName: '${DEMO_CUSTOMER_NAME}',
      offerPdfUrl, // signert URL til generert tilbud-PDF
    },
  },
});
// Innkommende svar med «OK» fanges av webhook
// → markerer tilbud som godkjent i offers-tabellen`,
      }}
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden max-w-2xl mx-auto">
        <div className="px-4 py-3 border-b border-border bg-muted/40 space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Innboks
            </span>
          </div>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Fra:</span> ola.nordmann@nordlys-sikkerhet.no{" "}
            <span className="text-muted-foreground">· Til:</span> kari.lien@dipsarena.no
          </p>
          <p className="text-sm font-semibold text-foreground">
            Emne: Vedlagt tilbud fra din partner {DEMO_PARTNER_NAME}
          </p>
        </div>

        <div className="px-5 py-5 space-y-4 text-sm text-foreground leading-relaxed">
          <p>Hei Kari,</p>
          <p>
            Vedlagt finner du tilbudet vi har satt sammen for {DEMO_CUSTOMER_NAME}. Åpne PDF-en for
            detaljer om leveranse, omfang og pris.
          </p>
          <p>
            <strong>Svar «OK» på denne e-posten for å godkjenne tilbudet</strong>, så starter vi
            opp leveransen umiddelbart.
          </p>

          {/* PDF attachment pill */}
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                Tilbud-DIPS-Arena.pdf
              </p>
              <p className="text-xs text-muted-foreground">PDF · 248 KB</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Last ned
            </button>
          </div>

          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-center gap-2 text-xs text-foreground">
            <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Tips: Svar bare «OK» på denne e-posten for å godkjenne. Vi registrerer svaret
              automatisk som godkjenning.
            </span>
          </div>

          <p className="text-foreground pt-1">
            Vennlig hilsen,
            <br />
            Ola Nordmann — {DEMO_PARTNER_NAME}
          </p>
        </div>
      </div>
    </PreviewFrame>
  );
}
