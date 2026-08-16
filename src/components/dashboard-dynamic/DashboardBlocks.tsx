import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cloud,
  FileCheck2,
  Package,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardModuleKey } from "@/lib/dashboardModules";

export interface BlockProps {
  isNb: boolean;
  active: Set<DashboardModuleKey>;
}

/* ---------- felles byggeklosser ---------- */

function BlockCard({
  icon: Icon,
  title,
  action,
  to,
  children,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action: string;
  to: string;
  children: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-md",
        tone === "accent" && "border-primary/30 bg-primary/[0.03]"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex-1 space-y-2 text-sm">{children}</div>
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {action}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function Line({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          tone === "ok" && "text-success",
          tone === "warn" && "text-warning",
          tone === "bad" && "text-destructive",
          !tone && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- alltid synlige blokker ---------- */

export function LaraGreetingBlock({ isNb, active }: BlockProps) {
  const names: Record<DashboardModuleKey, string> = {
    frameworks: isNb ? "Regelverk" : "Regulations",
    trust: "Trust Center",
    vendors: isNb ? "Leverandører" : "Vendors",
    core: "Core",
    assets: isNb ? "Eiendeler" : "Assets",
  };
  const list = [...active].map((k) => names[k]);

  return (
    <Card className="flex flex-col gap-2 border-primary/25 bg-gradient-to-r from-primary/[0.07] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {list.length === 0
              ? isNb
                ? "Ingen produkter er aktivert ennå"
                : "No products activated yet"
              : isNb
                ? `Dashbordet er satt opp for ${list.join(", ")}`
                : `Dashboard configured for ${list.join(", ")}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {list.length === 0
              ? isNb
                ? "Velg et startpunkt nedenfor, så bygger jeg opp arbeidsflaten din."
                : "Pick a starting point below and I'll build your workspace."
              : isNb
                ? "Jeg viser bare det som er relevant for produktene dere har aktivert."
                : "I only show what's relevant to the products you've activated."}
          </p>
        </div>
      </div>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((n) => (
            <Badge key={n} variant="secondary" className="text-[0.7rem]">
              {n}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export function MaturityBlock({ isNb, active }: BlockProps) {
  // Modenhet bygges av det som faktisk er aktivert.
  const areas = [
    { key: "governance", label_no: "Styring", label_en: "Governance", score: active.has("frameworks") ? 62 : 24 },
    { key: "operations", label_no: "Drift og sikkerhet", label_en: "Operations", score: active.has("core") ? 58 : 20 },
    { key: "identityAccess", label_no: "Identitet og tilgang", label_en: "Identity & access", score: active.has("assets") ? 49 : 18 },
    { key: "privacy", label_no: "Personvern og data", label_en: "Privacy & data", score: active.has("frameworks") ? 54 : 22 },
    { key: "vendor", label_no: "Tredjepart", label_en: "Third party", score: active.has("vendors") ? 51 : 15 },
  ];
  const avg = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">
            {isNb ? "Samlet modenhet" : "Overall maturity"}
          </h3>
        </div>
        <span className="text-2xl font-bold tabular-nums text-foreground">{avg}%</span>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <div key={a.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{isNb ? a.label_no : a.label_en}</span>
              <span className="tabular-nums text-foreground/80">{a.score}%</span>
            </div>
            <Progress value={a.score} className="h-1.5" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WorkQueueBlock({ isNb, active }: BlockProps) {
  const items = [
    active.has("frameworks") && {
      label_no: "3 krav mangler bevis i GDPR",
      label_en: "3 requirements lack evidence in GDPR",
      to: "/regulations",
    },
    active.has("vendors") && {
      label_no: "2 databehandleravtaler utløper innen 30 dager",
      label_en: "2 DPAs expire within 30 days",
      to: "/vendors",
    },
    active.has("core") && {
      label_no: "1 avvik venter på ansvarlig",
      label_en: "1 deviation awaiting an owner",
      to: "/deviations",
    },
    active.has("assets") && {
      label_no: "4 oppdagede enheter er ikke klassifisert",
      label_en: "4 discovered devices are unclassified",
      to: "/assets",
    },
    active.has("trust") && {
      label_no: "1 kundeforespørsel venter på svar",
      label_en: "1 customer request awaiting reply",
      to: "/customer-requests",
    },
  ].filter(Boolean) as { label_no: string; label_en: string; to: string }[];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{isNb ? "Laras arbeidskø" : "Lara's work queue"}</h3>
        <Badge variant="secondary" className="ml-auto text-[0.7rem]">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isNb ? "Ingenting venter på deg akkurat nå." : "Nothing waiting for you right now."}
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.slice(0, 4).map((i) => (
            <li key={i.label_en}>
              <Link
                to={i.to}
                className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary"
              >
                <span>{isNb ? i.label_no : i.label_en}</span>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- modulblokker ---------- */

export function FrameworksBlock({ isNb }: BlockProps) {
  return (
    <BlockCard
      icon={Scale}
      title={isNb ? "Regelverk i scope" : "Regulations in scope"}
      action={isNb ? "Jobb med regelverk" : "Work on regulations"}
      to="/regulations"
    >
      <Line label={isNb ? "Aktive regelverk" : "Active regulations" } value="3" />
      <Line label={isNb ? "Krav besvart" : "Requirements answered"} value="48 / 71" tone="warn" />
      <Line label={isNb ? "Krav uten bevis" : "Requirements without evidence"} value="12" tone="bad" />
    </BlockCard>
  );
}

export function TrustBlock({ isNb }: BlockProps) {
  return (
    <BlockCard
      icon={Shield}
      title="Trust Center"
      action={isNb ? "Åpne trust-profilen" : "Open trust profile"}
      to="/trust-center/profile"
    >
      <Line label={isNb ? "Profilstatus" : "Profile status"} value={isNb ? "Publisert" : "Published"} tone="ok" />
      <Line label={isNb ? "Aktive delinger" : "Active shares"} value="4" />
      <Line label={isNb ? "Ubesvarte forespørsler" : "Open requests"} value="1" tone="warn" />
    </BlockCard>
  );
}

export function VendorsBlock({ isNb }: BlockProps) {
  return (
    <BlockCard
      icon={Building2}
      title={isNb ? "Leverandører" : "Vendors"}
      action={isNb ? "Åpne leverandørregisteret" : "Open vendor register"}
      to="/vendors"
    >
      <Line label={isNb ? "Registrerte" : "Registered"} value="18" />
      <Line label={isNb ? "Høy risiko" : "High risk"} value="3" tone="bad" />
      <Line label={isNb ? "Avtaler utløper (30 d)" : "Agreements expiring (30 d)"} value="2" tone="warn" />
    </BlockCard>
  );
}

export function CoreBlock({ isNb }: BlockProps) {
  return (
    <BlockCard
      icon={ClipboardList}
      title="Core"
      action={isNb ? "Åpne oppgaver" : "Open tasks"}
      to="/tasks"
    >
      <Line label={isNb ? "Åpne oppgaver" : "Open tasks"} value="9" />
      <Line label={isNb ? "Avvik under arbeid" : "Deviations in progress"} value="2" tone="warn" />
      <Line label={isNb ? "Behandlinger i protokollen" : "Records in RoPA"} value="14" tone="ok" />
    </BlockCard>
  );
}

export function AssetsBlock({ isNb }: BlockProps) {
  return (
    <BlockCard
      icon={Package}
      title={isNb ? "Eiendeler" : "Assets"}
      action={isNb ? "Åpne eiendeler" : "Open assets"}
      to="/assets"
    >
      <Line label={isNb ? "Registrerte eiendeler" : "Registered assets"} value="26" />
      <Line label={isNb ? "Oppdaget via Acronis" : "Discovered via Acronis"} value="4" tone="warn" />
      <Line label={isNb ? "Uten eier" : "Without owner"} value="3" tone="bad" />
    </BlockCard>
  );
}

/* ---------- aktiveringskort ---------- */

export function ActivationCard({
  isNb,
  moduleKey,
}: {
  isNb: boolean;
  moduleKey: DashboardModuleKey;
}) {
  const meta: Record<
    DashboardModuleKey,
    { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }
  > = {
    frameworks: {
      icon: Scale,
      title: isNb ? "Regelverk" : "Regulations",
      desc: isNb
        ? "Velg regelverkene dere må etterleve — Trust Center følger med."
        : "Pick the regulations you must comply with — Trust Center is included.",
    },
    trust: {
      icon: Shield,
      title: "Trust Center",
      desc: isNb
        ? "Samle modenhet og bevis i én delbar profil."
        : "Collect maturity and evidence in one shareable profile.",
    },
    vendors: {
      icon: Building2,
      title: isNb ? "Leverandørmodul" : "Vendor module",
      desc: isNb
        ? "Kartlegg og følg opp leverandører og databehandlere."
        : "Map and follow up vendors and processors.",
    },
    core: {
      icon: Cloud,
      title: "Core",
      desc: isNb
        ? "Systemer, oppgaver, avvik og behandlingsprotokoll."
        : "Systems, tasks, deviations and processing records.",
    },
    assets: {
      icon: Package,
      title: isNb ? "Eiendeler" : "Assets",
      desc: isNb
        ? "Register over enheter og eiendeler per arbeidsområde."
        : "Register of devices and assets per work area.",
    },
  };
  const m = meta[moduleKey];

  return (
    <Card className="flex h-full flex-col gap-2 border-dashed p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <m.icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground/80">{m.title}</h3>
      </div>
      <p className="flex-1 text-xs text-muted-foreground">{m.desc}</p>
      <Button asChild size="sm" variant="outline" className="w-fit">
        <Link to="/subscriptions">{isNb ? "Aktiver" : "Activate"}</Link>
      </Button>
    </Card>
  );
}

export function EmptyStateBlock({ isNb }: { isNb: boolean }) {
  return (
    <Card className="flex flex-col items-start gap-2 border-primary/25 bg-primary/[0.03] p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{isNb ? "Kom i gang" : "Get started"}</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {isNb
          ? "Start med ett regelverk. Trust Center blir automatisk tilgjengelig, og dashbordet fylles ut etter hvert som dere aktiverer flere produkter."
          : "Start with one regulation. Trust Center becomes available automatically, and the dashboard fills in as you activate more products."}
      </p>
      <Button asChild size="sm">
        <Link to="/subscriptions">{isNb ? "Velg første produkt" : "Choose first product"}</Link>
      </Button>
    </Card>
  );
}

export const BLOCK_ICONS = { AlertTriangle, FileCheck2 };
