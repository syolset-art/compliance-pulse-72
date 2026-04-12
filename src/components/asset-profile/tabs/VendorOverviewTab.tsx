import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, ShieldAlert, TrendingUp, TrendingDown,
  Send, CheckCircle2, AlertTriangle, XCircle,
  Shield, Users, Server, Link2,
} from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { useState } from "react";
import { RequestUpdateDialog } from "../RequestUpdateDialog";

interface VendorOverviewTabProps {
  assetId: string;
  assetName?: string;
  vendorName?: string;
  updatedAt?: string | null;
  onNavigateToTab?: (tab: string) => void;
}

const DOMAIN_CARDS = [
  { area: "governance", icon: Shield, labelNb: "Styring", labelEn: "Governance", color: "text-blue-600" },
  { area: "risk_compliance", icon: Server, labelNb: "Drift og sikkerhet", labelEn: "Operations & Security", color: "text-emerald-600" },
  { area: "security_posture", icon: Users, labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling", color: "text-violet-600" },
  { area: "supplier_governance", icon: Link2, labelNb: "Tredjepartstyring og verdikjede", labelEn: "Third-Party & Value Chain", color: "text-amber-600" },
];

export const VendorOverviewTab = ({ assetId, assetName, vendorName, updatedAt, onNavigateToTab }: VendorOverviewTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);
  const [requestOpen, setRequestOpen] = useState(false);

  const trustScore = evaluation?.trustScore ?? 0;
  const confidenceScore = evaluation?.confidenceScore ?? 0;
  const risks = evaluation?.risks ?? [];

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (evaluation) {
    const { allControls } = evaluation;
    const implemented = allControls.filter(c => c.status === "implemented");
    const missing = allControls.filter(c => c.status === "missing");

    // Top 3 strengths
    implemented.slice(0, 3).forEach(c => strengths.push(isNb ? c.labelNb : c.labelEn));
    // Top 3 concerns
    missing.slice(0, 3).forEach(c => concerns.push(isNb ? c.labelNb : c.labelEn));
  }

  const scoreColor = trustScore >= 70 ? "text-success" : trustScore >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Trust Score summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col items-center">
                <span className={`text-4xl font-bold ${scoreColor}`}>{trustScore}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Trust Score</span>
              </div>
              <div className="flex-1 space-y-2">
                <Progress value={trustScore} className="h-2" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{isNb ? "Konfidens" : "Confidence"}: {confidenceScore}%</span>
                  {updatedAt && (
                    <span>
                      {isNb ? "Sist oppdatert" : "Last updated"}: {new Date(updatedAt).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => setRequestOpen(true)} className="gap-2 shrink-0">
              <Send className="h-4 w-4" />
              {isNb ? "Be om dokumentasjon" : "Request documentation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strengths / Concerns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <TrendingUp className="h-4 w-4" />
              {isNb ? "Styrker" : "Strengths"}
            </div>
            {strengths.length > 0 ? strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span>{s}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen data ennå" : "No data yet"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <TrendingDown className="h-4 w-4" />
              {isNb ? "Bekymringer" : "Concerns"}
            </div>
            {concerns.length > 0 ? concerns.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span>{c}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen bekymringer" : "No concerns"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Domain cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {DOMAIN_CARDS.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn, color }) => {
          const score = evaluation?.areaScore(area as any) ?? 0;
          const scoreClr = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
          return (
            <Card
              key={area}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onNavigateToTab?.("controls")}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium">{isNb ? lNb : lEn}</span>
                <span className={`text-xl font-bold ${scoreClr}`}>{score}%</span>
                <Progress value={score} className="h-1.5 w-full" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {requestOpen && (
        <RequestUpdateDialog
          assetId={assetId}
          assetName={assetName || ""}
          vendorName={vendorName}
          open={requestOpen}
          onOpenChange={setRequestOpen}
        />
      )}
    </div>
  );
};
