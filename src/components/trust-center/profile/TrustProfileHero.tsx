import { Shield, Award, Info, Clock, Eye, ChevronDown, Scale, BookCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
}

function frameworkChipClass(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("iso") || n.includes("soc"))
    return "bg-emerald-400/15 text-emerald-200 border-emerald-300/30";
  if (n.includes("nis2"))
    return "bg-amber-400/15 text-amber-200 border-amber-300/30";
  if (n.includes("dora"))
    return "bg-rose-400/15 text-rose-200 border-rose-300/30";
  if (n.includes("ai") || n.includes("ki-forordning"))
    return "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-300/30";
  return "bg-violet-400/15 text-violet-100 border-violet-300/30";
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

  return (
    <div className={flush ? "relative overflow-hidden" : "relative overflow-hidden rounded-2xl border border-border bg-card"}>
      {/* Cover layer */}
      <div className="relative w-full" style={{ minHeight: "clamp(260px, 36vw, 420px)" }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary to-[#3a1d5c]" />
            {/* subtle dot pattern */}
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
        {/* Overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(8,8,16,${overlay * 0.85}) 0%, rgba(8,8,16,${overlay * 0.4}) 45%, rgba(8,8,16,${overlay}) 100%)`,
          }}
        />

        {/* Top strip — branding + verified */}
        <div className="relative z-10 flex items-center justify-between px-5 md:px-7 pt-4">
          <div className="flex items-center gap-2 text-sm text-white/85">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">Mynder Trust Profile</span>
          </div>
          <button
            type="button"
            onClick={onVerifiedClick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <Award className="h-3.5 w-3.5" />
            {isNb ? "Verifisert" : "Verified"}
          </button>
        </div>

        {/* Main hero content */}
        <div className="relative z-10 px-5 md:px-8 pt-8 pb-7 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {/* Glass logo pill */}
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/95 backdrop-blur-md ring-1 ring-white/30 shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${companyName} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-foreground">
                      {(companyName || "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm tracking-tight">
                    {companyName}
                  </h1>
                  {description ? (
                    <p className="text-sm md:text-base text-white/85 mt-1.5 leading-relaxed line-clamp-3 max-w-2xl">
                      {description}
                    </p>
                  ) : (
                    <p className="text-sm text-white/60 italic mt-1">
                      {isNb ? "Mangler kort beskrivelse" : "Missing short description"}
                    </p>
                  )}
                </div>
              </div>

              {/* Framework chips */}
              <div className="mt-5 flex flex-wrap items-center gap-1.5">
                {frameworks.length === 0 ? (
                  <span className="text-xs text-white/70 italic">
                    {isNb ? "Ingen regelverk publisert ennå" : "No frameworks published yet"}
                  </span>
                ) : (
                  <>
                    <span className="text-[11px] uppercase tracking-wider text-white/70 mr-1">
                      {isNb ? "Følger" : "Complies with"}
                    </span>
                    {frameworks.map((fw) => {
                      const standard = isStandard(fw.framework_name);
                      const Icon = standard ? BookCheck : Scale;
                      return (
                        <button
                          key={fw.framework_id}
                          type="button"
                          onClick={scrollToFrameworks}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-transform hover:scale-[1.03] ${frameworkChipClass(fw.framework_name)}`}
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
                  </>
                )}
              </div>
            </div>

            {/* Trust Score — glass card */}
            <div className="shrink-0 self-stretch md:self-auto">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl px-5 py-4 flex flex-col items-center gap-2 min-w-[180px]">
                <div className="text-[11px] uppercase tracking-wider text-white/80 font-medium">
                  Trust Score
                </div>
                <div className="relative flex items-center justify-center">
                  <svg width="112" height="112" viewBox="0 0 128 128" className="-rotate-90">
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
                    <circle
                      cx="64" cy="64" r={radius} fill="none"
                      stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${dash} ${circ}`}
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold tabular-nums leading-none text-white drop-shadow`}>
                      {trustScore}
                    </span>
                    <span className="text-[11px] font-medium text-white/70 uppercase tracking-wide mt-1">/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${trustColor}`}>
                    {trustLabel}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-white/70 hover:text-white" aria-label={isNb ? "Om Trust Score" : "About Trust Score"}>
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
                <div className="flex items-center gap-2 text-[11px] text-white/70 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {lastUpdated}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span className="tabular-nums">{viewCount.toLocaleString(isNb ? "nb-NO" : "en-GB")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <button
          type="button"
          onClick={() => document.getElementById("tc-section-maturity")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute z-10 bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors"
          aria-label={isNb ? "Bla ned" : "Scroll down"}
        >
          {isNb ? "Detaljer" : "Details"}
          <ChevronDown className="h-3 w-3 animate-bounce" />
        </button>
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
