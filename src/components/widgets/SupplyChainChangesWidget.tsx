import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface VendorChange {
  id: string;
  name: string;
  isNew: boolean;
  riskLevel: string | null;
  time: string;
}

export function SupplyChainChangesWidget() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [changes, setChanges] = useState<VendorChange[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, risk_level, created_at, updated_at")
        .in("asset_type", ["vendor", "sub_processor"])
        .order("updated_at", { ascending: false })
        .limit(3);

      if (data) {
        setChanges(
          data.map((v) => ({
            id: v.id,
            name: v.name,
            isNew:
              Math.abs(
                new Date(v.updated_at || "").getTime() -
                  new Date(v.created_at || "").getTime()
              ) < 60000,
            riskLevel: v.risk_level,
            time: v.updated_at || v.created_at || "",
          }))
        );
      }
    };
    fetch();
  }, []);

  return (
    <Card variant="flat" className="h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          {isNorwegian ? "Leverandørkjeden" : "Supply chain"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {changes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {isNorwegian ? "Ingen endringer" : "No changes"}
          </p>
        ) : (
          <div className="space-y-3">
            {changes.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                  {c.isNew ? (
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{c.name}</span>
                    {c.riskLevel === "high" && (
                      <Badge variant="destructive" className="text-[13px] px-1.5 py-0">
                        {isNorwegian ? "Høy" : "High"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {c.isNew
                      ? isNorwegian
                        ? "Ny leverandør"
                        : "New vendor"
                      : isNorwegian
                      ? "Oppdatert"
                      : "Updated"}{" "}
                    ·{" "}
                    {formatDistanceToNow(new Date(c.time), {
                      addSuffix: true,
                      locale: isNorwegian ? nb : undefined,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
