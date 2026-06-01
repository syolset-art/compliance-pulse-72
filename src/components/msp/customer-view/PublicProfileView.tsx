import { Shield, CheckCircle2, FileText, Mail } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME } from "./demoServices";

export function PublicProfileView() {
  return (
    <PreviewFrame
      title="Offentlig Trust Profile"
      subtitle="Det en kundes innkjøper eller revisor ser når de åpner trust-lenken."
      channel="Offentlig URL"
      surface="browser"
      browserUrl="https://trust.mynder.no/dips-arena"
      note={{
        file: "src/pages/PublicTrustProfile.tsx",
        component: "<PublicTrustProfile />",
        channel: "Offentlig webside (uten innlogging)",
        trigger: "Kunde/partner deler URL «trust.mynder.no/<slug>»",
        propsExample: `// Route: /trust/:slug
// Slug hentes fra assets.public_slug der publish_mode = 'public'`,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-border">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">{DEMO_CUSTOMER_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Programvareutvikling for helsesektoren · Norge
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success-foreground px-2.5 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Verifisert av Mynder
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                Oppdatert 28. mai 2026
              </span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
            Etterlevelse
          </h2>
          <div className="grid sm:grid-cols-3 gap-2">
            {["ISO 27001", "GDPR", "NSM grunnprinsipper"].map((fw) => (
              <div key={fw} className="rounded-lg border border-border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Rammeverk</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{fw}</p>
                <p className="text-xs text-success-foreground mt-1">Dokumentert</p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
            Tilgjengelige dokumenter
          </h2>
          <ul className="rounded-lg border border-border bg-card divide-y divide-border">
            {[
              "Sikkerhetspolicy (PDF)",
              "Databehandleravtale — mal",
              "Underleverandørliste",
              "Penetrasjonstest — sammendrag 2025",
            ].map((d) => (
              <li key={d} className="px-3 py-2.5 flex items-center gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {d}
                <span className="ml-auto text-xs text-primary font-semibold">Be om tilgang</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Kontakt for sikkerhet og personvern</h2>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Personvern:</dt>
              <dd className="text-foreground">personvern@dipsarena.no</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Sikkerhet:</dt>
              <dd className="text-foreground">security@dipsarena.no</dd>
            </div>
          </dl>
        </section>
      </div>
    </PreviewFrame>
  );
}
