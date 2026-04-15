import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface RegionData {
  id: string;
  label: string;
  labelEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gdprSafe: boolean;
  assets: Array<{ id: string; name: string; asset_type: string }>;
}

const REGION_CONFIG: Record<string, Omit<RegionData, "assets">> = {
  norway: {
    id: "norway",
    label: "Norge",
    labelEn: "Norway",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500",
    borderColor: "border-blue-400",
    gdprSafe: true,
  },
  eu: {
    id: "eu",
    label: "EU / EØS",
    labelEn: "EU / EEA",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500",
    borderColor: "border-emerald-400",
    gdprSafe: true,
  },
  usa: {
    id: "usa",
    label: "USA",
    labelEn: "USA",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500",
    borderColor: "border-amber-400",
    gdprSafe: false,
  },
  other: {
    id: "other",
    label: "Andre",
    labelEn: "Other",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500",
    borderColor: "border-red-400",
    gdprSafe: false,
  },
};

const EU_COUNTRIES = [
  "austria", "belgium", "bulgaria", "croatia", "cyprus", "czech republic", "czechia",
  "denmark", "estonia", "finland", "france", "germany", "greece", "hungary",
  "iceland", "ireland", "italy", "latvia", "liechtenstein", "lithuania",
  "luxembourg", "malta", "netherlands", "poland", "portugal", "romania",
  "slovakia", "slovenia", "spain", "sweden", "eu", "eea", "eu/eea",
];

function classifyRegion(country?: string | null, region?: string | null): string {
  const val = (country || region || "").toLowerCase().trim();
  if (!val) return "other";
  if (val === "norway" || val === "norge" || val === "no") return "norway";
  if (val === "usa" || val === "us" || val === "united states" || val === "united states of america") return "usa";
  if (EU_COUNTRIES.some((c) => val.includes(c))) return "eu";
  return "other";
}

function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={12} />
      {segments
        .filter((s) => s.value > 0)
        .map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={12}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          );
          offset += dash;
          return el;
        })}
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-lg font-bold">
        {total}
      </text>
    </svg>
  );
}

export function DataGeographyWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const { data: assets = [] } = useQuery({
    queryKey: ["geo-assets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, asset_type, country, region")
        .in("asset_type", ["vendor", "sub_processor", "cloud_service", "system"]);
      return data || [];
    },
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["geo-systems"],
    queryFn: async () => {
      const { data } = await supabase.from("systems").select("id, name, vendor");
      return data || [];
    },
  });

  // Group assets by region
  const regionGroups: Record<string, RegionData> = Object.fromEntries(
    Object.entries(REGION_CONFIG).map(([key, config]) => [key, { ...config, assets: [] }])
  );

  assets.forEach((a) => {
    const region = classifyRegion(a.country, a.region);
    regionGroups[region].assets.push({ id: a.id, name: a.name, asset_type: a.asset_type });
  });

  // Add systems without region as "other" by default (unless we have vendor info)
  systems.forEach((s) => {
    // Only add if not already counted from assets
    if (!assets.some((a) => a.name === s.name)) {
      regionGroups["norway"].assets.push({ id: s.id, name: s.name, asset_type: "system" });
    }
  });

  const regions = Object.values(regionGroups).filter((r) => r.assets.length > 0);
  const maxCount = Math.max(...regions.map((r) => r.assets.length), 1);

  const donutSegments = [
    { value: regionGroups.norway.assets.length, color: "hsl(217, 91%, 60%)" },
    { value: regionGroups.eu.assets.length, color: "hsl(160, 84%, 39%)" },
    { value: regionGroups.usa.assets.length, color: "hsl(38, 92%, 50%)" },
    { value: regionGroups.other.assets.length, color: "hsl(0, 84%, 60%)" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {isNb ? "Datageografi" : "Data geography"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isNb
            ? "Hvor er virksomhetens data og leverandører plassert?"
            : "Where are your organization's data and vendors located?"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut chart */}
          <div className="flex flex-col items-center gap-1.5">
            <DonutChart segments={donutSegments} size={130} />
            <span className="text-[13px] text-muted-foreground font-medium mt-1">
              {isNb ? "Totalt" : "Total"}
            </span>
          </div>

          {/* Bubble grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {Object.values(regionGroups).map((region) => {
              const count = region.assets.length;
              const bubbleSize = count > 0 ? Math.max(48, Math.min(96, (count / maxCount) * 96)) : 40;
              const isExpanded = expandedRegion === region.id;

              return (
                <button
                  key={region.id}
                  onClick={() => setExpandedRegion(isExpanded ? null : region.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all group"
                >
                  {/* Bubble */}
                  <div
                    className={cn(
                      "rounded-full flex items-center justify-center transition-all duration-500 shadow-sm",
                      region.bgColor,
                      count === 0 && "opacity-30"
                    )}
                    style={{ width: bubbleSize, height: bubbleSize }}
                  >
                    <span className="text-white font-bold text-sm">{count}</span>
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p className={cn("text-xs font-semibold", region.color)}>
                      {isNb ? region.label : region.labelEn}
                    </p>
                    <div className="flex items-center gap-1 justify-center mt-0.5">
                      {region.gdprSafe ? (
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ShieldAlert className="h-3 w-3 text-amber-500" />
                      )}
                      <span className="text-[13px] text-muted-foreground">
                        {region.gdprSafe ? "GDPR OK" : isNb ? "Krever vurdering" : "Needs review"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded list */}
                  {isExpanded && count > 0 && (
                    <div className="w-full mt-1 space-y-1 text-left max-h-24 overflow-y-auto">
                      {region.assets.slice(0, 8).map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <div className={cn("w-1.5 h-1.5 rounded-full", region.bgColor)} />
                          <span className="truncate">{a.name}</span>
                        </div>
                      ))}
                      {count > 8 && (
                        <p className="text-[13px] text-muted-foreground/60 pl-3">
                          +{count - 8} {isNb ? "til" : "more"}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend row */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border">
          {Object.values(regionGroups).map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", r.bgColor)} />
              <span className="text-[13px] text-muted-foreground">{isNb ? r.label : r.labelEn}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-[13px] gap-1 h-5">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              GDPR OK
            </Badge>
            <Badge variant="outline" className="text-[13px] gap-1 h-5">
              <ShieldAlert className="h-3 w-3 text-amber-500" />
              {isNb ? "Krever vurdering" : "Needs review"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
