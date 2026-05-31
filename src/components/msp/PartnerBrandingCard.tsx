import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, RotateCcw, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";

const MAX_LOGO_BYTES = 300 * 1024;

export function PartnerBrandingCard() {
  const { branding, save, clearField } = usePartnerBranding();
  const [name, setName] = useState(branding.isAutoName ? "" : branding.name);
  const [orgNumber, setOrgNumber] = useState(branding.isAutoOrg ? "" : branding.orgNumber);
  const [tagline, setTagline] = useState(branding.tagline);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Ugyldig filtype", { description: "Velg en PNG- eller JPG-fil." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logoen er for stor", { description: "Maks 300 KB. Komprimer bildet og prøv igjen." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      save({ logoDataUrl: String(reader.result) });
      toast.success("Logo lagret", { description: "Brukes i alle nye tilbud." });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    save({
      name: name.trim() || undefined,
      orgNumber: orgNumber.trim() || undefined,
      tagline: tagline.trim() || undefined,
    });
    toast.success("Tilbudsmerking lagret");
  };

  return (
    <Card className="p-4 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {branding.logoDataUrl ? (
              <img src={branding.logoDataUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">Tilbudsmerking</h3>
              <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-2.5 w-2.5" /> Auto-fylt
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {branding.name}{branding.orgNumber ? ` · Org.nr ${branding.orgNumber}` : ""}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="grid gap-4 md:grid-cols-[1fr_280px] pt-2 border-t border-border">
          <div className="space-y-3">
            <p className="text-[12px] text-muted-foreground">
              Navn, organisasjonsnummer og logo vises automatisk i alle tilbud du genererer. Vi henter det fra
              partnerprofilen din — du kan overstyre når som helst.
            </p>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Partnernavn
              </Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={branding.autoName}
                  className="h-9 text-sm"
                />
                {!branding.isAutoName && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("name"); setName(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {branding.isAutoName ? "Hentet automatisk fra partnerprofilen." : "Overstyrt manuelt."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Organisasjonsnummer
              </Label>
              <div className="flex gap-2">
                <Input
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                  placeholder={branding.autoOrgNumber || "999 999 999"}
                  className="h-9 text-sm tabular-nums"
                />
                {!branding.isAutoOrg && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("orgNumber"); setOrgNumber(""); toast.success("Tilbakestilt til auto"); }}>
                    <RotateCcw className="h-3 w-3" /> Auto
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {branding.isAutoOrg
                  ? (branding.autoOrgNumber ? "Hentet automatisk fra partnerprofilen." : "Mangler — legg inn for at det skal vises i tilbudet.")
                  : "Overstyrt manuelt."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Slagord <span className="text-muted-foreground/70 normal-case">(valgfritt)</span>
              </Label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="F.eks. Din partner for trygg digitalisering"
                className="h-9 text-sm"
                maxLength={80}
              />
              <p className="text-[10px] text-muted-foreground">Vises under partnernavnet i tilbudet.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Logo</Label>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoSelect(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 text-xs gap-1.5"
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> {branding.logoDataUrl ? "Bytt logo" : "Last opp logo"}
                </Button>
                {!branding.isAutoLogo && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 text-xs gap-1"
                    onClick={() => { clearField("logoDataUrl"); toast.success("Logo fjernet"); }}>
                    <RotateCcw className="h-3 w-3" /> Fjern
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">PNG eller JPG, maks 300 KB. Vises øverst i tilbudet.</p>
            </div>

            <div className="pt-1">
              <Button type="button" size="sm" className="h-9 text-xs" onClick={handleSave}>
                Lagre tilbudsmerking
              </Button>
            </div>
          </div>

          {/* Mini-preview */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Slik vises det i tilbudet
            </Label>
            <div className="rounded-md border border-border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {branding.logoDataUrl ? (
                    <img src={branding.logoDataUrl} alt="" className="h-9 w-9 object-contain rounded" />
                  ) : (
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {name.trim() || branding.autoName}
                    </p>
                    {(tagline.trim() || branding.tagline) && (
                      <p className="text-[10px] text-muted-foreground italic truncate">
                        {tagline.trim() || branding.tagline}
                      </p>
                    )}
                    {(orgNumber.trim() || branding.autoOrgNumber) && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        Org.nr {orgNumber.trim() || branding.autoOrgNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  <div>Tilbud T-2026-1234</div>
                  <div>{new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
