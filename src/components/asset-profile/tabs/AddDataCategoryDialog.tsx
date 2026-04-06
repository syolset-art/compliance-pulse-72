import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SUGGESTED_DATA_TYPES = [
  "Fullt navn (fornavn, etternavn)",
  "Kontaktinformasjon (e-post, telefon, adresse)",
  "Fødselsnummer / personnummer",
  "IP-adresse",
  "Enhetsidentifikatorer",
  "Helseopplysninger",
  "Biometriske data",
  "Fagforeningsmedlemskap",
  "Strafferettslige opplysninger",
];

interface AddDataCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

export const AddDataCategoryDialog = ({ open, onOpenChange, assetId }: AddDataCategoryDialogProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("ordinary");
  const [retentionPeriod, setRetentionPeriod] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setCategory("ordinary");
    setRetentionPeriod("");
    setLegalBasis("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("asset_data_categories").insert({
      asset_id: assetId,
      data_type_name: name.trim(),
      category,
      retention_period: retentionPeriod.trim() || null,
      legal_basis: legalBasis.trim() || null,
      source: "manual",
    });
    setSaving(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
      return;
    }
    toast.success(isNb ? "Datatype lagt til" : "Data type added");
    queryClient.invalidateQueries({ queryKey: ["asset-data-categories", assetId] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNb ? "Legg til personopplysningstype" : "Add personal data type"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isNb ? "Datatype" : "Data type"}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isNb ? "Velg eller skriv inn..." : "Select or type..."}
              list="suggested-data-types"
            />
            <datalist id="suggested-data-types">
              {SUGGESTED_DATA_TYPES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label>{isNb ? "Kategori" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinary">{isNb ? "Ordinær" : "Ordinary"}</SelectItem>
                <SelectItem value="special">{isNb ? "Særlig" : "Special"}</SelectItem>
                <SelectItem value="sensitive">{isNb ? "Sensitiv" : "Sensitive"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isNb ? "Oppbevaringstid" : "Retention period"}</Label>
            <Input
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(e.target.value)}
              placeholder={isNb ? "F.eks. 3 år, slettes ved oppsigelse" : "E.g. 3 years"}
            />
          </div>

          <div className="space-y-2">
            <Label>{isNb ? "Rettslig grunnlag" : "Legal basis"}</Label>
            <Input
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value)}
              placeholder={isNb ? "F.eks. Samtykke, Avtale" : "E.g. Consent, Contract"}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {isNb ? "Legg til" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
