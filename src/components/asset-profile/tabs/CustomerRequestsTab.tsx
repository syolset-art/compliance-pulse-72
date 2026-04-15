import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileQuestion, Clock, Building2, Eye, Plus, TrendingUp, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DEMO_REQUESTS = [
  {
    id: "demo-1",
    customer_name: "Allier AS",
    title: "Norsk leverandørvurdering",
    request_type: "vendor_assessment",
    status: "completed",
    progress_percent: 100,
    due_date: "2025-03-01",
  },
  {
    id: "demo-2",
    customer_name: "TechCorp AS",
    title: "ISO 27001 dokumentasjon",
    request_type: "certification",
    status: "in_progress",
    progress_percent: 60,
    due_date: "2025-04-15",
  },
  {
    id: "demo-3",
    customer_name: "Nordic Solutions",
    title: "DPA forespørsel",
    request_type: "dpa",
    status: "pending",
    progress_percent: 30,
    due_date: "2025-05-01",
  },
];

function getStatusBadge(status: string, isNb: boolean) {
  switch (status) {
    case "responded":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[13px]">{isNb ? "Besvart" : "Responded"}</Badge>;
    case "read":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[13px]">{isNb ? "Lest" : "Read"}</Badge>;
    default:
      return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[13px]">{isNb ? "Ny" : "New"}</Badge>;
  }
}

function getScoreImpact(requestType: string, isNb: boolean) {
  const impacts: Record<string, { label: string; areas: string[] }> = {
    vendor_assessment: {
      label: isNb ? "Styrker kontrollområdet «Styring»" : "Strengthens the Governance control area",
      areas: isNb ? ["Styring", "Tredjepartstyring"] : ["Governance", "Third-Party Management"],
    },
    certification: {
      label: isNb ? "Styrker kontrollområdet «Drift og sikkerhet»" : "Strengthens Operations & Security",
      areas: isNb ? ["Drift og sikkerhet"] : ["Operations & Security"],
    },
    dpa: {
      label: isNb ? "Styrker kontrollområdet «Personvern og datahåndtering»" : "Strengthens Privacy & Data Handling",
      areas: isNb ? ["Personvern og datahåndtering"] : ["Privacy & Data Handling"],
    },
  };
  return impacts[requestType] || {
    label: isNb ? "Kan forbedre din totalscore" : "May improve your overall score",
    areas: [],
  };
}

export function CustomerRequestsTab() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [addedToProfile, setAddedToProfile] = useState<Set<string>>(new Set());

  const { data: dbRequests = [] } = useQuery({
    queryKey: ["customer-requests-self"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const requests = dbRequests.length > 0 ? dbRequests : DEMO_REQUESTS;

  const handleAddToProfile = (reqId: string) => {
    setAddedToProfile(prev => new Set(prev).add(reqId));
    toast.success(isNb
      ? "Dokumentet er lagt til i Trust Profilen og vil forbedre scoren"
      : "Document added to Trust Profile — score will be updated");
  };

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                {isNb ? "Hva er dette?" : "What is this?"}
              </p>
              <p>
                {isNb
                  ? "Her ser du dokumenter som kunder eller partnere har bedt om. Når et dokument er mottatt, kan du lese det og legge det til i profilen. Dette styrker scoren din ved å dokumentere at viktige kontrollpunkter er på plass."
                  : "Here you see documents that customers or partners have requested. When a document is received, you can review it and add it to your profile. This strengthens your score by documenting that key controls are in place."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-primary" />
            {isNb ? "Mottatte meldinger" : "Received Messages"}
            <Badge variant="secondary" className="text-[13px]">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileQuestion className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{isNb ? "Ingen meldinger ennå" : "No messages yet"}</p>
            </div>
          ) : (
            requests.map((req: any) => {
              const isAdded = addedToProfile.has(req.id);
              const impact = getScoreImpact(req.request_type, isNb);
              return (
                <div key={req.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileQuestion className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium">{req.title}</span>
                        {getStatusBadge(req.status, isNb)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {req.customer_name}
                        {req.due_date && (
                          <>
                            <span className="mx-1">·</span>
                            <Clock className="h-3 w-3" />
                            {new Date(req.due_date).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Eye className="h-3 w-3" />
                        {isNb ? "Les" : "View"}
                      </Button>
                      {isAdded ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-xs h-7 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {isNb ? "Lagt til" : "Added"}
                        </Badge>
                      ) : (
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleAddToProfile(req.id)}>
                          <Plus className="h-3 w-3" />
                          {isNb ? "Legg til i profil" : "Add to profile"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Score impact indicator */}
                  <div className="flex items-center gap-2 pl-6 text-[13px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-primary cursor-help">
                            <TrendingUp className="h-3 w-3" />
                            {impact.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                          {isNb
                            ? "Når du legger dette dokumentet til i profilen, bekrefter det at et kontrollpunkt er oppfylt. Dette øker scoren i det aktuelle kontrollområdet og den totale modenhetsscoren."
                            : "Adding this document to your profile confirms that a control point is fulfilled. This increases the score in the relevant control area and overall maturity score."}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                      <span>{isNb ? "Fremdrift" : "Progress"}</span>
                      <span>{req.progress_percent}%</span>
                    </div>
                    <Progress value={req.progress_percent} className="h-1.5" />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}