import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plug, Copy, Check, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MCP_EXPOSED_TOOLS,
  MCP_STATUS_LABEL,
  mcpServerUrl,
  readMcpConnections,
  writeMcpConnections,
  type McpAgentConnection,
} from "@/lib/mcpAgentConnections";

const STATUS_STYLE = {
  active: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
} as const;

export function McpAgentConnectionsSection() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [items, setItems] = useState<McpAgentConnection[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => setItems(readMcpConnections()), []);

  const persist = (next: McpAgentConnection[]) => {
    setItems(next);
    writeMcpConnections(next);
  };

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignorer */
    }
  };

  const add = () => {
    if (!name.trim() || !url.trim()) return;
    persist([
      ...items,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ]);
    setName("");
    setUrl("");
    setDescription("");
    setAddOpen(false);
    toast.success(isNb ? "Agentkobling lagt til" : "Agent connection added");
  };

  const serverUrl = mcpServerUrl();

  const field = (labelNb: string, labelEn: string, value: string, key: string) => (
    <div>
      <Label className="text-xs">{isNb ? labelNb : labelEn}</Label>
      <div className="flex gap-2 mt-1">
        <Input readOnly value={value} className="h-8 text-xs" />
        <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => copy(value, key)}>
          {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );

  return (
    <section id="mcp" className="space-y-4 scroll-mt-20">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {isNb ? "Agentkoblinger (MCP)" : "Agent connections (MCP)"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-3xl">
          {isNb
            ? "MCP lar dine egne AI-agenter snakke med Mynder. Da kan Lara hente leverandørdata dere allerede har i egen infrastruktur, i stedet for å be leverandøren om alt på nytt."
            : "MCP lets your own AI agents talk to Mynder, so Lara can use vendor data you already hold in your own infrastructure instead of asking the vendor for everything again."}
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {isNb ? "Tilkoblingsinformasjon" : "Connection details"}
        </h2>
        {field("Server-URL", "Server URL", serverUrl, "url")}
        {field("Autentisering", "Authentication", "OAuth 2.1 (Bearer token)", "auth")}
        <div>
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left"
            aria-expanded={toolsOpen}
          >
            <Label className="cursor-pointer text-xs">
              {isNb ? "Verktøy som eksponeres" : "Exposed tools"}
              <span className="ml-1.5 text-muted-foreground">({MCP_EXPOSED_TOOLS.length})</span>
            </Label>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {toolsOpen ? (isNb ? "Skjul" : "Hide") : isNb ? "Vis" : "Show"}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", toolsOpen && "rotate-180")}
              />
            </span>
          </button>
          {toolsOpen && (
            <ul className="mt-1.5 space-y-1">
              {MCP_EXPOSED_TOOLS.map((t) => (
                <li key={t.name} className="flex items-center gap-2 text-xs">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{t.name}</code>
                  <span className="text-muted-foreground">{isNb ? t.nb : t.en}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isNb
              ? "Koblingen bruker OAuth 2.1. Når en agent kobler til, blir du bedt om å godkjenne tilgangen. Du kan når som helst fjerne koblingen."
              : "This connection uses OAuth 2.1. When an agent connects, you will be asked to approve access. You can remove the connection at any time."}
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {isNb ? "Registrerte agentkoblinger" : "Registered agent connections"}
          </h2>
          <Button size="sm" className="h-8 text-xs" onClick={() => setAddOpen(true)}>
            <Plug className="h-3.5 w-3.5 mr-1.5" />
            {isNb ? "Legg til agentkobling" : "Add agent connection"}
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-3">
            {isNb
              ? "Ingen agentkoblinger ennå."
              : "No agent connections yet."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{c.name}</span>
                    <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLE[c.status])}>
                      {isNb ? MCP_STATUS_LABEL[c.status].nb : MCP_STATUS_LABEL[c.status].en}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.url}</p>
                  {c.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNb ? "Sist brukt: " : "Last used: "}
                    {c.lastUsedAt
                      ? new Date(c.lastUsedAt).toLocaleDateString(isNb ? "nb-NO" : "en-GB")
                      : isNb
                        ? "aldri"
                        : "never"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs shrink-0"
                  onClick={() => persist(items.filter((i) => i.id !== c.id))}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {isNb ? "Fjern" : "Remove"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNb ? "Legg til agentkobling" : "Add agent connection"}</DialogTitle>
            <DialogDescription>
              {isNb
                ? "Registrer agenten som skal kunne hente data på vegne av virksomheten."
                : "Register the agent that will fetch data on behalf of your organisation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{isNb ? "Navn" : "Name"}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isNb ? "F.eks. Intern innkjøpsagent" : "E.g. Internal procurement agent"}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…/mcp"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{isNb ? "Beskrivelse (valgfritt)" : "Description (optional)"}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button size="sm" onClick={add} disabled={!name.trim() || !url.trim()}>
              {isNb ? "Legg til" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
