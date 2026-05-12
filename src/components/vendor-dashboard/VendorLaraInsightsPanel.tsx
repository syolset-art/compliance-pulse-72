import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Diamond, AlertTriangle, FileWarning, Inbox, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  compliance_score: number | null;
  risk_level: string | null;
  next_review_date?: string | null;
}

interface Props {
  vendors: Asset[];
  expiredDocVendorIds: string[];
  pendingInboxVendorIds: string[];
  onSendRequest?: (vendorIds: string[], requestType: string, categoryKey: string) => void;
}

export function VendorLaraInsightsPanel({
  vendors,
  expiredDocVendorIds,
  pendingInboxVendorIds,
  onSendRequest,
}: Props) {
  const navigate = useNavigate();

  const insights = useMemo(() => {
    const items: {
      key: string;
      severity: "critical" | "high" | "medium" | "info";
      title: string;
      detail: string;
      icon: typeof AlertTriangle;
      cta: string;
      onClick: () => void;
    }[] = [];

    const missingDPA = vendors.filter((v) => (v.compliance_score || 0) < 30);
    const highRiskUnaudited = vendors.filter(
      (v) => v.risk_level === "high" && (v.compliance_score || 0) < 50
    );
    const now = new Date();
    const overdueReview = vendors.filter(
      (v) => v.next_review_date && new Date(v.next_review_date) < now
    );

    if (missingDPA.length > 0) {
      items.push({
        key: "missing-dpa",
        severity: "critical",
        title: `${missingDPA.length} leverandører mangler databehandleravtale`,
        detail: "Lara kan formulere og sende forespørsel om DPA i én operasjon.",
        icon: FileWarning,
        cta: "La Lara sende forespørsel",
        onClick: () =>
          onSendRequest?.(
            missingDPA.map((v) => v.id),
            "dpa",
            "missing_dpa"
          ),
      });
    }

    if (expiredDocVendorIds.length > 0) {
      items.push({
        key: "expired-docs",
        severity: "high",
        title: `${expiredDocVendorIds.length} leverandører har utdaterte dokumenter`,
        detail: "Sertifikater eller avtaler er utløpt — be om oppdatert dokumentasjon.",
        icon: AlertTriangle,
        cta: "Be om oppdatering",
        onClick: () =>
          onSendRequest?.(expiredDocVendorIds, "renewal", "expired_docs"),
      });
    }

    if (highRiskUnaudited.length > 0) {
      items.push({
        key: "high-risk",
        severity: "high",
        title: `${highRiskUnaudited.length} høy-risiko leverandører er ikke vurdert`,
        detail: "Lara anbefaler en strukturert risikovurdering og innhenting av evidens.",
        icon: ShieldCheck,
        cta: "Start vurdering",
        onClick: () => navigate("/vendors?tab=all"),
      });
    }

    if (pendingInboxVendorIds.length > 0) {
      items.push({
        key: "inbox",
        severity: "medium",
        title: `${pendingInboxVendorIds.length} ventende meldinger fra leverandører`,
        detail: "Nye dokumenter eller svar venter behandling i Lara-innboksen.",
        icon: Inbox,
        cta: "Åpne innboks",
        onClick: () => navigate("/lara-inbox"),
      });
    }

    if (overdueReview.length > 0) {
      items.push({
        key: "overdue",
        severity: "medium",
        title: `${overdueReview.length} leverandører har forfalt gjennomgang`,
        detail: "Planlagt periodisk gjennomgang er overskredet. Sett ny dato eller utfør nå.",
        icon: AlertTriangle,
        cta: "Planlegg gjennomgang",
        onClick: () => navigate("/tasks"),
      });
    }

    return items.slice(0, 4);
  }, [vendors, expiredDocVendorIds, pendingInboxVendorIds, navigate, onSendRequest]);

  if (insights.length === 0) {
    return (
      <Card variant="flat" className="p-4 border-success/20 bg-success/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Lara har ingen kritiske anbefalinger</p>
            <p className="text-[13px] text-muted-foreground">
              Leverandørporteføljen ser sunn ut. Lara overvåker kontinuerlig endringer i status og dokumentasjon.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const severityStyles: Record<string, { bar: string; iconBg: string; iconText: string; badge: string; label: string }> = {
    critical: {
      bar: "bg-destructive",
      iconBg: "bg-destructive/15",
      iconText: "text-destructive",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      label: "Kritisk",
    },
    high: {
      bar: "bg-warning",
      iconBg: "bg-warning/15",
      iconText: "text-warning",
      badge: "bg-warning/10 text-warning border-warning/20",
      label: "Høy",
    },
    medium: {
      bar: "bg-primary",
      iconBg: "bg-primary/10",
      iconText: "text-primary",
      badge: "bg-primary/10 text-primary border-primary/20",
      label: "Middels",
    },
    info: {
      bar: "bg-muted-foreground",
      iconBg: "bg-muted",
      iconText: "text-muted-foreground",
      badge: "bg-muted text-muted-foreground border-border",
      label: "Info",
    },
  };

  return (
    <Card variant="flat" className="overflow-hidden border-primary/20">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Diamond className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Lara anbefaler
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                {insights.length} forslag
              </Badge>
            </h3>
            <p className="text-[12px] text-muted-foreground">
              Prioriterte handlinger basert på status og dokumentasjon i porteføljen
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {insights.map((item) => {
          const styles = severityStyles[item.severity];
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex items-stretch group hover:bg-muted/40 transition-colors">
              <div className={cn("w-1 shrink-0", styles.bar)} />
              <div className="flex-1 flex items-center gap-3 px-4 py-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", styles.iconBg)}>
                  <Icon className={cn("h-4 w-4", styles.iconText)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", styles.badge)}>
                      {styles.label}
                    </Badge>
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  </div>
                  <p className="text-[13px] text-muted-foreground">{item.detail}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                  onClick={item.onClick}
                >
                  {item.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
