import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Layers, Shield, Package, ClipboardList, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import {
  getModuleState,
  formatPeriodEnd,
  type ModuleLifecycle,
} from "@/lib/moduleActivationState";
import { useCustomerOffers, type SavedOffer } from "@/lib/customerOffers";
import {
  pickDeliveryFormTemplate,
  loadDeliveryForm,
  deliveryFormProgress,
} from "@/lib/deliveryFormTemplates";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { CustomerModulesTab } from "./CustomerModulesTab";
import { MSPMaturityServiceMatrix } from "./MSPMaturityServiceMatrix";
import { RecommendedNextStepsCard } from "./RecommendedNextStepsCard";

interface Props {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  activeFrameworkIds: string[];
  recommended?: FrameworkRecommendation[];
  confirmed?: FrameworkRecommendation[];
  /** Navigerer til «Leveranser»-fanen. */
  onOpenDeliveries?: () => void;
  onUpdate?: () => void;
}


/** Modulene partneren kan aktivere hos kunden. */
const MODULES: { key: string; title: string }[] = [
  { key: "core", title: "Mynder Core" },
  { key: "vendor", title: "Leverandørmodul" },
  { key: "systems", title: "Systemer" },
  { key: "assets", title: "Verdier" },
];

const STATUS_LABEL: Record<ModuleLifecycle, string> = {
  active: "Aktiv",
  pending_cancellation: "Sagt opp",
  inactive: "Ikke aktivert",
};

function StatusPill({ status, note }: { status: ModuleLifecycle; note?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        status === "active" && "bg-success/10 text-success border-success/30",
        status === "pending_cancellation" && "bg-warning/10 text-warning border-warning/30",
        status === "inactive" && "bg-muted text-muted-foreground border-border",
      )}
    >
      {STATUS_LABEL[status]}
      {note ? ` — ${note}` : ""}
    </Badge>
  );
}

const OFFER_STATUS_LABEL: Record<string, string> = {
  draft: "Utkast",
  sent: "Sendt",
  delivered: "Levert",
};

function offerStatusClass(status?: string) {
  if (status === "delivered") return "bg-success/10 text-success border-success/30";
  if (status === "sent") return "bg-primary/10 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
}

export function CustomerServicesAndProductsTab({
  customerId,
  customerName,
  customerEmail,
  activeFrameworkIds,
  recommended = [],
  confirmed = [],
  onOpenDeliveries,
  onUpdate,
}: Props) {

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("modules:changed", refresh);
    return () => window.removeEventListener("modules:changed", refresh);
  }, []);

  const moduleRows = useMemo(
    () =>
      MODULES.map((m) => {
        const state = getModuleState(m.key);
        return {
          ...m,
          status: state.status,
          note:
            state.status === "pending_cancellation"
              ? `aktiv til ${formatPeriodEnd(state.cancelAt)}`
              : state.tierId,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const frameworkNames = useMemo(
    () =>
      activeFrameworkIds
        .map((id) => ALL_FRAMEWORKS.find((f) => f.id === id)?.name || id)
        .filter(Boolean),
    [activeFrameworkIds],
  );

  const offers: SavedOffer[] = useCustomerOffers(customerId);
  const activeModules = moduleRows.filter((m) => m.status !== "inactive");

  return (
    <div className="space-y-5">
      {/* ── 1. Aktivert hos kunden ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Aktivert hos kunden</h2>
          <span className="text-xs text-muted-foreground">
            {activeModules.length} produkter · {frameworkNames.length} regelverk
          </span>
        </div>

        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {moduleRows.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[13px] font-medium text-foreground truncate">{m.title}</span>
              </div>
              <StatusPill status={m.status} note={m.note} />
            </div>
          ))}

          <div className="flex items-start justify-between gap-3 px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[13px] font-medium text-foreground">Aktive regelverk</span>
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {frameworkNames.length === 0 ? (
                <span className="text-xs text-muted-foreground">Ingen aktivert</span>
              ) : (
                frameworkNames.map((n) => (
                  <Badge key={n} variant="outline" className="text-[11px]">
                    {n}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. Tilbud ── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Tilbud</h2>
          <span className="text-xs text-muted-foreground">{offers.length} totalt</span>
        </div>

        {offers.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Ingen tilbud er laget for denne kunden ennå. Lag tilbud fra tjenestene under.
          </p>
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{o.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.offerNumber} · {formatDate(o.sentAt ?? o.createdAt)} ·{" "}
                    {o.templateIds.length + o.serviceKeys.length} tjenester
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[11px] font-medium shrink-0", offerStatusClass(o.status))}
                >
                  {OFFER_STATUS_LABEL[o.status ?? "draft"] ?? "Utkast"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 3. Tilgjengelig å tilby ── */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Tilgjengelig å tilby</h2>
        <CustomerModulesTab
          customerId={customerId}
          customerName={customerName}
          activeFrameworkIds={activeFrameworkIds}
          onUpdate={onUpdate}
        />
        <MSPMaturityServiceMatrix customerName={customerName} customerEmail={customerEmail} />
      </div>
    </div>
  );
}
