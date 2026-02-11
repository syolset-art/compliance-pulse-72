import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  assetId: string;
}

export function DocumentRequestsSection({ assetId }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";

  const { data: requests = [] } = useQuery({
    queryKey: ["vendor-document-requests", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_document_requests")
        .select("*")
        .eq("asset_id", assetId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (requests.length === 0) return null;

  const getStatusInfo = (status: string, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "received") return { icon: CheckCircle2, color: "text-emerald-600", badge: <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">Mottatt</Badge> };
    if (daysLeft < 0 || status === "overdue") return { icon: AlertTriangle, color: "text-destructive", badge: <Badge variant="destructive" className="text-[10px]">{Math.abs(daysLeft)} dager over frist</Badge> };
    return { icon: Clock, color: "text-yellow-600", badge: <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[10px]">{daysLeft} dager igjen</Badge> };
  };

  const handleSendReminder = (requestId: string) => {
    toast.success(t("vendorDocs.reminderSent", "Purring sendt til leverandøren"));
  };

  const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    penetration_test: "Penetrasjonstest",
    dpa: "DPA / Databehandleravtale",
    iso27001: "ISO 27001-sertifikat",
    soc2: "SOC 2-rapport",
    dpia: "DPIA",
    nda: "NDA",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          {t("vendorDocs.requestsTitle", "Forespørsler og purringer")}
          <Badge variant="secondary" className="text-[10px]">{requests.filter((r: any) => r.status !== "received").length} aktive</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((req: any) => {
          const info = getStatusInfo(req.status, req.due_date);
          const Icon = info.icon;
          return (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${info.color}`} />
                <div>
                  <p className="text-sm font-medium">{DOCUMENT_TYPE_LABELS[req.document_type] || req.document_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Frist: {new Date(req.due_date).toLocaleDateString(locale)}
                    {req.reminder_count > 0 && ` · ${req.reminder_count} purring(er) sendt`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {info.badge}
                {req.status !== "received" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendReminder(req.id)}>
                    <Send className="h-3 w-3 mr-1" />
                    Send purring
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
