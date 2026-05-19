import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Share2 } from "lucide-react";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";
import { ShareOfferDialog } from "./ShareOfferDialog";
import { MSPServiceCatalogTab } from "./MSPServiceCatalogTab";
import { ConfirmActivityDialog, type EvidenceFileMeta, type ConfirmPayload } from "./ConfirmActivityDialog";
import { OngoingDeliveriesList } from "./OngoingDeliveriesList";
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

interface SavedOffer {
  id: string;
  offerNumber: string;
  serviceTitle: string;
  frameworkLabel?: string;
  createdAt: string; // ISO
  createdBy: string;
  taskCount: number;
  totalHours: number;
  totalPrice: number;
  status: "not_started" | "in_progress";
}

const SAVED_OFFERS_SEED: SavedOffer[] = [
  {
    id: "of-1",
    offerNumber: "T-2026-1247",
    serviceTitle: "ISO 27001-klargjøring",
    frameworkLabel: "ISO 27001",
    createdAt: "2026-05-12T09:20:00Z",
    createdBy: "Truls Hansen",
    taskCount: 6,
    totalHours: 90,
    totalPrice: 135000,
    status: "in_progress",
  },
  {
    id: "of-2",
    offerNumber: "T-2026-1231",
    serviceTitle: "Awareness-program",
    frameworkLabel: "ISO 27001",
    createdAt: "2026-04-28T13:05:00Z",
    createdBy: "Truls Hansen",
    taskCount: 4,
    totalHours: 60,
    totalPrice: 90000,
    status: "not_started",
  },
  {
    id: "of-3",
    offerNumber: "T-2026-1198",
    serviceTitle: "NIS2-klargjøring",
    frameworkLabel: "NIS2",
    createdAt: "2026-04-15T10:42:00Z",
    createdBy: "Anita Berg",
    taskCount: 5,
    totalHours: 100,
    totalPrice: 150000,
    status: "not_started",
  },
];


export type LaraStep = string | { text: string; via?: string };

export const getStepText = (s: LaraStep): string =>
  typeof s === "string" ? s : s.text;
export const getStepVia = (s: LaraStep): string | undefined =>
  typeof s === "string" ? undefined : s.via;

export type ActivityStatus = "in_progress" | "not_relevant" | "done";

