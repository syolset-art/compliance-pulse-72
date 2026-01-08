import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Link2, ArrowRight } from "lucide-react";

interface RelationsTabProps {
  assetId: string;
}

export const RelationsTab = ({ assetId }: RelationsTabProps) => {
  const { t } = useTranslation();

  // Fetch relationships where this asset is the source
  const { data: outgoingRelations } = useQuery({
    queryKey: ["asset-relations-outgoing", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select(`
          *,
          target:target_asset_id (
            id,
            name,
            asset_type
          )
        `)
        .eq("source_asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch relationships where this asset is the target
  const { data: incomingRelations } = useQuery({
    queryKey: ["asset-relations-incoming", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select(`
          *,
          source:source_asset_id (
            id,
            name,
            asset_type
          )
        `)
        .eq("target_asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const getRelationshipLabel = (type: string) => {
    const labels: Record<string, string> = {
      uses: t("assets.relationUses"),
      hosts: t("assets.relationHosts"),
      connects_to: t("assets.relationConnectsTo"),
      integrates_with: t("assets.relationIntegratesWith"),
      governed_by: t("assets.relationGovernedBy"),
    };
    return labels[type] || type;
  };

  const getAssetTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      vendor: "bg-purple-500/20 text-purple-500 border-purple-500/30",
      location: "bg-green-500/20 text-green-500 border-green-500/30",
      network: "bg-orange-500/20 text-orange-500 border-orange-500/30",
      integration: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
      hardware: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      data: "bg-red-500/20 text-red-500 border-red-500/30",
      contract: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const totalRelations = (outgoingRelations?.length || 0) + (incomingRelations?.length || 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {t("assets.relations")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("assets.addRelation")}
          </Button>
        </CardHeader>
        <CardContent>
          {totalRelations > 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("assets.totalRelations", { count: totalRelations })}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">{t("assets.noRelations")}</p>
          )}
        </CardContent>
      </Card>

      {/* Outgoing Relations */}
      {outgoingRelations && outgoingRelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("assets.outgoingRelations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outgoingRelations.map((relation: any) => (
                <div key={relation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {getRelationshipLabel(relation.relationship_type)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{relation.target?.name}</span>
                    <Badge className={`text-xs ${getAssetTypeBadgeColor(relation.target?.asset_type)}`}>
                      {relation.target?.asset_type}
                    </Badge>
                  </div>
                  {relation.description && (
                    <span className="text-sm text-muted-foreground">{relation.description}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incoming Relations */}
      {incomingRelations && incomingRelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("assets.incomingRelations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingRelations.map((relation: any) => (
                <div key={relation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{relation.source?.name}</span>
                    <Badge className={`text-xs ${getAssetTypeBadgeColor(relation.source?.asset_type)}`}>
                      {relation.source?.asset_type}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {getRelationshipLabel(relation.relationship_type)}
                    </Badge>
                  </div>
                  {relation.description && (
                    <span className="text-sm text-muted-foreground">{relation.description}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {totalRelations === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("assets.noRelationsDescription")}</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              {t("assets.addFirstRelation")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
