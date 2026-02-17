import { MetricCard } from "@/components/widgets/MetricCard";
import { Users, TrendingUp, Loader2, AlertTriangle } from "lucide-react";

interface MSPMetricsRowProps {
  customers: {
    compliance_score: number;
    status: string;
  }[];
}

export function MSPMetricsRow({ customers }: MSPMetricsRowProps) {
  const total = customers.length;
  const avgScore = total > 0
    ? Math.round(customers.reduce((s, c) => s + (c.compliance_score || 0), 0) / total)
    : 0;
  const onboarding = customers.filter((c) => c.status === "onboarding").length;
  const lowScore = customers.filter((c) => (c.compliance_score || 0) < 50).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Totalt antall kunder" value={total} icon={Users} />
      <MetricCard title="Gj.snittlig samsvar" value={`${avgScore}%`} icon={TrendingUp} />
      <MetricCard title="Under onboarding" value={onboarding} icon={Loader2} />
      <MetricCard title="Lav score (<50%)" value={lowScore} icon={AlertTriangle} />
    </div>
  );
}
