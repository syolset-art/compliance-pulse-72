import { Mail } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_PARTNER_NAME } from "./demoServices";

export function HandoverEmailView() {
  return (
    <PreviewFrame
      title="Overleveringse-post (Trust handover)"
      subtitle="Sendes når partner overleverer ferdigstilt Trust Profile til kunden."
      channel="E-post"
      surface="muted"
      note={{
        file: "src/components/msp/SendTrustHandoverEmailDialog.tsx",
        component: "<SendTrustHandoverEmailDialog />",
        channel: "Utgående e-post med lenke til Trust Profile",
        trigger: "Partner trykker «Overlever» på kundekortet i MSPCustomerDetail",
        propsExample: `// Body inkluderer:
// - customerName, partnerName
// - trustProfileUrl (publik slug)
// - completionStats { frameworks, controls, documents }`,
      }}
    >
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40 space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              E-post til kunde — utkast
            </span>
          </div>
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">Fra:</span> {DEMO_PARTNER_NAME}{" "}
            <span className="text-muted-foreground">· Til:</span> {DEMO_CUSTOMER_NAME}
          </p>
          <p className="text-sm font-semibold text-foreground">
            Emne: Din Trust Profile er klar — full oversikt over etterlevelsen
          </p>
        </div>
        <div className="px-5 py-5 space-y-3 text-sm text-foreground leading-relaxed">
          <p>Hei {DEMO_CUSTOMER_NAME},</p>
          <p>
            Vi har nå satt opp Trust Profilen din i Mynder. Den gir deg, dine kunder og revisorer
            én samlet oversikt over hvordan dere etterlever ISO 27001, GDPR og NSM-grunnprinsippene.
          </p>
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Rammeverk</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">47</p>
              <p className="text-xs text-muted-foreground">Kontroller dokumentert</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Dokumenter delt</p>
            </div>
          </div>
          <p>Du kan se og dele profilen herfra:</p>
          <p>
            <a className="text-primary font-semibold underline underline-offset-2" href="#">
              https://trust.mynder.no/dips-arena
            </a>
          </p>
          <p>
            Vi følger opp månedlig, men ta gjerne kontakt om du har spørsmål eller ønsker å gi
            tilgang til en revisor.
          </p>
          <p className="text-foreground">
            Vennlig hilsen,
            <br />
            Ola Nordmann — {DEMO_PARTNER_NAME}
          </p>
        </div>
      </div>
    </PreviewFrame>
  );
}
