import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mynder.lara-mechanics-callout.open";

const INTEGRATIONS = [
  "Microsoft 365",
  "Entra ID",
  "KnowBe4",
  "Tenable",
  "Microsoft Defender",
  "Outlook",
  "Jira",
];

export const LaraMechanicsCallout = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="border-primary/15 bg-primary/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-primary/[0.05] transition-colors"
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[12px] font-medium text-foreground flex-1">
          Hvordan Lara jobber for deg
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {open ? "Skjul" : "Vis"} integrasjoner og arbeidsdeling
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-primary/10">
          <p className="text-[12px] text-muted-foreground leading-relaxed pt-3">
            Lara er koblet til kundens systemer via standard-integrasjoner. Hun
            utfører rutineoppgaver automatisk — datahenting, kampanje-utsending,
            rapport-generering — og overlater juridiske, etiske og
            relasjonsbaserte oppgaver til deg som partner.
          </p>

          <div className="grid sm:grid-cols-2 gap-2.5">
            <div className="rounded-md border border-primary/15 bg-background/60 p-2.5">
              <p className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3 w-3" />
                Lara automatisk
              </p>
              <ul className="space-y-0.5 text-xs text-foreground">
                <li>· Henter data via API-er</li>
                <li>· Trigger kampanjer og workflows</li>
                <li>· Genererer rapport-utkast og policies</li>
                <li>· Mapper resultater mot rammeverk</li>
              </ul>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-2.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                Partner manuelt
              </p>
              <ul className="space-y-0.5 text-xs text-foreground">
                <li>· Etisk/juridisk godkjenning</li>
                <li>· 1:1-samtaler og opplæring</li>
                <li>· Presentasjon for ledergruppe</li>
                <li>· Strategiske valg og prioritering</li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
              Aktiverte integrasjoner
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INTEGRATIONS.map((i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs font-mono bg-primary/5 border-primary/15 text-primary"
                >
                  {i}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
