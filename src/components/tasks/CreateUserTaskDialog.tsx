import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateUserTaskDialogProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    assignee?: string;
    due_date?: string;
    asset_id?: string;
  }) => void;
  isLoading?: boolean;
}

export function CreateUserTaskDialog({ onSubmit, isLoading }: CreateUserTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assetId, setAssetId] = useState("");

  const { data: assets = [] } = useQuery({
    queryKey: ["assets-for-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, asset_type")
        .order("name");
      return data || [];
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: "Feil", description: "Aktivitetstittel er påkrevd.", variant: "destructive" });
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assignee: assignee.trim() || undefined,
      due_date: dueDate || undefined,
      asset_id: assetId || undefined,
    });
    setTitle("");
    setDescription("");
    setAssignee("");
    setDueDate("");
    setAssetId("");
    setOpen(false);
    toast({ title: "Aktivitet opprettet", description: "Den nye aktiviteten er lagt til." });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ny aktivitet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett ny aktivitet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Aktivitet *</Label>
            <Input
              id="task-title"
              placeholder="Hva skal gjøres?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Beskrivelse</Label>
            <Textarea
              id="task-desc"
              placeholder="Legg til detaljer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Ansvarlig</Label>
              <Input
                id="task-assignee"
                placeholder="Navn"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Frist</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Koble til eiendel</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg eiendel (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            Opprett aktivitet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
