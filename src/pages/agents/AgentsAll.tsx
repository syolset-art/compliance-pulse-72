import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { AgentTable } from "@/components/agents/AgentTable";
import { RegisterAgentDialog } from "@/components/agents/RegisterAgentDialog";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { toast } from "sonner";

export default function AgentsAll() {
  const { agents, refresh } = useAgents();
  const [open, setOpen] = useState(false);

  const mynder = agents.filter((a) => a.kind === "mynder");
  const byoa = agents.filter((a) => a.kind === "byoa");

  const handleExport = () => {
    const header = ["Navn", "Type", "Leverandør", "Eier", "Status", "Kontrollnivå", "Tillit-score"];
    const rows = agents.map((a) => [a.name, a.kind, a.provider, a.owner_team, a.status, a.macf_level, a.trust_score]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ki-agenter.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Eksportert som CSV");
  };

  return (
    <AgentsPageShell
      title="Alle agenter"
      description="Registeret over agentene virksomheten har bygget eller koblet til."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Eksporter
          </Button>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Registrer agent
          </Button>
        </>
      }
    >
      <AgentTable title="Bygget i Mynder" icon="mynder" agents={mynder} />
      <AgentTable title="BYOA — egne agenter" icon="byoa" agents={byoa} />

      <RegisterAgentDialog open={open} onOpenChange={setOpen} onCreated={refresh} />
    </AgentsPageShell>
  );
}
