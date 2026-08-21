import { useState } from "react";
import { ArrowLeft, ChevronRight, Scale, Flag, Users, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VendorFrameworkScopeTab } from "@/components/vendor-dashboard/VendorFrameworkScopeTab";
import { VendorPrioritySettingsSection } from "./VendorPrioritySettingsSection";
import { VendorAccessSettingsSection } from "./VendorAccessSettingsSection";

type SectionKey = "scope" | "priority" | "access";

const SECTIONS: { key: SectionKey; icon: typeof Scale; title: string; desc: string }[] = [
  {
    key: "scope",
    icon: Scale,
    title: "Regelverk i scope",
    desc: "Velg hvilke regelverk og standarder leverandørene styres mot",
  },
  {
    key: "priority",
    icon: Flag,
    title: "Prioritetsskala",
    desc: "Egne visningsnavn for P0–P3 i leverandørmodulen",
  },
  {
    key: "access",
    icon: Users,
    title: "Tilgang til modulen",
    desc: "Hvem som har skrive- og lesetilgang",
  },
];

/** Innstillinger for leverandørmodulen — to-nivås panel med egne lagringer per seksjon. */
export function VendorModuleSettingsSheet() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionKey | null>(null);
  const active = SECTIONS.find((s) => s.key === section) || null;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSection(null);
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Innstillinger for leverandørmodulen"
          title="Innstillinger for leverandørmodulen"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          {active ? (
            <>
              <button
                type="button"
                onClick={() => setSection(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbake
              </button>
              <SheetTitle className="text-left">{active.title}</SheetTitle>
              <SheetDescription className="text-left">{active.desc}</SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle className="text-left">Leverandørmodul – innstillinger</SheetTitle>
              <SheetDescription className="text-left">
                Velg et område for å se og endre innstillingene.
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        <div className="mt-6">
          {!active && (
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}

          {section === "scope" && <VendorFrameworkScopeTab />}
          {section === "priority" && <VendorPrioritySettingsSection />}
          {section === "access" && <VendorAccessSettingsSection />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
