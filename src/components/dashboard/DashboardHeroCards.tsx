import { AlertTriangle, ShieldCheck, TrendingUp, Cpu, ListTodo, FileWarning, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_HERO_CTAS } from "@/lib/roleContentConfig";
import { ROLE_LABELS } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

/* ── tiny reusable donut ── */
function MiniDonut({ segments, size = 100, strokeWidth = 10 }: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted/30" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * C;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.6s ease" }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

/* ── small metric pill ── */
function MetricPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-lg font-bold text-foreground leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground truncate">{label}</span>
    </div>
  );
}

export function DashboardHeroCards() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { primaryRole } = useUserRole();
  const isNb = i18n.language === "nb";

  const riskScore = 68;
  const complianceScore = 74;
  const ctas = ROLE_HERO_CTAS[primaryRole] || ROLE_HERO_CTAS.compliance_ansvarlig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* ── Card 1: Risk overview ── */}
      <div className="rounded-xl border border-border bg-card p-5 flex gap-5 items-center">
        <MiniDonut
          size={110}
          strokeWidth={12}
          segments={[
            { value: 3, color: "hsl(var(--destructive))" },
            { value: 2, color: "hsl(var(--warning, 38 92% 50%))" },
            { value: 7, color: "hsl(var(--primary))" },
          ]}
        />
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isNb ? "Risikooversikt" : "Risk overview"}
            </p>
            <p className="text-2xl font-bold text-foreground">{riskScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricPill icon={AlertTriangle} label={isNb ? "Hendelser" : "Incidents"} value={3} color="text-destructive" />
            <MetricPill icon={Cpu} label={isNb ? "Høyrisiko AI" : "High-risk AI"} value={2} color="text-primary" />
            <MetricPill icon={FileWarning} label={isNb ? "Avvik" : "Deviations"} value={5} color="text-warning" />
            <MetricPill icon={ListTodo} label={isNb ? "Oppgaver" : "Tasks"} value={8} color="text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ── Card 2: Compliance status + Role CTAs ── */}
      <div className="rounded-xl border border-border bg-card p-5 flex gap-5 items-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/trust-center/regulations')}>
        <div className="relative shrink-0">
          <MiniDonut
            size={110}
            strokeWidth={12}
            segments={[
              { value: complianceScore, color: "hsl(var(--primary))" },
              { value: 100 - complianceScore, color: "hsl(var(--muted))" },
            ]}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">{complianceScore}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isNb ? "Samsvarsstatus" : "Compliance status"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm text-foreground font-medium">{isNb ? "God fremgang" : "Good progress"}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: isNb ? "Rammeverk aktive" : "Frameworks active", value: 3, max: 5 },
              { label: isNb ? "Kontroller oppfylt" : "Controls met", value: 42, max: 58 },
              { label: isNb ? "Dokumenter klare" : "Documents ready", value: 18, max: 24 },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                  <span>{bar.label}</span>
                  <span className="font-medium text-foreground">{bar.value}/{bar.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${(bar.value / bar.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Role-specific quick actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {ctas.map((cta) => (
              <Button
                key={cta.route + cta.labelNb}
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(cta.route);
                }}
              >
                {isNb ? cta.labelNb : cta.labelEn}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
