import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, PenLine, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import { ConnectSourcesCallout } from "@/components/integrations/ConnectSourcesCallout";
import { INTEGRATION_CATALOG } from "@/lib/integrationCatalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSystemAdded?: (status?: string) => void;
}

type Source = "acronis" | "manual";

const sources: Array<{
  id: Source;
  icon: typeof Shield;
  color: string;
  bg: string;
  title: { nb: string; en: string };
  desc: { nb: string; en: string };
  badge?: { nb: string; en: string };
}> = [
  {
    id: "acronis",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10",
    title: { nb: "Koble til Acronis", en: "Connect Acronis" },
    desc: {
      nb: "Lara henter enheter og backup-status fra Acronis Cyber Protect via 7 Security-agenten.",
      en: "Lara pulls devices and backup status from Acronis Cyber Protect via the 7 Security agent.",
    },
    badge: { nb: "Tilgjengelig", en: "Available" },
  },
  {
    id: "manual",
    icon: PenLine,
    color: "text-muted-foreground",
    bg: "bg-muted",
    title: { nb: "Registrer manuelt", en: "Add manually" },
    desc: {
      nb: "Fyll ut skjema selv når du vet nøyaktig hva du vil legge inn.",
      en: "Fill in the form yourself when you know exactly what to add.",
    },
  },
];

export function DiscoverSystemsDialog({ open, onOpenChange, onSystemAdded }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [manualOpen, setManualOpen] = useState(false);

  const handleSelect = (id: Source) => {
    if (id === "manual") {
      onOpenChange(false);
      setTimeout(() => setManualOpen(true), 150);
      return;
    }
    // Acronis
    toast.info(
      isNb ? "Kobling til Acronis settes opp" : "Connecting to Acronis",
      {
        description: isNb
          ? "Lara vil hente enheter og backup-status fra Acronis Cyber Protect via 7 Security-agenten."
          : "Lara will pull devices and backup status from Acronis Cyber Protect via the 7 Security agent.",
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isNb ? "Oppdag systemer" : "Discover systems"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Lara kobler oppdagede systemer til Trust Profile, leverandør og systemkort automatisk."
                : "Lara auto-links discovered systems to Trust Profile, vendor and system card."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {sources.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className="group text-left rounded-xl border border-border hover:border-primary/50 hover:bg-accent/40 transition-all p-4 relative"
                >
                  {s.badge && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {isNb ? s.badge.nb : s.badge.en}
                    </span>
                  )}
                  <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {isNb ? s.title.nb : s.title.en}
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isNb ? s.desc.nb : s.desc.en}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {isNb ? "Planlagte kilder" : "Planned sources"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INTEGRATION_CATALOG.filter((i) => i.availability === "planned" && i.discovers.includes("systems")).map(
                (i) => (
                  <span
                    key={i.id}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {i.name}
                  </span>
                ),
              )}
            </div>
            <ConnectSourcesCallout
              alwaysShow
              variant="inline"
              className="mt-3"
              context={isNb
                ? "Vil du koble til en annen kilde? Se hva som er tilgjengelig og planlagt."
                : "Want to connect another source? See what is available and planned."}
            />
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 border border-border p-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNb
                ? "For hvert oppdaget system sjekker Lara: (1) finnes Trust Profile fra før? (2) finnes leverandøren? (3) finnes systemet? — og oppretter kun det som mangler."
                : "For each system Lara checks: (1) existing Trust Profile? (2) existing vendor? (3) existing system? — and creates only what's missing."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AddSystemDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSystemAdded={(status) => {
          onSystemAdded?.(status);
        }}
      />
    </>
  );
}
