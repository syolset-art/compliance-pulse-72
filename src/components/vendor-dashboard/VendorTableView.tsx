import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerEntranceClass } from "@/lib/animation";

import { getCriticality, CRITICALITY_META, type CriticalityKey } from "@/lib/criticality";
import { deriveVendorStatus } from "@/lib/vendorStatus";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PLATFORM_USERS } from "@/lib/platformUsers";
import type { ScoreDisplayMode } from "./VendorListTab";

interface Asset {
  id: string;
  name: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  criticality?: string | null;
  country?: string | null;
  vendor_category?: string | null;
  gdpr_role?: string | null;
  priority?: string | null;
  asset_owner?: string | null;
  work_area_id?: string | null;
  lifecycle_status?: string | null;
  metadata?: any;
}

interface Props {
  vendors: Asset[];
  expiredCounts: Record<string, number>;
  inboxCounts: Record<string, number>;
  getOwnerName: (a: Asset) => string | null;
  scoreDisplay: ScoreDisplayMode;
  // Filters (controlled from parent so popover toolbar and column filters stay in sync)
  countryFilter: string;
  setCountryFilter: (v: string) => void;
  vendorCategoryFilter: string;
  setVendorCategoryFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  criticalityFilter: string;
  setCriticalityFilter: (v: string) => void;
  ownerFilter: string;
  setOwnerFilter: (v: string) => void;
}

const getPriorityLabel = (isNb: boolean): Record<string, string> => isNb
  ? { critical: "Kritisk", high: "Høy", medium: "Medium", low: "Lav" }
  : { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

/** Pille-stil for prioritet — bruker semantiske tokens. */
const PRIORITY_PILL: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high:     "bg-warning/15 text-warning border-warning/30",
  medium:   "bg-secondary text-secondary-foreground border-border",
  low:      "bg-muted text-muted-foreground border-border",
};

const getVendorCatLabel = (isNb: boolean): Record<string, string> => isNb
  ? { saas: "SaaS", infrastructure: "Infrastruktur", consulting: "Rådgivning", it_operations: "IT-drift", facilities: "Kontor", other: "Annet" }
  : { saas: "SaaS", infrastructure: "Infrastructure", consulting: "Consulting", it_operations: "IT operations", facilities: "Facilities", other: "Other" };

function ColumnFilter({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const active = !!value && value !== "all";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors",
            active && "text-primary"
          )}
          aria-label={`Filter ${label}`}
        >
          {label}
          <Filter className={cn("h-3 w-3", active ? "fill-primary text-primary" : "opacity-50")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        <div className="max-h-64 overflow-y-auto">
          <button
            onClick={() => onChange("")}
            className={cn(
              "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted",
              !active && "bg-muted font-medium"
            )}
          >
            Alle
          </button>
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex items-center justify-between",
                value === o.value && "bg-muted font-medium"
              )}
            >
              <span>{o.label}</span>
              {value === o.value && <X className="h-3 w-3 opacity-50" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * ScoreRing — delt visuell standard for modenhets-/trustscore på tvers av
 * leverandør- og kundeprofiler. Følger Risk Colors-regelen i designsystemet:
 * grønn ≥75, gul 50–74, rød <50.
 */
function ScoreRing({ score }: { score: number }) {
  const size = 32;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100);
  const dash = `${(pct / 100) * c} ${c}`;
  const tone =
    pct >= 75 ? "text-success"
    : pct >= 50 ? "text-warning"
    : "text-destructive";

  if (score <= 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" strokeWidth={stroke}
          className="text-muted/40" fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={dash} strokeLinecap="round"
          className={tone} fill="none"
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums", tone)}>
        {pct}
      </span>
    </div>
  );
}

