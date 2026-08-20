import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Circle,
  CheckCircle2,
  Info,
  ShieldCheck,
  ScrollText,
  Link as LinkIcon,
  Globe,
  ExternalLink,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { frameworks } from "@/lib/frameworkDefinitions";
import { getRequirementsByFramework, type ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import { inferFulfillment } from "@/lib/requirementFulfillment";
import { PartnerEvidenceUploadDialog } from "@/components/msp/PartnerEvidenceUploadDialog";

interface Props {
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
  customerUrl?: string | null;
  onGoToRegulations?: () => void;
}

const accessKey = (id: string) => `msp.customer.laraDocAccess.${id}`;

/** Krav som representerer en publisert personvernerklæring. */
function isPrivacyPolicyRequirement(req: ComplianceRequirement): boolean {
  const id = req.requirement_id.toLowerCase();
  const hay = `${req.name} ${req.name_no}`.toLowerCase();
  return (
    id.includes("gdpr:art13") ||
    id.includes("gdpr:art14") ||
    id.includes("privacy_notice") ||
    id.includes("privacy_policy") ||
    hay.includes("personvernerklær") ||
    hay.includes("privacy notice") ||
    hay.includes("privacy policy")
  );
}

interface RequiredDoc {
  key: string;
  requirementId: string;
  title: string;
  description: string;
  frameworkId: string;
  frameworkName: string;
  isPrivacyPolicy: boolean;
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function CustomerDocumentationTab({
  customerId,
  customerName,
  activeFrameworkIds,
  customerUrl,
  onGoToRegulations,
}: Props) {
  const [access, setAccess] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFrameworkIds, setUploadFrameworkIds] = useState<string[]>([]);

  const openUpload = (frameworkIds: string[] = []) => {
    setUploadFrameworkIds(frameworkIds);
    setUploadOpen(true);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(accessKey(customerId));
      setAccess(raw === "true");
    } catch {
      setAccess(false);
    }
  }, [customerId]);

  const toggleAccess = (next: boolean) => {
    setAccess(next);
    try {
      localStorage.setItem(accessKey(customerId), String(next));
    } catch {}
    toast.success(
      next
        ? "Lara har nå lese-tilgang til opplastede dokumenter"
        : "Lara har ikke lenger tilgang til dokumentene",
    );
  };

  // Utled lovpålagte dokumenter fra kundens aktive regelverk
  const groupedDocs = useMemo(() => {
    const map = new Map<string, { frameworkName: string; docs: RequiredDoc[] }>();
    for (const fid of activeFrameworkIds) {
      const fw = frameworks.find((f) => f.id === fid);
      if (!fw) continue;
      const reqs = [
        ...getRequirementsByFramework(fid),
        ...ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === fid),
      ];
      const docs: RequiredDoc[] = [];
      const seen = new Set<string>();
      for (const r of reqs) {
        const ff = inferFulfillment(r);
        if (!ff.evidenceMandatory && ff.type !== "document_required") continue;
        if (seen.has(r.requirement_id)) continue;
        seen.add(r.requirement_id);
        docs.push({
          key: `${fid}:${r.requirement_id}`,
          requirementId: r.requirement_id,
          title: r.name_no || r.name,
          description: r.description_no || r.description || "",
          frameworkId: fid,
          frameworkName: fw.name,
          isPrivacyPolicy: isPrivacyPolicyRequirement(r),
        });
      }
      if (docs.length > 0) map.set(fid, { frameworkName: fw.name, docs });
    }
    return map;
  }, [activeFrameworkIds]);

  const totalDocs = useMemo(
    () => Array.from(groupedDocs.values()).reduce((n, g) => n + g.docs.length, 0),
    [groupedDocs],
  );

  // Regelverk-filter (multi-select). Default: alle valgt.
  const [selectedFrameworks, setSelectedFrameworks] = useState<Set<string>>(
    () => new Set(activeFrameworkIds),
  );
  useEffect(() => {
    setSelectedFrameworks(new Set(activeFrameworkIds));
  }, [activeFrameworkIds]);

  const visibleGroups = useMemo(
    () => Array.from(groupedDocs.entries()).filter(([fid]) => selectedFrameworks.has(fid)),
    [groupedDocs, selectedFrameworks],
  );
  const visibleDocCount = useMemo(
    () => visibleGroups.reduce((n, [, g]) => n + g.docs.length, 0),
    [visibleGroups],
  );

  const toggleFramework = (fid: string) => {
    setSelectedFrameworks((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });
  };
  const allSelected = selectedFrameworks.size === groupedDocs.size;
  const [filterOpen, setFilterOpen] = useState(false);


  // Personvernerklæring-dialog
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [privacyUrlErr, setPrivacyUrlErr] = useState<string | null>(null);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const openPrivacyDialog = (fromWebsite: boolean) => {
    setPrivacyUrlErr(null);
    if (fromWebsite && customerUrl) {
      // Foreslå typisk sti
      const base = normalizeUrl(customerUrl).replace(/\/$/, "");
      setPrivacyUrl(`${base}/personvernerklaering`);
    } else {
      setPrivacyUrl("");
    }
    setPrivacyOpen(true);
  };
  const submitPrivacy = () => {
    const t = privacyUrl.trim();
    if (!t) {
      setPrivacyUrlErr("Lim inn en URL eller last opp dokumentet i stedet");
      return;
    }
    try {
      new URL(normalizeUrl(t));
    } catch {
      setPrivacyUrlErr("Ugyldig URL");
      return;
    }
    setPrivacyLoading(true);
    setTimeout(() => {
      setPrivacyLoading(false);
      setPrivacyOpen(false);
      toast.success("Personvernerklæring registrert", {
        description: "Lara analyserer innholdet og kobler det til relevante krav.",
      });
    }, 900);
  };

  // ─── Tom-tilstand: ingen aktive regelverk ───
  if (activeFrameworkIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Dokumentasjon</h2>
        </div>
        <Card className="p-8 border-dashed border-border text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">
            Ingen regelverk kartlagt enda
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Dokumentasjonskravene bestemmes av hvilke regelverk {customerName} er underlagt.
            Kjør en kartlegging for å se hvilke bevis som er lovpålagte.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={onGoToRegulations} className="gap-1.5">
              Gå til Regelverk <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Normal-tilstand ───
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Dokumentasjon</h2>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs bg-popover border border-border p-3 text-popover-foreground shadow-md rounded-md">
                <p className="text-xs leading-relaxed">
                  Dokumentene under er utledet fra regelverkene {customerName} er tilknyttet. Last opp dokumenter — eller registrer en URL for publiserte dokumenter som personvernerklæring.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {visibleDocCount} er dokumentert· {allSelected ? groupedDocs.size : `${selectedFrameworks.size}/${groupedDocs.size}`} regelverk
          </span>

          <Button size="sm" className="h-7 gap-1.5" onClick={() => openUpload()}>
            <Upload className="h-3.5 w-3.5" />
            Last opp
          </Button>

          {/* Regelverk-filter */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 h-7 pl-2 pr-2 rounded-full border transition-colors ${
                  allSelected
                    ? "border-border bg-card hover:bg-muted/40"
                    : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {allSelected ? "Alle regelverk" : `${selectedFrameworks.size} valgt`}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vis dokumenter for
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFrameworks(new Set(activeFrameworkIds))}
                  className="text-[11px] text-primary hover:underline"
                >
                  Alle
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {Array.from(groupedDocs.entries()).map(([fid, group]) => {
                  const checked = selectedFrameworks.has(fid);
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => toggleFramework(fid)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="text-sm text-foreground truncate flex-1">
                        {group.frameworkName}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {group.docs.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

        </div>
      </div>


      {/* Dokumenter gruppert per regelverk */}
      <div className="space-y-3">
        {visibleGroups.map(([fid, group]) => (

          <Card key={fid} className="p-4 sm:p-5 border-border">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {group.frameworkName}
              </h3>
              <span className="text-xs text-muted-foreground shrink-0">
                {group.docs.length} er dokumentert
              </span>
            </div>
            <div className="divide-y divide-border/60">
              {group.docs.map((doc) => {
                const uploaded = false; // prototype
                const StatusIcon = uploaded ? CheckCircle2 : Circle;
                return (
                  <div key={doc.key} className="flex items-start gap-3 py-3">
                    <StatusIcon
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        uploaded ? "text-success" : "text-muted-foreground/50"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {doc.description}
                      </p>
                      {doc.isPrivacyPolicy && customerUrl && (
                        <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Kan finnes på{" "}
                          <a
                            href={normalizeUrl(customerUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            {customerUrl.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.isPrivacyPolicy && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => openPrivacyDialog(Boolean(customerUrl))}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          {customerUrl ? "Hent fra nettside" : "Legg inn URL"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => openUpload([doc.frameworkId])}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Last opp
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Fotnote */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Når dokumentasjon mangler, baserer Lara svarene på antakelser om typiske norske
          SMB-er i kundens bransje. Last opp dokumenter eller lim inn URL for høyere
          presisjon — Laras begrunnelse vises da som et direkte sitat fra kilden.
        </p>
      </div>

      {/* Personvernerklæring-dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personvernerklæring</DialogTitle>
            <DialogDescription>
              {customerUrl
                ? "Vi har foreslått en mulig plassering basert på kundens nettside. Bekreft URL-en, endre den, eller last opp dokumentet i stedet."
                : "Lim inn en direkte URL til den publiserte erklæringen — eller last opp dokumentet."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">URL til publisert erklæring</Label>
              <Input
                value={privacyUrl}
                onChange={(e) => {
                  setPrivacyUrl(e.target.value);
                  setPrivacyUrlErr(null);
                }}
                placeholder="https://example.no/personvernerklaering"
              />
              {privacyUrlErr && (
                <p className="text-xs text-destructive">{privacyUrlErr}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Ingen publisert erklæring?{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setPrivacyOpen(false);
                  openUpload();
                }}
              >
                Last opp dokumentet i stedet
              </button>
              .
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrivacyOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={submitPrivacy} disabled={privacyLoading}>
              {privacyLoading ? "Registrerer…" : "Lagre URL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PartnerEvidenceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        customerId={customerId}
        presetFrameworkIds={uploadFrameworkIds}
      />
    </div>
  );
}
