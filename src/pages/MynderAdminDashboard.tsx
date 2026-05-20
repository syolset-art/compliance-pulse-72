import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Building2, Users, CreditCard, CheckCircle2, AlertCircle, Download, ShieldCheck, TrendingUp, Handshake, Server, Truck, BookCheck, Target, Sparkles, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PlanTier = "Starter" | "Pro" | "Business" | "Enterprise";
type BillingStatus = "ok" | "missing" | "pending";

interface CustomerRow {
  id: string;
  country: string; // ISO 3166-1 alpha-2
  name: string;
  industry: string;
  plan: PlanTier;
  modules: string[];
  users: number;
  systems: number;
  vendors: number;
  frameworks: number;
  isPartner: boolean;
  partnerType?: string;
  mrrNok: number;
  billing: BillingStatus;
  since: string;
}

const countryFlag = (cc: string) =>
  cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

// Aggregated demo data — internal Mynder admin view of all tenants
const customers: CustomerRow[] = [
  { id: "1", country: "NO", name: "Nordic Energy AS", industry: "Energi", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], users: 42, systems: 86, vendors: 142, frameworks: 6, isPartner: false, mrrNok: 9800, billing: "ok", since: "2024-01-15" },
  { id: "2", country: "NO", name: "Fjord Helse", industry: "Helse", plan: "Business", modules: ["Vendors", "Systems"], users: 18, systems: 34, vendors: 58, frameworks: 4, isPartner: false, mrrNok: 4900, billing: "ok", since: "2024-03-02" },
  { id: "3", country: "NO", name: "Bergen Logistikk", industry: "Logistikk", plan: "Pro", modules: ["Vendors"], users: 9, systems: 12, vendors: 27, frameworks: 2, isPartner: false, mrrNok: 1990, billing: "pending", since: "2024-05-21" },
  { id: "4", country: "NO", name: "Oslo Advokatfirma", industry: "Juridisk", plan: "Business", modules: ["Vendors", "Assets"], users: 14, systems: 22, vendors: 41, frameworks: 3, isPartner: true, partnerType: "Konsulent", mrrNok: 4900, billing: "ok", since: "2024-02-11" },
  { id: "5", country: "NO", name: "Tromsø Tech", industry: "IT", plan: "Starter", modules: ["Vendors"], users: 4, systems: 6, vendors: 11, frameworks: 1, isPartner: true, partnerType: "MSP", mrrNok: 0, billing: "missing", since: "2024-09-08" },
  { id: "6", country: "SE", name: "Stavanger Industri", industry: "Industri", plan: "Pro", modules: ["Vendors", "Systems"], users: 11, systems: 18, vendors: 33, frameworks: 2, isPartner: false, mrrNok: 2490, billing: "ok", since: "2024-04-30" },
  { id: "7", country: "NO", name: "Kystverket Maritim", industry: "Offentlig", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], users: 67, systems: 124, vendors: 198, frameworks: 7, isPartner: false, mrrNok: 14800, billing: "ok", since: "2023-11-04" },
  { id: "8", country: "DK", name: "Nordfjord Bank", industry: "Finans", plan: "Business", modules: ["Vendors", "Systems"], users: 22, systems: 41, vendors: 67, frameworks: 5, isPartner: true, partnerType: "MSSP", mrrNok: 4900, billing: "missing", since: "2024-08-19" },
];

