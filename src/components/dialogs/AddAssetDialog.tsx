import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Server, 
  Building2, 
  MapPin, 
  Network, 
  Plug, 
  HardDrive, 
  Database, 
  FileText,
  LucideIcon
} from "lucide-react";

interface AssetTypeTemplate {
  asset_type: string;
  display_name: string;
  display_name_plural: string;
  icon: string;
  color: string;
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetAdded: () => void;
  assetTypeTemplates: AssetTypeTemplate[];
}

const iconMap: Record<string, LucideIcon> = {
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
};

export function AddAssetDialog({ open, onOpenChange, onAssetAdded, assetTypeTemplates }: AddAssetDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_type: "",
    name: "",
    description: "",
    vendor: "",
    category: "",
    risk_level: "medium",
    criticality: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.asset_type) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("assets").insert({
        asset_type: formData.asset_type,
        name: formData.name,
        description: formData.description || null,
        vendor: formData.vendor || null,
        category: formData.category || null,
        risk_level: formData.risk_level,
        criticality: formData.criticality,
        lifecycle_status: "active",
      });

      if (error) throw error;

      toast.success(t("assets.addSuccess"));
      onAssetAdded();
      onOpenChange(false);
      setFormData({
        asset_type: "",
        name: "",
        description: "",
        vendor: "",
        category: "",
        risk_level: "medium",
        criticality: "medium",
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error(t("assets.addError"));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = assetTypeTemplates.find(t => t.asset_type === formData.asset_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("assets.addAsset")}</DialogTitle>
          <DialogDescription>
            {t("assets.addAssetDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Type Selection */}
          <div className="space-y-2">
            <Label>{t("assets.assetType")} *</Label>
            <div className="grid grid-cols-4 gap-2">
              {assetTypeTemplates.map((template) => {
                const IconComponent = iconMap[template.icon] || Server;
                const isSelected = formData.asset_type === template.asset_type;
                return (
                  <button
                    key={template.asset_type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, asset_type: template.asset_type }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <IconComponent className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs text-center">{template.display_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("assets.name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t("assets.namePlaceholder")}
              required
            />
          </div>

          {/* Vendor (only for certain asset types) */}
          {["system", "hardware", "network"].includes(formData.asset_type) && (
            <div className="space-y-2">
              <Label htmlFor="vendor">{t("assets.vendor")}</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder={t("assets.vendorPlaceholder")}
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">{t("assets.category")}</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder={t("assets.categoryPlaceholder")}
            />
          </div>

          {/* Risk Level */}
          <div className="space-y-2">
            <Label>{t("assets.riskLevel")}</Label>
            <Select 
              value={formData.risk_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("trustProfile.riskLow")}</SelectItem>
                <SelectItem value="medium">{t("trustProfile.riskMedium")}</SelectItem>
                <SelectItem value="high">{t("trustProfile.riskHigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Criticality */}
          <div className="space-y-2">
            <Label>{t("assets.criticality")}</Label>
            <Select 
              value={formData.criticality} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, criticality: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("assets.criticalityLow")}</SelectItem>
                <SelectItem value="medium">{t("assets.criticalityMedium")}</SelectItem>
                <SelectItem value="high">{t("assets.criticalityHigh")}</SelectItem>
                <SelectItem value="critical">{t("assets.criticalityCritical")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("assets.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t("assets.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.asset_type}>
              {isLoading ? t("common.loading") : t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
