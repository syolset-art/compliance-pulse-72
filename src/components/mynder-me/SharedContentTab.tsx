import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText,
  Bot,
  Server,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Loader2,
} from "lucide-react";

interface SharedContentRow {
  id: string;
  content_type: string;
  is_enabled: boolean;
  display_title_no: string;
  display_description_no: string | null;
}

interface ContentCounts {
  processing_records: number;
  ai_systems: number;
  data_systems: number;
  vendors: number;
  incidents: number;
  frameworks: number;
}

const CONTENT_META: Record<string, { icon: typeof FileText; color: string }> = {
  processing_records: { icon: FileText, color: "text-blue-600" },
  ai_systems: { icon: Bot, color: "text-purple-600" },
  data_systems: { icon: Server, color: "text-emerald-600" },
  vendors: { icon: Building2, color: "text-orange-600" },
  incidents: { icon: AlertTriangle, color: "text-red-600" },
  frameworks: { icon: ShieldCheck, color: "text-teal-600" },
};

export function SharedContentTab() {
  const [rows, setRows] = useState<SharedContentRow[]>([]);
  const [counts, setCounts] = useState<ContentCounts>({
    processing_records: 0,
    ai_systems: 0,
    data_systems: 0,
    vendors: 0,
    incidents: 0,
    frameworks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [contentRes, procRes, aiRes, sysRes, vendorRes, incRes, fwRes] = await Promise.all([
      supabase.from("mynder_me_shared_content").select("*").order("created_at"),
      supabase.from("system_processes").select("id").eq("status", "active"),
      supabase.from("ai_system_registry").select("id").eq("status", "active"),
      supabase.from("assets").select("id").in("asset_type", ["system", "software", "cloud_service"]),
      supabase.from("assets").select("id").eq("asset_type", "vendor"),
      supabase.from("system_incidents").select("id"),
      supabase.from("selected_frameworks").select("id").eq("is_selected", true),
    ]);

    setRows((contentRes.data as SharedContentRow[]) || []);
    setCounts({
      processing_records: procRes.data?.length || 0,
      ai_systems: aiRes.data?.length || 0,
      data_systems: sysRes.data?.length || 0,
      vendors: vendorRes.data?.length || 0,
      incidents: incRes.data?.length || 0,
      frameworks: fwRes.data?.length || 0,
    });
    setLoading(false);
  };

  const handleToggle = async (row: SharedContentRow) => {
    setToggling(row.id);
    const newVal = !row.is_enabled;
    const { error } = await supabase
      .from("mynder_me_shared_content")
      .update({ is_enabled: newVal })
      .eq("id", row.id);

    if (error) {
      toast.error("Kunne ikke oppdatere innstillingen");
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, is_enabled: newVal } : r))
      );
      toast.success(
        newVal
          ? `${row.display_title_no} er nå synlig for ansatte`
          : `${row.display_title_no} er skjult for ansatte`
      );
    }
    setToggling(null);
  };

  const enabledCount = rows.filter((r) => r.is_enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card variant="flat">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delt med ansatte</p>
              <p className="text-2xl font-bold text-foreground">
                {enabledCount} av {rows.length} kategorier
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content category cards */}
      <div className="grid gap-4">
        {rows.map((row) => {
          const meta = CONTENT_META[row.content_type];
          const Icon = meta?.icon || FileText;
          const count = counts[row.content_type as keyof ContentCounts] || 0;

          return (
            <Card key={row.id} variant="flat" className="overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${meta?.color || ""}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{row.display_title_no}</h4>
                    <Badge variant={row.is_enabled ? "default" : "secondary"} className="text-xs">
                      {count} elementer
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {row.display_description_no}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Switch
                    checked={row.is_enabled}
                    disabled={toggling === row.id}
                    onCheckedChange={() => handleToggle(row)}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Aktiverte kategorier blir tilgjengelige for ansatte via Mynder Me-appen i et forenklet, ansattvennlig format.
        Ingen personopplysninger om individuelle ansatte lagres.
      </p>
    </div>
  );
}