/** Inline owner-velger: vises som "Tilordne" når tomt, ellers som navn. */
function OwnerCell({
  assetId, ownerName, options,
}: { assetId: string; ownerName: string | null; options: string[] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const mutate = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.from("assets")
        .update({ asset_owner: next }).eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-assets"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("vendorDashboard.list.ownerUpdated", "Eier oppdatert"));
    },
    onError: () => toast.error(t("vendorDashboard.list.ownerError", "Kunne ikke oppdatere eier")),
  });

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const suggestions = Array.from(new Set([
    ...PLATFORM_USERS.map(u => u.name),
    ...options,
  ])).sort();

  return (
    <Popover>
      <PopoverTrigger asChild onClick={stop}>
        {ownerName ? (
          <button className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[140px] text-left">
            {ownerName}
          </button>
        ) : (
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <UserPlus className="h-3 w-3" />
            {t("vendorDashboard.list.assign", "Tilordne")}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1" onClick={stop}>
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map(name => (
            <button
              key={name}
              onClick={() => mutate.mutate(name)}
              className={cn(
                "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted",
                ownerName === name && "bg-muted font-medium"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function VendorTableView({
  vendors,
  expiredCounts, inboxCounts, getOwnerName, scoreDisplay,
  countryFilter, setCountryFilter,
  vendorCategoryFilter, setVendorCategoryFilter,
  priorityFilter, setPriorityFilter,
  criticalityFilter, setCriticalityFilter,
  ownerFilter, setOwnerFilter,
}: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const tl = (k: string) => t(`vendorDashboard.list.${k}`);
  const PRIORITY_LABEL = getPriorityLabel(isNb);
  const VENDOR_CAT_LABEL = getVendorCatLabel(isNb);

  const countries = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach(v => { if (v.country) set.add(v.country); });
    return Array.from(set).sort();
  }, [vendors]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach(v => {
      const n = getOwnerName(v);
      if (n) set.add(n);
    });
    return Array.from(set).sort();
  }, [vendors, getOwnerName]);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-1.5 p-0" aria-label={tl("status")} />
              <TableHead className="w-20">
                <ColumnFilter
                  label={tl("country")}
                  value={countryFilter}
                  onChange={setCountryFilter}
                  options={countries.map(c => ({ value: c, label: c }))}
                />
              </TableHead>
              <TableHead className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                {tl("name")}
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label={tl("type")}
                  value={vendorCategoryFilter}
                  onChange={setVendorCategoryFilter}
                  options={Object.entries(VENDOR_CAT_LABEL).map(([v, l]) => ({ value: v, label: l as string }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label={tl("priority")}
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l as string }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label={tl("criticality")}
                  value={criticalityFilter}
                  onChange={setCriticalityFilter}
                  options={(Object.keys(CRITICALITY_META) as CriticalityKey[]).map(k => ({
                    value: k, label: isNb ? CRITICALITY_META[k].labelNb : CRITICALITY_META[k].labelEn,
                  }))}
                />
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium uppercase tracking-wide text-muted-foreground w-16">
                {tl("score")}
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label={tl("owner")}
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  options={owners.map(o => ({ value: o, label: o }))}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v, i) => {
              const score = v.compliance_score || 0;
              const owner = getOwnerName(v);
              const crit = getCriticality(v);
              const status = deriveVendorStatus({
                compliance_score: v.compliance_score,
                risk_level: v.risk_level,
                lifecycle_status: v.lifecycle_status,
                metadata: v.metadata,
              });
              return (
                <TableRow
                  key={v.id}
                  className={cn("cursor-pointer group", staggerEntranceClass(i))}
                  onClick={() => navigate(`/assets/${v.id}`)}
                >

                  <TableCell className="w-1.5 p-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn("h-full w-1.5", status.stripeBg)}
                            aria-label={status.label}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs font-medium">{status.label}</p>
                          <p className="text-[12px] text-muted-foreground">{status.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground uppercase">
                    {v.country || "—"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{v.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.vendor_category ? VENDOR_CAT_LABEL[v.vendor_category] || v.vendor_category : "—"}
                  </TableCell>
                  <TableCell>
                    {v.priority ? (
                      <Badge variant="outline" className={cn("font-normal text-[12px]", PRIORITY_PILL[v.priority] || "")}>
                        {PRIORITY_LABEL[v.priority] || v.priority}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {crit ? (
                      <Badge variant="outline" className={cn("font-normal text-[12px]", crit.pillClass)}>
                        {isNb ? crit.labelNb : crit.labelEn}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <ScoreRing score={score} />
                  </TableCell>
                  <TableCell>
                    <OwnerCell assetId={v.id} ownerName={owner} options={owners} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
