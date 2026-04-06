import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, Trash2, Bot, Database } from "lucide-react";
import { toast } from "sonner";
import { AddDataCategoryDialog } from "./AddDataCategoryDialog";

interface PersonalDataCardProps {
  assetId: string;
}

const getCategoryStyle = (category: string) => {
  switch (category) {
    case "sensitive":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "special":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
};

const getCategoryLabel = (category: string, isNb: boolean) => {
  switch (category) {
    case "sensitive": return isNb ? "SENSITIV" : "SENSITIVE";
    case "special": return isNb ? "SÆRLIG" : "SPECIAL";
    default: return isNb ? "ORDINÆR" : "ORDINARY";
  }
};

export const PersonalDataCard = ({ assetId }: PersonalDataCardProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["asset-data-categories", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_categories")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const missingRetention = categories.filter((c) => !c.retention_period).length;

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("asset_data_categories").delete().eq("id", id);
    if (error) {
      toast.error(isNb ? "Kunne ikke slette" : "Could not delete");
      return;
    }
    toast.success(isNb ? "Datatype slettet" : "Data type deleted");
    queryClient.invalidateQueries({ queryKey: ["asset-data-categories", assetId] });
  };

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {isNb ? "Personopplysninger som behandles" : "Personal Data Processed"}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {isNb ? "Legg til" : "Add"}
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={getCategoryStyle(cat.category)}>
                      {getCategoryLabel(cat.category, isNb)}
                    </Badge>
                    <span className="text-sm truncate">{cat.data_type_name}</span>
                    {cat.source === "ai_detected" && (
                      <Badge variant="secondary" className="text-xs gap-0.5 px-1.5 py-0">
                        <Bot className="h-3 w-3" /> AI
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cat.retention_period && (
                      <span className="text-xs text-muted-foreground">{cat.retention_period}</span>
                    )}
                    {cat.legal_basis && (
                      <Badge variant="outline" className="text-xs">{cat.legal_basis}</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {missingRetention > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  ⚠ {missingRetention} {isNb ? "datatyper mangler definert oppbevaringstid" : "data types missing retention period"}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {isNb
                  ? "Ingen personopplysningstyper registrert. AI kan kartlegge dette automatisk fra personvernerklæring."
                  : "No personal data types registered. AI can map these automatically from privacy policies."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddDataCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} assetId={assetId} />
    </>
  );
};
