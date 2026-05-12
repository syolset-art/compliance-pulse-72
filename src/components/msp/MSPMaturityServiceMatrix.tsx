import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Target,
  Brain,
  Bug,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  Package,
  Circle,
  AlertCircle,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";
import { MSPServiceCatalogTab } from "./MSPServiceCatalogTab";
import { PARTNER_SERVICES, getService } from "@/lib/serviceCatalog";

export type TaskOwner = "Partner" | "Kunde";

export interface TaskEstimate {
  label: string;
  hours: number;
  weeks?: string;
  owner?: TaskOwner;
  note?: string;
}

interface Recommendation {
  id: string;
  icon: any;
  title: string;
  desc: string;
  urgent?: boolean;
  /** Knytt anbefalingen til ett regelverk så partner kan se relevante gap. */
  frameworkId?: string;
  /** Antall åpne gap (vises på "Vis gap"-knapp). */
  openGaps?: number;
  /** Forslag til tiltak med estimerte timer. */
  tasks: TaskEstimate[];
  /** Timepris i NOK brukt til total-beregning. */
  hourlyRate: number;
}

interface ControlPoint {
  id: string;
  name: string;
  desc: string;
  status: "missing" | "partial" | "fulfilled";
  capability: "auto" | "assisted" | "manual";
  progress?: number;
  source?: string;
}

interface OngoingItem {
  id: string;
  title: string;
  status: "pending" | "accepted";
  meta: string;
  frameworkId?: string;
  frameworkLabel?: string;
  controls?: ControlPoint[];
}

const HOURLY_RATE = 1500;

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "nis2",
    icon: Target,
    title: "NIS2-klargjøring",
    desc: "Kunden er omfattet av NIS2 og lite forberedt. Strukturert leveranse med gap-analyse, policyer og rapporteringsrutiner.",
    urgent: true,
    frameworkId: "nis2",
    openGaps: 7,
    hourlyRate: HOURLY_RATE,
    tasks: [
      { label: "Gap-analyse mot NIS2", hours: 20, weeks: "Uke 1–2", owner: "Partner" },
      { label: "Risiko- og sårbarhetsvurdering", hours: 25, weeks: "Uke 2–4", owner: "Kunde" },
      { label: "Policy- og dokumentpakke", hours: 30, weeks: "Uke 4–7", owner: "Partner" },
      { label: "Hendelsesrapporteringsrutiner", hours: 15, weeks: "Uke 6–8", owner: "Partner" },
      { label: "Ledelsesgjennomgang", hours: 10, weeks: "Uke 9–10", owner: "Kunde", note: "Truls leder" },
    ],
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI Governance-rammeverk",
    desc: "Kunden har ikke startet på AI-styring. Kartlegging av AI-bruk, klassifisering og policy-oppsett.",
    frameworkId: "aiact",
    openGaps: 4,
    hourlyRate: HOURLY_RATE,
    tasks: [
      { label: "Kartlegging av AI-bruk og systemregister", hours: 16, weeks: "Uke 1–2", owner: "Kunde" },
      { label: "Risikoklassifisering av AI-systemer", hours: 20, weeks: "Uke 2–4", owner: "Partner" },
      { label: "AI-styring og policy-oppsett", hours: 24, weeks: "Uke 4–6", owner: "Partner" },
      { label: "Rutiner for menneskelig tilsyn", hours: 12, weeks: "Uke 6–7", owner: "Kunde" },
    ],
  },
  {
    id: "pentest",
    icon: Bug,
    title: "Penetrasjonstest",
    desc: "Årlig ekstern test av applikasjoner og infrastruktur. Underbygger ISO- og NIS2-arbeidet.",
    frameworkId: "iso27001",
    openGaps: 6,
    hourlyRate: HOURLY_RATE,
    tasks: [
      { label: "Scoping og forberedelse", hours: 8, weeks: "Uke 1", owner: "Kunde" },
      { label: "Ekstern penetrasjonstest", hours: 40, weeks: "Uke 2–4", owner: "Partner" },
      { label: "Rapport og gjennomgang med kunde", hours: 12, weeks: "Uke 5", owner: "Partner" },
    ],
  },
];

