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
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";

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

interface DeliveryItem {
  id: string;
  title: string;
  meta: string;
  status: "active" | "completed";
  progress?: number;
}

const DELIVERIES: DeliveryItem[] = [
  {
    id: "d1",
    title: "Awareness-program 2025",
    meta: "Løpende leveranse · Neste kampanje 20. mai",
    status: "active",
    progress: 45,
  },
  {
    id: "d2",
    title: "Penetrasjonstest – Q1 2025",
    meta: "Levert 14. mars · Rapport sendt til Truls",
    status: "completed",
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
                Du har {RECOMMENDATIONS.length} tjenestemuligheter som matcher denne kundens behov
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
            return (
              <Card key={o.id} className="p-3 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isPending ? "bg-warning/10" : "bg-success/10"
                  )}>
                    {isPending
                      ? <Clock className="h-4 w-4 text-warning" />
                      : <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
                    <p className="text-[12px] text-muted-foreground">{o.meta}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isPending ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"
                  )}>
                    {isPending ? "Venter" : "Akseptert"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-2 mt-0">
          {DELIVERIES.map(d => {
            const isActive = d.status === "active";
            return (
              <Card key={d.id} className="p-3 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isActive ? "bg-primary/10" : "bg-success/10"
                  )}>
                    {isActive
                      ? <Package className="h-4 w-4 text-primary" />
                      : <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{d.title}</p>
                    <p className="text-[12px] text-muted-foreground">{d.meta}</p>
                    {isActive && typeof d.progress === "number" && (
                      <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${d.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    isActive ? "bg-primary/10 text-primary border-primary/30" : "bg-success/10 text-success border-success/30"
                  )}>
                    {isActive ? "Aktiv" : "Levert"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            );
          })}
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
