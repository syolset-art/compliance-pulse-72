import { useNavigate } from "react-router-dom";
import { AIAgent } from "@/lib/agentMacf";
import { Button } from "@/components/ui/button";
import { AgentTypePill } from "./AgentTypePill";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { MacfLevelBadge } from "./MacfLevelBadge";
import { AgentTrustBar } from "./AgentTrustBar";
import { Sparkles, Plug } from "lucide-react";
import { PinBadge } from "@/components/pin/PinBadge";
import { getMockPin } from "@/lib/pin";

interface Props {
  title: string;
  icon: "mynder" | "byoa";
  agents: AIAgent[];
}

export function AgentTable({ title, icon, agents }: Props) {
  const navigate = useNavigate();
  const Icon = icon === "mynder" ? Sparkles : Plug;

  return (
    <section className="rounded-lg border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </h3>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="px-4 py-2.5 font-medium">Agent</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">MACF-nivå</th>
              <th className="px-4 py-2.5 font-medium">Tillit-score</th>
              <th className="px-4 py-2.5 font-medium">Pin</th>
              <th className="px-4 py-2.5 font-medium text-right">Handling</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Ingen agenter registrert her ennå.
                </td>
              </tr>
            ) : (
              agents.map((a) => {
                const needsApproval = a.macf_level === "L3_pending" || a.macf_level === "not_assessed";
                return (
                  <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.subtitle}</div>
                    </td>
                    <td className="px-4 py-3"><AgentTypePill kind={a.kind} /></td>
                    <td className="px-4 py-3"><AgentStatusBadge status={a.status} /></td>
                    <td className="px-4 py-3"><MacfLevelBadge level={a.macf_level} /></td>
                    <td className="px-4 py-3"><AgentTrustBar score={a.trust_score} /></td>
                    <td className="px-4 py-3"><PinBadge pin={getMockPin(a.id + a.name)} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={needsApproval ? "default" : "outline"}
                        onClick={() => navigate(`/agents/${a.id}`)}
                      >
                        {a.macf_level === "L3_pending" ? "Godkjenn" :
                         a.macf_level === "not_assessed" ? "Start MACF" : "Detaljer"}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
