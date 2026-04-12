import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, ChevronDown, ChevronUp, Shield, Server, Users, Link2, Fingerprint } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface VendorTrustScoreCardProps {
  trustScore: number;
  confidenceScore: number;
  lastUpdated: string;
  assetId?: string;
}

const AREA_CARDS = [
  { area: "governance", icon: Shield, labelNb: "Styring", labelEn: "Governance", color: "text-blue-600" },
  { area: "risk_compliance", icon: Server, labelNb: "Drift og sikkerhet", labelEn: "Operations & Security", color: "text-emerald-600" },
  { area: "security_posture", icon: Fingerprint, labelNb: "Identitet og tilgang", labelEn: "Identity & Access", color: "text-violet-600" },
  { area: "supplier_governance", icon: Link2, labelNb: "Tredjepartstyring og verdikjede", labelEn: "Third-Party & Value Chain", color: "text-amber-600" },
];

const PRIVACY_AREA = { area: "privacy_data", icon: Users, labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling", color: "text-rose-600" };

export function VendorTrustScoreCard({ trustScore, confidenceScore, lastUpdated, assetId }: VendorTrustScoreCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [expanded, setExpanded] = useState(false);
  const evaluation = useTrustControlEvaluation(assetId ?? "");

  const score = trustScore;
  const conf = confidenceScore;
  const isHigh = score >= 75;
  const isMid = score >= 50;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const bgRingColor = "hsl(var(--muted))";
  const confLabel = conf >= 80
    ? (isNb ? "Høy tillit" : "High confidence")
    : conf >= 50
      ? (isNb ? "Middels tillit" : "Medium confidence")
      : (isNb ? "Lav tillit" : "Low confidence");

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative flex items-center justify-center">
              <svg width="88" height="88" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r={radius} fill="none" stroke={bgRingColor} strokeWidth="5" />
                <circle
                  cx="48" cy="48" r={radius} fill="none"
                  stroke={strokeColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold tabular-nums leading-none ${isHigh ? "text-success" : isMid ? "text-warning" : "text-destructive"}`}>
                  {score}
                </span>
                <span className="text-[8px] font-semibold text-muted-foreground uppercase">/100</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Leverandørens Trust Score" : "Vendor Trust Score"}
              </h3>
              <Badge variant="outline" className="text-[9px] text-muted-foreground gap-1 px-2 py-0.5 h-5">
                <ShieldCheck className="h-2.5 w-2.5" />
                {isNb ? "Egenerklæring" : "Self-declared"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNb
                ? "Denne scoren reflekterer leverandørens baseline basert på tilgjengelig dokumentasjon og kontroller. Den oppdateres automatisk når ny evidens registreres."
                : "This score reflects the vendor's baseline based on available documentation and controls. It updates automatically as new evidence is registered."}
            </p>

            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1">
                {conf >= 80 && <CheckCircle2 className="h-3 w-3 text-success" />}
                {conf >= 50 && conf < 80 && <AlertTriangle className="h-3 w-3 text-warning" />}
                {conf < 50 && <XCircle className="h-3 w-3 text-muted-foreground" />}
                <span className={`font-medium ${conf >= 80 ? "text-success" : conf >= 50 ? "text-warning" : "text-muted-foreground"}`}>
                  {confLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span className="text-[10px]">
                  {isNb ? "Sist oppdatert:" : "Last updated:"} {lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (isNb ? "Skjul detaljer" : "Hide details") : (isNb ? "Se kontrollområder" : "View control areas")}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Expanded: control area mini cards */}
        {expanded && (
          <div className="mt-3 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {AREA_CARDS.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn, color }) => {
                const areaScore = evaluation?.areaScore(area as any) ?? 0;
                const scoreClr = areaScore >= 70 ? "text-success" : areaScore >= 40 ? "text-warning" : "text-destructive";
                const barClr = areaScore >= 70 ? "bg-success" : areaScore >= 40 ? "bg-warning" : "bg-destructive";
                return (
                  <div key={area} className="rounded-lg border border-border bg-background p-3 flex flex-col items-center text-center gap-1.5">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <span className="text-[11px] font-medium text-foreground leading-tight">{isNb ? lNb : lEn}</span>
                    <span className={`text-lg font-bold tabular-nums ${scoreClr}`}>{areaScore}%</span>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barClr}`} style={{ width: `${areaScore}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 5th area — Privacy — compact horizontal */}
            {(() => {
              const { area, icon: Icon, labelNb: lNb, labelEn: lEn, color } = PRIVACY_AREA;
              const ps = evaluation?.areaScore(area as any) ?? 0;
              const sc = ps >= 70 ? "text-success" : ps >= 40 ? "text-warning" : "text-destructive";
              const bc = ps >= 70 ? "bg-success" : ps >= 40 ? "bg-warning" : "bg-destructive";
              return (
                <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-4">
                  <Icon className={`h-5 w-5 ${color} shrink-0`} />
                  <span className="text-[11px] font-medium text-foreground whitespace-nowrap">{isNb ? lNb : lEn}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${bc}`} style={{ width: `${ps}%` }} />
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${sc}`}>{ps}%</span>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
