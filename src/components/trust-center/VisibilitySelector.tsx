import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader2, Globe2, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ALL_VISIBILITY_LEVELS,
  VISIBILITY_META,
  type TrustVisibility,
} from "@/lib/trustVisibility";
import { buildPublicTrustUrl, buildSlug } from "@/lib/publicTrustUrl";

interface Props {
  assetId: string;
  current: TrustVisibility;
  onChange?: (v: TrustVisibility) => void;
  /** Compact pill button (default true). */
  compact?: boolean;
}

export default function VisibilitySelector({ assetId, current, onChange, compact = true }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<TrustVisibility | null>(null);
  const [publicConfirmOpen, setPublicConfirmOpen] = useState(false);
  const [confirmAck, setConfirmAck] = useState(false);
  const queryClient = useQueryClient();

  const meta = VISIBILITY_META[current];
  const Icon = meta.icon;

  // Fetch the bits needed to render the public URL inside the confirm dialog.
  const { data: urlContext } = useQuery({
    queryKey: ["visibility-public-url", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const [{ data: assetRow }, { data: companyRow }] = await Promise.all([
        supabase.from("assets").select("name").eq("id", assetId).maybeSingle(),
        supabase.from("company_profile").select("name, org_number").maybeSingle(),
      ]);
      const name = companyRow?.name || assetRow?.name || "";
      const code = companyRow?.org_number || assetId.slice(0, 4);
      const slug = buildSlug(name, code);
      return { url: buildPublicTrustUrl(slug), slug };
    },
  });

  const persistVisibility = async (level: TrustVisibility) => {
    setSaving(level);
    try {
      const { error } = await supabase
        .from("assets")
        .update({
          publish_mode: level,
          metadata: { visibility_confirmed_at: new Date().toISOString() } as any,
        })
        .eq("id", assetId);
      if (error) throw error;
      toast.success(`Synlighet endret til ${VISIBILITY_META[level].labelNb}`);
      onChange?.(level);
      await queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Kunne ikke endre synlighet");
    } finally {
      setSaving(null);
    }
  };

  const handleSelect = async (level: TrustVisibility) => {
    if (level === current) {
      setOpen(false);
      return;
    }
    // Public requires explicit confirmation modal
    if (level === "public") {
      setOpen(false);
      setConfirmAck(false);
      setPublicConfirmOpen(true);
      return;
    }
    await persistVisibility(level);
  };

  const publicUrl = urlContext?.url || "";
  const isSavingPublic = saving === "public";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={compact ? "sm" : "default"}
            className="rounded-full gap-2 border-[hsl(var(--mynder-blue))]/30 text-[hsl(var(--mynder-blue))] hover:bg-[hsl(var(--mynder-blue))]/5 hover:text-[hsl(var(--mynder-blue))]"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium">{meta.shortNb}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="end">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold">Synlighet for Trust Profile</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Profilen er synlig i Mynder-økosystemet som standard. Alle innloggede brukere kan se den.
            </p>
          </div>
          <div className="space-y-1 mt-1">
            {ALL_VISIBILITY_LEVELS.map((level) => {
              const m = VISIBILITY_META[level];
              const I = m.icon;
              const selected = level === current;
              const isSaving = saving === level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={!!saving}
                  onClick={() => handleSelect(level)}
                  className={`w-full text-left rounded-lg px-2 py-2 transition-colors flex items-start gap-2 ${
                    selected ? "bg-[hsl(var(--mynder-blue))]/10" : "hover:bg-muted"
                  } disabled:opacity-50`}
                >
                  <I className={`h-4 w-4 mt-0.5 ${selected ? "text-[hsl(var(--mynder-blue))]" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{m.labelNb}</span>
                      {level === "ecosystem" && (
                        <span className="text-[10px] text-[hsl(var(--mynder-blue))]">· Anbefalt</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{m.descNb}</p>
                  </div>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--mynder-blue))]" />
                  ) : selected ? (
                    <Check className="h-4 w-4 text-[hsl(var(--mynder-blue))]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Public visibility confirmation dialog */}
      <Dialog
        open={publicConfirmOpen}
        onOpenChange={(o) => {
          if (!isSavingPublic) setPublicConfirmOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-2 h-11 w-11 rounded-full bg-[hsl(var(--mynder-blue))]/10 flex items-center justify-center">
              <Globe2 className="h-5 w-5 text-[hsl(var(--mynder-blue))]" />
            </div>
            <DialogTitle className="text-center">
              Gjør Trust Profile offentlig tilgjengelig
            </DialogTitle>
            <DialogDescription className="text-center">
              Profilen blir åpen for alle på internett, og kan bli indeksert av søkemotorer.
              Bekreft at innholdet er klarert for offentlig deling.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Profilen blir tilgjengelig på
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-foreground break-all">
                  {publicUrl || "Henter lenke…"}
                </code>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] text-[hsl(var(--mynder-blue))] hover:underline"
                  >
                    Åpne <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-foreground leading-relaxed">
                Når profilen er offentlig kan hvem som helst se sertifiseringer, dokumenter merket som
                offentlige, modenhet og kontakter du har lagt til. Du kan endre synlighet tilbake
                når som helst.
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors">
              <Checkbox
                checked={confirmAck}
                onCheckedChange={(v) => setConfirmAck(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground leading-snug">
                Jeg bekrefter at innholdet i Trust Profile er klarert for offentlig deling.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setPublicConfirmOpen(false)}
              disabled={isSavingPublic}
            >
              Avbryt
            </Button>
            <Button
              onClick={async () => {
                await persistVisibility("public");
                setPublicConfirmOpen(false);
              }}
              disabled={!confirmAck || isSavingPublic || !publicUrl}
              className="gap-1.5"
            >
              {isSavingPublic ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publiserer…
                </>
              ) : (
                <>
                  <Globe2 className="h-4 w-4" />
                  Publiser offentlig
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
