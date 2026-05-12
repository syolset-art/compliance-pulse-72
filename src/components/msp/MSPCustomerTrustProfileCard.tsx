import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ExternalLink,
  UserPlus,
  EyeOff,
  FileBadge,
  FileText,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";

interface Props {
  customerName?: string;
}

const certifications = [
  { name: "ISO 27001:2022", meta: "Gyldig til 14. mars 2027 · BSI", status: "active" as const },
  { name: "PCI DSS v4.0", meta: "Nivå 1 · Gyldig til 8. juli 2026", status: "active" as const },
  { name: "SOC 2 Type II", meta: "Utløpt 31. desember 2025", status: "expired" as const },
];

const policies = [
  { name: "Personvernerklæring", published: true },
  { name: "Informasjonssikkerhetspolicy", published: true },
  { name: "Hendelseshåndtering", published: true },
  { name: "Leverandørstyring", published: false },
];

const accessRequests = [
  { initials: "SB", color: "bg-blue-100 text-blue-700", title: "Sparebank 1 ba om SOC 2-rapport", meta: "22. april 2026 · Avventer svar", status: "open" as const },
  { initials: "VP", color: "bg-purple-100 text-purple-700", title: "Vipps MobilePay ba om personvernerklæring", meta: "10. april 2026 · Besvart", status: "closed" as const },
];

export function MSPCustomerTrustProfileCard({ customerName = "Kunden" }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{customerName} · Trust Profile</p>
          <h2 className="text-lg font-semibold text-foreground">Kundens visningskort utad</h2>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <ExternalLink className="h-3.5 w-3.5" />
          Se offentlig visning
        </Button>
      </div>

      {/* Claim banner */}
      <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
        <div className="flex items-start gap-2.5">
          <UserPlus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Profilen er ikke claimet av kunden</p>
            <p className="text-[13px] text-muted-foreground leading-snug">
              Du administrerer profilen på vegne av {customerName}. Når kunden claimer profilen tar de over redigering — du
              beholder innsynet, men kan ikke lenger endre innhold direkte.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-8 text-xs">Inviter Truls til å claime</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">Lær om claim-prosessen</Button>
        </div>
      </Card>

      {/* Visibility + views */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 bg-muted/30 border-border/60">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Synlighet</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground">Privat — kun via invitasjon</span>
          </div>
        </Card>
        <Card className="p-4 bg-muted/30 border-border/60">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Profilvisninger siste 30d</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl font-bold text-foreground">4</span>
            <span className="text-sm text-muted-foreground">tredjeparter</span>
          </div>
        </Card>
      </div>

      {/* Certifications */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Sertifiseringer og attesteringer</h3>
          <span className="text-[11px] text-muted-foreground">2 publisert · 1 utløpt</span>
        </div>
        <div className="space-y-2">
          {certifications.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${c.status === "active" ? "bg-success/10" : "bg-destructive/10"}`}>
                <FileBadge className={`h-4 w-4 ${c.status === "active" ? "text-success" : "text-destructive"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.meta}</p>
              </div>
              <Badge variant="outline" className={c.status === "active"
                ? "text-[10px] bg-success/10 text-success border-success/30"
                : "text-[10px] bg-destructive/10 text-destructive border-destructive/30"}>
                {c.status === "active" ? "Aktiv" : "Utløpt"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Policies */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Policyer og dokumenter</h3>
          <span className="text-[11px] text-muted-foreground">5 av 12 publisert</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {policies.map(p => (
            <div key={p.name} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${p.published ? "border-border/60" : "border-dashed border-border bg-muted/20"}`}>
              <FileText className={`h-3.5 w-3.5 shrink-0 ${p.published ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
              <span className={`text-[13px] flex-1 truncate ${p.published ? "text-foreground" : "text-muted-foreground"}`}>{p.name}</span>
              {p.published ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <span className="text-[10px] text-muted-foreground">Mangler</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Access requests */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Innsynsforespørsler fra tredjepart</h3>
          <span className="text-[11px] text-muted-foreground">Siste 90 dager</span>
        </div>
        <div className="space-y-2">
          {accessRequests.map(r => (
            <div key={r.title} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${r.color}`}>
                {r.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{r.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{r.meta}</p>
              </div>
              <Badge variant="outline" className={r.status === "open"
                ? "text-[10px] bg-warning/10 text-warning border-warning/30"
                : "text-[10px] bg-success/10 text-success border-success/30"}>
                {r.status === "open" ? "Åpen" : "Lukket"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
