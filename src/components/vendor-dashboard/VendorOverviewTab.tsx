import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  AlertTriangle,
  Plus,
  Sparkles,
  TrendingUp,
  MapPin,
  Globe,
  Shield,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { VendorActionCards } from "./VendorActionCards";
import { SystemsPriorityChart } from "./SystemsPriorityChart";
import { ComplianceActivityChart } from "./ComplianceActivityChart";
import { BulkSendConfirmDialog } from "./BulkSendConfirmDialog";
import { toast } from "sonner";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  country?: string | null;
  region?: string | null;
  vendor?: string | null;
  next_review_date?: string | null;
  vendor_category?: string | null;
  gdpr_role?: string | null;
  work_area_id?: string | null;
  created_at?: string | null;
  criticality?: string | null;
  priority?: string | null;
}

interface VendorOverviewTabProps {
  vendors: Asset[];
  relationships: { source_asset_id: string; target_asset_id: string }[];
  onAddVendor: () => void;
  onDiscoverAI: () => void;
  onDelete?: (id: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "hsl(var(--success))",
  medium: "hsl(var(--warning))",
  high: "hsl(var(--destructive))",
  unknown: "hsl(var(--muted-foreground))",
};

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  infrastructure: "Infrastruktur",
  consulting: "Rådgivning",
  it_operations: "IT-drift",
  facilities: "Kontor",
  other: "Annet",
};

