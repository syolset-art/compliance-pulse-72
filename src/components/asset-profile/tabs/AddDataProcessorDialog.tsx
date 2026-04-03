import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AddDataProcessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

export const AddDataProcessorDialog = ({ open, onOpenChange, assetId }: AddDataProcessorDialogProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [euEosCompliant, setEuEosCompliant] = useState(false);
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(isNb ? "Navn er påkrevd" : "Name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("asset_data_processors").insert({
      asset_id: assetId,
      name: name.trim(),
      purpose: purpose.trim() || null,
      eu_eos_compliant: euEosCompliant,
      source: source.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
      return;
    }
    toast.success(isNb ? "Databehandler lagt til" : "Data processor added");
    queryClient.invalidateQueries({ queryKey: ["asset-data-processors", assetId] });
    setName("");
    setPurpose("");
    setEuEosCompliant(false);
    setSource("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNb ? "Legg til databehandler" : "Add data processor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{isNb ? "Navn" : "Name"} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={isNb ? "Leverandørnavn" : "Vendor name"} />
          </div>
          <div>
            <Label>{isNb ? "Formål" : "Purpose"}</Label>
            <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={isNb ? "Beskriv formål" : "Describe purpose"} rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <Label>{isNb ? "EU/EØS-kompatibel" : "EU/EEA compliant"}</Label>
            <Switch checked={euEosCompliant} onCheckedChange={setEuEosCompliant} />
          </div>
          <div>
            <Label>{isNb ? "Kilde / opprinnelse" : "Source / origin"}</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder={isNb ? "F.eks. DPA, Trust Profile" : "E.g. DPA, Trust Profile"} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{isNb ? "Avbryt" : "Cancel"}</Button>
          <Button onClick={handleSave} disabled={saving}>{isNb ? "Lagre" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
