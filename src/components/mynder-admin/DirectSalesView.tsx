import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Building2, Coins, TrendingUp, Server, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CUSTOMERS, PLAN_META, countryFlag, BillingStatus, CUSTOMER_MCP, MCP_PRODUCTS } from "./adminDemoData";

const billingMeta: Record<BillingStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "OK", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  pending: { label: "Avventer", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  missing: { label: "Mangler", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

const INDUSTRY_COLORS = [
  "hsl(262 83% 62%)", "hsl(199 89% 60%)", "hsl(160 84% 45%)", "hsl(38 92% 55%)",
  "hsl(330 81% 62%)", "hsl(15 90% 60%)", "hsl(180 72% 48%)", "hsl(280 70% 55%)",
];

export function DirectSalesView() {
  const direct = CUSTOMERS.filter((c) => c.salesChannel === "direct");
  const totalMrr = direct.reduce((s, c) => s + c.mrrNok, 0);
  const avgMrr = direct.length > 0 ? Math.round(totalMrr / direct.length) : 0;

  const industryCounts = Object.entries(
    direct.reduce<Record<string, number>>((acc, c) => {
      acc[c.industry] = (acc[c.industry] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);

  const topIndustry = industryCounts[0]?.industry ?? "—";

  const planCounts = (["Starter", "Pro", "Business", "Enterprise"] as const).map((p) => ({
    plan: p,
    count: direct.filter((c) => c.plan === p).length,
  }));
  const maxPlan = Math.max(1, ...planCounts.map((p) => p.count));

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard title="Direktekunder" value={direct.length} icon={Building2} />
        <MetricCard title="MRR direkte" value={`${totalMrr.toLocaleString("nb-NO")} kr`} icon={Coins} />
        <MetricCard title="Snitt MRR" value={`${avgMrr.toLocaleString("nb-NO")} kr`} icon={TrendingUp} />
        <MetricCard title="Topp bransje" value={topIndustry} subtitle={`${industryCounts[0]?.count ?? 0} kunder`} icon={Building2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Bransjefordeling</h3>
          <p className="text-xs text-muted-foreground mb-2">Direktekunder</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, _n, p: any) => [`${v} kunder`, p?.payload?.industry]}
                />
                <Pie data={industryCounts} dataKey="count" nameKey="industry" innerRadius={32} outerRadius={64} stroke="hsl(var(--background))" strokeWidth={2}>
                  {industryCounts.map((_, i) => (
                    <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Planfordeling</h3>
          <p className="text-xs text-muted-foreground mb-3">Antall direktekunder per plan</p>
          <div className="space-y-2.5">
            {planCounts.map(({ plan, count }) => (
              <div key={plan} className="flex items-center gap-3">
                <Badge variant="outline" className={cn("text-[12px] w-24 justify-center", PLAN_META[plan].color)}>{plan}</Badge>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxPlan) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-semibold tabular-nums">{count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Customer table */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Direktekunder</h3>
          <span className="text-xs text-muted-foreground">{direct.length} totalt</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-center font-medium px-3 py-2.5 w-12">Land</th>
                <th className="text-left font-medium px-4 py-2.5">Kunde</th>
                <th className="text-left font-medium px-4 py-2.5">Bransje</th>
                <th className="text-left font-medium px-4 py-2.5">Plan</th>
                <th className="text-left font-medium px-4 py-2.5">Moduler</th>
                <th className="text-left font-medium px-4 py-2.5">Regelverk</th>
                <th className="text-left font-medium px-4 py-2.5">MCP-produkter</th>
                <th className="text-right font-medium px-3 py-2.5" title="Systemer"><Server className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right font-medium px-3 py-2.5" title="Leverandører"><Truck className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right font-medium px-3 py-2.5">Brukere</th>
                <th className="text-right font-medium px-4 py-2.5">MRR (kr)</th>
                <th className="text-left font-medium px-4 py-2.5">Faktura</th>
              </tr>
            </thead>
            <tbody>
              {direct.map((c) => {
                const BIcon = billingMeta[c.billing].icon;
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-base leading-none">{countryFlag(c.country)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">Siden {new Date(c.since).toLocaleDateString("nb-NO")}</div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.industry}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={cn("text-xs", PLAN_META[c.plan].color)}>{c.plan}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.modules.map((m) => (
                          <span key={m} className="text-[12px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.frameworks.map((f) => (
                          <span key={f} className="text-[12px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {(CUSTOMER_MCP[c.id] ?? []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(CUSTOMER_MCP[c.id] ?? []).map((m) => {
                            const meta = MCP_PRODUCTS[m.key];
                            return (
                              <span
                                key={m.key}
                                title={`${meta.description} · koblet ${new Date(m.since).toLocaleDateString("nb-NO")}`}
                                className={cn(
                                  "text-[12px] px-1.5 py-0.5 rounded border",
                                  meta.status === "live"
                                    ? "bg-success/10 text-success border-success/20"
                                    : "bg-muted text-muted-foreground border-border"
                                )}
                              >
                                {meta.label}
                                {meta.status === "coming" ? " · kommer" : ""}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.systems}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.vendors}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.users}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">{c.mrrNok.toLocaleString("nb-NO")}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={cn("gap-1 text-xs", billingMeta[c.billing].className)}>
                        <BIcon className="h-3 w-3" />
                        {billingMeta[c.billing].label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
