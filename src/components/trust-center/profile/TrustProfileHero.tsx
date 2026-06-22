import { Shield, Award, Info, Clock, Scale, BookCheck, ListChecks } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getCoverPreset, DEFAULT_COVER_OVERLAY, getCoverColor } from "@/lib/coverPresets";

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
  domain?: string | null;
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
  domain,
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
  const colorId: string | undefined = meta.cover_color_id;
  const activeColor = getCoverColor(colorId);
  const overlay: number =
    typeof meta.cover_overlay === "number"
      ? meta.cover_overlay
      : activeColor?.overlay ?? getCoverPreset(presetId)?.overlay ?? DEFAULT_COVER_OVERLAY;

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
      <div className={bannerCls} style={{ height: "clamp(165px, 21vw, 255px)" }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : activeColor ? (
          <div className="absolute inset-0" style={{ background: activeColor.background }} />
        ) : (
          <>
            {/* Neutral dark base */}
            <div className="absolute inset-0 bg-[#0e1320]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 85% 15%, rgba(148,163,184,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 15% 90%, rgba(100,116,139,0.10) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage:
                  "radial-gradient(ellipse 70% 70% at 50% 50%, #000 40%, transparent 100%)",
              }}
            />
          </>
        )}
        {/* Overlay for legibility of top badges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(8,10,18,${overlay * 0.5}) 0%, rgba(8,10,18,0) 40%, rgba(8,10,18,0) 100%)`,
          }}
        />

        {/* Top strip — branding only */}
        <div className="relative z-10 flex items-center justify-between px-5 md:px-7 pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md ring-1 ring-white/15 px-2.5 py-1 text-xs text-white/90">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-medium">Trust Center</span>
          </div>
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

            {/* Company description */}
            {description ? (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed line-clamp-3 max-w-2xl">
                {description}
              </p>
            ) : null}

            {/* Website — plain text + link, sits under the description */}
            {domain ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {isNb ? "Nettside: " : "Website: "}
                <a
                  href={domain.startsWith("http") ? domain : `https://${domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {domain.replace(/^https?:\/\//, "")}
                </a>
              </p>
            ) : null}
          </div>


          {/* Compact Trust Score card */}
          <div className="shrink-0 self-start">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-3 min-w-[220px]">
              <HoverCard openDelay={150} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <div
                    className="relative flex items-center justify-center cursor-help rounded-lg transition hover:ring-2 hover:ring-primary/30"
                    tabIndex={0}
                    aria-label={isNb ? `Trust Score ${trustScore}. Hold musepekeren over for forklaring.` : `Trust Score ${trustScore}. Hover for explanation.`}
                  >
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
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="start" className="w-80 p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    {isNb ? "Slik er scoren regnet ut" : "How the score is calculated"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isNb
                      ? "Hvert kontrollområde scores 0–100, og veies sammen til én Trust Score. Personvern teller 30 %, Styring og Drift 25 % hver, Identitet og Leverandører 10 % hver."
                      : "Each control area is scored 0–100 and weighted into one Trust Score. Privacy weighs 30 %, Governance and Operations 25 % each, Identity and Vendors 10 % each."}
                  </p>
                  <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-foreground">
                    <ListChecks className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>
                      {isNb
                        ? "Bygger på besvarte kontrollpunkter med bekreftet dokumentasjon. «Ikke relevant» teller ikke med."
                        : "Based on answered controls with verified evidence. «Not relevant» is excluded."}
                    </span>
                  </div>
                </HoverCardContent>
              </HoverCard>
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
                </div>
              </div>
            </div>

            {/* Verified badge under Trust Score */}
            <button
              type="button"
              onClick={onVerifiedClick}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label={isNb ? "Verifisert av Mynder" : "Verified by Mynder"}
              title={isNb ? "Verifisert av Mynder" : "Verified by Mynder"}
            >
              <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {isNb ? "Verifisert av Mynder" : "Verified by Mynder"}
            </button>
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
  privacyPolicyUrl?: string | null;
}

export function IdentityStripe({ isNb, orgNumber, country, industry, privacyPolicyUrl }: IdentityStripeProps) {
  const items = [
    { label: isNb ? "ORG.NR" : "REG. NUMBER", value: orgNumber || (isNb ? "Mangler" : "Personvernerklæring "), missing: !orgNumber },
    { label: isNb ? "LAND" : "COUNTRY", value: country || (isNb ? "Mangler" : "Personvernerklæring "), missing: !country },
    {
      label: isNb ? "PERSONVERNERKLÆRING" : "PRIVACY POLICY",
      value: privacyPolicyUrl || (isNb ? "Mangler" : "Personvernerklæring "),
      missing: !privacyPolicyUrl,
      isLink: !!privacyPolicyUrl,
      linkLabel: isNb ? "Åpne erklæring" : "Open policy",
    },
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
              {(item as any).linkLabel || item.value}
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
