import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Building2, Users, CreditCard, CheckCircle2, AlertCircle, Download, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanTier = "Starter" | "Pro" | "Business" | "Enterprise";
type BillingStatus = "ok" | "missing" | "pending";

interface CustomerRow {
  id: string;
  name: string;
  industry: string;
  plan: PlanTier;
  modules: string[];
  users: number;
  mrrNok: number;
  billing: BillingStatus;
  since: string;
}

// Aggregated demo data — internal Mynder admin view of all tenants
const customers: CustomerRow[] = [
  { id: "1", name: "Nordic Energy AS", industry: "Energi", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], users: 42, mrrNok: 9800, billing: "ok", since: "2024-01-15" },
  { id: "2", name: "Fjord Helse", industry: "Helse", plan: "Business", modules: ["Vendors", "Systems"], users: 18, mrrNok: 4900, billing: "ok", since: "2024-03-02" },
  { id: "3", name: "Bergen Logistikk", industry: "Logistikk", plan: "Pro", modules: ["Vendors"], users: 9, mrrNok: 1990, billing: "pending", since: "2024-05-21" },
  { id: "4", name: "Oslo Advokatfirma", industry: "Juridisk", plan: "Business", modules: ["Vendors", "Assets"], users: 14, mrrNok: 4900, billing: "ok", since: "2024-02-11" },
  { id: "5", name: "Tromsø Tech", industry: "IT", plan: "Starter", modules: ["Vendors"], users: 4, mrrNok: 0, billing: "missing", since: "2024-09-08" },
  { id: "6", name: "Stavanger Industri", industry: "Industri", plan: "Pro", modules: ["Vendors", "Systems"], users: 11, mrrNok: 2490, billing: "ok", since: "2024-04-30" },
  { id: "7", name: "Kystverket Maritim", industry: "Offentlig", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], users: 67, mrrNok: 14800, billing: "ok", since: "2023-11-04" },
  { id: "8", name: "Nordfjord Bank", industry: "Finans", plan: "Business", modules: ["Vendors", "Systems"], users: 22, mrrNok: 4900, billing: "missing", since: "2024-08-19" },
];

const planMeta: Record<PlanTier, { color: string; price: number }> = {
  Starter: { color: "bg-muted text-foreground", price: 0 },
  Pro: { color: "bg-secondary text-secondary-foreground", price: 1990 },
  Business: { color: "bg-primary/10 text-primary", price: 4900 },
  Enterprise: { color: "bg-primary text-primary-foreground", price: 9800 },
};

const billingMeta: Record<BillingStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "Fakturagrunnlag OK", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  pending: { label: "Avventer", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  missing: { label: "Mangler", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

export default function MynderAdminDashboard() {
  const totalCustomers = customers.length;
  const totalUsers = customers.reduce((s, c) => s + c.users, 0);
  const totalMrr = customers.reduce((s, c) => s + c.mrrNok, 0);
  const billingOk = customers.filter((c) => c.billing === "ok").length;
  const billingMissing = customers.filter((c) => c.billing !== "ok").length;

  const planCounts = (Object.keys(planMeta) as PlanTier[]).map((p) => ({
    plan: p,
    count: customers.filter((c) => c.plan === p).length,
  }));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 px-6 pb-12">
        <div className="max-w-7xl mx-auto space-y-6">
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

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard title="Kunder totalt" value={totalCustomers} icon={Building2} />
            <MetricCard title="Brukere totalt" value={totalUsers} subtitle={`Snitt ${Math.round(totalUsers / totalCustomers)} per kunde`} icon={Users} />
            <MetricCard title="MRR (NOK)" value={totalMrr.toLocaleString("nb-NO")} subtitle="Månedlig fakturering" icon={CreditCard} />
            <MetricCard
              title="Fakturagrunnlag"
              value={`${billingOk}/${totalCustomers}`}
              subtitle={billingMissing > 0 ? `${billingMissing} mangler` : "Alle OK"}
              icon={billingMissing > 0 ? AlertCircle : CheckCircle2}
            />
          </div>

          {/* Plan distribution */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Fordeling av planer</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {planCounts.map(({ plan, count }) => (
                <div key={plan} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className={cn("text-xs", planMeta[plan].color)}>{plan}</Badge>
                    <span className="text-xs text-muted-foreground">{planMeta[plan].price.toLocaleString("nb-NO")} kr</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">kunder</div>
                </div>
              ))}
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
                    <th className="text-left font-medium px-4 py-2.5">Kunde</th>
                    <th className="text-left font-medium px-4 py-2.5">Bransje</th>
                    <th className="text-left font-medium px-4 py-2.5">Plan</th>
                    <th className="text-left font-medium px-4 py-2.5">Moduler</th>
                    <th className="text-right font-medium px-4 py-2.5">Brukere</th>
                    <th className="text-right font-medium px-4 py-2.5">MRR (kr)</th>
                    <th className="text-left font-medium px-4 py-2.5">Fakturagrunnlag</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const BillingIcon = billingMeta[c.billing].icon;
                    return (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">Siden {new Date(c.since).toLocaleDateString("nb-NO")}</div>
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
                        <td className="px-4 py-2.5 text-right font-medium text-foreground">{c.users}</td>
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
