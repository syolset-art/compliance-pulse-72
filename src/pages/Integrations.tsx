import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import {
  Search,
  Plug,
  ArrowLeft,
  Shield,
  RefreshCw,
  Settings2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Bot,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  INTEGRATION_CATALOG,
  DISCOVERY_FILTER_LABEL,
  STATUS_LABEL,
  type DiscoveryType,
  type IntegrationDefinition,
  type IntegrationStatus,
} from "@/lib/integrationCatalog";
import { useConnectedSources } from "@/hooks/useConnectedSources";
import { ConnectIntegrationDialog } from "@/components/integrations/ConnectIntegrationDialog";
import { McpAgentConnectionsSection } from "@/components/integrations/McpAgentConnectionsSection";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";
import { LocalAgentCard } from "@/components/integrations/LocalAgentCard";
import { AgentActivityFeed, type AgentActivityItem } from "@/components/integrations/AgentActivityFeed";
import { NextSourceSuggestions } from "@/components/integrations/NextSourceSuggestions";

interface ConnectionState {
  status: IntegrationStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  discoveredSystems?: number;
  discoveredVendors?: number;
}

const DISCOVERY_FILTERS: (DiscoveryType | "all")[] = [
  "all",
  "systems",
  "vendors",
  "documents",
  "users",
];

const STATUS_STYLE: Record<IntegrationStatus, string> = {
  not_connected: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success border-success/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  expired: "bg-warning/15 text-warning border-warning/30",
};

