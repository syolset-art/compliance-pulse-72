import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
}

interface AddWorkAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkAreaAdded: () => void;
  workArea?: WorkArea | null;
}

export function AddWorkAreaDialog({ open, onOpenChange, onWorkAreaAdded, workArea }: AddWorkAreaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    responsible_person: ""
  });

  useEffect(() => {
    if (workArea) {
      setFormData({
        name: workArea.name,
        description: workArea.description || "",
        responsible_person: workArea.responsible_person || ""
      });
    } else {
      setFormData({
        name: "",
        description: "",
        responsible_person: ""
      });
    }
  }, [workArea, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (workArea) {
        // Update existing work area
        const { error } = await supabase
          .from("work_areas")
          .update(formData)
          .eq("id", workArea.id);

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: `${formData.name} ${t("common.success").toLowerCase()}.`,
        });
      } else {
        // Create new work area
        const { error } = await supabase.from("work_areas").insert([formData]);

        if (error) throw error;

        // Update onboarding progress
        const { data: progressData } = await supabase
          .from("onboarding_progress")
          .select("*")
          .single();

        if (progressData) {
          await supabase
            .from("onboarding_progress")
            .update({ work_areas_defined: true })
            .eq("id", progressData.id);
        }

        toast({
          title: t("common.success"),
          description: `${formData.name} ${t("common.success").toLowerCase()}.`,
        });
      }

      setFormData({
        name: "",
        description: "",
        responsible_person: ""
      });

      onWorkAreaAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving work area:", error);
      toast({
        title: t("common.error"),
        description: `Kunne ikke ${workArea ? "oppdatere" : "opprette"} arbeidsområde. Prøv igjen.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workArea ? t("dialog.editWorkArea") : t("dialog.addWorkArea")} 🏢
          </DialogTitle>
          <DialogDescription>
            {workArea 
              ? t("dialog.editWorkAreaDesc")
              : t("dialog.addWorkAreaDesc")
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialog.name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("dialog.namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_person">{t("dialog.responsible")}</Label>
            <Input
              id="responsible_person"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              placeholder={t("dialog.responsiblePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("dialog.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("dialog.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("dialog.close")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : workArea ? (
                t("dialog.update")
              ) : (
                t("dialog.create")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
