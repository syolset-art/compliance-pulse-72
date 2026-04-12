import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ResponsiblePersonEditor } from "@/components/work-areas/ResponsiblePersonEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Sparkles, AlertTriangle, Trash2, Save, Check, Loader2 } from "lucide-react";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
  is_active: boolean;
}

interface WorkAreaDetailsCardProps {
  workArea: WorkArea;
  onUpdate: (updates: Partial<WorkArea>) => void;
  onDelete: () => void;
}

export const WorkAreaDetailsCard = ({ workArea, onUpdate, onDelete }: WorkAreaDetailsCardProps) => {
  const [name, setName] = useState(workArea.name);
  const [description, setDescription] = useState(workArea.description || "");
  const [isActive, setIsActive] = useState(workArea.is_active);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nameChanged, setNameChanged] = useState(false);
  const [descChanged, setDescChanged] = useState(false);

  const saveName = async () => {
    if (!name.trim() || name === workArea.name) {
      setNameChanged(false);
      return;
    }
    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from("work_areas")
        .update({ name: name.trim() })
        .eq("id", workArea.id);
      if (error) throw error;
      onUpdate({ name: name.trim() });
      setNameChanged(false);
      toast.success("Navn oppdatert");
    } catch {
      toast.error("Kunne ikke oppdatere navn");
    } finally {
      setIsSavingName(false);
    }
  };

  const saveDescription = async () => {
    setIsSavingDesc(true);
    try {
      const { error } = await supabase
        .from("work_areas")
        .update({ description: description || null })
        .eq("id", workArea.id);
      if (error) throw error;
      onUpdate({ description: description || null });
      setDescChanged(false);
      toast.success("Beskrivelse oppdatert");
    } catch {
      toast.error("Kunne ikke oppdatere beskrivelse");
    } finally {
      setIsSavingDesc(false);
    }
  };

  const toggleActive = async (checked: boolean) => {
    setIsActive(checked);
    try {
      const { error } = await supabase
        .from("work_areas")
        .update({ is_active: checked })
        .eq("id", workArea.id);
      if (error) throw error;
      onUpdate({ is_active: checked });
      toast.success(checked ? "Arbeidsområde aktivert" : "Arbeidsområde deaktivert");
    } catch {
      setIsActive(!checked);
      toast.error("Kunne ikke oppdatere status");
    }
  };

  const generateDescription = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Generer en kort og profesjonell beskrivelse (2-3 setninger) på norsk for et arbeidsområde som heter "${workArea.name}" i en compliance-plattform. Beskrivelsen skal forklare hva arbeidsområdet dekker og hvilke ansvarsområder det innebærer. Svar kun med beskrivelsen, ingen innledning.`
            }
          ]
        }
      });

      if (error) throw error;

      // Handle streaming response - read the text
      if (typeof data === "string") {
        // Parse SSE data
        const lines = data.split("\n");
        let result = "";
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) result += content;
            } catch {
              // skip
            }
          }
        }
        if (result) {
          setDescription(result.trim());
          setDescChanged(true);
        }
      } else if (data?.choices?.[0]?.message?.content) {
        setDescription(data.choices[0].message.content.trim());
        setDescChanged(true);
      }

      toast.success("Beskrivelse generert av Lara");
    } catch (err) {
      console.error("Error generating description:", err);
      toast.error("Kunne ikke generere beskrivelse");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Detaljer-kort */}
      <Card className="p-6">
        <h3 className="text-base font-semibold mb-5 flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          Arbeidsområde-detaljer
        </h3>

        <div className="space-y-5">
          {/* Navn */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Navn</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameChanged(e.target.value !== workArea.name); }}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="flex-1"
              />
              {nameChanged && (
                <Button size="sm" onClick={saveName} disabled={isSavingName} className="gap-1.5">
                  {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Lagre
                </Button>
              )}
            </div>
          </div>

          {/* Ansvarlig person */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ansvarlig person</Label>
            <ResponsiblePersonEditor
              workAreaId={workArea.id}
              currentPerson={workArea.responsible_person}
              onUpdate={(newPerson) => onUpdate({ responsible_person: newPerson })}
            />
          </div>

          {/* Beskrivelse */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Beskrivelse</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateDescription}
                disabled={isGenerating}
                className="gap-1.5 text-xs h-7"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Foreslå med Lara
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescChanged(true); }}
              placeholder="Beskriv arbeidsområdet..."
              rows={3}
            />
            {descChanged && (
              <div className="flex justify-end">
                <Button size="sm" onClick={saveDescription} disabled={isSavingDesc} className="gap-1.5">
                  {isSavingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Lagre beskrivelse
                </Button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Arbeidsområdet er aktivt og synlig" : "Arbeidsområdet er deaktivert"}
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={toggleActive} />
          </div>
        </div>
      </Card>

      {/* Avansert */}
      <div className="flex items-center justify-between rounded-lg border border-muted p-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Slett arbeidsområde</p>
          <p className="text-xs text-muted-foreground">Denne handlingen kan ikke angres</p>
        </div>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          Slett
        </Button>
      </div>
    </>
  );
};
