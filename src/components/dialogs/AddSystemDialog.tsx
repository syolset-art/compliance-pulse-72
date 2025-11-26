import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSystemAdded: () => void;
}

export function AddSystemDialog({ open, onOpenChange, onSystemAdded }: AddSystemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    vendor: "",
    risk_level: "medium"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("systems").insert([formData]);

      if (error) throw error;

      // Update onboarding progress
      const { data: progressData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .single();

      if (progressData) {
        await supabase
          .from("onboarding_progress")
          .update({ systems_added: true })
          .eq("id", progressData.id);
      }

      toast({
        title: "System lagt til!",
        description: `${formData.name} er nå registrert i systemet.`,
      });

      setFormData({
        name: "",
        description: "",
        category: "",
        vendor: "",
        risk_level: "medium"
      });

      onSystemAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding system:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til system. Prøv igjen.",
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
          <DialogTitle>Legg til nytt system 💻</DialogTitle>
          <DialogDescription>
            Registrer et IT-system som bedriften bruker. Dette hjelper med compliance-oversikt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Systemnavn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="F.eks. Microsoft 365, Salesforce, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Leverandør</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="F.eks. Microsoft, Salesforce"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="erp">ERP</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="productivity">Produktivitet</SelectItem>
                <SelectItem value="communication">Kommunikasjon</SelectItem>
                <SelectItem value="storage">Lagring</SelectItem>
                <SelectItem value="security">Sikkerhet</SelectItem>
                <SelectItem value="other">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_level">Risikonivå</Label>
            <Select value={formData.risk_level} onValueChange={(value) => setFormData({ ...formData, risk_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Lav</SelectItem>
                <SelectItem value="medium">Middels</SelectItem>
                <SelectItem value="high">Høy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kort beskrivelse av hva systemet brukes til..."
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
                "Legg til system"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
