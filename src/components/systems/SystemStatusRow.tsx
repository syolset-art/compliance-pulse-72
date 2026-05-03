import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Archive, ArrowRightLeft, CheckCircle2, Clock, RotateCcw, UserPlus,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deriveSystemStatus, type SystemStatusMeta } from "@/lib/systemStatus";
import { computeRisk } from "@/lib/derivedRisk";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AssetRowActionMenu } from "@/components/shared/AssetRowActionMenu";

interface SystemRow {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  vendor?: string | null;
  status?: string | null;
  risk_level?: string | null;
  compliance_score?: number;
  work_area_id?: string | null;
  system_manager?: string | null;
  metadata?: any;
  updated_at?: string | null;
  created_at?: string | null;
}

interface WorkArea {
  id: string;
  name: string;
}

interface Props {
  system: SystemRow;
  ownerWorkArea?: WorkArea;
  iconColor: string;
  IconComponent: LucideIcon;
  workAreas: WorkArea[];
  statusOptions: { value: string; label: string }[];
  onAssignOwner: (id: string, workAreaId: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: string) => void;
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}
function formatShortDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
  } catch { return null; }
}
/** Deterministisk dato basert på id, så prototypen aldri viser "—". */
function demoDateFromId(id?: string | null): string {
  let hash = 0;
  const src = (id || "demo").toString();
  for (let i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
  const daysAgo = 7 + (hash % 200);
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  return dt.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

function SystemDonut({ score, tone, frozen }: { score: number; tone: SystemStatusMeta["tone"]; frozen?: boolean }) {
  const has = score > 0;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const stroke =
    frozen ? "hsl(var(--muted-foreground) / 0.4)" :
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.5)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
        {has && (
          <circle cx="32" cy="32" r={radius} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} />
        )}
      </svg>
      <span className={cn(
        "absolute text-[13px] font-semibold tabular-nums leading-none",
        frozen ? "text-muted-foreground line-through" :
        tone === "success" ? "text-success" :
        tone === "warning" ? "text-warning" :
        tone === "primary" ? "text-primary" :
        "text-muted-foreground"
      )}>
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

export function SystemStatusRow({
  system, ownerWorkArea, IconComponent, iconColor,
  workAreas, statusOptions,
  onAssignOwner, onArchive, onRestore, onDelete, onSetStatus,
}: Props) {
  const navigate = useNavigate();
  const status = deriveSystemStatus({
    status: system.status,
    work_area_id: system.work_area_id,
    compliance_score: system.compliance_score,
    metadata: system.metadata,
  });

  const score = system.compliance_score || 0;
  const md = system.metadata || {};
  const isArchived = status.key === "archived";

  const maturityLabel =
    status.key === "mapped"   ? "estimert av Lara" :
    status.key === "assigned" ? "avventer eier" :
    status.key === "owned"    ? "vedlikeholdt av eier" :
    status.key === "phasing"  ? "under utfasing" :
    `fryst ${formatShortDate(md.archived_at || system.updated_at) || ""}`;

  const handleOpen = () => navigate(`/systems/${system.id}`);

  const renderBanner = () => {
    if (status.key === "mapped") {
      const mapped = formatLongDate(md.lara_mapped_at) || formatLongDate(system.updated_at) || demoDateFromId(system.id);
      return (
        <div className="mt-3 rounded-lg bg-purple-100 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <LaraAvatar size={22} />
            <span className="text-[13px] text-purple-900 truncate">
              Lara kartla systemet {mapped}
            </span>
          </div>
          <Button
            size="sm"
            className="rounded-pill gap-1.5 shrink-0 h-8 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            onClick={(e) => { e.stopPropagation(); toast.info("Velg arbeidsområde fra menyen til høyre"); }}
          >
            <UserPlus className="h-3.5 w-3.5" /> Tildel arbeidsområde
          </Button>
        </div>
      );
    }
    if (status.key === "assigned") {
      const assigned = formatLongDate(md.assigned_at) || formatLongDate(system.updated_at) || demoDateFromId(system.id);
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[13px] text-foreground truncate">
              Tildelt {ownerWorkArea?.name || "arbeidsområde"} {assigned} — avventer bekreftelse
            </span>
          </div>
          <Button size="sm" variant="outline" className="rounded-pill gap-1.5 shrink-0 h-8"
            onClick={(e) => { e.stopPropagation(); toast.success("Påminnelse sendt til eier"); }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Be om bekreftelse
          </Button>
        </div>
      );
    }
    if (status.key === "owned") {
      const updatedOn = formatLongDate(system.updated_at) || demoDateFromId(system.id);
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span className="text-[13px] text-foreground/80">
            Eid av <strong>{ownerWorkArea?.name || "arbeidsområde"}</strong> · sist oppdatert {updatedOn}
          </span>
        </div>
      );
    }
    if (status.key === "phasing") {
      const planned = formatLongDate(md.phase_out_date) || "–";
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ArrowRightLeft className="h-4 w-4 text-warning shrink-0" />
            <span className="text-[13px] text-foreground truncate">
              Under utfasing. Planlagt avslutning: {planned}
            </span>
          </div>
        </div>
      );
    }
    // archived
    const archivedOn = formatLongDate(md.archived_at || system.updated_at) || demoDateFromId(system.id);
    return (
      <div className="mt-3 rounded-lg bg-muted/60 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[13px] text-foreground">
            <strong>Systemet er arkivert.</strong> Fryst {archivedOn}.
          </span>
        </div>
        <Button size="sm" variant="ghost" className="rounded-pill gap-1.5 shrink-0 text-primary hover:text-primary"
          onClick={(e) => { e.stopPropagation(); onRestore(system.id); }}>
          <RotateCcw className="h-3.5 w-3.5" /> Gjenåpne
        </Button>
      </div>
    );
  };

  return (
    <Card
      variant="flat"
      onClick={handleOpen}
      className={cn(
        "relative cursor-pointer hover:shadow-md transition-all hover:border-primary/30 overflow-hidden p-0",
        isArchived && "opacity-90"
      )}
    >
      <div className="flex">
        {/* Vertikal tilstandsstripe */}
        <div className={cn("relative w-7 shrink-0 flex items-center justify-center", status.stripeBg)}>
          {status.hasActiveDot && (
            <span
              className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-success ring-2 ring-success/30"
              aria-hidden
            />
          )}
          <span
            className={cn("absolute text-[10px] font-bold tracking-[0.18em] whitespace-nowrap", status.stripeText)}
            style={{ transform: "rotate(-90deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Hovedinnhold */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={cn("h-10 w-10 rounded-md border border-border flex items-center justify-center shrink-0", iconColor)}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn(
                    "text-[16px] font-semibold text-foreground truncate",
                    isArchived && "line-through text-muted-foreground"
                  )}>
                    {system.name}
                  </h3>
                  {isArchived ? (
                    <Badge variant="outline" className="text-[12px] gap-1 px-2 py-0.5 bg-muted/60 text-muted-foreground border-border font-medium">
                      <Archive className="h-3 w-3" /> Arkivert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[12px] px-2 py-0.5 font-medium">
                      {status.label}
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1 truncate">
                  {[system.category, system.vendor].filter(Boolean).join("  ·  ") || "—"}
                </p>
                {system.description && (
                  <p className="text-[13px] text-foreground/75 mt-1 line-clamp-1">
                    {system.description}
                  </p>
                )}
              </div>
            </div>

            {/* Donut + maturity + avledet risiko (Mynder) */}
            <div className="hidden md:flex items-center gap-3 shrink-0 pl-3 border-l border-border/60">
              <SystemDonut score={score} tone={status.tone} frozen={isArchived} />
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isArchived ? "Siste modenhet" : "Modenhet"}
                </p>
                <p className={cn("text-[12px]", isArchived ? "italic text-muted-foreground" : "text-muted-foreground")}>
                  {maturityLabel || "—"}
                </p>
                {!isArchived && (() => {
                  const risk = computeRisk({
                    criticality: system.risk_level,
                    complianceScore: score,
                  });
                  return (
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 border text-[11px] font-medium",
                              risk.pillClass
                            )}
                          >
                            <LaraAvatar size={12} />
                            {risk.labelNb}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[260px]">
                          <p className="text-[11px] font-semibold mb-1">Beregnet av Mynder</p>
                          <ul className="text-[11px] space-y-0.5 list-disc pl-4">
                            {risk.reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })()}
              </div>
            </div>

            {/* Action menu */}
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <AssetRowActionMenu
                itemId={system.id}
                currentWorkAreaId={system.work_area_id}
                currentStatus={system.status}
                isArchived={isArchived}
                workAreas={workAreas}
                statusOptions={statusOptions}
                onSetOwner={(itemId, waId) => onAssignOwner(itemId, waId)}
                onArchive={(itemId) => onArchive(itemId)}
                onRestore={(itemId) => onRestore(itemId)}
                onDelete={(itemId) => onDelete(itemId)}
                onSetStatus={(itemId, st) => onSetStatus(itemId, st)}
              />
            </div>
          </div>

          {renderBanner()}
        </div>
      </div>
    </Card>
  );
}