const ONGOING: OngoingItem[] = [
  {
    id: "iso",
    title: "ISO 27001-klargjøring",
    status: "pending",
    meta: "Tilbud sendt 28. april · Avventer svar",
  },
  {
    id: "aware",
    title: "Awareness-program",
    status: "accepted",
    meta: "Akseptert 12. april · Oppstart 15. mai",
    frameworkId: "iso27001",
    frameworkLabel: "ISO 27001",
    controls: [
      {
        id: "A.6.3",
        name: "Sikkerhetsbevissthet, opplæring og trening",
        desc: "Ansatte skal motta jevnlig opplæring i informasjonssikkerhet og oppdaterte trusler.",
        status: "partial",
        capability: "assisted",
        progress: 60,
        source: "Awareness-plattform",
      },
      {
        id: "A.5.10",
        name: "Akseptabel bruk av informasjonsmidler",
        desc: "Etabler regler for akseptabel bruk og kommuniser dette til alle ansatte.",
        status: "missing",
        capability: "manual",
        progress: 0,
      },
      {
        id: "A.5.24",
        name: "Planlegging og forberedelse av hendelseshåndtering",
        desc: "Definer og kommuniser ansvar og rutiner for håndtering av sikkerhetshendelser.",
        status: "missing",
        capability: "assisted",
        progress: 0,
      },
      {
        id: "A.7.7",
        name: "Tomt skrivebord og tom skjerm",
        desc: "Etabler praksis for låsing av skjerm og rydding av sensitive papirer.",
        status: "fulfilled",
        capability: "auto",
        progress: 100,
        source: "Endpoint-policy",
      },
    ],
  },
];

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

interface DeliveryItem {
  id: string;
  title: string;
  meta: string;
  serviceId?: string;
  checklist: ChecklistItem[];
}

const buildChecklist = (items: string[], doneCount = 0): ChecklistItem[] =>
  items.map((label, i) => ({
    id: `c${i}`,
    label,
    done: i < doneCount,
  }));

const DELIVERIES: DeliveryItem[] = [
  {
    id: "d1",
    title: "Awareness-program 2025",
    meta: "Løpende leveranse · Neste kampanje 20. mai",
    serviceId: "awareness",
    checklist: buildChecklist(getService("awareness")!.defaultChecklist, 2),
  },
  {
    id: "d2",
    title: "Penetrasjonstest – Q1 2025",
    meta: "Levert 14. mars · Rapport sendt til Truls",
    serviceId: "pentest",
    checklist: buildChecklist(getService("pentest")!.defaultChecklist, 5),
  },
];

