import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Server, Wifi, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Monitor, HardDrive, Shield } from "lucide-react";

interface AcronisConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

const DEMO_TENANTS = [
  { id: "t-001", name: "Hovedkontor", devices: 4 },
  { id: "t-002", name: "Avdeling Sør", devices: 2 },
  { id: "t-003", name: "Fjernkontor", devices: 1 },
];

export function AcronisConnectDialog({ open, onOpenChange, customerId, customerName }: AcronisConnectDialogProps) {
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<typeof DEMO_TENANTS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();

  const reset = () => {
    setStep(1);
    setTenantId("");
    setApiKey("");
    setSelectedTenant(null);
    setLoading(false);
    setConnecting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleStep1 = () => {
    if (!tenantId.trim() || !apiKey.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleStep2 = () => {
    if (!selectedTenant) return;
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedTenant) return;
    setConnecting(true);
    try {
      await supabase
        .from("msp_customers" as any)
        .update({
          has_acronis_integration: true,
          acronis_device_count: selectedTenant.devices,
        } as any)
        .eq("id", customerId);

      queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["msp-customers"] });
      setStep(4);
      toast.success("Acronis tilkoblet!");
    } catch {
      toast.error("Kunne ikke koble til Acronis");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Koble Acronis til {customerName}
          </DialogTitle>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tast inn Acronis-legitimasjonen for å koble til kundens miljø.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Tenant-ID</label>
                <Input
                  placeholder="F.eks. ACR-12345"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">API-nøkkel</label>
                <Input
                  type="password"
                  placeholder="Din Acronis API-nøkkel"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleStep1}
              disabled={!tenantId.trim() || !apiKey.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Kobler til...
                </>
              ) : (
                <>
                  Koble til
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vi fant følgende tenants. Velg hvilken som tilhører {customerName}.
            </p>
            <div className="space-y-2">
              {DEMO_TENANTS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenant(t)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    selectedTenant?.id === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {t.id}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {t.devices} enheter
                  </Badge>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button onClick={handleStep2} disabled={!selectedTenant} className="flex-1">
                Velg og fortsett
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && selectedTenant && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bekreft at du vil importere enheter fra Acronis til {customerName}.
            </p>
            <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-medium text-foreground">{selectedTenant.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tenant-ID</span>
                <span className="font-medium text-foreground">{selectedTenant.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enheter funnet</span>
                <span className="font-medium text-foreground">{selectedTenant.devices} enheter</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kunde</span>
                <span className="font-medium text-foreground">{customerName}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Button onClick={handleConfirm} disabled={connecting} className="flex-1">
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importerer...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Bekreft og importer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && selectedTenant && (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-status-closed/10 dark:bg-status-closed/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-status-closed dark:text-status-closed" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Acronis tilkoblet!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTenant.devices} enheter ble importert fra «{selectedTenant.name}» til {customerName}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4 text-status-closed" />
              Synkronisering aktiv
            </div>
            <Button onClick={handleClose} className="w-full">
              Ferdig
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
