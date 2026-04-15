import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_PACKAGES, formatKr } from "@/lib/planConstants";
import { cn } from "@/lib/utils";

type Step = "select" | "confirm" | "success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseCreditsDialog({ open, onOpenChange }: Props) {
  const { balance, purchaseCredits, isPurchasing } = useCredits();
  const [step, setStep] = useState<Step>("select");
  const [selectedId, setSelectedId] = useState<string>("standard");

  const selectedPkg = CREDIT_PACKAGES.find((p) => p.id === selectedId)!;
  const pricePerCredit = (selectedPkg.priceKr / selectedPkg.credits).toFixed(2).replace(".", ",");

  const handleClose = (v: boolean) => {
    if (!v) {
      setTimeout(() => setStep("select"), 300);
    }
    onOpenChange(v);
  };

  const handleConfirm = async () => {
    await purchaseCredits(selectedId);
    setStep("success");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Kjøp credits
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 border border-border">
              <span className="text-sm text-muted-foreground">Nåværende saldo</span>
              <span className="text-lg font-bold text-foreground">{balance} credits</span>
            </div>

            <div className="space-y-2.5 mt-1">
              {CREDIT_PACKAGES.map((pkg) => {
                const perCredit = (pkg.priceKr / pkg.credits).toFixed(2).replace(".", ",");
                const isSelected = selectedId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedId(pkg.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{pkg.name}</span>
                        {pkg.popular && (
                          <Badge className="bg-primary text-primary-foreground text-[11px] px-1.5 py-0">
                            Populær
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {perCredit} kr/credit
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">{pkg.credits}</p>
                      <p className="text-xs text-muted-foreground">{formatKr(pkg.priceKr)}</p>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button className="w-full gap-2 mt-2" onClick={() => setStep("confirm")}>
              Fortsett
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Bekreft kjøp</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pakke</span>
                  <span className="font-medium text-foreground">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium text-foreground">+{selectedPkg.credits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pris per credit</span>
                  <span className="text-foreground">{pricePerCredit} kr</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Totalt</span>
                  <span className="text-foreground">{formatKr(selectedPkg.priceKr)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-border">
                <div className="text-sm">
                  <p className="text-muted-foreground">Saldo etter kjøp</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{balance}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold text-success text-base">{balance + selectedPkg.credits}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>
                  Tilbake
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirm}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Behandler…
                    </span>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Bekreft kjøp
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Credits lagt til!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPkg.credits} credits er lagt til kontoen din.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-6 py-3 border border-border">
                <p className="text-xs text-muted-foreground">Ny saldo</p>
                <p className="text-2xl font-bold text-foreground">{balance} credits</p>
              </div>
              <Button className="w-full mt-2" onClick={() => handleClose(false)}>
                Lukk
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
