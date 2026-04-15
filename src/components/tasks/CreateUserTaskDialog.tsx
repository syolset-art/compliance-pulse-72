import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assetId, setAssetId] = useState("");
  const [titleError, setTitleError] = useState(false);

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
      setTitleError(true);
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
    setTitleError(false);
    setOpen(false);
    toast({
      title: isNb ? "Aktivitet opprettet" : "Activity created",
      description: isNb ? "Den nye aktiviteten er lagt til." : "The new activity has been added.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {isNb ? "Ny aktivitet" : "New activity"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNb ? "Opprett ny aktivitet" : "Create new activity"}</DialogTitle>
          <DialogDescription>
            {isNb ? "Fyll inn detaljer for den nye aktiviteten." : "Fill in details for the new activity."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">{isNb ? "Aktivitet" : "Activity"} *</Label>
            <Input
              id="task-title"
              aria-required="true"
              aria-invalid={titleError}
              placeholder={isNb ? "Hva skal gjøres?" : "What needs to be done?"}
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
            />
            {titleError && (
              <p role="alert" className="text-xs text-destructive">
                {isNb ? "Aktivitetstittel er påkrevd." : "Activity title is required."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">{isNb ? "Beskrivelse" : "Description"}</Label>
            <Textarea
              id="task-desc"
              placeholder={isNb ? "Legg til detaljer..." : "Add details..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-assignee">{isNb ? "Ansvarlig" : "Assignee"}</Label>
              <Input
                id="task-assignee"
                placeholder={isNb ? "Navn" : "Name"}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">{isNb ? "Frist" : "Due date"}</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-asset">{isNb ? "Koble til eiendel" : "Link to asset"}</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger id="task-asset">
                <SelectValue placeholder={isNb ? "Velg eiendel (valgfritt)" : "Select asset (optional)"} />
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isNb ? "Opprett aktivitet" : "Create activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
