import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Download, ShieldCheck, Info } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { AgentTable } from "@/components/agents/AgentTable";
import { RegisterAgentDialog } from "@/components/agents/RegisterAgentDialog";
import { toast } from "sonner";

export default function AgentRegistry() {
  const { agents, refresh } = useAgents();
  const [open, setOpen] = useState(false);

  const mynder = agents.filter((a) => a.kind === "mynder");
  const byoa = agents.filter((a) => a.kind === "byoa");

  const handleExport = () => {
    const header = ["Navn", "Type", "Leverandør", "Eier", "Status", "MACF-nivå", "Tillit-score"];
    const rows = agents.map((a) => [a.name, a.kind, a.provider, a.owner_team, a.status, a.macf_level, a.trust_score]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "ai-agenter.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Eksportert som CSV");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto pt-16">
          <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  AI-agenter
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Registrerte agenter tilknyttet din Trust Profile · MACF-styrt
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Eksporter
                </Button>
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Registrer agent
                </Button>
              </div>
            </div>


            {/* Mynder Lara-flyter */}
            <AgentTable title="Mynder — Lara-flyter" icon="mynder" agents={mynder} />

            {/* BYOA */}
            <AgentTable title="BYOA — Bring your own agent" icon="byoa" agents={byoa} />

          </div>
        </main>
      </div>

      <RegisterAgentDialog open={open} onOpenChange={setOpen} onCreated={refresh} />
    </div>
  );
}
