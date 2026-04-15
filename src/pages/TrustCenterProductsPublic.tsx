import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Server, Shield, Loader2, ExternalLink } from "lucide-react";

const TrustCenterProductsPublic = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data: selfAsset, isLoading: loadingSelf } = useQuery({
    queryKey: ["self-asset"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, logo_url")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["trust-center-services-public", selfAsset?.id],
    enabled: !!selfAsset?.id,
    queryFn: async () => {
      const { data: rels, error: relError } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", selfAsset!.id)
        .eq("relationship_type", "service_of");
      if (relError) throw relError;
      if (!rels || rels.length === 0) return [];

      const ids = rels.map((r) => r.target_asset_id);
      const { data: assets, error } = await supabase
        .from("assets")
        .select("id, name, description, asset_type, compliance_score, publish_mode")
        .in("id", ids);
      if (error) throw error;
      return (assets || []).filter((a) => a.publish_mode === "public" || true); // show all for now
    },
  });

  const isLoading = loadingSelf || loadingServices;

  const content = (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-10 pt-16 md:pt-20">
      {/* Back to Trust Profile */}
      <button
        onClick={() => navigate("/trust-center/profile")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isNb ? "Tilbake til Trust Profile" : "Back to Trust Profile"}
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {isNb ? "Produkter og tjenester" : "Products & Services"}
            </h1>
            {selfAsset?.name && (
              <p className="text-sm text-muted-foreground">{selfAsset.name}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2">
          {isNb
            ? "Oversikt over Trust Profiler for våre produkter og tjenester."
            : "Overview of Trust Profiles for our products and services."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Ingen produktprofiler er publisert ennå."
                : "No product profiles have been published yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((svc) => (
            <Card
              key={svc.id}
              className="group hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate(`/trust-center/profile/${svc.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {svc.asset_type === "saas" ? (
                      <Globe className="h-6 w-6 text-primary" />
                    ) : (
                      <Server className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                      <Badge
                        variant={svc.asset_type === "saas" ? "default" : "secondary"}
                        className="text-[13px]"
                      >
                        {svc.asset_type === "saas" ? "SaaS" : "Service"}
                      </Badge>
                    </div>
                    {svc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {typeof svc.compliance_score === "number" && svc.compliance_score > 0 && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Shield className="h-3 w-3" />
                        {svc.compliance_score}%
                      </Badge>
                    )}
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-mynder">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">{content}</main>
    </div>
  );
};

export default TrustCenterProductsPublic;
