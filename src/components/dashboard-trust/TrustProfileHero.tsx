import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Pencil, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ShareTrustProfileDialog from "@/components/trust-center/ShareTrustProfileDialog";

export function TrustProfileHero() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

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
        .select("id,name,updated_at")
        .eq("asset_type", "self")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const updatedAt = ownAsset?.updated_at
    ? new Date(ownAsset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ShieldCheck className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-foreground">
                {isNb ? "Din Trust Profile" : "Your Trust Profile"}
              </h2>
              {updatedAt && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {isNb ? "Sist oppdatert" : "Last updated"}: {updatedAt}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => setShareOpen(true)}
              disabled={!ownAsset?.id}
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              {isNb ? "Del profil" : "Share profile"}
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => navigate("/trust-center/edit")}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {isNb ? "Rediger" : "Edit"}
            </Button>
          </div>
        </div>

      </Card>
      {ownAsset?.id && (
        <ShareTrustProfileDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          assetId={ownAsset.id}
        />
      )}
    </>
  );
}
