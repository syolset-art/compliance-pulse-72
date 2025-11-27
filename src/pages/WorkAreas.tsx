import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Users as UsersIcon, FileText, Server, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
}

export default function WorkAreas() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWorkArea, setEditingWorkArea] = useState<WorkArea | null>(null);
  const [deletingWorkArea, setDeletingWorkArea] = useState<WorkArea | null>(null);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { mode } = useNavigationMode();
  const { t } = useTranslation();

  const fetchWorkAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("work_areas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkAreas(data || []);
    } catch (error) {
      console.error("Error fetching work areas:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke hente arbeidsområder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkAreas();
  }, []);

  const handleWorkAreaAdded = () => {
    fetchWorkAreas();
    setEditingWorkArea(null);
  };

  const handleEdit = (area: WorkArea) => {
    setEditingWorkArea(area);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingWorkArea) return;

    try {
      const { error } = await supabase
        .from("work_areas")
        .delete()
        .eq("id", deletingWorkArea.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Arbeidsområdet ble slettet",
      });

      fetchWorkAreas();
    } catch (error) {
      console.error("Error deleting work area:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke slette arbeidsområde",
        variant: "destructive",
      });
    } finally {
      setDeletingWorkArea(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingWorkArea(null);
    }
  };

  if (mode === "chat") {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("workAreas.title")} ({workAreas.length})
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("workAreas.subtitle")}
              </p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("workAreas.addNew")}
            </Button>
          </div>

          {/* Work Areas Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Velg arbeidsområde</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : workAreas.length === 0 ? (
              <Card className="p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("workAreas.noWorkAreas")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("workAreas.noWorkAreasDesc")}
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("workAreas.addNew")}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workAreas.map((area) => (
                  <Card 
                    key={area.id} 
                    className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {area.name.toLowerCase().includes("hr") || 
                         area.name.toLowerCase().includes("personell") ? (
                          <UsersIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <Shield className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 truncate">
                          {area.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("workAreas.responsiblePerson")}: {area.responsible_person || "Ikke tildelt"}
                        </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(area);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingWorkArea(area);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>0 {t("workAreas.processes").toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        <span>0 {t("workAreas.users").toLowerCase()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        <span>0 {t("workAreas.systems").toLowerCase()}</span>
                      </div>
                    </div>

                    {area.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {area.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Risiko</span>
                        <span className="text-primary font-medium">Moderat risiko</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>2 {t("workAreas.criticalAlerts")}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AddWorkAreaDialog 
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        onWorkAreaAdded={handleWorkAreaAdded}
        workArea={editingWorkArea}
      />

      <AlertDialog open={!!deletingWorkArea} onOpenChange={() => setDeletingWorkArea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workAreas.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("workAreas.deleteDescription")} "{deletingWorkArea?.name}". {t("workAreas.cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("workAreas.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("workAreas.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
