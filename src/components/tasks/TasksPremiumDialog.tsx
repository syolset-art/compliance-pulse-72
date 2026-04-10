import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Sparkles, ClipboardList, Bot, BarChart3, Users,
  FolderKanban, Bell, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TasksPremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}

const FEATURES = [
  { icon: ClipboardList, label: "Automatisk genererte compliance-oppgaver", description: "Basert på dine systemer, leverandører og aktiverte regelverk" },
  { icon: Bot, label: "AI-agent som utfører oppgaver", description: "Sett autonominivå og la AI-agenten håndtere rutineoppgaver" },
  { icon: BarChart3, label: "Prioritering etter risiko og regelverk", description: "Oppgaver sortert etter kritikalitet med kobling til ISO 27001, GDPR, NIS2 m.fl." },
  { icon: FolderKanban, label: "Prosjekter og milepæler", description: "Organiser oppgaver i prosjekter med fremdriftssporing" },
  { icon: Users, label: "Flerbruker med seat-lisenser", description: "Tildel oppgaver til ulike roller i organisasjonen" },
  { icon: Bell, label: "Varsler og påminnelser", description: "Automatiske varsler ved forfall, statusendringer og nye oppgaver" },
];

export function TasksPremiumDialog({ open, onOpenChange, onActivated }: TasksPremiumDialogProps) {
  const [seats, setSeats] = useState(1);
  const [isActivating, setIsActivating] = useState(false);

  const pricePerSeat = 2900;
  const totalPrice = pricePerSeat * seats;

  const handleActivate = async () => {
    setIsActivating(true);
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem("tasks_premium_activated", "true");
    localStorage.setItem("tasks_premium_seats", String(seats));
    toast.success(`Oppgaver aktivert med ${seats} ${seats === 1 ? "seat" : "seats"}!`);
    onActivated();
    onOpenChange(false);
    setIsActivating(false);
  };

  const formatKr = (amount: number) =>
    new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Oppgaver – Premium
          </DialogTitle>
          <DialogDescription>
            Få full kontroll på compliance-oppgaver med AI-støtte, prioritering og teamsamarbeid.
          </DialogDescription>
        </DialogHeader>

        {/* Feature list */}
        <div className="space-y-3 py-2">
          {FEATURES.map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Pris per seat</p>
              <p className="text-xs text-muted-foreground">Månedlig fakturering</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">{formatKr(pricePerSeat)}</p>
              <p className="text-xs text-muted-foreground">/ mnd per seat</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground font-medium">Antall seats:</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setSeats(Math.max(1, seats - 1))}
                  disabled={seats <= 1}
                >
                  −
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{seats}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setSeats(seats + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                Totalt: {formatKr(totalPrice)} / mnd
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            className="gap-2 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white"
          >
            <Sparkles className="h-4 w-4" />
            {isActivating
              ? "Aktiverer..."
              : `Aktiver – ${formatKr(totalPrice)}/mnd`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
