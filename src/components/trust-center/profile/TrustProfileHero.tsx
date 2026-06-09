import { Shield, Award, Info, Clock, Eye, Scale, BookCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCoverPreset, DEFAULT_COVER_OVERLAY } from "@/lib/coverPresets";

export interface HeroFramework {
  framework_id: string;
  framework_name: string;
}

interface Props {
  isNb: boolean;
  meta: Record<string, any>;
  logoUrl?: string | null;
  companyName: string;
  description?: string | null;
  trustScore: number;
  trustColor: string;
  trustLabel: string;
  strokeColor: string;
  radius: number;
  circ: number;
  dash: number;
  lastUpdated: string;
  viewCount?: number;
  frameworks: HeroFramework[];
  isStandard: (name: string) => boolean;
  onVerifiedClick: () => void;
  /** When true, render flush (no outer rounded border) — for embedding inside an existing Card. */
  flush?: boolean;
  /** When true, banner breaks out to full viewport width while content stays at parent width. */
  fullBleed?: boolean;
}

function frameworkChipClass(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("iso") || n.includes("soc"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
  if (n.includes("nis2"))
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";
  if (n.includes("dora"))
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30";
  if (n.includes("ai") || n.includes("ki-forordning"))
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/30";
  return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:border-violet-500/30";
}

export function TrustProfileHero({
  isNb,
  meta,
  logoUrl,
  companyName,
  description,
  trustScore,
  trustColor,
  trustLabel,
  strokeColor,
  radius,
  circ,
  dash,
  lastUpdated,
  viewCount = 1247,
  frameworks,
  isStandard,
  onVerifiedClick,
  flush = false,
  fullBleed = false,
}: Props) {
  const coverUrl: string | undefined = meta.cover_image_url;
  const presetId: string | undefined = meta.cover_preset_id;
  const overlay: number =
    typeof meta.cover_overlay === "number"
      ? meta.cover_overlay
      : getCoverPreset(presetId)?.overlay ?? DEFAULT_COVER_OVERLAY;

  const scrollToFrameworks = () => {
    document.getElementById("tc-section-maturity")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Small ring metrics (compact card)
  const smR = 28;
  const smCirc = 2 * Math.PI * smR;
  const smDash = (trustScore / 100) * smCirc;

  const outerCls = fullBleed
    ? "relative bg-card"
    : flush
      ? "relative overflow-hidden bg-card"
      : "relative overflow-hidden rounded-2xl border border-border bg-card";

  const bannerCls = fullBleed
    ? "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden"
    : "relative w-full overflow-hidden";

  return (
    <div className={outerCls}>
      {/* Banner zone */}
      <div className={bannerCls} style={{ height: "clamp(220px, 28vw, 340px)" }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary to-[#3a1d5c]" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
          </>
        )}
        {/* Overlay for legibility of top badges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(8,8,16,${overlay * 0.55}) 0%, rgba(8,8,16,0) 35%, rgba(8,8,16,0) 100%)`,
          }}
        />

        {/* Top strip — branding + verified */}
        <div className="relative z-10 flex items-center justify-between px-5 md:px-7 pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md ring-1 ring-white/15 px-2.5 py-1 text-xs text-white/90">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">Trust Center</span>
          </div>
          <button
            type="button"
            onClick={onVerifiedClick}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md ring-1 ring-emerald-300/40 px-2.5 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/30 transition-colors"
          >
            <Award className="h-3.5 w-3.5" />
            {isNb ? "Verifisert" : "Verified"}
          </button>
        </div>
      </div>

      {/* Logo notch — overlapping seam */}
      <div className="relative px-6 md:px-10">
        <div className="absolute -top-14 md:-top-16 left-6 md:left-10 z-20">
          <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-white ring-4 ring-card shadow-2xl flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={`${companyName} logo`} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-3xl font-bold text-foreground">
                {(companyName || "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Identity row — on white surface */}
      <div className="px-6 md:px-10 pt-16 md:pt-20 pb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-none">
              {companyName}
            </h1>

            {/* Compliance frameworks */}
            <div className="mt-5 rounded-xl border border-border bg-muted/30 px-4 py-3 shadow-sm">
              {frameworks.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  {isNb ? "Ingen regelverk publisert ennå" : "No frameworks published yet"}
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mr-2">
                    {isNb ? "Etterlevelse" : "Compliance"}
                  </span>
                  {frameworks.map((fw) => {
                    const standard = isStandard(fw.framework_name);
                    const Icon = standard ? BookCheck : Scale;
                    return (
                      <button
                        key={fw.framework_id}
                        type="button"
                        onClick={scrollToFrameworks}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-transform hover:scale-[1.03] ${frameworkChipClass(fw.framework_name)}`}
                        title={
                          standard
                            ? isNb ? "Sertifisert standard" : "Certified standard"
                            : isNb ? "Følger regelverket" : "Complies with regulation"
                        }
                      >
                        <Icon className="h-3 w-3" />
                        {fw.framework_name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Compact Trust Score card */}
          <div className="shrink-0 self-start">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-3 min-w-[220px]">
              <div className="relative flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                  <circle cx="32" cy="32" r={smR} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r={smR} fill="none"
                    stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${smDash} ${smCirc}`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold tabular-nums text-foreground">{trustScore}</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    Trust Score
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={isNb ? "Om Trust Score" : "About Trust Score"}>
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-sm leading-relaxed">
                      {isNb
                        ? "Trust Score er en sammenstilt vurdering av modenheten din mot bransjestandard. 80+ regnes som god dekning."
                        : "Trust Score is an aggregated assessment of your maturity against industry standards. 80+ is considered solid coverage."}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${trustColor}`}>
                  {trustLabel}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {lastUpdated}
                  </span>
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="tabular-nums">{viewCount.toLocaleString(isNb ? "nb-NO" : "en-GB")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IdentityStripeProps {
  isNb: boolean;
  orgNumber?: string | null;
  country?: string | null;
  domain?: string | null;
  industry?: string | null;
}

export function IdentityStripe({ isNb, orgNumber, country, domain, industry }: IdentityStripeProps) {
  const items = [
    { label: isNb ? "ORG.NR" : "REG. NUMBER", value: orgNumber || (isNb ? "Mangler" : "Missing"), missing: !orgNumber },
    { label: isNb ? "LAND" : "COUNTRY", value: country || (isNb ? "Mangler" : "Missing"), missing: !country },
    { label: isNb ? "NETTSIDE" : "WEBSITE", value: domain || (isNb ? "Mangler" : "Missing"), missing: !domain, isLink: !!domain },
    { label: isNb ? "BRANSJE" : "INDUSTRY", value: industry || "–" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
      {items.map((item) => (
        <div key={item.label} className="bg-card px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
          {item.isLink ? (
            <a
              href={item.value.startsWith("http") ? item.value : `https://${item.value}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline mt-0.5 truncate block"
            >
              {item.value}
            </a>
          ) : (
            <p className={`text-sm font-medium mt-0.5 truncate ${item.missing ? "text-muted-foreground italic" : "text-foreground"}`}>
              {item.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
