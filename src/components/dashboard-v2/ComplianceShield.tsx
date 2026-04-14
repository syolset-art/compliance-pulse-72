import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface ComplianceShieldProps {
  score: number;
  levelLabel_no: string;
  levelLabel_en: string;
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

export function ComplianceShield({ score, levelLabel_no, levelLabel_en, assessed, total, avgMaturity }: ComplianceShieldProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const colors = getShieldColor(score);
  const message = getMessage(score, isNorwegian);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg width="110" height="110" viewBox="0 0 120 120">
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
          <span className={cn("text-2xl font-bold", colors.text)}>{score}</span>
          <span className="text-[10px] text-muted-foreground font-medium">/100</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 space-y-1.5">
        <h2 className={cn("text-lg font-bold", colors.text)}>{message}</h2>
        <p className="text-xs text-muted-foreground">
          {isNorwegian
            ? `${assessed}/${total} krav vurdert · Snitt modenhet ${avgMaturity}/4`
            : `${assessed}/${total} assessed · Avg maturity ${avgMaturity}/4`
          }
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {isNorwegian ? levelLabel_no : levelLabel_en}
        </span>
      </div>
    </div>
  );
}
