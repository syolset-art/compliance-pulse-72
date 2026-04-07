import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Upload, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManualDocumentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  requirementName: string;
  onSave: (status: string, comment: string) => void;
}

export function ManualDocumentationDialog({
  open,
  onOpenChange,
  requirementId,
  requirementName,
  onSave,
}: ManualDocumentationDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const handleSave = () => {
    if (!status) {
      toast({
        title: "Velg status",
        description: "Du må velge en status for kravet",
        variant: "destructive",
      });
      return;
    }
    onSave(status, comment);
    toast({
      title: "Dokumentasjon lagret",
      description: `Status for ${requirementName} er oppdatert`,
    });
    setStatus("");
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Manuell dokumentering</DialogTitle>
              <DialogDescription>
                Bekreft om dette kravet oppfylles i din organisasjon ved å velge status og legge til dokumentasjon.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Status */}
          <div className="space-y-2">
            <Label className="font-semibold">
              Status <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Hvordan oppfyller dere dette kravet?</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Velg status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fulfilled">Oppfylt</SelectItem>
                <SelectItem value="partial">Delvis oppfylt</SelectItem>
                <SelectItem value="not_fulfilled">Ikke oppfylt</SelectItem>
                <SelectItem value="not_applicable">Ikke relevant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="font-semibold">Kommentar / dokumentasjon</Label>
            <p className="text-xs text-muted-foreground">
              Legg til en kort beskrivelse av hvordan dere oppfyller dette kravet.
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv hvordan kravet oppfylles i praksis..."
              className="min-h-[100px]"
            />
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Tilknyttede dokumenter</Label>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Upload className="h-3.5 w-3.5" />
                Last opp nytt
              </Button>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Velg eksisterende dokumenter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">Informasjonssikkerhetspolicy.pdf</SelectItem>
                <SelectItem value="risk">Risikovurdering Q1 2026.xlsx</SelectItem>
                <SelectItem value="audit">Intern revisjon 2025.pdf</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Lagre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