export function VendorOverviewTab({ vendors, relationships, onAddVendor, onDiscoverAI, onDelete }: VendorOverviewTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [requestWizardOpen, setRequestWizardOpen] = useState(false);
  const [preselectedVendorIds, setPreselectedVendorIds] = useState<string[]>([]);
  const [preselectedRequestType, setPreselectedRequestType] = useState<string>("");
  const [sentCategories, setSentCategories] = useState<string[]>([]);
  const [preselectedCategoryKey, setPreselectedCategoryKey] = useState<string>("");

  const { data: inboxCounts = {} } = useQuery({
    queryKey: ["lara-inbox-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lara_inbox")
        .select("matched_asset_id, id")
        .in("status", ["new", "auto_matched"]);
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        if (item.matched_asset_id) {
          counts[item.matched_asset_id] = (counts[item.matched_asset_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const { data: expiredCounts = {} } = useQuery({
    queryKey: ["expired-docs-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("asset_id, valid_to")
        .not("valid_to", "is", null);
      const now = new Date();
      const counts: Record<string, number> = {};
      data?.forEach(doc => {
        if (new Date(doc.valid_to!) < now) {
          counts[doc.asset_id] = (counts[doc.asset_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // ── Metrics ──
  const metrics = useMemo(() => {
    const total = vendors.length;
    const compliant = vendors.filter(v => (v.compliance_score || 0) >= 80).length;
    const compliantPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const avgScore = total > 0 ? Math.round(vendors.reduce((s, v) => s + (v.compliance_score || 0), 0) / total) : 0;
    const missingDPA = vendors.filter(v => (v.compliance_score || 0) < 30).length;
    const highRisk = vendors.filter(v => v.risk_level === "high").length;
    const withExpiredDocs = Object.keys(expiredCounts).filter(id => vendors.some(v => v.id === id)).length;
    const pendingInbox = Object.keys(inboxCounts).filter(id => vendors.some(v => v.id === id)).length;
    return { total, compliant, compliantPercent, avgScore, missingDPA, highRisk, withExpiredDocs, pendingInbox };
  }, [vendors, expiredCounts, inboxCounts]);

  // ── Risk distribution for pie chart ──
  const riskDistribution = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, unknown: 0 };
    vendors.forEach(v => {
      const r = v.risk_level as keyof typeof counts;
      if (r && r in counts) counts[r]++;
      else counts.unknown++;
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([name, value]) => ({ name, value, fill: RISK_COLORS[name] }));
  }, [vendors]);

  // ── Category distribution for bar chart ──
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach(v => {
      const cat = v.vendor_category || "uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ name: CATEGORY_LABELS[key] || "Ukategorisert", count }))
      .sort((a, b) => b.count - a.count);
  }, [vendors]);

  // ── GDPR role breakdown ──
  const gdprBreakdown = useMemo(() => {
    const labels: Record<string, string> = {
      databehandler: "Databehandler",
      underdatabehandler: "Underdatabehandler",
      ingen: "Ingen persondata",
    };
    const counts: Record<string, number> = {};
    vendors.forEach(v => {
      const role = v.gdpr_role || "unknown";
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([key, count]) => ({
      key,
      label: labels[key] || "Ikke satt",
      count,
      percent: vendors.length > 0 ? Math.round((count / vendors.length) * 100) : 0,
    }));
  }, [vendors]);

  // ── Country breakdown ──
  const countryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    vendors.forEach(v => {
      const c = v.country || "Ukjent";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [vendors]);

  // ── Top risk vendors (for action list) ──
  const topRiskVendors = useMemo(() => {
    return [...vendors]
      .sort((a, b) => (a.compliance_score || 0) - (b.compliance_score || 0))
      .slice(0, 5);
  }, [vendors]);

  // ── Attention items ──
  const attentionCounts = useMemo(() => {
    const now = new Date();
    const overdue = vendors.filter(v => v.next_review_date && new Date(v.next_review_date) < now).length;
    return { missingDPA: metrics.missingDPA, overdue, highRiskUnaudited: vendors.filter(v => v.risk_level === "high" && (v.compliance_score || 0) < 50).length };
  }, [vendors, metrics.missingDPA]);

  const totalAttention = attentionCounts.missingDPA + attentionCounts.overdue + attentionCounts.highRiskUnaudited + metrics.withExpiredDocs;

  if (vendors.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground motion-safe:animate-fade-in-up">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" aria-hidden="true" />
        <p className="text-lg mb-2 text-foreground">{t("vendorDashboard.noVendors", "Ingen leverandører ennå")}</p>
        <p className="text-sm">{t("vendorDashboard.noVendorsDesc", "Legg til din første leverandør for å komme i gang")}</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">

      {/* Aktiviteter + Leverandører per prioritet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 motion-safe:animate-fade-in-up motion-safe:animate-delay-250">
        <ComplianceActivityChart />
        <SystemsPriorityChart />
      </div>


      {/* Visuell oppsummering: Risikofordeling (donut) + Geografi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 motion-safe:animate-fade-in-up motion-safe:animate-delay-300">

        {/* Risk donut med stort sentertall */}
        <Card variant="flat" className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Risikofordeling</h2>
            <Badge variant="outline" className="text-[12px] font-normal">
              {vendors.length} leverandører
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
            <div className="relative h-[170px] w-[170px] sm:h-[180px] sm:w-[180px] shrink-0" role="img"
              aria-label={`Risikofordeling: ${riskDistribution
                .map(d => `${({ low: "Lav", medium: "Middels", high: "Høy", unknown: "Ukjent" } as Record<string, string>)[d.name]} ${d.value}`)
                .join(", ")}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={84}
                    dataKey="value" stroke="none" paddingAngle={2}
                  >
                    {riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-foreground tabular-nums">
                  {metrics.highRisk}
                </span>
                <span className="text-[12px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  høy risiko
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5 min-w-0">
              {riskDistribution.map(d => {
                const pct = vendors.length > 0 ? Math.round((d.value / vendors.length) * 100) : 0;
                const label = ({ low: "Lav", medium: "Middels", high: "Høy", unknown: "Ukjent" } as Record<string, string>)[d.name];
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                        {label}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {d.value} <span className="text-muted-foreground font-normal">· {pct}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: d.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Geografi — visuell liste med store land-koder */}
        <Card variant="flat" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              Geografi
            </h2>
            <Badge variant="outline" className="text-[12px] font-normal">
              {countryBreakdown.length} land
            </Badge>
          </div>
          <div className="space-y-2.5">
            {countryBreakdown.map(c => {
              const pct = vendors.length > 0 ? Math.round((c.count / vendors.length) * 100) : 0;
              return (
                <div key={c.country} className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary/5 border border-primary/10 text-[12px] font-mono font-semibold text-primary uppercase shrink-0">
                    {c.country.slice(0, 2)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium truncate">{c.country}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {c.count} <span className="opacity-60">· {pct}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <BulkSendConfirmDialog
        open={requestWizardOpen}
        onOpenChange={setRequestWizardOpen}
        vendorNames={vendors
          .filter((v) => preselectedVendorIds.includes(v.id))
          .map((v) => ({ id: v.id, name: v.name }))}
        requestType={preselectedRequestType}
        onConfirm={(dueDate) => {
          setSentCategories((prev) => [...prev, preselectedCategoryKey]);
          setRequestWizardOpen(false);
        }}
      />
    </div>
  );
}

/** Mini horizontal bar chart showing compliance score buckets */
function ComplianceDistribution({ vendors }: { vendors: Asset[] }) {
  const buckets = useMemo(() => {
    const b = [
      { label: "0–29%", min: 0, max: 29, count: 0, color: "hsl(var(--destructive))" },
      { label: "30–49%", min: 30, max: 49, count: 0, color: "hsl(var(--destructive) / 0.7)" },
      { label: "50–69%", min: 50, max: 69, count: 0, color: "hsl(var(--warning))" },
      { label: "70–89%", min: 70, max: 89, count: 0, color: "hsl(var(--warning) / 0.7)" },
      { label: "90–100%", min: 90, max: 100, count: 0, color: "hsl(var(--success))" },
    ];
    vendors.forEach(v => {
      const s = v.compliance_score || 0;
      const bucket = b.find(x => s >= x.min && s <= x.max);
      if (bucket) bucket.count++;
    });
    return b;
  }, [vendors]);

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="space-y-3">
      {buckets.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">{b.label}</span>
          <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md transition-all"
              style={{ width: `${(b.count / maxCount) * 100}%`, backgroundColor: b.color }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-6 text-right">{b.count}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Kritisk for vår virksomhet — viser leverandører med kritikalitet "critical"
 * eller "high". Følger samme pille-stil som tabellvisningen.
 */
function CriticalVendorsCard({
  vendors, onOpen,
}: { vendors: Asset[]; onOpen: (id: string) => void }) {
  const critical = useMemo(() => {
    const order: Record<string, number> = { critical: 0, high: 1 };
    return vendors
      .filter(v => v.criticality === "critical" || v.criticality === "high")
      .sort((a, b) => (order[a.criticality!] ?? 9) - (order[b.criticality!] ?? 9))
      .slice(0, 6);
  }, [vendors]);

  return (
    <Card variant="flat" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          Kritisk for vår virksomhet
        </h2>
        <Badge variant="outline" className="text-[13px]">{critical.length}</Badge>
      </div>

      {critical.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Ingen leverandører er markert som kritiske ennå.
        </p>
      ) : (
        <div className="space-y-1.5">
          {critical.map(v => {
            const isCritical = v.criticality === "critical";
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpen(v.id)}
                aria-label={`Åpne leverandør ${v.name}, kritikalitet ${v.criticality}`}
                className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                  {v.vendor_category && (
                    <p className="text-[12px] text-muted-foreground truncate">
                      {CATEGORY_LABELS[v.vendor_category] || v.vendor_category}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-[12px] h-5 font-normal ${
                    isCritical
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-warning/15 text-warning border-warning/30"
                  }`}
                >
                  {isCritical ? "Kritisk" : "Høy"}
                </Badge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