export interface DeliveryActivity {
  id: string;
  label: string;
  done: boolean;
  status?: ActivityStatus;
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
            laraSteps: [
              { text: "Valgt phishing-mal «Microsoft 365 passordvarsel»", via: "KnowBe4" },
              { text: "Bygget mottakerliste: 142 ansatte fra HR-synk", via: "Entra ID" },
              { text: "Trigget kampanje, spredt utsending over 48 t", via: "KnowBe4" },
              { text: "Samlet klikk- og rapporterings-statistikk i sanntid", via: "KnowBe4" },
              { text: "Mappet baseline mot ISO 27001 A.6.3", via: "Lara" },
            ],
            partnerSteps: ["Godkjent phishing-scenario før utsending (etisk sjekk)", "Validert at HR-listen var fersk"],
          },
          {
            id: "a2",
            label: "Kvartalsvis e-læring rullet ut (Q1)",
            done: true,
            owner: "Partner",
            date: "5. mar",
            laraSteps: [
              { text: "Generert deltakerliste fra HR (142 ansatte)", via: "Entra ID" },
              { text: "Tildelt e-læringsmodul «Awareness Q1»", via: "Microsoft 365 Learning" },
              { text: "Sendt invitasjon og 4 påminnelser", via: "Outlook" },
              { text: "Samlet gjennomføringsdata: 138/142 (97 %)", via: "Microsoft 365 Learning" },
              { text: "Generert PDF-rapport med snitt-score 86 %", via: "Lara" },
            ],
            partnerSteps: [
              "Validere at e-læringsinnholdet er oppdatert",
              "Følge opp 4 ansatte som krevde påminnelse",
            ],
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
              { text: "Identifisert 8 personer i ledergruppen via gruppe «Leadership»", via: "Entra ID" },
              { text: "Tilpasset agenda per rolle (CEO, CFO, CTO …)", via: "Lara" },
              { text: "Lagt møteinvitasjon i kalenderen — venter godkjenning", via: "Outlook" },
              { text: "Pre-arbeid (10 min e-læring) tildelt deltakerne", via: "Microsoft 365 Learning" },
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
            laraSteps: [
              { text: "Hentet baseline fra Q1: 18 % klikk, 24 % rapportert", via: "KnowBe4" },
              { text: "Valgt nytt scenario «DHL pakkesporing» (unngår gjenkjenning)", via: "KnowBe4" },
              { text: "Bygget mottakerliste: 138 ansatte, eksklud. nyansatte <14 d", via: "Entra ID" },
              { text: "Planlagt utsending tirs–ons (spredt over 48 t)", via: "KnowBe4" },
              { text: "Samler klikk/rapportering i sanntid", via: "KnowBe4" },
              { text: "Genererer trendrapport: forventet 18 % → 9 % klikk-rate", via: "Lara" },
              { text: "Mapper resultat til ISO 27001 A.6.3", via: "Lara" },
            ],
            partnerSteps: [
              "Godkjenne phishing-scenario før utsending (etisk sjekk)",
              "1:1-samtale med repeat offenders fra Q1",
              "Presentere trendrapport for kundens ledergruppe",
            ],
            laraDraft: {
              title: "Phishing re-test Q2 — effektmåling",
              fileName: "phishing-retest-Q2-2025-rapport.pdf",
              summary: [
                "Klikk-rate: 18 % (Q1) → 9 % (Q2) — 50 % forbedring",
                "Rapporterings-rate: 24 % → 41 %",
                "3 repeat offenders identifisert anonymisert",
                "Foreslåtte tiltak per gruppe inkludert",
              ],
            },
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
            laraSteps: [
              { text: "Booket workshop og sendt agenda til 12 deltakere", via: "Outlook" },
              { text: "Transkribert opptak og oppsummert innspill", via: "Lara" },
            ],
          },
          {
            id: "b2",
            label: "Utkast til policy lagt frem",
            done: false,
            owner: "Partner",
            date: "10. mai",
            laraSteps: [
              { text: "Skrevet policy-utkast basert på ISO 27001 Annex A.5.10", via: "Lara" },
              { text: "Hentet kundens domene, roller og M365-verktøy", via: "Microsoft 365" },
              { text: "Krysssjekket mot eksisterende personvernerklæring", via: "Lara" },
              { text: "Lagret utkast i kundens dokumentbibliotek", via: "SharePoint" },
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
            laraSteps: [
              { text: "Lagt intranett-melding klar for publisering", via: "SharePoint" },
              { text: "Generert e-postmal til alle ansatte", via: "Outlook" },
            ],
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
            laraSteps: [
              { text: "Hentet kritiske CVE-funn og status", via: "Tenable" },
              { text: "Verifisert at patch er rullet ut til 100 % av endepunkter", via: "Microsoft Defender" },
              { text: "Mappet lukkede funn mot ISO 27001 A.8.8", via: "Lara" },
            ],
          },
          {
            id: "v2",
            label: "Middels funn under retting",
            done: false,
            owner: "Kunde",
            date: "15. mai",
            laraSteps: [
              { text: "Identifisert 6 middels CVE-funn", via: "Tenable" },
              { text: "Foreslått eier per funn basert på asset-tagging", via: "Lara" },
              { text: "Opprettet oppfølgings-tickets med 30 d SLA", via: "Jira" },
              { text: "Identifisert patche-vindu helg 18. mai", via: "Microsoft Defender" },
            ],
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

interface MSPMaturityServiceMatrixProps {
  customerName?: string;
  customerEmail?: string;
}

export function MSPMaturityServiceMatrix({
  customerName = "Kunden",
  customerEmail,
}: MSPMaturityServiceMatrixProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("service") ? "recommended" : "recommended",
  );
  const [highlightedTitle, setHighlightedTitle] = useState<string | null>(null);
  const recCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const svc = searchParams.get("service");
    if (!svc) return;
    setActiveTab("recommended");
    // wait for tab render
    const t = setTimeout(() => {
      const el = recCardRefs.current[svc];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedTitle(svc);
        setTimeout(() => setHighlightedTitle(null), 2400);
      }
      // clean param so navigation back doesn't re-trigger
      const next = new URLSearchParams(searchParams);
      next.delete("service");
      setSearchParams(next, { replace: true });
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>(SAVED_OFFERS_SEED);

  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(DELIVERIES);
  const [expandedDelivery, setExpandedDelivery] = useState<string | null>("d1");
  const [shareCtx, setShareCtx] = useState<{ open: boolean; offerNumber?: string; serviceTitle?: string }>({ open: false });

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
    const status = payload.status ?? "done";
    const isResolved = status === "done" || status === "not_relevant";
    applyActivityUpdate(deliveryId, controlId, activityId, a => ({
      ...a,
      status,
      done: isResolved,
      confirmedAt: isResolved ? new Date().toISOString() : undefined,
      confirmedBy: isResolved ? "Partner" : undefined,
      note: payload.note,
      evidence: payload.files,
      sharedWithCustomer: payload.sharedWithCustomer,
    }));
    if (status === "done") {
      toast.success("Aktivitet markert som ferdig", {
        description: "Generer sluttrapport når alle aktivitetene er ferdige.",
      });
    } else if (status === "not_relevant") {
      toast.success("Aktivitet markert som ikke relevant");
    } else {
      toast.success("Aktivitet oppdatert", { description: "Status: pågår" });
    }
  };

  const undoActivity = (deliveryId: string, controlId: string, activityId: string) => {
    applyActivityUpdate(deliveryId, controlId, activityId, a => ({
      ...a,
      done: false,
      status: "in_progress",
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList>
          <TabsTrigger value="recommended" className="gap-2">
            Anbefalte tjenester
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{RECOMMENDATIONS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            Tilbud
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{savedOffers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2">
            Pågående oppdrag
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{DELIVERIES.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-2 mt-0">
          {RECOMMENDATIONS.map(r => {
            const Icon = r.icon;
            const isHighlighted = highlightedTitle === r.title;
            return (
              <Card
                key={r.id}
                ref={(el) => { recCardRefs.current[r.title] = el; }}
                className={cn(
                  "p-4 hover:border-primary/30 transition-all",
                  isHighlighted && "ring-2 ring-primary/50 border-primary/50 shadow-lg",
                )}
              >

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

        <TabsContent value="ongoing" className="mt-0">
          {savedOffers.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Ingen tilbud er lagret enda. Bruk "Lag tilbud" på en anbefalt tjeneste for å komme i gang.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Tilbudsnr.</TableHead>
                    <TableHead>Tjeneste</TableHead>
                    <TableHead className="w-[120px]">Regelverk</TableHead>
                    <TableHead className="w-[120px]">Laget</TableHead>
                    <TableHead className="w-[140px]">Av</TableHead>
                    <TableHead className="w-[140px] text-right">Sum</TableHead>
                    <TableHead className="w-[100px] text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedOffers.map(o => {
                    const created = new Date(o.createdAt).toLocaleDateString("nb-NO", {
                      day: "2-digit", month: "short", year: "numeric",
                    });
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">
                          {o.offerNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground text-sm">{o.serviceTitle}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {o.taskCount} tiltak · {o.totalHours} timer
                          </div>
                        </TableCell>
                        <TableCell>
                          {o.frameworkLabel ? (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <FileText className="h-3 w-3" />
                              {o.frameworkLabel}
                            </Badge>
                          ) : (
                            <span className="text-[12px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">{created}</TableCell>
                        <TableCell className="text-[12px] text-foreground">{o.createdBy}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {o.totalPrice.toLocaleString("nb-NO")} kr
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Del tilbud"
                              onClick={() => setShareCtx({ open: true, offerNumber: o.offerNumber, serviceTitle: o.serviceTitle })}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Last ned PDF"
                              onClick={() => toast.success(`Lastet ned ${o.offerNumber}.pdf`)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>





        <TabsContent value="deliveries" className="mt-0">
          <OngoingDeliveriesList
            deliveries={deliveries}
            customerName={customerName}
            customerEmail={customerEmail}
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
