import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, Cloud, ClipboardList, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KPI {
  label_no: string;
  label_en: string;
  value: number;
  icon: typeof Building2;
  route: string;
  accent: string;
}

export function KPIRow() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const [counts, setCounts] = useState({ vendors: 0, systems: 0, openTasks: 0, deviations: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [vendorRes, systemRes, taskRes, devRes] = await Promise.all([
        supabase.from("assets").select("id", { count: "exact", head: true }).eq("asset_type", "vendor"),
        supabase.from("assets").select("id", { count: "exact", head: true }).eq("asset_type", "system"),
        supabase.from("user_tasks").select("id", { count: "exact", head: true }).neq("status", "done"),
        supabase.from("employee_deviation_reports").select("id", { count: "exact", head: true }).neq("status", "closed"),
      ]);
      setCounts({
        vendors: vendorRes.count || 0,
        systems: systemRes.count || 0,
        openTasks: taskRes.count || 0,
        deviations: devRes.count || 0,
      });
    };
    fetchCounts();
  }, []);

  const kpis: KPI[] = [
    { label_no: "Leverandører", label_en: "Vendors", value: counts.vendors, icon: Building2, route: "/vendors", accent: "text-primary dark:text-primary" },
    { label_no: "Systemer", label_en: "Systems", value: counts.systems, icon: Cloud, route: "/systems", accent: "text-status-closed dark:text-status-closed" },
    { label_no: "Åpne oppgaver", label_en: "Open tasks", value: counts.openTasks, icon: ClipboardList, route: "/tasks", accent: "text-warning dark:text-warning" },
    { label_no: "Avvik", label_en: "Deviations", value: counts.deviations, icon: AlertTriangle, route: "/deviations", accent: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <button
            key={kpi.route}
            onClick={() => navigate(kpi.route)}
            className="rounded-xl border border-border bg-card p-4 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${kpi.accent}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isNorwegian ? kpi.label_no : kpi.label_en}</p>
          </button>
        );
      })}
    </div>
  );
}
