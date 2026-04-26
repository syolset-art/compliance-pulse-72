import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Link2, ArrowRight, Server, Network, GitMerge, Shield, Trash2 } from "lucide-react";
import { AddRelationDialog } from "@/components/dialogs/AddRelationDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface RelationsTabProps {
  assetId: string;
}

const RELATIONSHIP_ICONS: Record<string, React.ElementType> = {
  uses: ArrowRight,
  hosts: Server,
  connects_to: Network,
  integrates_with: GitMerge,
  governed_by: Shield,
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  uses: "text-primary bg-primary/20",
  hosts: "text-status-closed bg-status-closed/20",
  connects_to: "text-warning bg-warning/20",
  integrates_with: "text-primary bg-primary/20",
  governed_by: "text-warning bg-warning/20",
};

export const RelationsTab = ({ assetId }: RelationsTabProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const deleteRelation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from("asset_relationships")
        .delete()
        .eq("id", relationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-relations-outgoing", assetId] });
      queryClient.invalidateQueries({ queryKey: ["asset-relations-incoming", assetId] });
      toast.success(t("assets.relationDeleted"));
    },
    onError: () => {
      toast.error(t("common.error"));
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
      system: "bg-primary/20 text-primary border-primary/30",
      vendor: "bg-accent/20 text-accent border-accent/30",
      location: "bg-status-closed/20 text-status-closed border-status-closed/30",
      network: "bg-warning/20 text-warning border-warning/30",
      integration: "bg-primary/20 text-primary border-primary/30",
      hardware: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      data: "bg-destructive/20 text-destructive border-destructive/30",
      contract: "bg-warning/20 text-warning border-warning/30",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const getRelationIcon = (type: string) => {
    const Icon = RELATIONSHIP_ICONS[type] || ArrowRight;
    const colorClass = RELATIONSHIP_COLORS[type] || "text-muted-foreground bg-muted";
    return (
      <div className={cn("p-1.5 rounded", colorClass.split(" ")[1])}>
        <Icon className={cn("h-4 w-4", colorClass.split(" ")[0])} />
      </div>
    );
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
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
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
                <div key={relation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
                  <div className="flex items-center gap-3">
                    {getRelationIcon(relation.relationship_type)}
                    <Badge variant="outline" className="text-xs">
                      {getRelationshipLabel(relation.relationship_type)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{relation.target?.name}</span>
                    <Badge className={`text-xs ${getAssetTypeBadgeColor(relation.target?.asset_type)}`}>
                      {relation.target?.asset_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {relation.description && (
                      <span className="text-sm text-muted-foreground">{relation.description}</span>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("assets.deleteRelation")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("assets.confirmDeleteRelation")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteRelation.mutate(relation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
                    {getRelationIcon(relation.relationship_type)}
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
            <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("assets.addFirstRelation")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Relation Dialog */}
      <AddRelationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        sourceAssetId={assetId} 
      />
    </div>
  );
};
