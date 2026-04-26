import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  FileText,
  Server,
  Users,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

export function ComplianceSummaryCards() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const { requirements } = useComplianceRequirements({});

  // Fetch vendor data
  const { data: vendorData } = useQuery({
    queryKey: ["summary-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, country, gdpr_role, asset_type")
        .in("asset_type", ["vendor", "sub_processor", "cloud_service"]);
      const vendors = data || [];
      const outsideEU = vendors.filter(
        (v) => v.country && !["NO", "SE", "DK", "FI", "DE", "FR", "NL", "BE", "AT", "IE", "IT", "ES", "PT", "PL", "CZ", "EE", "LV", "LT", "LU", "MT", "CY", "SK", "SI", "HR", "BG", "RO", "GR", "HU", "IS", "LI"].includes(v.country.toUpperCase())
      ).length;
      const missingDPA = vendors.filter((v) => !v.gdpr_role).length;
      return { total: vendors.length, outsideEU, missingDPA };
    },
  });

  // Fetch systems count
  const { data: systemsData } = useQuery({
    queryKey: ["summary-systems"],
    queryFn: async () => {
      const { count: systemCount } = await supabase
        .from("systems")
        .select("*", { count: "exact", head: true });
      return { total: systemCount || 0 };
    },
  });

  // Fetch work areas for org overview
  const { data: orgData } = useQuery({
    queryKey: ["summary-org"],
    queryFn: async () => {
      const { count: areaCount } = await supabase
        .from("work_areas")
        .select("*", { count: "exact", head: true });
      return { workAreas: areaCount || 0 };
    },
  });

  // SLA stats by category from requirements
  const slaByCat = (cat: string) => {
    const reqs = requirements.filter((r) => r.sla_category === cat);
    const completed = reqs.filter((r) => r.status === "completed").length;
    return reqs.length > 0 ? Math.round((completed / reqs.length) * 100) : 0;
  };

  const cards = [
    {
      key: "vendors",
      icon: Building2,
      title: isNorwegian ? "Tredjeparter" : "Third parties",
      metric: vendorData?.total ?? 0,
      metricLabel: isNorwegian ? "leverandører" : "vendors",
      alerts: [
        vendorData?.outsideEU
          ? `${vendorData.outsideEU} ${isNorwegian ? "utenfor EU/EØS" : "outside EU/EEA"}`
          : null,
        vendorData?.missingDPA
          ? `${vendorData.missingDPA} ${isNorwegian ? "mangler DPA" : "missing DPA"}`
          : null,
      ].filter(Boolean) as string[],
      route: "/assets",
      color: "text-primary dark:text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      key: "protocols",
      icon: FileText,
      title: isNorwegian ? "Protokoller (ROPA)" : "Protocols (ROPA)",
      metric: `${slaByCat("supplier_ecosystem")}%`,
      metricLabel: isNorwegian ? "tredjepartsstyring" : "third party mgmt",
      alerts: [],
      route: "/processing-records",
      color: "text-accent dark:text-accent",
      bg: "bg-accent/10 border-accent/20",
    },
    {
      key: "systems",
      icon: Server,
      title: isNorwegian ? "Systemer & prosesser" : "Systems & processes",
      metric: systemsData?.total ?? 0,
      metricLabel: isNorwegian ? "systemer" : "systems",
      alerts: [
        `SLA: ${slaByCat("operations")}%`
      ],
      route: "/systems",
      color: "text-status-closed dark:text-status-closed",
      bg: "bg-status-closed/10 border-status-closed/20",
    },
    {
      key: "org",
      icon: Users,
      title: isNorwegian ? "Organisasjon & roller" : "Organization & roles",
      metric: orgData?.workAreas ?? 0,
      metricLabel: isNorwegian ? "arbeidsområder" : "work areas",
      alerts: [
        `SLA: ${slaByCat("governance")}%`
      ],
      route: "/work-areas",
      color: "text-warning dark:text-warning",
      bg: "bg-warning/10 border-warning/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            onClick={() => navigate(card.route)}
            className="text-left group"
          >
            <Card className="p-4 h-full border-border hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg border", card.bg)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{card.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{card.metric}</span>
                <span className="text-xs text-muted-foreground">{card.metricLabel}</span>
              </div>
              {card.alerts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {card.alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </button>
        );
      })}
    </div>
  );
}
