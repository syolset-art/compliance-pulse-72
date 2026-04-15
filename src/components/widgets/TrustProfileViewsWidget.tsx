import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function TrustProfileViewsWidget() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const navigate = useNavigate();
  const [publishMode, setPublishMode] = useState<string | null>(null);
  const [selfAssetId, setSelfAssetId] = useState<string | null>(null);

  // Demo views count
  const viewsCount = 12;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, publish_mode")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();

      if (data) {
        setPublishMode(data.publish_mode);
        setSelfAssetId(data.id);
      }
    };
    fetch();
  }, []);

  const isPublished = publishMode && publishMode !== "private";

  return (
    <Card variant="flat" className="h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          {isNorwegian ? "Trust Profil" : "Trust Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">{viewsCount}</p>
            <p className="text-[13px] text-muted-foreground">
              {isNorwegian ? "visninger siste 30 dager" : "views last 30 days"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isPublished ? "action" : "secondary"}
            className="text-[13px]"
          >
            {isPublished
              ? isNorwegian
                ? "Publisert"
                : "Published"
              : isNorwegian
              ? "Privat"
              : "Private"}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8"
          onClick={() => {
            if (selfAssetId) navigate(`/assets/${selfAssetId}`);
          }}
        >
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          {isNorwegian ? "Del via Mynder Trust Engine" : "Share via Mynder Trust Engine"}
        </Button>
      </CardContent>
    </Card>
  );
}
