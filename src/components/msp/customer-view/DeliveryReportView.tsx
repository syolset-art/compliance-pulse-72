import { FileText } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_PARTNER_NAME } from "./demoServices";

export function DeliveryReportView() {
  return (
    <PreviewFrame
      title="Leveranserapport (månedlig PDF)"
      subtitle="Vedlegges fakturagrunnlaget — viser hva som ble levert forrige periode."
      channel="PDF-vedlegg"
      surface="muted"
      note={{
        file: "src/components/reports/generateExecutivePortfolioReport.ts",
        component: "generateExecutivePortfolioReport()",
        channel: "PDF i e-post + nedlasting i kundeportalen",
        trigger: "Automatisk generering 1. hver måned (cron) eller manuelt i DeliverySummaryDialog",
        propsExample: `generateExecutivePortfolioReport({
  customer: { name: "${DEMO_CUSTOMER_NAME}" },
  partner: { name: "${DEMO_PARTNER_NAME}" },
  period: { from, to },
  activities: deliveredActivities,
})`,
      }}
    >
      <div className="mx-auto max-w-[640px] rounded-lg border border-border bg-background shadow-lg overflow-hidden">
        {/* Page top band */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Leveranserapport
            </p>
            <p className="text-xs text-muted-foreground">Mai 2026</p>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-3">{DEMO_CUSTOMER_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Levert av {DEMO_PARTNER_NAME}
          </p>
        </div>

        {/* Summary */}
        <div className="px-8 py-5 grid grid-cols-3 gap-4 border-b border-border">
          {[
            { v: "18", l: "Aktiviteter levert" },
            { v: "3", l: "Hendelser håndtert" },
            { v: "1", l: "Risikovurdering" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-bold text-foreground">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Activity list */}
        <div className="px-8 py-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Hva vi har gjort for deg
          </h2>
          <ul className="space-y-2">
            {[
              "Oppdatert behandlingsprotokoll med 2 nye behandlinger",
              "Gjennomført månedlig leverandørgjennomgang (8 leverandører)",
              "Klassifisert og lukket 3 sikkerhetshendelser",
              "Forberedt internrevisjon for ISO 27001 Q2",
              "Oppdatert beredskapsplan etter NIS2-endring",
            ].map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border bg-muted/30 text-xs text-muted-foreground flex justify-between">
          <span>Side 1 av 4</span>
          <span>Generert av Mynder · trust.mynder.no</span>
        </div>
      </div>
    </PreviewFrame>
  );
}
