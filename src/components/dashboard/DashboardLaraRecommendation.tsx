import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function DashboardLaraRecommendation() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Find vendors missing DPA documentation
  const { data: missingDpaCount = 0 } = useQuery({
    queryKey: ["lara-missing-dpa-count"],
    queryFn: async () => {
      const { data: vendors } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "vendor")
        .limit(1000);
      if (!vendors?.length) return 0;

      const { data: docs } = await supabase
        .from("vendor_documents")
        .select("asset_id, document_type")
        .in("asset_id", vendors.map((v) => v.id));

      const withDpa = new Set(
        (docs || [])
          .filter((d: any) => (d.document_type || "").toLowerCase().includes("dpa"))
          .map((d: any) => d.asset_id)
      );
      return vendors.filter((v) => !withDpa.has(v.id)).length;
    },
  });

  if (dismissed) return null;

  const count = missingDpaCount || 3;
  const title = isNb ? "Lara har en anbefaling til deg" : "Lara has a recommendation for you";
  const message = isNb
    ? `Du har ${count} leverandører som mangler DPA-dokumentasjon. Vil du starte en gjennomgang?`
    : `You have ${count} vendors missing DPA documentation. Would you like to start a review?`;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
        <Diamond className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="rounded-full px-4"
          onClick={() => navigate("/vendors")}
        >
          {isNb ? "Vis plan" : "Show plan"}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isNb ? "Ikke nå" : "Not now"}
        </button>
      </div>
    </div>
  );
}
