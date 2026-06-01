import { Sparkles, ShieldCheck, FileText, ClipboardList, Building2, TrendingUp, ChevronRight } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_PARTNER_NAME } from "./demoServices";

export function GrantAuthorityView() {
  return (
    <PreviewFrame
      title="Gi fullmakt — kundens Trust Profile"
      subtitle="Slik ser kunden sin Trust Profile etter at partner har opprettet den. Lara foreslår å gi fullmakt øverst."
      channel="Innlogget visning"
      surface="browser"
      browserUrl="https://app.mynder.no/trust-profile"
      note={{
        file: "src/components/trust-center/GrantPartnerAuthorityBanner.tsx",
        component: "<GrantPartnerAuthorityBanner partnerName={...} />",
        channel: "Sticky banner øverst i kundens Trust Profile",
        trigger:
          "Vises når en MSP-partner har opprettet eller er koblet til kundens Trust Profile uten aktiv fullmakt",
        propsExample: `// Lagres som relasjon mellom partner og kunde-profil
await supabase.from('trust_profile_authorities').insert({
  trust_profile_id: profile.id,
  partner_org_id: partner.id,
  granted_by: auth.uid(),
  scopes: ['activities', 'documents', 'inquiries'],
});`,
      }}
    >
      <div className="space-y-5">
        {/* Lara-banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Lara foreslår
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Gi din partner fullmakt til å øke modenheten
              </h2>
              <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                Gi <strong>{DEMO_PARTNER_NAME}</strong> fullmakt til å utføre aktiviteter på din
                Trust Profile. De kan da dokumentere kontroller, laste opp bevis og svare på
                henvendelser — slik at modenheten øker raskere uten at du må gjøre alt selv.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-12">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90"
            >
              <ShieldCheck className="h-4 w-4" />
              Gi fullmakt
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Les mer
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Trust Profile header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{DEMO_CUSTOMER_NAME}</h1>
                <p className="text-xs text-muted-foreground">Trust Profile · trust.mynder.no/dips-arena</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Modenhet</p>
                <p className="text-sm font-semibold text-foreground">62 %</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid gap-3 md:grid-cols-3">
          <SectionCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Rammeverk"
            count="3"
            items={["ISO 27001", "GDPR", "NSM grunnprinsipper"]}
          />
          <SectionCard
            icon={<FileText className="h-4 w-4" />}
            title="Dokumenter"
            count="12"
            items={["Informasjonssikkerhetspolicy", "ROPA", "Beredskapsplan"]}
          />
          <SectionCard
            icon={<ClipboardList className="h-4 w-4" />}
            title="Aktiviteter"
            count="8 åpne"
            items={["Årlig risikovurdering", "Internrevisjon Q2", "DPIA – nytt CRM"]}
          />
        </div>
      </div>
    </PreviewFrame>
  );
}

function SectionCard({
  icon,
  title,
  count,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  count: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="truncate">· {i}</li>
        ))}
      </ul>
    </div>
  );
}
