import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  CalendarIcon,
  Plus,
  X,
  Cpu,
  Building2,
  User,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: any) => void;
  currentUser: string;
}

const TEAM_MEMBERS = [
  "Maria Larsen",
  "Erik Solberg",
  "Jonas Hansen",
  "Anna Kristiansen",
  "Kari Nordmann",
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
  currentUser,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [linkedAssetId, setLinkedAssetId] = useState<string>("");
  const [assignee, setAssignee] = useState(currentUser);
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [priority, setPriority] = useState<"høy" | "middels" | "lav">("middels");

  // Fetch systems and vendors for linking
  const { data: systems = [] } = useQuery({
    queryKey: ["task-systems"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name")
        .eq("asset_type", "system")
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["task-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name")
        .eq("asset_type", "vendor")
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setLinkedAssetId("");
    setAssignee(currentUser);
    setCollaboratorInput("");
    setCollaborators([]);
    setPriority("middels");
  };

  const handleAddCollaborator = () => {
    const trimmed = collaboratorInput.trim();
    if (trimmed && !collaborators.includes(trimmed)) {
      setCollaborators([...collaborators, trimmed]);
      setCollaboratorInput("");
    }
  };

  const handleRemoveCollaborator = (name: string) => {
    setCollaborators(collaborators.filter((c) => c !== name));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Determine linked entity info
    let linkedEntity = "";
    let linkedEntityType: "system" | "leverandør" | "behandling" | "dokument" = "system";
    const allAssets = [...systems, ...vendors];
    const linkedAsset = allAssets.find((a) => a.id === linkedAssetId);
    if (linkedAsset) {
      linkedEntity = linkedAsset.name;
      linkedEntityType = systems.some((s) => s.id === linkedAssetId) ? "system" : "leverandør";
    }

    const newTask = {
      id: `manual-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "Manuelt opprettet oppgave",
      category: linkedEntityType,
      priority,
      status: "åpen" as const,
      assignee,
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd") : format(new Date(Date.now() + 14 * 86400000), "yyyy-MM-dd"),
      linkedEntity: linkedEntity || "Ikke tilknyttet",
      linkedEntityType,
      source: "Manuelt opprettet",
      aiDraftable: false,
      collaborators,
    };

    onTaskCreated(newTask);
    resetForm();
    onOpenChange(false);
  };

  const availableCollaborators = TEAM_MEMBERS.filter(
    (m) => m !== assignee && !collaborators.includes(m)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opprett oppgave</DialogTitle>
          <DialogDescription>
            Legg til en ny oppgave med beskrivelse, frist og ansvarlig.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Tittel *</Label>
            <Input
              id="task-title"
              placeholder="F.eks. Oppdater DPA for Hubspot"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Beskrivelse</Label>
            <Textarea
              id="task-desc"
              placeholder="Beskriv hva oppgaven går ut på..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority & Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioritet</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="høy">Høy</SelectItem>
                  <SelectItem value="middels">Middels</SelectItem>
                  <SelectItem value="lav">Lav</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Frist (valgfritt)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d. MMM yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Linked asset */}
          <div className="space-y-1.5">
            <Label>Tilknyttet eiendel (valgfritt)</Label>
            <Select value={linkedAssetId} onValueChange={setLinkedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg system eller leverandør" />
              </SelectTrigger>
              <SelectContent>
                {systems.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Cpu className="h-3 w-3" />
                      Systemer
                    </div>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {vendors.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Building2 className="h-3 w-3" />
                      Leverandører
                    </div>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {systems.length === 0 && vendors.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    Ingen systemer eller leverandører registrert
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Ansvarlig
            </Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m} {m === currentUser && "(deg)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Collaborators */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Inviter deltakere (valgfritt)
            </Label>
            <div className="flex gap-2">
              <Select
                value={collaboratorInput}
                onValueChange={(v) => {
                  if (v && !collaborators.includes(v)) {
                    setCollaborators([...collaborators, v]);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Velg person" />
                </SelectTrigger>
                <SelectContent>
                  {availableCollaborators.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                  {availableCollaborators.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                      Ingen flere tilgjengelige
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {collaborators.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1 pr-1">
                    {c}
                    <button
                      onClick={() => handleRemoveCollaborator(c)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Opprett
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
