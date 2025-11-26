import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddWorkAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkAreaAdded: () => void;
}

export function AddWorkAreaDialog({ open, onOpenChange, onWorkAreaAdded }: AddWorkAreaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    responsible_person: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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
        title: "Arbeidsområde opprettet!",
        description: `${formData.name} er nå lagt til.`,
      });

      setFormData({
        name: "",
        description: "",
        responsible_person: ""
      });

      onWorkAreaAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding work area:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette arbeidsområde. Prøv igjen.",
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
          <DialogTitle>Definer arbeidsområde 🏢</DialogTitle>
          <DialogDescription>
            Opprett et arbeidsområde for å strukturere virksomheten. Kan være avdelinger, team eller funksjonsområder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn på arbeidsområde *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="F.eks. IT-avdelingen, HR, Økonomi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_person">Ansvarlig person</Label>
            <Input
              id="responsible_person"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              placeholder="Navn på ansvarlig leder/person"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Hva gjør dette arbeidsområdet? Hvilke ansvarsområder har det?"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                "Opprett arbeidsområde"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
