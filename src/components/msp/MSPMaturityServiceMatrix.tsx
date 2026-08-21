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

import { ConfirmActivityDialog, type EvidenceFileMeta, type ConfirmPayload } from "./ConfirmActivityDialog";
import { OngoingDeliveriesList } from "./OngoingDeliveriesList";
import { toast } from "sonner";
import { PARTNER_SERVICES, getService } from "@/lib/serviceCatalog";
import { OfferListRow } from "./offers/OfferListRow";
import { ConfirmOfferAcceptanceDialog } from "./offers/ConfirmOfferAcceptanceDialog";
import { DeclineOfferDialog } from "./offers/DeclineOfferDialog";
import type { OfferApproval, PartnerOffer } from "./offers/offerTypes";

/** Navnet som registreres når partneren setter status manuelt. */
const PARTNER_STATUS_ACTOR = "Truls Hansen (partner)";

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
  /** Lesbar etikett for regelverket – brukes i tilbudet. */
  frameworkLabel?: string;
  /** Kontrollpunkter denne leveransen dekker (vises i tilbudet). */
  controlIds?: string[];
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
    frameworkLabel: "NIS2",
    controlIds: ["Art.20", "Art.21", "Art.23"],
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
    frameworkLabel: "AI Act",
    controlIds: ["Art.4", "Art.9", "Art.10", "Art.26"],
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
    frameworkLabel: "ISO 27001",
    controlIds: ["A.8.8", "A.8.29", "A.5.7"],
    openGaps: 6,
    hourlyRate: HOURLY_RATE,
    tasks: [
      { label: "Scoping og forberedelse", hours: 8, weeks: "Uke 1", owner: "Kunde" },
      { label: "Ekstern penetrasjonstest", hours: 40, weeks: "Uke 2–4", owner: "Partner" },
      { label: "Rapport og gjennomgang med kunde", hours: 12, weeks: "Uke 5", owner: "Partner" },
    ],
  },
];

type SavedOffer = PartnerOffer;

const SAVED_OFFERS_SEED: SavedOffer[] = [
  {
    id: "of-1",
    offerNumber: "T-2026-1247",
    serviceTitle: "ISO 27001-klargjøring",
    frameworkLabel: "ISO 27001",
    createdAt: "2026-05-12T09:20:00Z",
    createdBy: "Truls Hansen",
    taskCount: 3,
    totalHours: 90,
    totalPrice: 135000,
    hourlyRate: 1500,
    offerState: "accepted",
    sentAt: "2026-05-13T09:00:00Z",
    respondedAt: "2026-05-20T09:00:00Z",
    approval: {
      approvedBy: "Marte Lie",
      approverRole: "Daglig leder",
      method: "E-post",
      date: "2026-05-20",
      reference: "E-post 20.05.2026",
    },
    tasks: [
      { label: "Scoping og forankring", hours: 12 },
      { label: "Gap-analyse mot ISO 27001", hours: 38 },
      { label: "Dokumentasjon og innføring", hours: 40 },
    ],
    attachmentLabel: "Gap-analyse ISO 27001.pdf",
  },
  {
    id: "of-2",
    offerNumber: "T-2026-1231",
    serviceTitle: "Awareness-program",
    frameworkLabel: "Åpenhetsloven",
    createdAt: "2026-07-28T13:05:00Z",
    createdBy: "Truls Hansen",
    taskCount: 3,
    totalHours: 60,
    totalPrice: 90000,
    hourlyRate: 1500,
    offerState: "sent",
    sentAt: "2026-07-30T08:10:00Z",
    respondedAt: "2026-07-30T11:00:00Z",
    tasks: [
      { label: "Scoping", hours: 8 },
      { label: "Gap-analyse", hours: 22 },
      { label: "Leveranse og opplæring", hours: 30 },
    ],
    attachmentLabel: "Gap-analyse Åpenhetsloven.pdf",
  },
  {
    id: "of-3",
    offerNumber: "T-2026-1198",
    serviceTitle: "NIS2-klargjøring",
    frameworkLabel: "NIS2",
    createdAt: "2026-04-15T10:42:00Z",
    createdBy: "Anita Berg",
    taskCount: 3,
    totalHours: 100,
    totalPrice: 150000,
    hourlyRate: 1500,
    offerState: "sent",
    sentAt: "2026-04-16T10:00:00Z",
    tasks: [
      { label: "Scoping og kartlegging", hours: 20 },
      { label: "Gap-analyse mot NIS2", hours: 40 },
      { label: "Tiltaksplan og rapport", hours: 40 },
    ],
  },
  {
    id: "of-4",
    offerNumber: "T-2026-1288",
    serviceTitle: "Penetrasjonstest",
    frameworkLabel: "GDPR",
    createdAt: "2026-07-24T09:00:00Z",
    createdBy: "Truls Hansen",
    taskCount: 3,
    totalHours: 60,
    totalPrice: 90000,
    hourlyRate: 1500,
    offerState: "draft",
    tasks: [
      { label: "Scoping og forberedelse", hours: 8 },
      { label: "Ekstern penetrasjonstest", hours: 40 },
      { label: "Rapport og gjennomgang", hours: 12 },
    ],
  },
  {
    id: "of-5",
    offerNumber: "T-2026-1290",
    serviceTitle: "Personvernrutiner",
    frameworkLabel: "GDPR",
    createdAt: "2026-07-29T14:30:00Z",
    createdBy: "Anita Berg",
    taskCount: 2,
    totalHours: 24,
    totalPrice: 36000,
    hourlyRate: 1500,
    offerState: "draft",
    tasks: [
      { label: "Kartlegging av behandlinger", hours: 10 },
      { label: "Rutiner og dokumentasjon", hours: 14 },
    ],
  },
];



