import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleAdded: () => void;
}

export function AddRoleDialog({ open, onOpenChange, onRoleAdded }: AddRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [workAreas, setWorkAreas] = useState<any[]>([]);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    work_area_id: "",
    responsibilities: ""
  });

  useEffect(() => {
    if (open) {
      fetchWorkAreas();
    }
  }, [open]);

  const fetchWorkAreas = async () => {
    const { data, error } = await supabase.from("work_areas").select("*");
    if (!error && data) {
      setWorkAreas(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const responsibilitiesArray = formData.responsibilities
        .split("\n")
        .filter(r => r.trim())
        .map(r => r.trim());

      const { error } = await supabase.from("roles").insert([{
        name: formData.name,
        description: formData.description,
        work_area_id: formData.work_area_id || null,
        responsibilities: responsibilitiesArray
      }]);

      if (error) throw error;

      // Update onboarding progress
      const { data: progressData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .single();

      if (progressData) {
        await supabase
          .from("onboarding_progress")
          .update({ roles_assigned: true })
          .eq("id", progressData.id);
      }

      toast({
        title: "Rolle opprettet!",
        description: `${formData.name} er nå lagt til.`,
      });

      setFormData({
        name: "",
        description: "",
        work_area_id: "",
        responsibilities: ""
      });

      onRoleAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette rolle. Prøv igjen.",
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
          <DialogTitle>Opprett rolle 👥</DialogTitle>
          <DialogDescription>
            Definer en rolle med tilhørende ansvar. Roller kan knyttes til arbeidsområder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rollenavn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="F.eks. Personvernombud, IT-ansvarlig, Sikkerhetsrådgiver"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_area_id">Arbeidsområde</Label>
            <Select value={formData.work_area_id} onValueChange={(value) => setFormData({ ...formData, work_area_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Velg arbeidsområde (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ingen</SelectItem>
                {workAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workAreas.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Du må opprette arbeidsområder først for å knytte roller til dem.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Hva gjør denne rollen?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsibilities">Ansvarsområder</Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="Skriv ett ansvar per linje&#10;F.eks:&#10;- Håndtere personvernforespørsler&#10;- Utføre DPIA&#10;- Rapportere til tilsynsmyndigheter"
              rows={5}
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
                "Opprett rolle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
