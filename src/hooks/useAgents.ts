import { useEffect, useState, useCallback } from "react";
import { AIAgent, calcMetrics, loadAgents } from "@/lib/agentMacf";

export function useAgents() {
  const [agents, setAgents] = useState<AIAgent[]>(() => loadAgents());

  const refresh = useCallback(() => setAgents(loadAgents()), []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener("mynder:agents:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("mynder:agents:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return { agents, metrics: calcMetrics(agents), refresh };
}
