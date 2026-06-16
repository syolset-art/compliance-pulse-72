import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ExternalLink, Copy, Check, Pencil } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildSlug, buildPublicTrustUrl } from "@/lib/publicTrustUrl";
import { toast } from "sonner";

export function TrustProfileHero() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile-trust-hero"],
    queryFn: async () => {
      const { data } = await supabase.from("company_profile").select("*").limit(1).single();
      return data;
    },
  });

  const { data: ownAsset } = useQuery({
    queryKey: ["own-trust-asset"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id,name,publish_mode,updated_at")
        .in("publish_mode", ["public", "ecosystem"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const slugUniqueCode = (companyProfile as any)?.org_number || ownAsset?.id?.slice(0, 4);
  const slug = buildSlug((companyProfile as any)?.name || ownAsset?.name || "min-virksomhet", slugUniqueCode);
  const fullUrl = buildPublicTrustUrl(slug);
  const displayUrl = fullUrl.replace(/^https?:\/\//, "");
  const isPublished = ownAsset?.publish_mode === "public";

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const updatedAt = ownAsset?.updated_at
    ? new Date(ownAsset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">
              {isNb ? "Din Trust Profile" : "Your Trust Profile"}
            </h2>
            <Badge variant={isPublished ? "default" : "secondary"} className="text-xs">
              {isPublished ? (isNb ? "Publisert" : "Published") : (isNb ? "Ikke publisert" : "Not published")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">{displayUrl}</p>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb ? "Sist oppdatert" : "Last updated"}: {updatedAt}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" onClick={() => navigate("/trust-center/edit")}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {isNb ? "Rediger profil" : "Edit profile"}
            </Button>
            {isPublished && (
              <Button size="sm" variant="outline" asChild>
                <a href={fullUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {isNb ? "Åpne profil" : "Open profile"}
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {isNb ? "Kopier lenke" : "Copy link"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