export default function Integrations() {
  const [search, setSearch] = useState("");
  const [discovery, setDiscovery] = useState<DiscoveryType | "all">("all");
  const [activity, setActivity] = useState<AgentActivityItem[]>([]);
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const [dialogIntegration, setDialogIntegration] = useState<IntegrationDefinition | null>(null);
  const { connectSource, disconnectSource } = useConnectedSources();
  const navigate = useNavigate();


  const filtered = useMemo(() => {
    return INTEGRATION_CATALOG.filter((i) => {
      if (discovery !== "all" && !i.discovers.includes(discovery)) return false;
      if (search.trim() && !`${i.name} ${i.vendor} ${i.description}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [search, discovery]);

  const activeCount = Object.values(connections).filter((c) => c.status === "active").length;
  const discoveredTotal = Object.values(connections).reduce(
    (acc, c) => acc + (c.discoveredSystems ?? 0) + (c.discoveredVendors ?? 0),
    0,
  );

  const coveredTypes = useMemo(() => {
    const set = new Set<DiscoveryType>();
    INTEGRATION_CATALOG.forEach((i) => {
      if (connections[i.id]?.status === "active") i.discovers.forEach((d) => set.add(d));
    });
    return Array.from(set);
  }, [connections]);

  const handleConnect = (integration: IntegrationDefinition) => {
    setConnections((prev) => ({
      ...prev,
      [integration.id]: {
        status: "active",
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        discoveredSystems: integration.discovers.includes("systems") ? Math.floor(Math.random() * 24) + 3 : 0,
        discoveredVendors: integration.discovers.includes("vendors") ? Math.floor(Math.random() * 12) + 1 : 0,
      },
    }));
    connectSource(integration.id);
    setActivity((prev) => [
      {
        id: `${integration.id}-${Date.now()}`,
        source: integration.name,
        summary: `Lara startet kartlegging av ${integration.name}`,
        at: new Date().toISOString(),
        status: "pending",
      },
      ...prev,
    ]);

    toast.success(`${integration.name} koblet til`, {
      description: "Lara starter automatisk kartlegging. Oppdagede elementer krever din godkjenning.",
    });
    setDialogIntegration(null);
  };

  const handleSync = (id: string, name: string) => {
    setConnections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id]!,
        lastSyncAt: new Date().toISOString(),
        discoveredSystems: (prev[id]?.discoveredSystems ?? 0) + Math.floor(Math.random() * 3),
      },
    }));
    setActivity((prev) => [
      {
        id: `${id}-${Date.now()}`,
        source: name,
        summary: `Nye funn fra ${name} venter på godkjenning`,
        at: new Date().toISOString(),
        status: "pending",
      },
      ...prev,
    ]);
    toast.success(`${name}: synkronisering fullført`);
  };

  const handleDisconnect = (id: string, name: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    disconnectSource(id);
    toast.info(`${name} koblet fra`, { description: "Tilgangstokenet er revokert." });
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
      <div className="container mx-auto pt-16 px-6 pb-12 max-w-7xl">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Tilbake">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Datakilder og agenter</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Her henter Lara og Sara grunnlaget sitt. Du godkjenner alltid funnene før noe blir aktivt.
            </p>
          </div>
        </div>

        <TrustBoundaryStrip activeCount={activeCount} discoveredTotal={discoveredTotal} />

        <LocalAgentCard />

        <AgentActivityFeed items={activity} />

        <section className="mt-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Kildekart
            </h2>
            <span className="text-xs text-muted-foreground">Filtrer etter hva kilden gir Lara.</span>
          </div>
        </section>

        {/* Filters */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter kilde…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={discovery} onValueChange={(v) => setDiscovery(v as DiscoveryType | "all")}>
            <TabsList>
              {DISCOVERY_FILTERS.map((d) => (
                <TabsTrigger key={d} value={d} className="text-xs">
                  {d === "all" ? "Alle" : DISCOVERY_FILTER_LABEL[d]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Groups */}
        {[
          {
            key: "connected",
            title: "Tilkoblet",
            desc: "Kilder Lara henter data fra nå.",
            items: filtered.filter((i) => connections[i.id]?.status === "active"),
          },
          {
            key: "available",
            title: "Tilgjengelig nå",
            desc: "Kan kobles på i dag — kun lesetilgang.",
            items: filtered.filter(
              (i) => i.availability === "available" && connections[i.id]?.status !== "active",
            ),
          },
          {
            key: "planned",
            title: "Planlagt",
            desc: "Under arbeid. Si fra hvis du vil ha den tidlig.",
            items: filtered.filter(
              (i) => i.availability === "planned" && connections[i.id]?.status !== "active",
            ),
          },
        ]
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <section key={group.key} className="mt-8">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {group.title}
                </h2>
                <span className="text-xs text-muted-foreground">{group.desc}</span>
              </div>

              {group.key === "available" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Alle integrasjoner ber kun om lesetilgang. Mynder skriver aldri tilbake til kilden.</span>
                </div>
              )}

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((integration) => {
                  const conn = connections[integration.id];
                  const status: IntegrationStatus = conn?.status ?? "not_connected";
                  const isPlanned = group.key === "planned";
                  const Icon = integration.icon;
                  return (
                    <Card
                      key={integration.id}
                      className={`p-5 flex flex-col gap-4 transition-shadow ${
                        isPlanned ? "opacity-80 border-dashed" : "hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm truncate">{integration.name}</h3>
                          </div>
                          <div className="text-xs text-muted-foreground">{integration.vendor}</div>
                        </div>
                        {isPlanned ? (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            Kommer
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[status]}`}>
                            {status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {STATUS_LABEL[status]}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {integration.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {integration.discovers.map((d) => (
                          <Badge key={d} variant="secondary" className="text-[10px] font-normal">
                            {DISCOVERY_FILTER_LABEL[d]}
                          </Badge>
                        ))}
                      </div>

                      {conn?.status === "active" && (
                        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                          <div className="flex justify-between">
                            <span>Sist synk</span>
                            <span className="text-foreground">
                              {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString("nb-NO", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Oppdaget</span>
                            <span className="text-foreground">
                              {(conn.discoveredSystems ?? 0)} systemer, {(conn.discoveredVendors ?? 0)} leverandører
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex gap-2">
                        {isPlanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              toast.success(`Vi sier fra når ${integration.name} er klar`, {
                                description: "Interessen din er registrert hos Mynder.",
                              })
                            }
                          >
                            Gi meg beskjed
                          </Button>
                        ) : status === "not_connected" ? (
                          <Button size="sm" className="w-full" onClick={() => setDialogIntegration(integration)}>
                            <Plug className="h-3.5 w-3.5 mr-1.5" />
                            Koble til
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleSync(integration.id, integration.name)}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              Synk nå
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" className="px-2">
                                  <Settings2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Innstillinger</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="px-2 text-destructive hover:text-destructive"
                                  onClick={() => handleDisconnect(integration.id, integration.name)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Koble fra og revokér tilgang</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}

        {filtered.length === 0 && (
          <Card className="mt-6 p-12 text-center text-muted-foreground text-sm">
            Ingen kilder matcher søket.
          </Card>
        )}


        <NextSourceSuggestions covered={coveredTypes} />

        <div className="mt-10 border-t border-border pt-8">
          <McpAgentConnectionsSection />
        </div>

        <ConnectIntegrationDialog
          integration={dialogIntegration}
          onOpenChange={(open) => !open && setDialogIntegration(null)}
          onConfirm={handleConnect}
        />
      </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
