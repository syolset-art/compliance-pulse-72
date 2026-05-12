import { Shield, Lock, Globe, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  governanceScore?: number;
  securityScore?: number;
  privacyScore?: number;
  thirdPartyScore?: number;
}

const AREAS = [
  { key: "governance", icon: Shield, label: "Styring og ansvar" },
  { key: "security", icon: Lock, label: "Sikkerhet" },
  { key: "privacy", icon: Globe, label: "Personvern og datahåndtering" },
  { key: "thirdParty", icon: Layers, label: "Tredjepart og verdikjede" },
] as const;

function colorFor(score: number) {
  if (score >= 75) return { text: "text-success", bar: "bg-success" };
  if (score >= 50) return { text: "text-warning", bar: "bg-warning" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

/**
 * MSP-variant av Modenhet per kontrollområde — bruker MSP-kundens
 * vurderingsscore framfor en konkret asset.
 */
export function MSPCustomerMaturityCard({
  governanceScore = 0,
  securityScore = 0,
  privacyScore = 0,
  thirdPartyScore = 0,
}: Props) {
  const scores: Record<string, number> = {
    governance: governanceScore,
    security: securityScore,
    privacy: privacyScore,
    thirdParty: thirdPartyScore,
  };

  const overall = Math.round(
    (governanceScore + securityScore + privacyScore + thirdPartyScore) / 4
  );
  const overallColor = colorFor(overall);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">
            Modenhet per kontrollområde
          </h3>
        </div>
        <p className="text-sm text-muted-foreground shrink-0">
          Trust Score{" "}
          <span className={cn("text-base font-bold tabular-nums", overallColor.text)}>
            {overall}
          </span>
          <span className="text-muted-foreground">/100</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AREAS.map((a) => {
          const Icon = a.icon;
          const score = scores[a.key] || 0;
          const c = colorFor(score);
          return (
            <div
              key={a.key}
              className="rounded-xl border border-border bg-card/60 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {a.label}
                  </span>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", c.text)}>
                  {score}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full transition-all", c.bar)}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