export type LaraStep = string | { text: string; via?: string };

export const getStepText = (s: LaraStep): string =>
  typeof s === "string" ? s : s.text;
export const getStepVia = (s: LaraStep): string | undefined =>
  typeof s === "string" ? undefined : s.via;

export type ActivityStatus = "not_started" | "in_progress" | "not_relevant" | "done";

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
            status: "in_progress",
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
            status: "not_started",
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
            status: "not_started",
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
            status: "in_progress",
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
          {
            id: "v3",
            label: "Lav-risiko funn vurdert",
            done: false,
            status: "not_relevant",
            owner: "Partner",
            note: "Kunden aksepterer restrisiko for 3 lav-funn (legacy-system fases ut Q3).",
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


  const [offerCtx, setOfferCtx] = useState<{
    open: boolean;
    serviceTitle?: string;
    variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
    attachGap?: boolean;
    gapFrameworkId?: string;
    defaultTasks?: TaskEstimate[];
    hourlyRate?: number;
    coveredControls?: Array<{ frameworkId: string; frameworkLabel: string; controlIds: string[] }>;
    coveredGaps?: { frameworkId: string; frameworkLabel: string; preselectedControlIds?: string[] };
    initialView?: "edit" | "preview";
  }>({ open: false });
  const [gapOpen, setGapOpen] = useState(false);
  const [gapFrameworkId, setGapFrameworkId] = useState<string | undefined>(undefined);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>(SAVED_OFFERS_SEED);
  const draftOffers = savedOffers.filter((o) => o.offerState === "draft");
  const sentOffers = savedOffers.filter((o) => o.offerState !== "draft");

  const [acceptCtx, setAcceptCtx] = useState<{ open: boolean; offer: SavedOffer | null }>({
    open: false,
    offer: null,
  });

  const patchOffer = (id: string, patch: Partial<SavedOffer>) =>
    setSavedOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const sendOffer = (offer: SavedOffer) => {
    patchOffer(offer.id, { offerState: "sent", sentAt: new Date().toISOString() });
    toast.success(`${offer.offerNumber} sendt til ${customerName}`);
    setActiveTab("ongoing");
  };

  const deleteDraft = (offer: SavedOffer) => {
    setSavedOffers((prev) => prev.filter((o) => o.id !== offer.id));
    toast.success(`Utkast ${offer.offerNumber} slettet`);
  };

  const [declineCtx, setDeclineCtx] = useState<{ open: boolean; offer: SavedOffer | null }>({
    open: false,
    offer: null,
  });

  const declineOffer = (offer: SavedOffer, reason = "Registrert som avslått av partner") => {
    patchOffer(offer.id, {
      offerState: "declined",
      respondedAt: new Date().toISOString(),
      declineReason: reason,
      approval: undefined,
      statusSource: "partner",
      statusSetBy: PARTNER_STATUS_ACTOR,
    });
    toast(`${offer.offerNumber} markert som avslått`);
  };

  const resetOfferToSent = (offer: SavedOffer) => {
    patchOffer(offer.id, {
      offerState: "sent",
      respondedAt: undefined,
      approval: undefined,
      declineReason: undefined,
      statusSource: "partner",
      statusSetBy: PARTNER_STATUS_ACTOR,
    });
    toast(`${offer.offerNumber} satt tilbake til venter`);
  };

  const handleSetOfferState = (
    offer: SavedOffer,
    next: "accepted" | "declined" | "sent",
  ) => {
    if (next === "accepted") setAcceptCtx({ open: true, offer });
    else if (next === "declined") setDeclineCtx({ open: true, offer });
    else resetOfferToSent(offer);
  };

  const acceptOffer = (approval: OfferApproval) => {
    const offer = acceptCtx.offer;
    if (!offer) return;
    patchOffer(offer.id, {
      offerState: "accepted",
      respondedAt: new Date(approval.date).toISOString(),
      approval,
      declineReason: undefined,
      statusSource: "partner",
      statusSetBy: PARTNER_STATUS_ACTOR,
    });
    toast.success(`${offer.offerNumber} er akseptert`, {
      description: `Godkjent av ${approval.approvedBy} · ${approval.method}. Oppdraget er klart til levering.`,
    });
  };

  const openOfferPreview = (o: SavedOffer) =>
    setOfferCtx({
      open: true,
      serviceTitle: o.serviceTitle,
      variant: "Tjeneste",
      attachGap: false,
      gapFrameworkId: undefined,
      hourlyRate: o.hourlyRate ?? (o.totalHours > 0 ? Math.round(o.totalPrice / o.totalHours) : 1500),
      defaultTasks: (o.tasks ?? [{ label: o.serviceTitle, hours: o.totalHours }]).map((t) => ({
        label: t.label,
        hours: t.hours,
        owner: "Partner" as TaskOwner,
        weeks: "",
      })),
      initialView: "preview",
    });


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
          // "Svart ut" = ferdig eller ikke relevant (begge teller mot full progress)
          const resolvedCount = activities.filter(
            a => a.status === "done" || a.status === "not_relevant" || a.done,
          ).length;
          const progress = activities.length > 0 ? Math.round((resolvedCount / activities.length) * 100) : 0;
          // Modenhet (status) — kun "done" bidrar til lukket kontroll
          const doneCount = activities.filter(a => a.status === "done" || a.done).length;
          const status: DeliveryControl["status"] =
            doneCount === activities.length && doneCount > 0
              ? "fulfilled"
              : doneCount > 0
                ? "partial"
                : "missing";
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
      done: status === "done",
      confirmedAt: isResolved ? new Date().toISOString() : undefined,
      confirmedBy: isResolved ? "Partner" : undefined,
      note: payload.note,
      evidence: payload.files,
      sharedWithCustomer: payload.sharedWithCustomer,
    }));
    if (status === "done") {
      toast.success("Spørsmål svart ut: Fullført", {
        description: "Generer sluttrapport når alle spørsmål er svart ut.",
      });
    } else if (status === "not_relevant") {
      toast.success("Spørsmål svart ut: Ikke aktuelt");
    } else if (status === "not_started") {
      toast.info("Status: Ikke påstartet");
    } else {
      toast.success("Status: Pågår");
    }
  };

  const setActivityStatus = (
    deliveryId: string,
    controlId: string,
    activityId: string,
    status: ActivityStatus,
  ) => {
    applyActivityUpdate(deliveryId, controlId, activityId, a => ({
      ...a,
      status,
      done: status === "done",
      confirmedAt: status === "done" || status === "not_relevant" ? a.confirmedAt ?? new Date().toISOString() : undefined,
      confirmedBy: status === "done" || status === "not_relevant" ? a.confirmedBy ?? "Partner" : undefined,
    }));
    const labels: Record<ActivityStatus, string> = {
      not_started: "Ikke påstartet",
      in_progress: "Pågår",
      not_relevant: "Ikke aktuelt",
      done: "Fullført",
    };
    toast.success(`Status: ${labels[status]}`);
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

      {/* Tabs: Anbefalt / Pågående */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="text-sm">
          <TabsTrigger value="recommended" className="gap-2 text-sm">
            Tjenester
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{RECOMMENDATIONS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-2 text-sm">
            Utkast
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{draftOffers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2 text-sm">
            Tilbud levert
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{sentOffers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2 text-sm">
            Pågående oppdrag
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{DELIVERIES.length}</Badge>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="recommended" className="mt-0">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Tjeneste</TableHead>
                  <TableHead className="w-[70px] text-left whitespace-nowrap">Tiltak</TableHead>
                  <TableHead className="w-[70px] text-left whitespace-nowrap">Timer</TableHead>
                  <TableHead className="w-[110px] text-left">Sum</TableHead>
                  <TableHead className="w-[110px] text-left">Regelverk</TableHead>
                  <TableHead className="w-[200px] text-left">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECOMMENDATIONS.map(r => {
                  const Icon = r.icon;
                  const isHighlighted = highlightedTitle === r.title;
                  const totalHours = r.tasks.reduce((s, t) => s + t.hours, 0);
                  const totalPrice = totalHours * r.hourlyRate;
                  return (
                    <TableRow
                      key={r.id}
                      ref={(el) => { recCardRefs.current[r.title] = el; }}
                      className={cn(isHighlighted && "bg-primary/5")}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{r.title}</div>
                            <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{r.desc}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground tabular-nums text-left">{r.tasks.length}</TableCell>
                      <TableCell className="text-[12px] text-foreground tabular-nums text-left">{totalHours}</TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-left">
                        {totalPrice.toLocaleString("nb-NO")} kr
                      </TableCell>
                      <TableCell>
                        {r.frameworkLabel ? (
                          <Badge variant="outline" className="text-xs gap-1">
                            <FileText className="h-3 w-3" />
                            {r.frameworkLabel}
                          </Badge>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                                coveredControls: r.frameworkId && r.controlIds?.length
                                  ? [{ frameworkId: r.frameworkId, frameworkLabel: r.frameworkLabel ?? r.frameworkId.toUpperCase(), controlIds: r.controlIds }]
                                  : undefined,
                                coveredGaps: r.frameworkId
                                  ? {
                                      frameworkId: r.frameworkId,
                                      frameworkLabel: r.frameworkLabel ?? r.frameworkId.toUpperCase(),
                                      preselectedControlIds: r.controlIds ?? [],
                                    }
                                  : undefined,
                              });
                            }}
                          >
                            Lag tilbud
                          </Button>
                          {r.frameworkId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => openGap(r.frameworkId)}
                            >
                              Gap-analyse
                              {typeof r.openGaps === "number" && (
                                <Badge variant="secondary" className="h-4 px-1 text-xs ml-0.5">
                                  {r.openGaps}
                                </Badge>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>


        <TabsContent value="drafts" className="mt-0">
          {draftOffers.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Ingen utkast. Bruk «Lag tilbud» på en tjeneste for å komme i gang.
            </Card>
          ) : (
            <div className="space-y-2">
              {draftOffers.map((o) => (
                <OfferListRow
                  key={o.id}
                  offer={o}
                  onOpen={openOfferPreview}
                  onSend={sendOffer}
                  onDelete={deleteDraft}
                  onDownload={(offer) => toast.success(`Lastet ned ${offer.offerNumber}.pdf`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ongoing" className="mt-0">
          {sentOffers.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Ingen tilbud er sendt til kunden enda.
            </Card>
          ) : (
            <div className="space-y-2">
              {sentOffers.map((o) => (
                <OfferListRow
                  key={o.id}
                  offer={o}
                  onAccept={(offer) => setAcceptCtx({ open: true, offer })}
                  onDecline={(offer) => setDeclineCtx({ open: true, offer })}
                  onSetState={handleSetOfferState}
                  onDownload={(offer) => toast.success(`Lastet ned ${offer.offerNumber}.pdf`)}
                />
              ))}
            </div>
          )}
        </TabsContent>






        <TabsContent value="deliveries" className="mt-0">
          <OngoingDeliveriesList
            deliveries={deliveries}
            customerName={customerName}
            customerEmail={customerEmail}
            onConfirm={confirmActivity}
            onUndo={undoActivity}
            onSetStatus={setActivityStatus}
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
        coveredControls={offerCtx.coveredControls}
        coveredGaps={offerCtx.coveredGaps}
        initialView={offerCtx.initialView}
      />

      <ConfirmOfferAcceptanceDialog
        open={acceptCtx.open}
        onOpenChange={(o) => setAcceptCtx((s) => ({ ...s, open: o }))}
        offer={acceptCtx.offer}
        customerName={customerName}
        onConfirm={acceptOffer}
      />

      <DeclineOfferDialog
        open={declineCtx.open}
        offer={declineCtx.offer}
        onOpenChange={(o) => setDeclineCtx((s) => ({ ...s, open: o }))}
        onConfirm={(reason) => declineCtx.offer && declineOffer(declineCtx.offer, reason)}
      />



      <ShareOfferDialog
        open={shareCtx.open}
        onOpenChange={(o) => setShareCtx(s => ({ ...s, open: o }))}
        offerNumber={shareCtx.offerNumber ?? ""}
        serviceTitle={shareCtx.serviceTitle}
        customerName={customerName}
        customerEmail={customerEmail}
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
        <Badge variant="outline" className={cn("text-xs gap-1 shrink-0", cap.cls)}>
          <CapIcon className="h-3 w-3" />
          {cap.label}
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-9 text-right">
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
                    <p className="text-xs text-muted-foreground mt-0.5">Lara henter dette fra: {c.source}</p>
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
            <p className="text-xs text-muted-foreground">Referanse: {frameworkLabel} · {c.id}</p>
          )}
        </div>
      )}
    </Card>
  );
}
