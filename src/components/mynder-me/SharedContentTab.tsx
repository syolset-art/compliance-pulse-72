import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Lock,
  Crown,
} from "lucide-react";

interface SharedContentRow {
  id: string;
  content_type: string;
  is_enabled: boolean;
  is_mandatory: boolean;
  is_premium: boolean;
  regulatory_basis: string | null;
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
  processing_records: { icon: FileText, color: "text-primary" },
  ai_systems: { icon: Bot, color: "text-accent" },
  data_systems: { icon: Server, color: "text-status-closed" },
  vendors: { icon: Building2, color: "text-warning" },
  incidents: { icon: AlertTriangle, color: "text-destructive" },
  frameworks: { icon: ShieldCheck, color: "text-status-closed" },
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
    if (row.is_mandatory) return;
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
  const mandatoryRows = rows.filter((r) => r.is_mandatory);
  const optionalRows = rows.filter((r) => !r.is_mandatory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderCard = (row: SharedContentRow) => {
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium text-foreground">{row.display_title_no}</h4>
              <Badge variant={row.is_enabled ? "default" : "secondary"} className="text-xs">
                {count} elementer
              </Badge>
              {row.is_mandatory && (
                <Badge variant="outline" className="text-xs gap-1 border-warning/20 text-warning dark:border-warning dark:text-warning">
                  <Lock className="h-3 w-3" />
                  Lovpålagt
                </Badge>
              )}
              {row.is_premium && (
                <Badge variant="outline" className="text-xs gap-1 border-accent/20 text-foreground dark:border-accent dark:text-accent">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            {row.regulatory_basis && (
              <p className="text-xs text-muted-foreground mb-0.5">{row.regulatory_basis}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {row.display_description_no}
            </p>
            {row.is_premium && row.content_type === "incidents" && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Når du aktiverer Live avvik i plattformen, blir sanntidsvarsler automatisk tilgjengelig for ansatte i Mynder Me.
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {row.is_premium && !row.is_enabled ? (
              <Badge variant="secondary" className="text-xs cursor-default">
                Kommer snart
              </Badge>
            ) : (
              <Switch
                checked={row.is_enabled}
                disabled={row.is_mandatory || toggling === row.id}
                onCheckedChange={() => handleToggle(row)}
              />
            )}
          </div>
        </div>
      </Card>
    );
  };

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

      {/* Mandatory section */}
      {mandatoryRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-warning dark:text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Lovpålagt deling</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Disse kategoriene er påkrevd etter GDPR og AI Act, og kan ikke deaktiveres.
          </p>
          <div className="grid gap-3">
            {mandatoryRows.map(renderCard)}
          </div>
        </div>
      )}

      {/* Optional section */}
      {optionalRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Valgfritt</h3>
          <div className="grid gap-3">
            {optionalRows.map(renderCard)}
          </div>
        </div>
      )}

      {/* Info card */}
      <Card variant="flat" className="border-primary/20 bg-primary/10/50 dark:border-primary dark:bg-blue-950/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <Eye className="h-4 w-4 text-primary dark:text-primary" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Ingen duplisering av data.</strong>{" "}
                Ansatte får lesetilgang til informasjonen direkte fra Mynder – dataene lagres kun ett sted.
              </p>
              <p>
                <strong className="text-foreground">Kun relevante behandlingsprotokoller.</strong>{" "}
                Det er kun behandlingsprotokoller som omhandler ansattdata som bør deles – ikke protokoller knyttet til kunder, leverandører eller andre registrerte. Sørg for at behandlingsprotokollene som er aktive i plattformen reflekterer dette.
              </p>
              <p>
                Ingen personopplysninger om individuelle ansatte lagres i Mynder Me.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
