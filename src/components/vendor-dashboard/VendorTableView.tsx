import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_VENDOR_STATUSES, deriveVendorStatus } from "@/lib/vendorStatus";
import { scoreToLabel, scoreLabelColor, type ScoreDisplayMode } from "./VendorListTab";

interface Asset {
  id: string;
  name: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  country?: string | null;
  vendor_category?: string | null;
  gdpr_role?: string | null;
  priority?: string | null;
  asset_owner?: string | null;
  work_area_id?: string | null;
  lifecycle_status?: string | null;
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
  gdprRoleFilter: string;
  setGdprRoleFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  riskFilter: string;
  setRiskFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  ownerFilter: string;
  setOwnerFilter: (v: string) => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  critical: "Kritisk", high: "Høy", medium: "Medium", low: "Lav",
};
const VENDOR_CAT_LABEL: Record<string, string> = {
  saas: "SaaS", infrastructure: "Infrastruktur", consulting: "Rådgivning",
  it_operations: "IT-drift", facilities: "Kontor", other: "Annet",
};
const GDPR_LABEL: Record<string, string> = {
  databehandler: "Databehandler",
  underdatabehandler: "Underdatabehandler",
  ingen: "Ingen persondata",
};

function ColumnFilter({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = !!value && value !== "all";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors",
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

export function VendorTableView({
  vendors,
  expiredCounts, inboxCounts, getOwnerName, scoreDisplay,
  countryFilter, setCountryFilter,
  vendorCategoryFilter, setVendorCategoryFilter,
  gdprRoleFilter, setGdprRoleFilter,
  priorityFilter, setPriorityFilter,
  riskFilter, setRiskFilter,
  statusFilter, setStatusFilter,
  ownerFilter, setOwnerFilter,
}: Props) {
  const navigate = useNavigate();

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
              <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Navn
              </TableHead>
              <TableHead className="w-20">
                <ColumnFilter
                  label="Land"
                  value={countryFilter}
                  onChange={setCountryFilter}
                  options={countries.map(c => ({ value: c, label: c }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="Type"
                  value={vendorCategoryFilter}
                  onChange={setVendorCategoryFilter}
                  options={Object.entries(VENDOR_CAT_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="GDPR"
                  value={gdprRoleFilter}
                  onChange={setGdprRoleFilter}
                  options={Object.entries(GDPR_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="Prioritet"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="Risiko"
                  value={riskFilter}
                  onChange={setRiskFilter}
                  options={[
                    { value: "high", label: "Høy" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Lav" },
                  ]}
                />
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={ALL_VENDOR_STATUSES.map(s => ({ value: s.key, label: s.label }))}
                />
              </TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Score
              </TableHead>
              <TableHead>
                <ColumnFilter
                  label="Eier"
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  options={owners.map(o => ({ value: o, label: o }))}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(v => {
              const status = deriveVendorStatus({
                compliance_score: v.compliance_score,
                risk_level: v.risk_level,
                lifecycle_status: v.lifecycle_status,
                expiredDocsCount: expiredCounts[v.id] || 0,
                inboxCount: inboxCounts[v.id] || 0,
              });
              const score = v.compliance_score || 0;
              const owner = getOwnerName(v);
              return (
                <TableRow
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/vendor/${v.id}`)}
                >
                  <TableCell className="font-medium text-sm">{v.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground uppercase">
                    {v.country || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.vendor_category ? VENDOR_CAT_LABEL[v.vendor_category] || v.vendor_category : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.gdpr_role ? GDPR_LABEL[v.gdpr_role] || v.gdpr_role : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.priority ? (
                      <span className="text-muted-foreground">{PRIORITY_LABEL[v.priority] || v.priority}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.risk_level ? (
                      <span className={cn(
                        v.risk_level === "high" && "text-destructive",
                        v.risk_level === "medium" && "text-warning",
                        v.risk_level === "low" && "text-success",
                      )}>
                        {v.risk_level === "high" ? "Høy" : v.risk_level === "medium" ? "Medium" : "Lav"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className={cn("text-right text-xs font-mono tabular-nums", scoreLabelColor(score))}>
                    {scoreDisplay === "percent"
                      ? (score > 0 ? `${score}%` : "—")
                      : scoreToLabel(score)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {owner || "—"}
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
