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
import { ConfirmActivityDialog, type EvidenceFileMeta, type ConfirmPayload } from "./ConfirmActivityDialog";
import { DeliveryWizard } from "./DeliveryWizard";
import { toast } from "sonner";
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
      { label: "Ledelsesgjennomgang", hours: 10, weeks: "Uke 9–10", owner: "Kunde" },
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

export interface DeliveryActivity {
  id: string;
  label: string;
  done: boolean;
  owner?: TaskOwner;
  date?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  note?: string;
  evidence?: EvidenceFileMeta[];
  sharedWithCustomer?: boolean;
  laraSteps?: LaraStep[];
  partnerSteps?: string[];
  laraDraft?: {
    title: string;
    fileName: string;
    summary: string[];
  };
}

export interface DeliveryControl {
  id: string; // f.eks. "A.6.3"
  name: string;
  status: "missing" | "partial" | "fulfilled";
  progress: number; // 0-100
  activities: DeliveryActivity[];
}

export interface DeliveryItem {
  id: string;
  title: string;
  meta: string;
  serviceId?: string;
  controls: DeliveryControl[];
}

const DELIVERIES: DeliveryItem[] = [
  {
    id: "d1",
    title: "Awareness-program 2025",
    meta: "Løpende leveranse · Neste kampanje 20. mai",
    serviceId: "awareness",
    controls: [
      {
        id: "A.6.3",
        name: "Sikkerhetsbevissthet, opplæring og trening",
        status: "partial",
        progress: 60,
        activities: [
          {
            id: "a1",
            label: "Baselinemåling phishing-simulering",
            done: true,
            owner: "Partner",
            date: "12. feb",
            laraSteps: ["Konfigurert phishing-mal", "Sendt til 142 mottakere", "Samlet klikk-statistikk"],
            partnerSteps: ["Godkjent phishing-scenario før utsending", "Validert at HR-listen var fersk"],
          },
          {
            id: "a2",
            label: "Kvartalsvis e-læring rullet ut (Q1)",
            done: true,
            owner: "Partner",
            date: "5. mar",
            laraSteps: ["Generert deltakerliste fra HR", "Sendt invitasjon via Outlook", "Samlet gjennomføringsrapport"],
            laraDraft: {
              title: "Gjennomføringsrapport Q1 e-læring",
              fileName: "elearning-Q1-2025-rapport.pdf",
              summary: [
                "138 av 142 ansatte fullført (97 %)",
                "Snitt-score: 86 % korrekt",
                "4 påminnelser sendt — alle besvart",
                "Klart for kvittering i Trust Profile",
              ],
            },
          },
          {
            id: "a3",
            label: "Målrettet opplæring for ledergruppen",
            done: false,
            owner: "Partner",
            date: "20. mai",
            laraSteps: [
              "Identifisert 8 personer i ledergruppen",
              "Tilpasset innhold basert på rolle (CEO, CFO, CTO …)",
              "Booking-utkast lagt i Outlook — venter på din godkjenning",
            ],
            partnerSteps: [
              "Bekrefte tidspunkt med CEO",
              "Lede selve workshopen (60 min)",
              "Signere oppmøteliste etter gjennomføring",
            ],
            laraDraft: {
              title: "Workshop-agenda for ledergruppen",
              fileName: "ledergruppe-awareness-mai-2025.pdf",
              summary: [
                "60 min workshop · 20. mai kl. 09:00",
                "Tema: målrettede CEO-svindelforsøk + GDPR-ansvar",
                "Pre-arbeid: 10 min e-læring",
                "Etter: kort oppsummering signert av deltakerne",
              ],
            },
          },
          {
            id: "a4",
            label: "Re-test phishing og rapportering",
            done: false,
            owner: "Partner",
            date: "15. jun",
            laraSteps: ["Re-test planlagt i juni", "Måler effekt av Q1-opplæring"],
          },
        ],
      },
      {
        id: "A.5.10",
        name: "Akseptabel bruk av informasjonsmidler",
        status: "missing",
        progress: 20,
        activities: [
          {
            id: "b1",
            label: "Workshop med kunde for å forankre policy",
            done: true,
            owner: "Kunde",
            date: "18. apr",
            laraSteps: ["Workshop avholdt", "Innspill samlet"],
          },
          {
            id: "b2",
            label: "Utkast til policy lagt frem",
            done: false,
            owner: "Partner",
            date: "10. mai",
            laraSteps: [
              "Skrevet utkast basert på ISO 27001 Annex A.5.10",
              "Tilpasset kundens domene, roller og verktøy",
              "Sjekket mot eksisterende personvernerklæring",
            ],
            partnerSteps: [
              "Kvalitetssjekke språk og tone mot kundens profil",
              "Hente inn juridisk signatur fra kundens DPO",
            ],
            laraDraft: {
              title: "Policy for akseptabel bruk",
              fileName: "policy-akseptabel-bruk-v1.pdf",
              summary: [
                "Gjelder alle ansatte og innleide",
                "Dekker e-post, internett, BYOD, AI-verktøy",
                "Henvisning til varslingsrutine",
                "Klar for kundens signatur",
              ],
            },
          },
          {
            id: "b3",
            label: "Kommunisert til alle ansatte",
            done: false,
            owner: "Kunde",
            laraSteps: ["Utkast til intranett-melding lagt klar", "E-postmal generert"],
          },
        ],
      },
    ],
  },
  {
    id: "d2",
    title: "Penetrasjonstest – Q1 2025",
    meta: "Levert 14. mars · Rapport sendt til Truls",
    serviceId: "pentest",
    controls: [
      {
        id: "A.8.29",
        name: "Sikkerhetstesting under utvikling og aksept",
        status: "fulfilled",
        progress: 100,
        activities: [
          { id: "p1", label: "Scoping og avtale signert", done: true, owner: "Partner", date: "20. jan" },
          { id: "p2", label: "Ekstern penetrasjonstest gjennomført", done: true, owner: "Partner", date: "10. feb" },
          { id: "p3", label: "Rapport levert med funn og tiltak", done: true, owner: "Partner", date: "14. mar" },
          { id: "p4", label: "Gjennomgang med kundens ledelse", done: true, owner: "Partner", date: "21. mar" },
        ],
      },
      {
        id: "A.8.8",
        name: "Sårbarhetshåndtering",
        status: "partial",
        progress: 50,
        activities: [
          {
            id: "v1",
            label: "Kritiske funn lukket innen SLA",
            done: true,
            owner: "Kunde",
            date: "28. mar",
            laraSteps: ["Hentet sårbarhetsrapport", "Mappet funn mot kontroller"],
          },
          {
            id: "v2",
            label: "Middels funn under retting",
            done: false,
            owner: "Kunde",
            date: "15. mai",
            laraSteps: ["6 middels funn identifisert", "Tiltaksforslag generert per funn"],
            partnerSteps: ["Avklare patche-vindu med drift", "Følge opp eier per funn ukentlig"],
            laraDraft: {
              title: "Tiltaksplan — middels sårbarheter",
              fileName: "tiltaksplan-middels-mai-2025.pdf",
              summary: [
                "6 funn med foreslått eier og frist",
                "Patche-vindu identifisert (helg 18. mai)",
                "SLA: 30 dager fra rapport",
                "Klar for godkjenning av kunde",
              ],
            },
          },
        ],
      },
    ],
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

  const [confirmCtx, setConfirmCtx] = useState<{
    open: boolean;
    deliveryId?: string;
    controlId?: string;
    activityId?: string;
    readOnly?: boolean;
  }>({ open: false });

  const applyActivityUpdate = (
    deliveryId: string,
    controlId: string,
    activityId: string,
    updater: (a: DeliveryActivity) => DeliveryActivity,
  ) => {
    setDeliveries(prev =>
      prev.map(d => {
        if (d.id !== deliveryId) return d;
        const controls = d.controls.map(c => {
          if (c.id !== controlId) return c;
          const activities = c.activities.map(a => (a.id === activityId ? updater(a) : a));
          const doneCount = activities.filter(a => a.done).length;
          const progress = activities.length > 0 ? Math.round((doneCount / activities.length) * 100) : 0;
          const status: DeliveryControl["status"] =
            progress >= 100 ? "fulfilled" : progress > 0 ? "partial" : "missing";
          return { ...c, activities, progress, status };
        });
        return { ...d, controls };
      }),
    );
  };

  const confirmActivity = (
    deliveryId: string,
    controlId: string,
    activityId: string,
    payload: ConfirmPayload,
  ) => {
    applyActivityUpdate(deliveryId, controlId, activityId, a => ({
      ...a,
      done: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: "Partner",
      note: payload.note,
      evidence: payload.files,
      sharedWithCustomer: payload.sharedWithCustomer,
    }));
    toast.success("Aktivitet bekreftet — Trust Profile oppdatert", {
      description: payload.files.length > 0
        ? `${payload.files.length} bevis lagt ved${payload.sharedWithCustomer ? " · Kunden varsles" : ""}`
        : payload.sharedWithCustomer ? "Kunden varsles" : undefined,
    });
  };

  const undoActivity = (deliveryId: string, controlId: string, activityId: string) => {
    applyActivityUpdate(deliveryId, controlId, activityId, a => ({
      ...a,
      done: false,
      confirmedAt: undefined,
      confirmedBy: undefined,
      note: undefined,
      evidence: undefined,
      sharedWithCustomer: undefined,
    }));
    toast.info("Bekreftelse angret");
  };

  const confirmCtxActivity = (() => {
    if (!confirmCtx.open) return null;
    const d = deliveries.find(x => x.id === confirmCtx.deliveryId);
    const c = d?.controls.find(x => x.id === confirmCtx.controlId);
    const a = c?.activities.find(x => x.id === confirmCtx.activityId);
    if (!d || !c || !a) return null;
    const service = d.serviceId ? getService(d.serviceId) : undefined;
    return { d, c, a, frameworkLabel: service?.frameworkMappings?.[0]?.frameworkLabel };
  })();

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
            Anbefalte tjenester
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{RECOMMENDATIONS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            Tilbud levert
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{ONGOING.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2">
            Pågående oppdrag
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

        <TabsContent value="deliveries" className="mt-0">
          <DeliveryWizard
            deliveries={deliveries}
            onConfirm={confirmActivity}
            onUndo={undoActivity}
          />
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

      {confirmCtxActivity && (
        <ConfirmActivityDialog
          open={confirmCtx.open}
          onOpenChange={(o) => setConfirmCtx((s) => ({ ...s, open: o }))}
          activityLabel={confirmCtxActivity.a.label}
          controlId={confirmCtxActivity.c.id}
          controlName={confirmCtxActivity.c.name}
          frameworkLabel={confirmCtxActivity.frameworkLabel}
          readOnly={confirmCtx.readOnly}
          initial={{
            note: confirmCtxActivity.a.note,
            files: confirmCtxActivity.a.evidence,
            sharedWithCustomer: confirmCtxActivity.a.sharedWithCustomer,
          }}
          onConfirm={(payload) =>
            confirmActivity(
              confirmCtxActivity.d.id,
              confirmCtxActivity.c.id,
              confirmCtxActivity.a.id,
              payload,
            )
          }
        />
      )}
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
