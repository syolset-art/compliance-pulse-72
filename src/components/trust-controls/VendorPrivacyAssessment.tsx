import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface VendorPrivacyAssessmentProps {
  vendorName?: string;
  complianceScore?: number;
  coverageAssessed?: number;
  coverageTotal?: number;
  strengths?: string;
  concerns?: string;
}

const PRIVACY_DIMENSIONS = [
  { key: "security", label: "Security" },
  { key: "data_rights", label: "Data Rights" },
  { key: "purpose_limitation", label: "Purpose limitation" },
  { key: "lawfulness", label: "Lawfulness" },
  { key: "transparency", label: "Transparency" },
  { key: "lia", label: "LIA" },
  { key: "processors", label: "Processors" },
  { key: "cookies_tracking", label: "Cookies & Tracking" },
  { key: "childrens_data", label: "Children's Data" },
  { key: "special_data", label: "Special Data" },
  { key: "governance", label: "Governance" },
  { key: "transfers", label: "Transfers" },
];

export function VendorPrivacyAssessment({
  vendorName = "",
  complianceScore = 0,
  coverageAssessed = 0,
  coverageTotal = 12,
  strengths,
  concerns,
}: VendorPrivacyAssessmentProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const statusLabel = complianceScore >= 80
    ? (isNb ? "Godt samsvar" : "Good compliance")
    : complianceScore >= 40
    ? (isNb ? "Delvis samsvar" : "Partial compliance")
    : (isNb ? "Trenger tiltak" : "Needs action");

  const statusColor = complianceScore >= 80
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : complianceScore >= 40
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200";

  // Generate radar data (placeholder scores for now)
  const radarData = PRIVACY_DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    score: Math.floor(Math.random() * 30), // Will be replaced with real data
  }));

  const defaultStrengths = isNb
    ? "Ingen dokumentasjon tilgjengelig."
    : "No documentation available.";
  const defaultConcerns = isNb
    ? "Ingen dokumentasjon tilgjengelig til å vurdere personvern og datasikkerhet."
    : "No documentation available to assess privacy and data security.";

  return (
    <Card className="border-red-200/50 bg-red-50/30">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              {isNb
                ? "Hvordan står det til med personvern og datasikkerhet?"
                : "How is privacy and data security?"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
              {isNb
                ? "Analysen bygger på offentlig tilgjengelig informasjon om systemet (personvernerklæring, databehandleravtale o.l.) innhentet av Lara. Den forklarer bruk av personopplysninger, hvilke sikkerhetstiltak som beskrives, og i hvilken grad systemet møter 12 sentrale krav innen personvern og datasikkerhet. Organisasjonens egne opplastede dokumenter påvirker ikke denne scoren."
                : "The analysis is based on publicly available information about the system (privacy policy, DPA, etc.) collected by Lara. It explains the use of personal data, the security measures described, and to what extent the system meets 12 key requirements in privacy and data security."}
            </p>
          </div>
          <Badge className={`shrink-0 text-[10px] border ${statusColor}`}>
            {complianceScore}% - {statusLabel}
          </Badge>
        </div>

        {/* Lara recommendation */}
        <div className="bg-card border rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {isNb ? "Lara Soft anbefaler" : "Lara Soft recommends"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isNb
              ? "Last opp eller legg inn lenker til relevant dokumentasjon (personvernerklæring og/eller databehandleravtale) for å få en faktisk vurdering."
              : "Upload or add links to relevant documentation (privacy policy and/or DPA) to get an actual assessment."}
          </p>
          <div className="flex items-start gap-2 mt-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {isNb
                ? "Innholdet er generert av kunstig intelligens og kan inneholde feil eller unøyaktigheter. Vi anbefaler at det gjennomgås og verifiseres av mennesker før bruk. Analysen bygger på offentlig tilgjengelig informasjon (personvernerklæringer, databehandleravtaler o.l.) og påvirkes ikke av dokumenter din organisasjon har lastet opp."
                : "The content is AI-generated and may contain errors or inaccuracies. We recommend that it is reviewed and verified by humans before use."}
            </p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Radar chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics + insights */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Samsvar */}
              <div className="border rounded-lg p-3 bg-card text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {isNb ? "Samsvar" : "Compliance"}
                  </span>
                  <Info className="h-3 w-3 text-muted-foreground/50" />
                </div>
                <p className="text-2xl font-bold text-foreground">{complianceScore}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {complianceScore >= 80
                    ? (isNb ? "God" : "Good")
                    : complianceScore >= 40
                    ? (isNb ? "Middels" : "Medium")
                    : (isNb ? "Kritisk" : "Critical")}
                </p>
              </div>

              {/* Dekningsgrad */}
              <div className="border rounded-lg p-3 bg-card text-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {isNb ? "Dekningsgrad" : "Coverage"}
                </span>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {coverageAssessed} / {coverageTotal}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isNb
                    ? `kategorier med høyt samsvar (≥80%)`
                    : `categories with high compliance (≥80%)`}
                </p>
              </div>
            </div>

            {/* Styrker */}
            <div className="border rounded-lg p-3 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-foreground">
                  {isNb ? "Styrker" : "Strengths"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {strengths || defaultStrengths}
              </p>
            </div>

            {/* Hovedbekymring */}
            <div className="border rounded-lg p-3 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-semibold text-foreground">
                  {isNb ? "Hovedbekymring" : "Main concern"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {concerns || defaultConcerns}
              </p>
            </div>
          </div>
        </div>

        {/* Sources link */}
        <button className="text-xs text-primary hover:underline font-medium">
          {isNb ? "Kilder" : "Sources"}
        </button>
      </CardContent>
    </Card>
  );
}
