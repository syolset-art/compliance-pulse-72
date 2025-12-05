import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Key, FileText, Database } from "lucide-react";

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleCreated: (moduleData: any) => void;
}

type ModuleType = "file-upload" | "api-integration" | "data-source" | "custom";

export const AddModuleDialog = ({ open, onOpenChange, onModuleCreated }: AddModuleDialogProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [moduleType, setModuleType] = useState<ModuleType | "">("");
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [additionalConfig, setAdditionalConfig] = useState("");

  const handleReset = () => {
    setStep(1);
    setModuleType("");
    setModuleName("");
    setModuleDescription("");
    setApiKey("");
    setUploadedFile(null);
    setAdditionalConfig("");
  };

  const handleNext = () => {
    if (step === 1 && !moduleType) {
      toast.error(t("addModule.errors.selectType"));
      return;
    }
    if (step === 2 && !moduleName) {
      toast.error(t("addModule.errors.enterName"));
      return;
    }
    setStep(step + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      toast.success(t("addModule.success.fileUploaded", { name: e.target.files[0].name }));
    }
  };

  const handleSubmit = () => {
    const moduleData = {
      type: moduleType,
      name: moduleName,
      description: moduleDescription,
      apiKey: moduleType === "api-integration" ? apiKey : undefined,
      file: uploadedFile,
      config: additionalConfig,
      createdAt: new Date().toISOString(),
    };

    onModuleCreated(moduleData);
    toast.success(t("addModule.success.moduleCreated", { name: moduleName }));
    handleReset();
    onOpenChange(false);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return t("addModule.steps.selectType");
      case 2: return t("addModule.steps.basicInfo");
      case 3: return t("addModule.steps.configuration");
      case 4: return t("addModule.steps.confirm");
      default: return "";
    }
  };

  const getModuleTypeDisplay = (type: string) => {
    switch (type) {
      case "file-upload": return t("addModule.types.fileUpload");
      case "api-integration": return t("addModule.types.apiIntegration");
      case "data-source": return t("addModule.types.dataSource");
      case "custom": return t("addModule.types.custom");
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t("addModule.title")}
          </DialogTitle>
          <DialogDescription>
            {t("addModule.step", { step })} {getStepTitle()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Module Type */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>{t("addModule.selectTypeLabel")}</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModuleType("file-upload")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "file-upload" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Upload className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">{t("addModule.types.fileUpload")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("addModule.types.fileUploadDesc")}</div>
                </button>

                <button
                  onClick={() => setModuleType("api-integration")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "api-integration" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Key className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">{t("addModule.types.apiIntegration")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("addModule.types.apiIntegrationDesc")}</div>
                </button>

                <button
                  onClick={() => setModuleType("data-source")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "data-source" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Database className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">{t("addModule.types.dataSource")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("addModule.types.dataSourceDesc")}</div>
                </button>

                <button
                  onClick={() => setModuleType("custom")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "custom" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <FileText className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">{t("addModule.types.custom")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t("addModule.types.customDesc")}</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moduleName">{t("addModule.moduleName")}</Label>
                <Input
                  id="moduleName"
                  placeholder={t("addModule.moduleNamePlaceholder")}
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moduleDescription">{t("addModule.description")}</Label>
                <Textarea
                  id="moduleDescription"
                  placeholder={t("addModule.descriptionPlaceholder")}
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <div className="space-y-4">
              {moduleType === "file-upload" && (
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">{t("addModule.uploadFile")}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {uploadedFile ? uploadedFile.name : t("addModule.clickToUpload")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("addModule.fileTypes")}
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {moduleType === "api-integration" && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t("addModule.apiKey")}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={t("addModule.apiKeyPlaceholder")}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("addModule.apiKeySecure")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalConfig">{t("addModule.additionalConfig")}</Label>
                <Textarea
                  id="additionalConfig"
                  placeholder={t("addModule.additionalConfigPlaceholder")}
                  value={additionalConfig}
                  onChange={(e) => setAdditionalConfig(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">{t("addModule.summary.moduleType")}</div>
                  <div className="font-medium">{getModuleTypeDisplay(moduleType)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("addModule.summary.name")}</div>
                  <div className="font-medium">{moduleName}</div>
                </div>
                {moduleDescription && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("addModule.summary.description")}</div>
                    <div className="text-sm">{moduleDescription}</div>
                  </div>
                )}
                {uploadedFile && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("addModule.summary.uploadedFile")}</div>
                    <div className="text-sm">{uploadedFile.name}</div>
                  </div>
                )}
                {apiKey && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("addModule.summary.apiKey")}</div>
                    <div className="text-sm">•••••••••••••</div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("addModule.confirmText")}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button onClick={handleNext}>
              {t("common.next")}
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              {t("addModule.createModule")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
