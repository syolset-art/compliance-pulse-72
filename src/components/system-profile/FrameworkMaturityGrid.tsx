import { useTranslation } from "react-i18next";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Brain, FileCheck, Server, Scale } from "lucide-react";

const FRAMEWORK_ICONS: Record<string, React.ReactNode> = {
  iso27001: <Shield className="h-4 w-4 text-muted-foreground" />,
  gdpr: <Lock className="h-4 w-4 text-muted-foreground" />,
  aiact: <Brain className="h-4 w-4 text-muted-foreground" />,
  nis2: <Server className="h-4 w-4 text-muted-foreground" />,
  cra: <Shield className="h-4 w-4 text-warning" />,
  nsm: <FileCheck className="h-4 w-4 text-muted-foreground" />,
  popplyl: <Scale className="h-4 w-4 text-muted-foreground" />,
};

const FRAMEWORK_DISPLAY: Record<string, { name: string; desc_nb: string; desc_en: string }> = {
  iso27001: { name: "ISO27001", desc_nb: "Standard for styringssystem for informasjonssikkerhet (ISMS).", desc_en: "Standard for information security management systems (ISMS)." },
  gdpr: { name: "GDPR", desc_nb: "EU-forordning for personvern og behandling av personopplysninger.", desc_en: "EU regulation for privacy and personal data protection." },
  aiact: { name: "AI Act", desc_nb: "EU-regulering for kunstig intelligens.", desc_en: "EU regulation for artificial intelligence." },
  nis2: { name: "NIS2", desc_nb: "EU-direktiv med krav til cybersikkerhet og hendelseshåndtering for utvalgte virksomheter.", desc_en: "EU directive on cybersecurity for critical entities." },
  cra: { name: "CRA", desc_nb: "EU-regelverk om cybersikkerhetskrav for produkter med digitale elementer.", desc_en: "EU regulation on cybersecurity requirements for digital products." },
  nsm: { name: "NSMs grunnprinsipper", desc_nb: "Nasjonal sikkerhetsmyndighets anbefalinger for IKT-sikkerhet.", desc_en: "NSM's basic principles for ICT security." },
  popplyl: { name: "Personopplysningsloven", desc_nb: "Norsk lov som utfyller GDPR.", desc_en: "Norwegian law supplementing GDPR." },
};

interface FrameworkMaturityGridProps {
  frameworks: { framework_id: string; framework_name: string }[];
}

export const FrameworkMaturityGrid = ({ frameworks }: FrameworkMaturityGridProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { stats } = useComplianceRequirements();

  if (!frameworks.length) return null;

  const frameworkScores = stats.byFramework || {};

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        {isNb ? "Modenhet per regelverk" : "Maturity per regulation"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {frameworks.map((fw) => {
          const score = frameworkScores[fw.framework_id];
          const pct = score?.score ?? 0;
          const assessed = score?.assessed ?? 0;
          const total = score?.total ?? 0;
          const display = FRAMEWORK_DISPLAY[fw.framework_id];
          const name = display?.name || fw.framework_name;
          const desc = display ? (isNb ? display.desc_nb : display.desc_en) : "";
          const icon = FRAMEWORK_ICONS[fw.framework_id] || <Shield className="h-4 w-4 text-muted-foreground" />;

          const maturityLabel = pct >= 75 ? (isNb ? "HØY" : "HIGH") : pct >= 50 ? (isNb ? "MIDDELS" : "MEDIUM") : (isNb ? "LAV" : "LOW");
          const maturityColor = pct >= 75 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : pct >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200";
          const strokeColor = pct >= 75 ? "stroke-emerald-500" : pct >= 50 ? "stroke-amber-500" : "stroke-destructive";

          return (
            <div key={fw.framework_id} className="rounded-xl border bg-card p-4 flex gap-3">
              {/* Circular gauge */}
              <div className="shrink-0">
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-muted"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={strokeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${pct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-foreground">{pct}%</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {icon}
                  <span className="font-semibold text-sm text-foreground truncate">{name}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 border font-semibold ${maturityColor}`}>
                    {maturityLabel}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    ✓ {assessed}/{total}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                  {isNb ? `${assessed} av ${total} vurderinger oppfylt` : `${assessed} of ${total} assessments fulfilled`}
                </p>
                {desc && (
                  <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5 line-clamp-2">{desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
