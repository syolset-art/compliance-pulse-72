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
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-foreground">
                {isNb ? "Din Trust Profile" : "Your Trust Profile"}
              </h2>
              <Badge variant={isPublished ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                {isPublished ? (isNb ? "Publisert" : "Published") : (isNb ? "Ikke publisert" : "Not published")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isPublished ? (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline truncate inline-flex items-center gap-1"
                >
                  {displayUrl}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground truncate">{displayUrl}</span>
              )}
              <button
                onClick={copyLink}
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                title={isNb ? "Kopier lenke" : "Copy link"}
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
              {updatedAt && (
                <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                  · {updatedAt}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/trust-center/edit")}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          {isNb ? "Rediger" : "Edit"}
        </Button>
      </div>
    </Card>
  );
}
