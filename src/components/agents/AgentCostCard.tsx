import { Card } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Ærlig kostnadsboks — synlig på agentoversikten, ikke gjemt i prislisten.
 */
export function AgentCostCard() {
  return (
    <Card className="p-4 bg-muted/40 border-dashed">
      <div className="flex gap-3">
        <Coins className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm space-y-1">
          <p className="font-medium">Hva koster en agent?</p>
          <p className="text-muted-foreground">
            Å kartlegge og sette opp agenter er gratis i beta. Når en agent utfører arbeid,
            trekkes kreditter fra saldoen din — omtrent 1 kreditt per oppgave agenten gjør.
            Du ser forbruket per agent før du setter den i arbeid.
          </p>
          <Link to="/subscriptions" className="text-primary hover:underline">
            Se kreditter og pakker
          </Link>
        </div>
      </div>
    </Card>
  );
}
