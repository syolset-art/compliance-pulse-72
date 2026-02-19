import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileX,
  Clock,
  AlertTriangle,
  FileWarning,
  Mail,
  Send,
  Building2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface VendorActionItem {
  id: string;
  name: string;
  compliance_score?: number | null;
  risk_level?: string | null;
  vendor_category?: string | null;
}

interface ActionCategory {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  vendors: VendorActionItem[];
  requestType?: string; // maps to SendRequestWizard request types
}

interface VendorActionCardsProps {
  vendors: {
    id: string;
    name: string;
    compliance_score: number | null;
    risk_level: string | null;
    next_review_date?: string | null;
    vendor_category?: string | null;
    gdpr_role?: string | null;
    work_area_id?: string | null;
  }[];
  expiredDocVendorIds: string[];
  pendingInboxVendorIds: string[];
  onSendRequest: (vendorIds: string[], requestType: string) => void;
}

export function VendorActionCards({
  vendors,
  expiredDocVendorIds,
  pendingInboxVendorIds,
  onSendRequest,
}: VendorActionCardsProps) {
  const navigate = useNavigate();

  const categories: ActionCategory[] = useMemo(() => {
    const now = new Date();

    const missingDPA = vendors
      .filter((v) => (v.compliance_score || 0) < 30)
      .map((v) => ({ id: v.id, name: v.name, compliance_score: v.compliance_score, risk_level: v.risk_level, vendor_category: v.vendor_category }));

    const overdueReview = vendors
      .filter((v) => v.next_review_date && new Date(v.next_review_date) < now)
      .map((v) => ({ id: v.id, name: v.name, compliance_score: v.compliance_score, risk_level: v.risk_level, vendor_category: v.vendor_category }));

    const highRiskUnaudited = vendors
      .filter((v) => v.risk_level === "high" && (v.compliance_score || 0) < 50)
      .map((v) => ({ id: v.id, name: v.name, compliance_score: v.compliance_score, risk_level: v.risk_level, vendor_category: v.vendor_category }));

    const expiredDocs = vendors
      .filter((v) => expiredDocVendorIds.includes(v.id))
      .map((v) => ({ id: v.id, name: v.name, compliance_score: v.compliance_score, risk_level: v.risk_level, vendor_category: v.vendor_category }));

    const pendingInbox = vendors
      .filter((v) => pendingInboxVendorIds.includes(v.id))
      .map((v) => ({ id: v.id, name: v.name, compliance_score: v.compliance_score, risk_level: v.risk_level, vendor_category: v.vendor_category }));

    return [
      {
        key: "missing_dpa",
        label: "Mangler DPA / DPIA",
        description: "Disse leverandørene har lav compliance og mangler trolig databehandleravtale eller vurdering.",
        icon: FileX,
        iconColor: "text-warning",
        borderColor: "border-warning/30",
        bgColor: "bg-warning/5",
        vendors: missingDPA,
        requestType: "dpa",
      },
      {
        key: "high_risk",
        label: "Høyrisiko uten revisjon",
        description: "Leverandører med høy risiko og lav compliance-score som bør vurderes snarest.",
        icon: ShieldAlert,
        iconColor: "text-destructive",
        borderColor: "border-destructive/30",
        bgColor: "bg-destructive/5",
        vendors: highRiskUnaudited,
        requestType: "vendor_assessment",
      },
      {
        key: "overdue",
        label: "Forfalt gjennomgang",
        description: "Gjennomgangsdatoen for disse leverandørene har passert.",
        icon: Clock,
        iconColor: "text-orange-500",
        borderColor: "border-orange-500/30",
        bgColor: "bg-orange-500/5",
        vendors: overdueReview,
        requestType: "vendor_assessment",
      },
      {
        key: "expired_docs",
        label: "Utdaterte dokumenter",
        description: "Dokumenter hos disse leverandørene har utløpt og bør fornyes.",
        icon: FileWarning,
        iconColor: "text-destructive",
        borderColor: "border-destructive/30",
        bgColor: "bg-destructive/5",
        vendors: expiredDocs,
        requestType: "iso_documentation",
      },
      {
        key: "pending_inbox",
        label: "Ventende i innboks",
        description: "Disse leverandørene har ubehandlede elementer i Lara-innboksen.",
        icon: Mail,
        iconColor: "text-primary",
        borderColor: "border-primary/30",
        bgColor: "bg-primary/5",
        vendors: pendingInbox,
      },
    ].filter((c) => c.vendors.length > 0);
  }, [vendors, expiredDocVendorIds, pendingInboxVendorIds]);

  if (categories.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Aksjoner som kreves</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.key}
              variant="flat"
              className={`p-4 ${cat.borderColor} ${cat.bgColor}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <Icon className={`h-5 w-5 ${cat.iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    <Badge variant="outline" className="text-[10px]">{cat.vendors.length}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {cat.vendors.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/assets/${v.id}`)}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-background/60 cursor-pointer transition-colors"
                  >
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground truncate flex-1">{v.name}</span>
                    {v.risk_level && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 ${
                          v.risk_level === "high"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : v.risk_level === "medium"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-success/10 text-success border-success/20"
                        }`}
                      >
                        {{ high: "Høy", medium: "Middels", low: "Lav" }[v.risk_level] || v.risk_level}
                      </Badge>
                    )}
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                ))}
                {cat.vendors.length > 4 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    +{cat.vendors.length - 4} flere
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {cat.requestType && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      onSendRequest(
                        cat.vendors.map((v) => v.id),
                        cat.requestType!
                      )
                    }
                  >
                    <Send className="h-3 w-3" />
                    Send forespørsel
                  </Button>
                )}
                {cat.key === "pending_inbox" && (
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 text-xs"
                    onClick={() => navigate("/lara-inbox")}
                  >
                    <Mail className="h-3 w-3" />
                    Åpne innboks
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
