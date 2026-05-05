import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Link2, Copy, Check, Pencil, Globe, Share2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const TrustCenterPublicProfile = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["self-asset-public-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("*")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const slug = useMemo(() => {
    const base = (companyProfile?.name || asset?.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9æøå\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    const suffix = companyProfile?.org_number
      ? `-${companyProfile.org_number.replace(/\s/g, "").slice(-4)}`
      : "";
    return `${base}${suffix}`;
  }, [companyProfile?.name, asset?.name, companyProfile?.org_number]);

  const publicUrl = `https://trust.mynder.com/${slug}`;
  const publishMode = (asset as any)?.publish_mode || "private";
  const isPublished = publishMode && publishMode !== "private";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            <div>
              <button
                onClick={() => navigate("/trust-center/edit")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {isNb ? "Rediger Trust Profile" : "Edit Trust Profile"}
              </button>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  {isNb ? "Offentlig profil" : "Public profile"}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isNb
                  ? "Administrer din offentlige Trust Center-lenke, synlighet og delingsalternativer."
                  : "Manage your public Trust Center link, visibility and sharing options."}
              </p>
            </div>

            {/* URL Card */}
            <Card className="p-5 space-y-3 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {isNb ? "Din Trust Center URL" : "Your Trust Center URL"}
                </span>
                <Badge
                  variant={isPublished ? "action" : "secondary"}
                  className="ml-auto text-[11px]"
                >
                  {isPublished ? (
                    <>
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      {isNb ? "Publisert" : "Published"}
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      {isNb ? "Privat" : "Private"}
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Dette er din offentlige lenke til din Trust Center-profil. Del den med kunder, partnere og potensielle kjøpere."
                  : "This is your public link to your Trust Center profile. Share it with customers, partners and prospects."}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5">
                  <code className="text-sm font-mono text-foreground break-all">{publicUrl}</code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => navigate("/trust-center/profile")}
                  title={isNb ? "Forhåndsvis" : "Preview"}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title={isNb ? "Rediger lenke" : "Edit link"}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleCopyUrl}
                  title={isNb ? "Kopier" : "Copy"}
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>

            {/* Visibility / publishing */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {isNb ? "Synlighet og publisering" : "Visibility and publishing"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Velg hvem som skal kunne se din Trust Profile. Du kan publisere åpent, dele med utvalgte kontakter, eller holde profilen privat."
                  : "Choose who can see your Trust Profile. You can publish openly, share with selected contacts, or keep it private."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/trust-center/profile")}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {isNb ? "Forhåndsvis profil" : "Preview profile"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => asset && navigate(`/assets/${asset.id}`)}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  {isNb ? "Del og publiseringsinnstillinger" : "Share & publishing settings"}
                </Button>
              </div>
            </Card>

            {/* Helper info */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <p className="text-xs text-muted-foreground">
                {isNb
                  ? "Tips: Innholdet som vises på den offentlige profilen styres fra Innholdsmatrisen i Rediger Trust Profile."
                  : "Tip: The content shown on the public profile is controlled from the Content Matrix in Edit Trust Profile."}
              </p>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TrustCenterPublicProfile;
