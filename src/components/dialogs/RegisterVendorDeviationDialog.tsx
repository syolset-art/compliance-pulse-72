import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { deviationCategories } from "@/lib/deviationCategories";
import { getControlAreaLabel, CONTROL_AREAS } from "@/lib/controlAreas";
import { suggestRequirementImpacts } from "@/lib/deviationImpact";
import { useRegisterVendorDeviation } from "@/hooks/useVendorDeviations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  vendorName?: string;
}

const CRITICALITY = [
  { value: "critical", label: "Kritisk" },
  { value: "high", label: "Høy" },
  { value: "medium", label: "Middels" },
  { value: "low", label: "Lav" },
];

const SOURCES = [
  { value: "manual", label: "Registrert av oss" },
  { value: "vendor_self", label: "Meldt av leverandøren" },
  { value: "agent", label: "Oppdaget av agent" },
];

export function RegisterVendorDeviationDialog({ open, onOpenChange, assetId, vendorName }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sikkerhet");
  const [criticality, setCriticality] = useState("medium");
  const [source, setSource] = useState("manual");
  const [responsible, setResponsible] = useState("");
  const [discoveredAt, setDiscoveredAt] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const suggestions = useMemo(
    () => suggestRequirementImpacts(category, criticality),
    [category, criticality],
  );

  useEffect(() => {
    setSelected(suggestions.map((s) => s.requirement_id));
  }, [suggestions]);

  const register = useRegisterVendorDeviation(assetId, () => {
    onOpenChange(false);
    setTitle(""); setDescription(""); setResponsible(""); setDueDate(null);
  });

  const impacts = suggestions.filter((s) => selected.includes(s.requirement_id));
  const areas = Array.from(new Set(impacts.map((i) => i.control_area)));
  const canSave = title.trim().length > 2 && responsible.trim().length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrer avvik{vendorName ? ` — ${vendorName}` : ""}</DialogTitle>
          <DialogDescription>
            Et åpent avvik gjør at berørte krav ikke regnes som oppfylt før avviket er lukket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Tittel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kort beskrivelse av avviket" />
          </div>

          <div className="space-y-1.5">
            <Label>Beskrivelse</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {deviationCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alvorlighetsgrad</Label>
              <Select value={criticality} onValueChange={setCriticality}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRITICALITY.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kilde</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ansvarlig</Label>
              <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Navn på ansvarlig" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Oppdaget</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(discoveredAt, "dd.MM.yyyy", { locale: nb })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={discoveredAt} onSelect={(d) => d && setDiscoveredAt(d)} locale={nb} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Frist</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd.MM.yyyy", { locale: nb }) : "Velg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate || undefined} onSelect={(d) => setDueDate(d || null)} locale={nb} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Kravpåvirkning */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Berørte krav</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Forslag fra Lara. Kravene du huker av settes til «ikke oppfylt» så lenge avviket er åpent.
                    Dokumentasjonen beholdes, men teller ikke i scoren.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <label key={s.requirement_id} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected.includes(s.requirement_id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, s.requirement_id] : prev.filter((p) => p !== s.requirement_id),
                      )
                    }
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className="text-foreground">{s.requirement_label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {s.framework_id} › {getControlAreaLabel(
                        CONTROL_AREAS.find((a) => a.key === s.control_area)!, "nb",
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {areas.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {areas.map((a) => (
                  <Badge key={a} variant="secondary" className="text-[11px]">
                    {getControlAreaLabel(CONTROL_AREAS.find((x) => x.key === a)!, "nb")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button
            disabled={!canSave || register.isPending}
            onClick={() =>
              register.mutate({
                assetId, title, description, category, criticality,
                responsible, discoveredAt, dueDate, source, impacts,
              })
            }
          >
            {register.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Registrer avvik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