const planMeta: Record<PlanTier, { color: string; price: number }> = {
  Starter: { color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30", price: 0 },
  Pro: { color: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30", price: 1990 },
  Business: { color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30", price: 4900 },
  Enterprise: { color: "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent", price: 9800 },
};

const billingMeta: Record<BillingStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "Fakturagrunnlag OK", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  pending: { label: "Avventer", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  missing: { label: "Mangler", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

const BUDGET_STORAGE_KEY = "mynder.mrr.budget.v1";
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Okt", "Nov"] as const;
const DEFAULT_BUDGETS: Record<string, number> = {
  Jun: 30000, Jul: 33000, Aug: 36000, Sep: 39000, Okt: 42000, Nov: 45000,
};

export default function MynderAdminDashboard() {
  const totalCustomers = customers.length;
  const totalUsers = customers.reduce((s, c) => s + c.users, 0);
  const totalMrr = customers.reduce((s, c) => s + c.mrrNok, 0);
  const billingOk = customers.filter((c) => c.billing === "ok").length;
  const billingMissing = customers.filter((c) => c.billing !== "ok").length;

  const [budgets, setBudgets] = useState<Record<string, number>>(DEFAULT_BUDGETS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (raw) setBudgets({ ...DEFAULT_BUDGETS, ...JSON.parse(raw) });
    } catch {}
  }, []);
  const saveBudgets = (next: Record<string, number>) => {
    setBudgets(next);
    try { localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const planCounts = (Object.keys(planMeta) as PlanTier[]).map((p) => ({
    plan: p,
    count: customers.filter((c) => c.plan === p).length,
    mrr: customers.filter((c) => c.plan === p).reduce((s, c) => s + c.mrrNok, 0),
  }));

  // Aggregated demo trends for graphical context
  const actuals: Record<string, number> = {
    Jun: 28200, Jul: 31100, Aug: 34900, Sep: 38400, Okt: 41200, Nov: totalMrr,
  };
  const mrrTrend = MONTHS.map((m) => ({
    month: m,
    mrr: actuals[m],
    budget: budgets[m] ?? 0,
  }));
  const currentBudget = budgets["Nov"] ?? 0;
  const budgetDelta = totalMrr - currentBudget;
  const budgetPct = currentBudget > 0 ? Math.round((totalMrr / currentBudget) * 100) : 0;
  const aboveBudget = budgetDelta >= 0;

  const industryCounts = Object.entries(
    customers.reduce<Record<string, number>>((acc, c) => {
      acc[c.industry] = (acc[c.industry] || 0) + 1;
      return acc;
    }, {})
  ).map(([industry, count]) => ({ industry, count }));

  // Vibrant chart palette — distinct hues for visual clarity
  const planColorVar: Record<PlanTier, string> = {
    Starter: "hsl(199 89% 60%)",      // sky
    Pro: "hsl(262 83% 62%)",          // violet
    Business: "hsl(292 84% 60%)",     // fuchsia
    Enterprise: "hsl(330 81% 60%)",   // pink/magenta
  };
  const industryColors = [
    "hsl(262 83% 62%)",   // violet
    "hsl(199 89% 60%)",   // sky
    "hsl(160 84% 45%)",   // emerald
    "hsl(38 92% 55%)",    // amber
    "hsl(330 81% 62%)",   // pink
    "hsl(15 90% 60%)",    // orange-red
    "hsl(180 72% 48%)",   // teal
    "hsl(280 70% 55%)",   // purple
  ];
  const maxPlanCount = Math.max(1, ...planCounts.map((p) => p.count));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 px-6 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Mynder innstillinger</span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Dashbord</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Aggregert oversikt over alle kunder, valgte planer, brukere og fakturagrunnlag.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Eksporter
            </Button>
          </div>

          {/* HERO: MRR (NOK) — flagship metric */}
          <Card className="relative overflow-hidden border-0 p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 p-6 text-white">
              <div className="md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-white/85">MRR · November</span>
                  </div>
                  <div className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums leading-none">
                    {totalMrr.toLocaleString("nb-NO")}
                    <span className="text-2xl font-medium text-white/75 ml-2">kr</span>
                  </div>
                  <p className="text-sm text-white/80 mt-2">Månedlig fakturering · alle kunder</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge className="gap-1 bg-white/15 hover:bg-white/20 text-white border-white/20 backdrop-blur">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.round(((mrrTrend[5].mrr - mrrTrend[0].mrr) / mrrTrend[0].mrr) * 100)}% siste 6 mnd
                  </Badge>
                  {currentBudget > 0 && (
                    <Badge className={cn(
                      "gap-1 border backdrop-blur",
                      aboveBudget
                        ? "bg-emerald-400/20 text-emerald-50 border-emerald-200/40"
                        : "bg-amber-400/20 text-amber-50 border-amber-200/40"
                    )}>
                      <Target className="h-3 w-3" />
                      {budgetPct}% av budsjett ({aboveBudget ? "+" : ""}{budgetDelta.toLocaleString("nb-NO")} kr)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-sm font-semibold">MRR vs. budsjett</h2>
                    <p className="text-xs text-white/70">Siste 6 måneder</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1.5 h-7 px-2 text-white hover:bg-white/15 hover:text-white">
                        <Pencil className="h-3 w-3" />
                        <span className="text-xs">Rediger budsjett</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold">Planlagt budsjett (NOK)</h3>
                          <p className="text-xs text-muted-foreground">Sett mål-MRR per måned.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {MONTHS.map((m) => (
                            <div key={m} className="space-y-1">
                              <Label htmlFor={`b-${m}`} className="text-xs text-muted-foreground">{m}</Label>
                              <Input
                                id={`b-${m}`}
                                type="number"
                                inputMode="numeric"
                                value={budgets[m] ?? 0}
                                onChange={(e) => saveBudgets({ ...budgets, [m]: Number(e.target.value) || 0 })}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => saveBudgets(DEFAULT_BUDGETS)}>
                          Tilbakestill
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mrrTrend} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="mrrFillHero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.85)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number, n) => [`${v.toLocaleString("nb-NO")} kr`, n === "mrr" ? "Faktisk MRR" : "Budsjett"]}
                      />
                      <Area type="monotone" dataKey="mrr" stroke="#ffffff" strokeWidth={2.5} fill="url(#mrrFillHero)" />
                      <Line type="monotone" dataKey="budget" stroke="hsl(38 100% 70%)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "hsl(38 100% 70%)" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-white/85">
                  <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-white" /> Faktisk</div>
                  <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "hsl(38 100% 70%)", borderTop: "2px dashed hsl(38 100% 70%)" }} /> Budsjett</div>
                </div>
              </div>
            </div>
          </Card>

          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard title="Kunder totalt" value={totalCustomers} icon={Building2} />
            <MetricCard title="Brukere totalt" value={totalUsers} subtitle={`Snitt ${Math.round(totalUsers / totalCustomers)} per kunde`} icon={Users} />
            <MetricCard
              title="Fakturagrunnlag"
              value={`${billingOk}/${totalCustomers}`}
              subtitle={billingMissing > 0 ? `${billingMissing} mangler` : "Alle OK"}
              icon={billingMissing > 0 ? AlertCircle : CheckCircle2}
            />
          </div>

          {/* Chart row: industry mix */}
          <div className="grid grid-cols-1 gap-3">


            <Card className="p-4">
              <h2 className="text-sm font-semibold text-foreground">Bransjefordeling</h2>
              <p className="text-xs text-muted-foreground mb-2">Andel kunder per bransje</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, _n, p: any) => [`${v} kunder`, p?.payload?.industry]}
                    />
                    <Pie data={industryCounts} dataKey="count" nameKey="industry" innerRadius={36} outerRadius={68} stroke="hsl(var(--background))" strokeWidth={2}>
                      {industryCounts.map((_, i) => (
                        <Cell key={i} fill={industryColors[i % industryColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Plan distribution */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Fordeling av planer</h2>
              <span className="text-xs text-muted-foreground">MRR per plan</span>
            </div>
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planCounts} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="plan" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v.toLocaleString("nb-NO")} kr`, "MRR"]}
                  />
                  <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                    {planCounts.map((p) => (
                      <Cell key={p.plan} fill={planColorVar[p.plan]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {planCounts.map(({ plan, count }) => {
                const share = (count / totalCustomers) * 100;
                return (
                  <div key={plan} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className={cn("text-xs", planMeta[plan].color)}>{plan}</Badge>
                      <span className="text-xs text-muted-foreground">{planMeta[plan].price.toLocaleString("nb-NO")} kr</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{count}</div>
                    <div className="text-xs text-muted-foreground mb-2">kunder · {Math.round(share)}%</div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / maxPlanCount) * 100}%`, background: planColorVar[plan] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Customer table */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Kunder</h2>
              <span className="text-xs text-muted-foreground">{totalCustomers} totalt</span>
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
                    <th className="text-right font-medium px-3 py-2.5" title="Systemer"><Server className="h-3.5 w-3.5 inline" /></th>
                    <th className="text-right font-medium px-3 py-2.5" title="Leverandører"><Truck className="h-3.5 w-3.5 inline" /></th>
                    <th className="text-right font-medium px-3 py-2.5" title="Aktive regelverk"><BookCheck className="h-3.5 w-3.5 inline" /></th>
                    <th className="text-right font-medium px-3 py-2.5">Brukere</th>
                    <th className="text-right font-medium px-4 py-2.5">MRR (kr)</th>
                    <th className="text-left font-medium px-4 py-2.5">Fakturagrunnlag</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const BillingIcon = billingMeta[c.billing].icon;
                    return (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-lg leading-none" title={c.country}>{countryFlag(c.country)}</span>
                          <div className="text-[10px] text-muted-foreground tracking-wider">{c.country}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-foreground">{c.name}</div>
                              <div className="text-xs text-muted-foreground">Siden {new Date(c.since).toLocaleDateString("nb-NO")}</div>
                            </div>
                            {c.isPartner && (
                              <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 bg-primary/5 text-primary" title={c.partnerType ? `Partner · ${c.partnerType}` : "Partner"}>
                                <Handshake className="h-3 w-3" />
                                {c.partnerType || "Partner"}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{c.industry}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn("text-xs", planMeta[c.plan].color)}>{c.plan}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {c.modules.map((m) => (
                              <span key={m} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.systems}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.vendors}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{c.frameworks}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-foreground">{c.users}</td>
                        <td className="px-4 py-2.5 text-right text-foreground">{c.mrrNok.toLocaleString("nb-NO")}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn("gap-1 text-xs", billingMeta[c.billing].className)}>
                            <BillingIcon className="h-3 w-3" />
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
      </main>
    </div>
  );
}
