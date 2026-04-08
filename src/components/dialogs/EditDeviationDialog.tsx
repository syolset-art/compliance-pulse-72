import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

interface EditDeviationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: any;
}

const PEOPLE = [
  "Thomas Berg",
  "Maria Johansen",
  "Erik Hansen",
  "Lise Andersen",
  "Anders Nilsen",
  "Kari Olsen",
  "Per Kristiansen",
  "Anne Svendsen",
];

const STATUS_OPTIONS = [
  { value: "open", label: "Åpen" },
  { value: "in_progress", label: "Pågår" },
  { value: "resolved", label: "Løst" },
];

const CRITICALITY_OPTIONS = [
  { value: "critical", label: "Kritisk" },
  { value: "high", label: "Høy" },
  { value: "medium", label: "Middels" },
  { value: "low", label: "Lav" },
];

export function EditDeviationDialog({ open, onOpenChange, incident }: EditDeviationDialogProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open",
    risk_level: "medium",
    responsible: "",
    discoveredAt: new Date(),
    dueDate: null as Date | null,
    category: "",
  });

  useEffect(() => {
    if (incident) {
      setFormData({
        title: incident.title || "",
        description: incident.description || "",
        status: incident.status || "open",
        risk_level: incident.risk_level || incident.criticality || "medium",
        responsible: incident.responsible || "",
        discoveredAt: incident.discovered_at ? new Date(incident.discovered_at) : new Date(incident.created_at || Date.now()),
        dueDate: incident.due_date ? new Date(incident.due_date) : null,
        category: incident.category || "",
      });
    }
  }, [incident]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("system_incidents")
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          risk_level: formData.risk_level,
          criticality: formData.risk_level,
          responsible: formData.responsible || null,
          discovered_at: format(formData.discoveredAt, "yyyy-MM-dd"),
          due_date: formData.dueDate ? format(formData.dueDate, "yyyy-MM-dd") : null,
          category: formData.category || null,
          last_updated: new Date().toISOString(),
        })
        .eq("id", incident.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success("Avvik oppdatert");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Kunne ikke oppdatere avviket");
    },
  });

  if (!incident) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger avvik</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Tittel</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Beskrivelse</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Status + Criticality row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alvorlighetsgrad</Label>
              <Select value={formData.risk_level} onValueChange={(v) => setFormData({ ...formData, risk_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRITICALITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <Label>Ansvarlig</Label>
            <Select value={formData.responsible} onValueChange={(v) => setFormData({ ...formData, responsible: v })}>
              <SelectTrigger><SelectValue placeholder="Velg ansvarlig" /></SelectTrigger>
              <SelectContent>
                {PEOPLE.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Oppdaget dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.discoveredAt, "dd.MM.yyyy", { locale: nb })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.discoveredAt}
                    onSelect={(d) => d && setFormData({ ...formData, discoveredAt: d })}
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Frist for utbedring</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "dd.MM.yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate || undefined}
                    onSelect={(d) => setFormData({ ...formData, dueDate: d || null })}
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="f.eks. personvern, sikkerhet, drift"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Lagre endringer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
