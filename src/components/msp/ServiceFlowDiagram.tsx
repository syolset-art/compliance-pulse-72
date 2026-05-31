import { Shield, Wrench, ShieldCheck, ArrowRight, TrendingUp, Check } from "lucide-react";

/**
 * Visuell illustrasjon som viser sammenhengen:
 * Kundens Trust profile & modenhet  ←→  Partnerens tjenester  ←→  Tilbud, regelverk og kontrollpunkter
 *
 * Bruker semantiske design-tokens. Responsiv: 3 kolonner på md+, stables vertikalt på mobil.
 */
export function ServiceFlowDiagram() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-7 space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Slik henger det sammen</h3>
        <p className="text-sm text-muted-foreground">
          Tjenestene du leverer blir byggeklosser i tilbudet, dekker kontrollpunkter på tvers av regelverk,
          og hever kundens modenhet i deres trust profile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {/* KUNDE */}
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kunde</p>
              <p className="text-sm font-semibold text-foreground">Trust profile</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Modenhetsnivå (0–4)</p>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${i < 3 ? "bg-success" : "bg-muted"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-success font-medium">
              <TrendingUp className="h-4 w-4" />
              Hever seg med hver leveranse
            </div>
          </div>
        </div>

        {/* Pil 1 */}
        <FlowArrow label="leverer på" />

        {/* PARTNER */}
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-primary">Partner (deg)</p>
              <p className="text-sm font-semibold text-foreground">Dine tjenester</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {["Backup & restore", "MDR / overvåking", "Awareness-opplæring"].map((s) => (
              <div
                key={s}
                className="text-sm bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Pil 2 */}
        <FlowArrow label="dekker" />

        {/* COMPLIANCE */}
        <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-success/10 text-success flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Compliance</p>
              <p className="text-sm font-semibold text-foreground">Tilbud · Regelverk · Kontroller</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["NIS2", "ISO 27001", "GDPR"].map((f) => (
              <span
                key={f}
                className="text-xs font-medium bg-muted text-foreground rounded-full px-2.5 py-1"
              >
                {f}
              </span>
            ))}
          </div>
          <div className="space-y-1">
            {[
              { fw: "ISO 27001", id: "A.8.13 Sikkerhetskopiering" },
              { fw: "NIS2", id: "Art.21 Sikkerhetstiltak" },
              { fw: "ISO 27001", id: "A.6.3 Awareness" },
            ].map((c) => (
              <div key={c.id} className="flex items-center gap-1.5 text-sm text-foreground">
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="text-muted-foreground">{c.fw}</span>
                <span className="truncate">{c.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lukker loopen: Compliance → Kunde */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-success/40 to-success/40 max-w-[200px]" />
        <div className="flex items-center gap-1.5 text-sm font-medium text-success bg-success/10 border border-success/20 rounded-full px-3 py-1.5">
          <TrendingUp className="h-4 w-4" />
          Hver dekket kontroll hever kundens modenhet
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-success/40 to-success/40 max-w-[200px]" />
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex md:flex-col items-center justify-center gap-1 md:px-1">
      <span className="text-xs text-muted-foreground md:order-2 whitespace-nowrap">{label}</span>
      <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0 md:order-1" />
    </div>
  );
}
