import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Zap, Flame, TrendingUp, Shield, SlidersHorizontal, FileCheck, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { ScoreResult } from "@/lib/scoringEngine";

interface ComplianceShieldProps {
  score: number;
  xp: number;
  streak: number;
  level: string;
  levelLabel_no: string;
  levelLabel_en: string;
  regulationDomains: { label_no: string; label_en: string; percent: number }[];
  focusAreas: { label_no: string; label_en: string; percent: number }[];
  assessed: number;
  total: number;
  avgMaturity: number;
}

function getShieldColor(score: number) {
  if (score >= 80) return { ring: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)", text: "text-green-600 dark:text-green-400" };
  if (score >= 60) return { ring: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", text: "text-primary" };
  if (score >= 40) return { ring: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.1)", text: "text-yellow-600 dark:text-yellow-400" };
  return { ring: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", text: "text-destructive" };
}

function getMessage(score: number, isNorwegian: boolean) {
  if (score >= 80) return isNorwegian ? "Du har kontroll" : "You're in control";
  if (score >= 60) return isNorwegian ? "På god vei" : "On track";
  if (score >= 40) return isNorwegian ? "Trenger oppfølging" : "Needs attention";
  return isNorwegian ? "Viktige mangler" : "Critical gaps";
}

export function ComplianceShield({ 
  score, xp, streak, level, levelLabel_no, levelLabel_en, 
  regulationDomains, focusAreas, assessed, total, avgMaturity 
}: ComplianceShieldProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const colors = getShieldColor(score);
  const message = getMessage(score, isNorwegian);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-6">
        {/* Shield circle */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", colors.text)}>{score}</span>
            <span className="text-[10px] text-muted-foreground font-medium">/100</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <h2 className={cn("text-xl font-bold", colors.text)}>{message}</h2>
          <p className="text-xs text-muted-foreground">
            {isNorwegian 
              ? `${assessed}/${total} krav vurdert · Snitt modenhet ${avgMaturity}/4`
              : `${assessed}/${total} assessed · Avg maturity ${avgMaturity}/4`
            }
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
              <TrendingUp className="h-3 w-3" />
              {isNorwegian ? levelLabel_no : levelLabel_en}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              {xp.toLocaleString()} XP
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streak} {isNorwegian ? "uker" : "weeks"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: SlidersHorizontal,
            label_no: "Kontroller",
            label_en: "Controls",
            desc_no: "Se og håndter sikkerhetskontroller",
            desc_en: "View and manage security controls",
            route: "/controls",
            accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
          },
          {
            icon: Shield,
            label_no: "ISO Readiness",
            label_en: "ISO Readiness",
            desc_no: "Sertifiseringsreise og fremdrift",
            desc_en: "Certification journey & progress",
            route: "/compliance",
            accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
          },
          {
            icon: FileCheck,
            label_no: "Regelverk",
            label_en: "Regulations",
            desc_no: "Aktiver og administrer rammeverk",
            desc_en: "Activate and manage frameworks",
            route: "/regulations",
            accent: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
          },
        ].map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.route}
              onClick={() => navigate(action.route)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all flex items-start gap-3 group",
                action.accent
              )}
            >
              <div className="rounded-lg bg-background/60 p-2 shrink-0">
                <ActionIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{isNorwegian ? action.label_no : action.label_en}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">{isNorwegian ? action.desc_no : action.desc_en}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two dimension grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Per regulation domain */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNorwegian ? "Per regelverk" : "By regulation"}
          </h3>
          <div className="space-y-2">
            {regulationDomains.map((d) => (
              <div key={d.label_en} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{isNorwegian ? d.label_no : d.label_en}</span>
                  <span className="text-muted-foreground">{d.percent}%</span>
                </div>
                <Progress value={d.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Per focus area (domain) */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isNorwegian ? "Per fokusområde" : "By focus area"}
          </h3>
          <div className="space-y-2">
            {focusAreas.map((d) => (
              <div key={d.label_en} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{isNorwegian ? d.label_no : d.label_en}</span>
                  <span className="text-muted-foreground">{d.percent}%</span>
                </div>
                <Progress value={d.percent} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
