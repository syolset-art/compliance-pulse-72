import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Download, HelpCircle, CalendarClock } from "lucide-react";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";

const DOC_SOURCES = ["Notion", "SharePoint", "Google Drive", "Confluence", "Lokale mapper"];

/**
 * Lokal agent (Sara) – egen seksjon øverst på Datakilder og agenter.
 * Nedlasting, kjøreplan og status. Onboardingveiledningen gjenbrukes fra SaraOnboardingDialog.
 */
export function LocalAgentCard() {
  const [open, setOpen] = useState(false);
  const { installed, markInstalled } = useSaraAgent();


  return (
    <Card className="mt-6 p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-[240px] flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Lokal agent (Sara)</h2>
            <Badge variant="outline" className="text-[10px]">
              Kommer snart
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Sara kjører i din egen infrastruktur og leser dokumentkildene dine der de er.
            Dokumentene forlater aldri infrastrukturen din — bare funnene sendes til Mynder.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {DOC_SOURCES.map((s) => (
              <Badge key={s} variant="secondary" className="text-[10px] font-normal">
                {s}
              </Badge>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              Status: <span className="text-foreground">Ikke installert</span>
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Kjøreplan: <span className="text-foreground">Ukentlig (anbefalt)</span>
            </span>
            <span>
              Sist kjørt: <span className="text-foreground">—</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              toast.info(
                "Sara er ikke klar for nedlasting ennå. Meld interessen, så gir vi deg beskjed så snart den er tilgjengelig.",
              )
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Last ned Sara
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <HelpCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Slik kommer du i gang
          </Button>
        </div>
      </div>

      <SaraOnboardingDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}
