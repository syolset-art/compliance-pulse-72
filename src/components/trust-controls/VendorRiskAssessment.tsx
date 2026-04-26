import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";

interface RiskArea {
  label: string;
  score: number;
  description: string;
}

interface VendorRiskAssessmentProps {
  vendorName?: string;
}

export function VendorRiskAssessment({ vendorName = "" }: VendorRiskAssessmentProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const riskAreas: RiskArea[] = [
    {
      label: isNb ? "Sikkerhet og databeskyttelse" : "Security & Data Protection",
      score: 25,
      description: isNb
        ? "Ingen offentlig tilgjengelig informasjon om sikkerhetskontroller (kryptering, tilgangsstyring, logging) eller uavhengige revisjoner/sertifiseringer. For en leverandør i helsetjenester (sensitive data) øker dette risikobildet betydelig."
        : "No publicly available information about security controls (encryption, access management, logging) or independent audits/certifications.",
    },
    {
      label: isNb ? "Hendelseshåndtering" : "Incident Management",
      score: 20,
      description: isNb
        ? "Ingen informasjon om hendelseshåndtering, varslingsfrister, beredskapsplaner eller status-/driftsside. Manglende åpenhet gir lav forutsigbarhet ved avvik."
        : "No information about incident management, notification deadlines, emergency plans or status pages.",
    },
    {
      label: isNb ? "Regulatorisk samsvar" : "Regulatory Compliance",
      score: 18,
      description: isNb
        ? "Ingen org.nr oppgitt for norsk leverandør, kan ikke verifiseres i Brønnøysundregistrene (negativt signal). Ingen dokumentasjon på etterlevelse (f.eks. GDPR-rammeverk, sektorpålagte krav) er tilgjengelig."
        : "No org. number provided, cannot be verified in business registers. No compliance documentation available.",
    },
    {
      label: isNb ? "Kontinuitet og drift" : "Continuity & Operations",
      score: 20,
      description: isNb
        ? "Ingen publisert informasjon om oppetid, backup/restore, disaster recovery, RPO/RTO eller SLA. Ukjent modenhet for drift og kontinuitet."
        : "No published information about uptime, backup/restore, disaster recovery, RPO/RTO or SLA.",
    },
  ];

  const getBarColor = (score: number) => {
    if (score >= 70) return "bg-status-closed";
    if (score >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-status-closed dark:text-status-closed";
    if (score >= 40) return "text-warning dark:text-warning";
    return "text-destructive";
  };

  const strengthsText = isNb
    ? `Det foreligger for lite offentlig informasjon til å identifisere dokumenterte styrker. Leverandørens bransjefokus antyder sensitiv databehandling, men uten støtte i konkret dokumentasjon kan dette ikke vektes positivt.`
    : `Too little public information available to identify documented strengths.`;

  const concernsText = isNb
    ? `Manglende org.nr for verifisering i Brreg og fravær av sentrale styringsdokumenter reduserer tilliten betydelig. Uklart lagringssted, dataflyt, sikkerhetstiltak og hendelseshåndtering er særlig bekymringsfullt gitt helsedata.`
    : `Missing org. number and absence of key governance documents significantly reduces trust.`;

  const recommendationText = isNb
    ? `Be om org.nr for Brreg-verifisering og full dokumentasjon: DPA, sikkerhetsoversikt (kryptering/tilgang), underleverandørliste med lokasjoner, dataflytdiagram og hendelseshåndteringsrutiner. Ikke del produksjonsdata før dette er mottatt og vurdert tilfredsstillende.`
    : `Request org. number for verification and full documentation: DPA, security overview, sub-processor list, data flow diagram and incident handling procedures.`;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {isNb ? "Risikovurdering" : "Risk Assessment"}
            </h3>
          </div>
          <Badge variant="outline" className="text-[13px] gap-1 border-primary/30 text-primary uppercase tracking-wider font-semibold">
            {isNb ? "KI-analyse" : "AI Analysis"}
          </Badge>
        </div>

        {/* Risk areas */}
        <div className="space-y-5">
          {riskAreas.map((area) => (
            <div key={area.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{area.label}</span>
                <span className={`text-sm font-bold tabular-nums ${getScoreColor(area.score)}`}>
                  {area.score}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(area.score)}`}
                  style={{ width: `${area.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {area.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom cards: Styrker, Bekymringer, Anbefaling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-status-closed dark:text-status-closed" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isNb ? "Styrker" : "Strengths"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {strengthsText}
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isNb ? "Bekymringer" : "Concerns"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {concernsText}
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isNb ? "Anbefaling" : "Recommendation"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommendationText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
