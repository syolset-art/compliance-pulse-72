import { Mail, ShieldCheck, FileUp, MessageSquare, ArrowRight } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_PARTNER_NAME } from "./demoServices";

export function HandoverEmailView() {
  return (
    <PreviewFrame
      title="Overleveringse-post — fullmakt til partner"
      subtitle="Sendes når partner har opprettet Trust Profile på vegne av kunden. Kunden logger inn og gir fullmakt."
      channel="E-post"
      surface="muted"
      note={{
        file: "src/components/msp/SendTrustHandoverEmailDialog.tsx",
        component: "<SendTrustHandoverEmailDialog />",
        channel: "Utgående e-post med engangs-innloggingslenke",
        trigger: "Partner fullfører aktiveringsveiviseren for kundens Trust Profile",
        propsExample: `await supabase.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'trust-profile-handover',
    recipientEmail: customer.email,
    idempotencyKey: 'handover-' + trustProfile.id,
    templateData: {
      partnerName: '${DEMO_PARTNER_NAME}',
      customerName: '${DEMO_CUSTOMER_NAME}',
      magicLinkUrl, // engangslenke til /trust-profile?grant=<partnerId>
    },
  },
});`,
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
            <span className="text-muted-foreground">Fra:</span> {DEMO_PARTNER_NAME} via Mynder{" "}
            <span className="text-muted-foreground">· Til:</span> kari.lien@dipsarena.no
          </p>
          <p className="text-sm font-semibold text-foreground">
            Emne: Din Trust Profile er klar — gi {DEMO_PARTNER_NAME} fullmakt til å jobbe i profilen
          </p>
        </div>

        <div className="px-5 py-5 space-y-4 text-sm text-foreground leading-relaxed">
          <p>Hei Kari,</p>
          <p>
            <strong>{DEMO_PARTNER_NAME}</strong> har opprettet en Trust Profile for{" "}
            {DEMO_CUSTOMER_NAME} i Mynder. Logg inn for å se profilen og gi partneren fullmakt til
            å utføre aktiviteter, oppdatere dokumentasjon og øke modenheten på dine vegne.
          </p>

          <div className="flex justify-center py-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
            >
              Åpne Trust Profile og gi fullmakt
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Hva betyr fullmakt?
            </p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Utføre aktiviteter og kontrolltiltak i din Trust Profile</span>
              </li>
              <li className="flex items-start gap-2">
                <FileUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Laste opp og vedlikeholde dokumentasjon og bevis</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Svare på henvendelser fra kunder og revisorer</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Du kan når som helst trekke tilbake fullmakten fra innstillingene i Trust Profile.
          </p>

          <p className="text-foreground pt-1">
            Vennlig hilsen,
            <br />
            Mynder på vegne av {DEMO_PARTNER_NAME}
          </p>
        </div>
      </div>
    </PreviewFrame>
  );
}
