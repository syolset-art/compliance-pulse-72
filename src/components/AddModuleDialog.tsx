import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Key, FileText, Database } from "lucide-react";

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModuleCreated: (moduleData: any) => void;
}

type ModuleType = "file-upload" | "api-integration" | "data-source" | "custom";

export const AddModuleDialog = ({ open, onOpenChange, onModuleCreated }: AddModuleDialogProps) => {
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
      toast.error("Velg modultype");
      return;
    }
    if (step === 2 && !moduleName) {
      toast.error("Oppgi modulnavn");
      return;
    }
    setStep(step + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      toast.success(`Fil lastet opp: ${e.target.files[0].name}`);
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
    toast.success(`Modul "${moduleName}" er opprettet!`);
    handleReset();
    onOpenChange(false);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Velg modultype";
      case 2: return "Grunnleggende informasjon";
      case 3: return "Konfigurasjon";
      case 4: return "Bekreft og opprett";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Legg til tilleggsmodul
          </DialogTitle>
          <DialogDescription>
            Steg {step} av 4: {getStepTitle()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Module Type */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Velg type modul</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModuleType("file-upload")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "file-upload" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Upload className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">Filopplasting</div>
                  <div className="text-xs text-muted-foreground mt-1">Last opp dokumenter og data</div>
                </button>

                <button
                  onClick={() => setModuleType("api-integration")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "api-integration" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Key className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">API-integrasjon</div>
                  <div className="text-xs text-muted-foreground mt-1">Koble til eksterne tjenester</div>
                </button>

                <button
                  onClick={() => setModuleType("data-source")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "data-source" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Database className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">Datakilde</div>
                  <div className="text-xs text-muted-foreground mt-1">Koble til database eller kilde</div>
                </button>

                <button
                  onClick={() => setModuleType("custom")}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                    moduleType === "custom" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <FileText className="h-8 w-8 mb-2 text-primary" />
                  <div className="font-medium">Tilpasset</div>
                  <div className="text-xs text-muted-foreground mt-1">Egendefinert modultype</div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moduleName">Modulnavn *</Label>
                <Input
                  id="moduleName"
                  placeholder="F.eks. 'GDPR Dokumenter' eller 'Salesforce API'"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moduleDescription">Beskrivelse</Label>
                <Textarea
                  id="moduleDescription"
                  placeholder="Beskriv hva denne modulen skal brukes til..."
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
                  <Label htmlFor="fileUpload">Last opp fil</Label>
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
                        {uploadedFile ? uploadedFile.name : "Klikk for å laste opp fil"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, Word, Excel eller andre dokumenter
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {moduleType === "api-integration" && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API-nøkkel *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Skriv inn API-nøkkel..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    API-nøkkelen lagres sikkert og kryptert
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalConfig">Tilleggskonfigurasjon (valgfritt)</Label>
                <Textarea
                  id="additionalConfig"
                  placeholder="JSON-konfigurasjon eller andre innstillinger..."
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
                  <div className="text-xs text-muted-foreground">Modultype</div>
                  <div className="font-medium capitalize">{moduleType?.replace("-", " ")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Navn</div>
                  <div className="font-medium">{moduleName}</div>
                </div>
                {moduleDescription && (
                  <div>
                    <div className="text-xs text-muted-foreground">Beskrivelse</div>
                    <div className="text-sm">{moduleDescription}</div>
                  </div>
                )}
                {uploadedFile && (
                  <div>
                    <div className="text-xs text-muted-foreground">Opplastet fil</div>
                    <div className="text-sm">{uploadedFile.name}</div>
                  </div>
                )}
                {apiKey && (
                  <div>
                    <div className="text-xs text-muted-foreground">API-nøkkel</div>
                    <div className="text-sm">•••••••••••••</div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Når du oppretter modulen, vil den bli tilgjengelig for bruk i AI-agenten.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Tilbake
            </Button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <Button onClick={handleNext}>
              Neste
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Opprett modul
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
