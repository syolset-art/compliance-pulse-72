import { Shield, Wrench, ShieldCheck, ArrowRight, TrendingUp, Check } from "lucide-react";

/**
 * Visuell illustrasjon som viser sammenhengen:
 * Kundens Trust profile & modenhet  ←→  Partnerens tjenester  ←→  Tilbud, regelverk og kontrollpunkter
 *
 * Bruker semantiske design-tokens. Responsiv: 3 kolonner på md+, stables vertikalt på mobil.
 */
export function ServiceFlowDiagram() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Slik henger det sammen</h3>
        <p className="text-base text-foreground/80 leading-relaxed">
          Tjenestene du leverer blir byggeklosser i tilbudet, dekker kontrollpunkter på tvers av regelverk,
          og hever kundens modenhet i deres trust profile.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {/* KUNDE */}
        <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-foreground/70">Kunde</p>
              <p className="text-base font-semibold text-foreground">Trust profile</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base text-foreground/80">Modenhetsnivå (0–4)</p>
            <div className="flex items-center gap-1.5" role="img" aria-label="Modenhetsnivå 3 av 4">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-3 flex-1 rounded-full ${i < 3 ? "bg-success" : "bg-muted"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-base text-success font-medium">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              Hever seg med hver leveranse
            </div>
          </div>
        </div>

        {/* Pil 1 */}
        <FlowArrow label="leverer på" />

        {/* PARTNER */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Partner (deg)</p>
              <p className="text-base font-semibold text-foreground">Dine tjenester</p>
            </div>
          </div>
          <ul className="space-y-2">
            {["Backup & restore", "MDR / overvåking", "Awareness-opplæring"].map((s) => (
              <li
                key={s}
                className="text-base bg-background border border-border rounded-md px-3 py-2 text-foreground"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Pil 2 */}
        <FlowArrow label="dekker" />

        {/* COMPLIANCE */}
        <div className="rounded-xl border border-border bg-card/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-success/10 text-success flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-foreground/70">Compliance</p>
              <p className="text-base font-semibold text-foreground">Tilbud · Regelverk · Kontroller</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["NIS2", "ISO 27001", "GDPR"].map((f) => (
              <span
                key={f}
                className="text-sm font-medium bg-muted text-foreground rounded-full px-3 py-1"
              >
                {f}
              </span>
            ))}
          </div>
          <ul className="space-y-2">
            {[
              { fw: "ISO 27001", id: "A.8.13 Sikkerhetskopiering" },
              { fw: "NIS2", id: "Art.21 Sikkerhetstiltak" },
              { fw: "ISO 27001", id: "A.6.3 Awareness" },
            ].map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-base text-foreground">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                <span className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-foreground/80">{c.fw}</span>
                  <span>{c.id}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lukker loopen: Compliance → Kunde */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-success/40 to-success/40 max-w-[200px]" />
        <div className="flex items-center gap-2 text-base font-medium text-success bg-success/10 border border-success/30 rounded-full px-4 py-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          Hver dekket kontroll hever kundens modenhet
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-success/40 to-success/40 max-w-[200px]" />
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex md:flex-col items-center justify-center gap-2 md:px-2">
      <span className="text-sm font-medium text-foreground/70 md:order-2 whitespace-nowrap">
        {label}
      </span>
      <ArrowRight
        className="h-6 w-6 text-foreground/60 rotate-90 md:rotate-0 md:order-1"
        aria-hidden="true"
      />
    </div>
  );
}
