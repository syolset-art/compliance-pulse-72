import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Database,
  ClipboardList,
  Sparkles,
  Plug,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorFrameworkAction } from "@/lib/vendorFrameworkSuggestions";
import { readMcpConnections } from "@/lib/mcpAgentConnections";

export type VendorActivityChoice = "request" | "mcp" | "manual" | "trustProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  actions: VendorFrameworkAction[];
  /** Videresender til eksisterende flyter. */
  onRequestDocumentation: () => void;
  onRegisterManualActivity: () => void;
  onInviteTrustProfile: () => void;
}

type McpResult = { documentType: string; found: boolean; source?: string };

export function CreateVendorActivityDialog({
  open,
  onOpenChange,
  vendorName,
  actions,
  onRequestDocumentation,
  onRegisterManualActivity,
  onInviteTrustProfile,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const navigate = useNavigate();

  const docActions = useMemo(() => actions.filter((a) => a.documentType), [actions]);
  const [choice, setChoice] = useState<VendorActivityChoice | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<McpResult[] | null>(null);

  const connections = useMemo(() => (open ? readMcpConnections() : []), [open]);
  const activeConnections = connections.filter((c) => c.status === "active");

  const reset = () => {
    setChoice(null);
    setSelectedSources([]);
    setResults(null);
    setRunning(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const options: {
    id: VendorActivityChoice;
    icon: typeof Send;
    titleNb: string;
    titleEn: string;
    descNb: string;
    descEn: string;
  }[] = [
    {
      id: "request",
      icon: Send,
      titleNb: "Be leverandøren om dokumentasjon",
      titleEn: "Request documentation from the vendor",
      descNb: "Send en forespørsel på e-post med frist og valgte dokumenttyper.",
      descEn: "Send an email request with a deadline and the selected document types.",
    },
    {
      id: "mcp",
      icon: Database,
      titleNb: "Hent data fra egen infrastruktur (MCP)",
      titleEn: "Fetch data from your own infrastructure (MCP)",
      descNb:
        "Lara spør dine egne koblede agenter om leverandørdata dere allerede har — avtaler, fakturaer, systemeierskap og tidligere risikovurderinger.",
      descEn:
        "Lara asks your own connected agents for vendor data you already hold — contracts, invoices, system ownership and earlier risk assessments.",
    },
    {
      id: "manual",
      icon: ClipboardList,
      titleNb: "Registrer aktivitet manuelt",
      titleEn: "Register an activity manually",
      descNb: "Opprett en oppgave med ansvarlig, frist og prioritet koblet til tiltaket.",
      descEn: "Create a task with an owner, due date and priority linked to the action.",
    },
    {
      id: "trustProfile",
      icon: Sparkles,
      titleNb: "Inviter til Agentisk Trust Profile",
      titleEn: "Invite to Agentic Trust Profile",
      descNb: "Leverandøren holder dokumentasjonen løpende oppdatert — dere slipper å purre.",
      descEn: "The vendor keeps documentation continuously updated — no more chasing.",
    },
  ];

  const runMcp = () => {
    setRunning(true);
    setTimeout(() => {
      const sourceName =
        activeConnections.find((c) => c.id === selectedSources[0])?.name ?? "Agent";
      setResults(
        docActions.map((a, i) => ({
          documentType: isNb ? a.titleNb : a.titleEn,
          found: i % 3 !== 2,
          source: sourceName,
        })),
      );
      setRunning(false);
    }, 1200);
  };

  const proceed = () => {
    if (choice === "request") {
      close();
      onRequestDocumentation();
    } else if (choice === "manual") {
      close();
      onRegisterManualActivity();
    } else if (choice === "trustProfile") {
      close();
      onInviteTrustProfile();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNb ? "Opprett aktivitet" : "Create activity"}</DialogTitle>
          <DialogDescription>
            {isNb
              ? `Velg hvordan dokumentasjonen for ${vendorName} skal skaffes.`
              : `Choose how documentation for ${vendorName} should be obtained.`}
          </DialogDescription>
        </DialogHeader>

        {/* Omfang — tiltakene som inngår */}
        {docActions.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {isNb ? "Omfatter" : "Covers"}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {docActions.map((a) => (
                <Badge key={a.id} variant="outline" className="text-[11px] font-normal">
                  {isNb ? a.titleNb : a.titleEn}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {options.map((o) => {
            const Icon = o.icon;
            const active = choice === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setChoice(o.id);
                  setResults(null);
                }}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/40",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {isNb ? o.titleNb : o.titleEn}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {isNb ? o.descNb : o.descEn}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* MCP-panel */}
        {choice === "mcp" && (
          <div className="rounded-lg border border-border p-3 space-y-3">
            {activeConnections.length === 0 ? (
              <>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {isNb
                    ? "Du har ingen aktive agentkoblinger ennå. Koble dine egne agenter til Mynder via MCP, så kan Lara hente leverandørdata dere allerede har."
                    : "You have no active agent connections yet. Connect your own agents to Mynder via MCP so Lara can fetch vendor data you already hold."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    close();
                    navigate("/settings/mcp");
                  }}
                >
                  <Plug className="h-3.5 w-3.5 mr-1.5" />
                  {isNb ? "Sett opp MCP-kobling" : "Set up MCP connection"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </>
            ) : results ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {isNb ? "Resultat fra innhenting" : "Fetch results"}
                </p>
                {results.map((r) => (
                  <div key={r.documentType} className="flex items-start gap-2">
                    {r.found ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <p className="text-[12px] text-foreground min-w-0">
                      {r.documentType}
                      <span className="text-muted-foreground">
                        {" · "}
                        {r.found
                          ? isNb
                            ? `funnet hos ${r.source}`
                            : `found in ${r.source}`
                          : isNb
                            ? "ikke funnet — må etterspørres"
                            : "not found — must be requested"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {isNb ? "Velg kilder" : "Select sources"}
                </p>
                {activeConnections.map((c) => (
                  <label key={c.id} className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedSources.includes(c.id)}
                      onCheckedChange={(v) =>
                        setSelectedSources((prev) =>
                          v ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                        )
                      }
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] text-foreground">{c.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {c.url}
                      </span>
                    </span>
                  </label>
                ))}
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={selectedSources.length === 0 || running}
                  onClick={runMcp}
                >
                  {running && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {isNb ? "Start innhenting" : "Start fetch"}
                </Button>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            {isNb ? "Lukk" : "Close"}
          </Button>
          {choice && choice !== "mcp" && (
            <Button size="sm" onClick={proceed}>
              {isNb ? "Fortsett" : "Continue"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
