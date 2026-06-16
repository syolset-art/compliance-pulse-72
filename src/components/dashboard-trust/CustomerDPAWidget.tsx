import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, ChevronRight, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DpaRow {
  id: string;
  name: string;
  uploaded_at?: string;
  expires_at?: string | null;
  version?: string | null;
  status?: string | null;
}

export function CustomerDPAWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();

  const { data: dpas = [] } = useQuery({
    queryKey: ["trust-dashboard-customer-dpas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id,name,document_type,uploaded_at,expires_at,version,status")
        .eq("document_type", "dpa")
        .order("uploaded_at", { ascending: false })
        .limit(6);
      return (data as any[]) as DpaRow[];
    },
  });

  const statusBadge = (status?: string | null, expires?: string | null) => {
    if (expires && new Date(expires) < new Date()) {
      return <Badge variant="destructive" className="text-xs">{isNb ? "Utløpt" : "Expired"}</Badge>;
    }
    if (expires) {
      const days = Math.round((new Date(expires).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days < 60) return <Badge className="text-xs bg-warning text-warning-foreground">{isNb ? `${days} dager igjen` : `${days} days left`}</Badge>;
    }
    if (status === "active" || !status) {
      return <Badge variant="secondary" className="text-xs">{isNb ? "Aktiv" : "Active"}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Databehandleravtaler" : "Data Processing Agreements"}
          </h3>
          {dpas.length > 0 && (
            <Badge variant="secondary" className="text-xs">{dpas.length}</Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate("/trust-center/edit?section=evidence")}>
          {isNb ? "Administrer" : "Manage"} <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      {dpas.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="text-sm text-muted-foreground">
            {isNb ? "Ingen DPA-er lastet opp ennå" : "No DPAs uploaded yet"}
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/trust-center/edit?section=evidence")}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {isNb ? "Last opp DPA" : "Upload DPA"}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left font-medium pb-2">{isNb ? "Navn" : "Name"}</th>
                <th className="text-left font-medium pb-2">{isNb ? "Versjon" : "Version"}</th>
                <th className="text-left font-medium pb-2">{isNb ? "Utløper" : "Expires"}</th>
                <th className="text-left font-medium pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dpas.map((d) => (
                <tr key={d.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-foreground truncate max-w-[200px]">{d.name}</td>
                  <td className="py-2 text-muted-foreground">{d.version || "—"}</td>
                  <td className="py-2 text-muted-foreground">
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString(isNb ? "nb-NO" : "en-US") : "—"}
                  </td>
                  <td className="py-2">{statusBadge(d.status, d.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
