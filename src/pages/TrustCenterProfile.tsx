import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Users, Building2, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { AssetHeader } from "@/components/asset-profile/AssetHeader";
import { AssetMetrics } from "@/components/asset-profile/AssetMetrics";
import { TrustProfilePublishing } from "@/components/asset-profile/TrustProfilePublishing";
import { ValidationTab } from "@/components/asset-profile/tabs/ValidationTab";

const TrustCenterProfile = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const headerRef = useRef<HTMLDivElement>(null);

  const [trustMetrics, setTrustMetrics] = useState<{
    trustScore: number;
    confidenceScore: number;
    lastUpdated: string;
  } | null>(null);

  // Fetch the self-asset (organization's own profile)
  const { data: asset, isLoading } = useQuery({
    queryKey: ["self-asset-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, work_areas (id, name, responsible_person)")
        .eq("asset_type", "self")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: template } = useQuery({
    queryKey: ["asset_type_template", "self"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_type_templates")
        .select("*")
        .eq("asset_type", "self")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["asset-tasks", asset?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [asset!.id]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!asset?.id,
  });

  // Company profile for roles/metadata
  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_trust_center"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleTrustMetrics = useCallback(
    (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => {
      setTrustMetrics((prev) => {
        if (prev && prev.trustScore === metrics.trustScore && prev.confidenceScore === metrics.confidenceScore) return prev;
        return metrics;
      });
    },
    []
  );

  const handleNavigateToTab = useCallback(
    (target: string) => {
      if (target.startsWith("_header:")) {
        headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // For tab-level navigation, redirect to the full asset view
      if (asset?.id) {
        navigate(`/assets/${asset.id}`);
      }
    },
    [asset?.id, navigate]
  );

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-20 space-y-4">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">
                {isNb ? "Ingen Trust Profile funnet" : "No Trust Profile found"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {isNb
                  ? "Fullfør onboarding for å opprette din organisasjonsprofil."
                  : "Complete onboarding to create your organization profile."}
              </p>
              <Button onClick={() => navigate("/onboarding")}>
                {isNb ? "Start onboarding" : "Start onboarding"}
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const roles = [
    {
      label: isNb ? "DPO" : "DPO",
      name: companyProfile?.dpo_name,
      email: companyProfile?.dpo_email,
    },
    {
      label: "CISO",
      name: companyProfile?.ciso_name,
      email: companyProfile?.ciso_email,
    },
    {
      label: isNb ? "Compliance-ansvarlig" : "Compliance Officer",
      name: companyProfile?.compliance_officer,
      email: companyProfile?.compliance_officer_email,
    },
  ].filter((r) => r.name);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-5">
            {/* Title + Publishing toolbar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isNb ? "Din Trust Profile" : "Your Trust Profile"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {asset.name} •{" "}
                    {isNb
                      ? "Administrer og del din compliance-profil"
                      : "Manage and share your compliance profile"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <Settings className="h-4 w-4" />
                  {isNb ? "Avansert" : "Advanced"}
                </Button>
              </div>

              <TrustProfilePublishing
                assetId={asset.id}
                assetName={asset.name}
                orgNumber={(asset as any).org_number || ""}
                publishMode={(asset as any).publish_mode || "private"}
                publishToCustomers={(asset as any).publish_to_customers || []}
              />
            </div>

            {/* Section 1: Entity Header with Trust Seal */}
            <div ref={headerRef}>
              <AssetHeader asset={asset} template={template} trustMetrics={trustMetrics} />
            </div>

            {/* Section 2: Security Areas + Metrics */}
            <AssetMetrics
              asset={asset}
              tasksCount={tasks?.length || 0}
              onTrustMetrics={handleTrustMetrics}
              onNavigateToTab={handleNavigateToTab}
            />

            {/* Section 3: Trust Score Details (inline ValidationTab) */}
            <section aria-label={isNb ? "Trust Score-detaljer" : "Trust Score Details"}>
              <ValidationTab assetId={asset.id} />
            </section>

            {/* Section 4: Key Roles */}
            {roles.length > 0 && (
              <section aria-label={isNb ? "Nøkkelroller" : "Key Roles"}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {isNb ? "Nøkkelroller" : "Key Roles"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <div
                          key={role.label}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20"
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {role.label}
                            </p>
                            <p className="text-sm font-medium truncate">{role.name}</p>
                            {role.email && (
                              <p className="text-xs text-muted-foreground truncate">{role.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Section 5: Organization Coverage */}
            <section aria-label={isNb ? "Organisasjonsdekning" : "Organization Coverage"}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {isNb ? "Organisasjonsdekning" : "Organization Coverage"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: isNb ? "Bransje" : "Industry",
                        value: companyProfile?.industry || "–",
                        icon: Building2,
                      },
                      {
                        label: isNb ? "Ansatte" : "Employees",
                        value: companyProfile?.employees || "–",
                        icon: Users,
                      },
                      {
                        label: isNb ? "Geografisk dekning" : "Geographic scope",
                        value: companyProfile?.geographic_scope || "–",
                        icon: Globe,
                      },
                      {
                        label: isNb ? "Domene" : "Domain",
                        value: companyProfile?.domain || "–",
                        icon: ExternalLink,
                      },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 rounded-lg bg-muted/20 border border-border">
                        <item.icon className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
