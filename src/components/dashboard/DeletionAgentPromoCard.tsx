import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Sparkles, ShieldCheck, ScrollText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeletionAgentPromoCardProps {
  onActivate: () => void;
}

export function DeletionAgentPromoCard({ onActivate }: DeletionAgentPromoCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [showConfirm, setShowConfirm] = useState(false);

  const features = isNb
    ? [
        { icon: ShieldCheck, text: "Overvåker lagringsfrister automatisk" },
        { icon: Trash2, text: "Sletter data ved utløp" },
        { icon: ScrollText, text: "Full revisjonssporing (GDPR Art. 17)" },
      ]
    : [
        { icon: ShieldCheck, text: "Monitors retention deadlines automatically" },
        { icon: Trash2, text: "Deletes data upon expiry" },
        { icon: ScrollText, text: "Full audit trail (GDPR Art. 17)" },
      ];

  return (
    <>
      <Card className="p-4 border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                {isNb ? "Slette-agent" : "Deletion Agent"}
                <Sparkles className="h-3 w-3 text-chart-2" />
              </h3>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] border-primary/30 text-primary gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {isNb ? "Inkludert i Profesjonell" : "Included in Professional"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {isNb
            ? "Automatisk sletting av data når lagringsfrister utløper. Overvåker behandlingsaktiviteter og logger alt for revisjon."
            : "Automatic data deletion when retention periods expire. Monitors processing activities and logs everything for audit."}
        </p>

        <div className="space-y-1.5 mb-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
              <f.icon className="h-3 w-3 shrink-0 text-primary" />
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <Button
          size="sm"
          variant="default"
          className="w-full text-xs h-8"
          onClick={() => setShowConfirm(true)}
        >
          {isNb ? "Aktiver agent" : "Activate agent"}
        </Button>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNb ? "Aktiver Slette-agent?" : "Activate Deletion Agent?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNb
                ? "Agenten vil overvåke lagringsfrister og utføre sletting automatisk. Du kan godkjenne hver sletting manuelt. Inkludert i din Profesjonell-plan."
                : "The agent will monitor retention deadlines and perform deletions automatically. You can approve each deletion manually. Included in your Professional plan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isNb ? "Avbryt" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onActivate();
                setShowConfirm(false);
              }}
            >
              {isNb ? "Aktiver" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
