import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bot, Check, Database, MoreVertical, RefreshCw, ChevronDown } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  SOURCE_CATEGORY_LABELS,
  SOURCE_CONNECTIONS_EVENT,
  SOURCE_SYSTEMS,
  connectSource,
  disconnectSource,
  formatRelative,
  listSourceConnections,
  syncSource,
  type SourceCategory,
  type SourceConnection,
} from "@/lib/sourceSystems";

export default function SourceSystems() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [connections, setConnections] = useState<SourceConnection[]>([]);
  const [showHow, setShowHow] = useState(false);

  useEffect(() => {
    const sync = () => setConnections(listSourceConnections());
    sync();
    window.addEventListener(SOURCE_CONNECTIONS_EVENT, sync);
    return () => window.removeEventListener(SOURCE_CONNECTIONS_EVENT, sync);
  }, []);

  const connectedIds = useMemo(() => new Set(connections.map((c) => c.sourceId)), [connections]);
  const connected = SOURCE_SYSTEMS.filter((s) => connectedIds.has(s.id));
  const available = SOURCE_SYSTEMS.filter((s) => !connectedIds.has(s.id));

  const byCategory = useMemo(() => {
    const map = new Map<SourceCategory, typeof available>();
    available.forEach((s) => {
      map.set(s.category, [...(map.get(s.category) ?? []), s]);
    });
    return Array.from(map.entries());
  }, [available]);

  const handleConnect = (id: string, name: string) => {
    connectSource(id);
    toast.success(
      isNb ? `${name} er koblet til` : `${name} connected`,
      { description: isNb ? "Lara starter kartlegging av relevante systemer." : "Lara starts mapping relevant systems." }
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={isNb ? "Tilbake" : "Back"}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isNb ? "Kildesystemer" : "Source systems"}
              </h1>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {isNb
                  ? "Koble Mynder til systemene dere allerede bruker. Lara kartlegger relevante systemer og fanger opp dokumentasjon selv – du godkjenner alltid før noe tas i bruk."
                  : "Connect Mynder to the systems you already use. Lara maps relevant systems and picks up documentation on its own – you always approve before anything is applied."}
              </p>
            </div>
          </div>

          {/* Hva Lara gjør – skjult som standard */}
          <Collapsible open={showHow} onOpenChange={setShowHow} className="mt-6">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bot className="h-4 w-4" />
                {isNb ? "Hva Lara gjør med kildene" : "What Lara does with the sources"}
                <ChevronDown className={`h-4 w-4 transition-transform ${showHow ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-3 p-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {(isNb
                    ? [
                        "Finner systemer og leverandører dere faktisk bruker, og foreslår dem for registeret.",
                        "Kobler dokumentasjon fra kildene til kontrollkrav i valgte regelverk.",
                        "Følger med over tid og varsler når noe endres eller går ut på dato.",
                      ]
                    : [
                        "Finds the systems and vendors you actually use and suggests them for the registry.",
                        "Links documentation from the sources to control requirements in your frameworks.",
                        "Monitors over time and alerts you when something changes or expires.",
                      ]
                  ).map((line) => (
                    <li key={line} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {isNb
                    ? "Lara leser kun det dere gir tilgang til, og endrer aldri noe i kildesystemet."
                    : "Lara only reads what you grant access to and never changes anything in the source system."}
                </p>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {connected.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-medium text-foreground">
                {isNb ? "Tilkoblede kilder" : "Connected sources"}
              </h2>
              <Card className="mt-3 divide-y divide-border">
                {connected.map((s) => {
                  const conn = connections.find((c) => c.sourceId === s.id)!;
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{s.name}</span>
                          <Badge variant="secondary" className="gap-1 text-[11px]">
                            <Check className="h-3 w-3" />
                            {isNb ? "Tilkoblet" : "Connected"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isNb ? "Sist synkronisert " : "Last synced "}
                          {formatRelative(conn.lastSyncedAt, isNb)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={isNb ? "Handlinger" : "Actions"}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              syncSource(s.id);
                              toast.success(isNb ? "Synkronisering startet" : "Sync started");
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {isNb ? "Synkroniser nå" : "Sync now"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              disconnectSource(s.id);
                              toast.success(isNb ? `${s.name} er koblet fra` : `${s.name} disconnected`);
                            }}
                          >
                            {isNb ? "Koble fra" : "Disconnect"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </Card>
            </section>
          )}

          <section className="mt-8 space-y-6">
            <h2 className="text-sm font-medium text-foreground">
              {isNb ? "Tilgjengelige kilder" : "Available sources"}
            </h2>
            {byCategory.map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isNb ? SOURCE_CATEGORY_LABELS[cat].nb : SOURCE_CATEGORY_LABELS[cat].en}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {items.map((s) => (
                    <Card key={s.id} className="flex flex-col gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {isNb ? s.descriptionNb : s.descriptionEn}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-start"
                        onClick={() => handleConnect(s.id, s.name)}
                      >
                        {isNb ? "Koble til" : "Connect"}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <Card className="mt-8 flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {isNb ? "Bruker du din egen agent?" : "Using your own agent?"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isNb
                  ? "Koble agenten din til Mynder via MCP-integrasjon."
                  : "Connect your agent to Mynder via MCP integration."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings/integrations")}>
              {isNb ? "Åpne MCP-integrasjon" : "Open MCP integration"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