export function MSPMaturityServiceMatrix() {
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [offerCtx, setOfferCtx] = useState<{
    open: boolean;
    serviceTitle?: string;
    variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
    attachGap?: boolean;
    gapFrameworkId?: string;
    defaultTasks?: TaskEstimate[];
    hourlyRate?: number;
  }>({ open: false });
  const [gapOpen, setGapOpen] = useState(false);
  const [gapFrameworkId, setGapFrameworkId] = useState<string | undefined>(undefined);
  const [expandedOngoing, setExpandedOngoing] = useState<string | null>("aware");
  const [controlFilter, setControlFilter] = useState<"all" | "missing" | "partial" | "fulfilled">("all");
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(DELIVERIES);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>("d1");

  const toggleChecklistItem = (deliveryId: string, itemId: string) => {
    setDeliveries(prev =>
      prev.map(d =>
        d.id === deliveryId
          ? {
              ...d,
              checklist: d.checklist.map(c =>
                c.id === itemId ? { ...c, done: !c.done } : c,
              ),
            }
          : d,
      ),
    );
  };

  const openGap = (frameworkId?: string) => {
    setGapFrameworkId(frameworkId);
    setGapOpen(true);
  };

  const urgentCount = RECOMMENDATIONS.filter(r => r.urgent).length;

  return (
    <div className="space-y-5">
      {/* Lara recommendation banner */}
      {!dismissedBanner && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Lara har en anbefaling til deg</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Du har {RECOMMENDATIONS.length} tjenester som matcher denne kundens behov
                {urgentCount > 0 && <>, hvorav {urgentCount} er tidskritisk</>}.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="h-8">Vis forslag</Button>
              <button
                type="button"
                onClick={() => setDismissedBanner(true)}
                className="text-xs text-muted-foreground hover:text-foreground px-2"
              >
                Ikke nå
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs: Anbefalt / Pågående */}
      <Tabs defaultValue="recommended" className="space-y-3">
        <TabsList>
          <TabsTrigger value="recommended" className="gap-2">
            Anbefalt
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{RECOMMENDATIONS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            Pågående
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{ONGOING.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2">
            Leveranser
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{DELIVERIES.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            Tjenester
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{PARTNER_SERVICES.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-2 mt-0">
          {RECOMMENDATIONS.map(r => {
            const Icon = r.icon;
            return (
              <Card key={r.id} className="p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{r.title}</span>
                      {r.urgent && (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                          Tidskritisk
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-snug">{r.desc}</p>

                    {/* Forslag til tiltak med timeestimat */}
                    {(() => {
                      const totalHours = r.tasks.reduce((s, t) => s + t.hours, 0);
                      const totalPrice = totalHours * r.hourlyRate;
                      return (
                        <p className="text-[12px] text-muted-foreground">
                          <span className="font-medium text-foreground">{r.tasks.length} foreslåtte tiltak</span>
                          {" · "}{totalHours} timer · {totalPrice.toLocaleString("nb-NO")} kr
                        </p>
                      );
                    })()}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setOfferCtx({
                            open: true,
                            serviceTitle: r.title,
                            variant: "Full leveranse",
                            attachGap: !!r.frameworkId,
                            gapFrameworkId: r.frameworkId,
                            defaultTasks: r.tasks,
                            hourlyRate: r.hourlyRate,
                          });
                        }}
                      >
                        Lag tilbud
                      </Button>
                      {r.frameworkId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs gap-1.5 text-primary hover:bg-primary/10"
                          onClick={() => openGap(r.frameworkId)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Vis gap
                          {typeof r.openGaps === "number" && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                              {r.openGaps}
                            </Badge>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-2 mt-0">
          {ONGOING.map(o => {
            const isPending = o.status === "pending";
            const isOpen = expandedOngoing === o.id;
            const hasControls = !!o.controls && o.controls.length > 0;
            const counts = {
              all: o.controls?.length ?? 0,
              missing: o.controls?.filter(c => c.status === "missing").length ?? 0,
              partial: o.controls?.filter(c => c.status === "partial").length ?? 0,
              fulfilled: o.controls?.filter(c => c.status === "fulfilled").length ?? 0,
            };
            const filtered = (o.controls ?? []).filter(c =>
              controlFilter === "all" ? true : c.status === controlFilter
            );
            return (
              <Card key={o.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <button
                  type="button"
                  onClick={() => hasControls && setExpandedOngoing(isOpen ? null : o.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left",
                    hasControls && "hover:bg-muted/30 cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isPending ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {isPending
                      ? <Clock className="h-4 w-4 text-warning" />
                      : <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
                      {o.frameworkLabel && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <FileText className="h-3 w-3" />
                          {o.frameworkLabel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{o.meta}</p>
                    {hasControls && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {counts.all} kontrollpunkt · <span className="text-destructive font-medium">{counts.missing} mangler</span>
                        {counts.partial > 0 && <> · <span className="text-warning font-medium">{counts.partial} delvis</span></>}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isPending ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"
                  )}>
                    {isPending ? "Venter" : "Akseptert"}
                  </Badge>
                  {hasControls ? (
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isOpen && "rotate-180")} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {isOpen && hasControls && (
                  <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                    {/* Filter pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([
                        { v: "all", label: "Alle", n: counts.all },
                        { v: "missing", label: "Ikke oppfylt", n: counts.missing },
                        { v: "partial", label: "Delvis", n: counts.partial },
                        { v: "fulfilled", label: "Oppfylt", n: counts.fulfilled },
                      ] as const).map(f => {
                        const active = controlFilter === f.v;
                        return (
                          <button
                            key={f.v}
                            type="button"
                            onClick={() => setControlFilter(f.v)}
                            className={cn(
                              "h-7 px-2.5 rounded-full text-[11px] border transition-colors",
                              active
                                ? "bg-primary/10 text-primary border-primary/40"
                                : "bg-background text-muted-foreground border-border hover:text-foreground"
                            )}
                          >
                            {f.label} <span className="tabular-nums">({f.n})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Controls list */}
                    <div className="space-y-2">
                      {filtered.map(c => <ControlRow key={c.id} c={c} frameworkLabel={o.frameworkLabel} />)}
                      {filtered.length === 0 && (
                        <p className="text-[12px] text-muted-foreground text-center py-4">
                          Ingen kontrollpunkter i denne visningen.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-2 mt-0">
          {deliveries.map(d => {
            const total = d.checklist.length;
            const doneCount = d.checklist.filter(c => c.done).length;
            const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
            const isCompleted = doneCount === total && total > 0;
            const isOpen = expandedDelivery === d.id;
            const service = d.serviceId ? getService(d.serviceId) : undefined;
            return (
              <Card key={d.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <button
                  type="button"
                  onClick={() => setExpandedDelivery(isOpen ? null : d.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30"
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isCompleted ? "bg-success/10" : "bg-primary/10"
                  )}>
                    {isCompleted
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <Package className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{d.title}</p>
                      {service?.frameworkMappings.map(m => (
                        <Badge key={m.frameworkId} variant="outline" className="text-[10px] gap-1">
                          <FileText className="h-3 w-3" />
                          {m.frameworkLabel}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{d.meta}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full transition-all", isCompleted ? "bg-success" : "bg-primary")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {doneCount}/{total}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isCompleted
                      ? "bg-success/10 text-success border-success/30"
                      : "bg-primary/10 text-primary border-primary/30"
                  )}>
                    {isCompleted ? "Levert" : "Aktiv"}
                  </Badge>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      Sjekkliste
                    </p>
                    {d.checklist.map(item => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-background cursor-pointer"
                      >
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={() => toggleChecklistItem(d.id, item.id)}
                          className="mt-0.5"
                        />
                        <span
                          className={cn(
                            "text-[13px] flex-1",
                            item.done ? "text-muted-foreground line-through" : "text-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                      </label>
                    ))}
                    {service && (
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border mt-2">
                        Mal hentet fra tjenestekatalogen — endringer her påvirker bare denne leveransen.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="catalog" className="mt-0">
          <MSPServiceCatalogTab />
        </TabsContent>
      </Tabs>

      <MSPCreateOfferDialog
        open={offerCtx.open}
        onOpenChange={(o) => setOfferCtx(s => ({ ...s, open: o }))}
        serviceTitle={offerCtx.serviceTitle}
        variant={offerCtx.variant}
        attachGap={offerCtx.attachGap}
        gapFrameworkId={offerCtx.gapFrameworkId}
        defaultTasks={offerCtx.defaultTasks}
        hourlyRate={offerCtx.hourlyRate}
      />

      <MSPGapAnalysisDialog
        open={gapOpen}
        onOpenChange={setGapOpen}
        initialFrameworkId={gapFrameworkId}
        onCreateOffer={(fwId) => {
          const rec = RECOMMENDATIONS.find(r => r.frameworkId === fwId);
          setOfferCtx({
            open: true,
            serviceTitle: rec?.title,
            variant: "Full leveranse",
            attachGap: true,
            gapFrameworkId: fwId,
            defaultTasks: rec?.tasks,
            hourlyRate: rec?.hourlyRate,
          });
        }}
      />
    </div>
  );
}

function ControlRow({ c, frameworkLabel }: { c: ControlPoint; frameworkLabel?: string }) {
  const [open, setOpen] = useState(false);

  const statusMap = {
    missing: { Icon: Circle, cls: "text-destructive", label: "Ikke oppfylt" },
    partial: { Icon: AlertCircle, cls: "text-warning", label: "Delvis oppfylt" },
    fulfilled: { Icon: CheckCircle2, cls: "text-success", label: "Oppfylt" },
  } as const;
  const capMap = {
    auto: { Icon: Bot, label: "Auto", cls: "bg-success/10 text-success border-success/30" },
    assisted: { Icon: Sparkles, label: "Assistert", cls: "bg-primary/10 text-primary border-primary/30" },
    manual: { Icon: UserIcon, label: "Manuell", cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const s = statusMap[c.status];
  const cap = capMap[c.capability];
  const StatusIcon = s.Icon;
  const CapIcon = cap.Icon;

  return (
    <Card className="p-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 text-left"
      >
        <StatusIcon className={cn("h-4 w-4 mt-0.5 shrink-0", s.cls)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{c.id}</span>
            <span className="text-sm font-semibold text-foreground">{c.name}</span>
          </div>
          <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{c.desc}</p>
        </div>
        <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", cap.cls)}>
          <CapIcon className="h-3 w-3" />
          {cap.label}
        </Badge>
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 w-9 text-right">
          {c.progress ?? 0}%
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <p className={cn("text-[12px] font-medium", s.cls)}>Status: {s.label}</p>

          {c.status !== "fulfilled" && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-foreground">
                    {c.status === "partial" ? "Lara har delvis data — dette gjenstår" : "Lara kan hjelpe deg å fylle inn dette"}
                  </p>
                  {c.source && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Lara henter dette fra: {c.source}</p>
                  )}
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Lara kan forberede et utkast basert på dataene, men trenger din godkjenning før det regnes som oppfylt.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs gap-1.5">
                  Fyll ut for kunde <ChevronRight className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <UserIcon className="h-3 w-3" />
                  Dokumenter manuelt
                </Button>
              </div>
            </div>
          )}

          {frameworkLabel && (
            <p className="text-[11px] text-muted-foreground">Referanse: {frameworkLabel} · {c.id}</p>
          )}
        </div>
      )}
    </Card>
  );
}
