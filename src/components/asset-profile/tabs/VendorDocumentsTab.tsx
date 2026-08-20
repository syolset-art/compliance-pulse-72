import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Inbox, ShieldCheck, Upload } from "lucide-react";
import { DocumentsTab } from "./DocumentsTab";
import { LaraInboxTab } from "./LaraInboxTab";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { SaraActivityLogDialog } from "@/components/agents/SaraActivityLogDialog";
import { useSaraAgent } from "@/lib/saraAgent";
import { InviteVendorDialog } from "@/components/vendor-dashboard/InviteVendorDialog";
import { useRef } from "react";

interface VendorDocumentsTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorDocumentsTab = ({ assetId, assetName, vendorName }: VendorDocumentsTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;
  const uploadTriggerRef = useRef<(() => void) | null>(null);
  const { installed, newFindings } = useSaraAgent();

  const [saraOpen, setSaraOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: pendingInbox = 0 } = useQuery({
    queryKey: ["lara-inbox-pending", assetId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lara_inbox")
        .select("id", { count: "exact", head: true })
        .eq("matched_asset_id", assetId)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-5">
      {/* Kilde og agent */}
      {installed ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[13px]">
          <SaraIcon size={18} />
          <span className="text-foreground">
            {isNb
              ? "Sara henter dokumentasjon om leverandøren automatisk fra egne kilder"
              : "Sara collects vendor documentation automatically from your own sources"}
          </span>
          {newFindings > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {isNb ? `${newFindings} nye underlag` : `${newFindings} new records`}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="ml-auto font-medium text-primary hover:underline"
          >
            {isNb ? "Se aktivitet" : "View activity"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-card/40 px-3 py-2 text-[13px]">
          <SaraIcon size={18} />
          <span className="text-muted-foreground">
            {isNb
              ? "Slipp manuell opplasting: den lokale agenten Sara kan hente dokumentasjonsunderlaget i din egen infrastruktur."
              : "Skip manual uploads: the local Sara agent can collect documentation records inside your own infrastructure."}
          </span>
          <button
            type="button"
            onClick={() => setSaraOpen(true)}
            className="ml-auto font-medium text-primary hover:underline"
          >
            {isNb ? "Se hvordan Sara fungerer" : "See how Sara works"}
          </button>
        </div>
      )}

      {/* Venter på godkjenning – tynn linje, ikke egen stor seksjon */}
      {pendingInbox > 0 && (
        <div className="rounded-lg border border-warning/25 bg-warning/[0.05]">
          <button
            type="button"
            onClick={() => setInboxOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]"
          >
            <Inbox className="h-4 w-4 text-warning" />
            <span className="text-foreground">
              {isNb
                ? `${pendingInbox} dokument${pendingInbox > 1 ? "er" : ""} venter på godkjenning`
                : `${pendingInbox} document${pendingInbox > 1 ? "s" : ""} awaiting approval`}
            </span>
            <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${inboxOpen ? "rotate-180" : ""}`} />
          </button>
          {inboxOpen && (
            <div className="border-t border-warning/20 p-3">
              <LaraInboxTab assetId={assetId} assetName={assetName} />
            </div>
          )}
        </div>
      )}

      {/* Dokumentliste med proveniens */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {isNb ? "Dokumentasjon" : "Documentation"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isNb
                ? "Alt vi har om leverandøren – og hvor det kommer fra"
                : "Everything we hold on this vendor – and where it came from"}
            </p>
          </div>
          <Button size="sm" onClick={() => uploadTriggerRef.current?.()} className="h-8 shrink-0 gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            {isNb ? "Last opp dokumentasjon" : "Upload documentation"}
          </Button>
        </div>
        <DocumentsTab
          assetId={assetId}
          assetName={assetName}
          vendorName={vendorName}
          hideUploadButton
          onUploadTriggerReady={(trigger) => { uploadTriggerRef.current = trigger; }}
        />
      </section>

      {/* Trust Engine – fase 2 */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Automatisk fra leverandørens Trust Profile" : "Automatic from the vendor's Trust Profile"}
              </h3>
              <Badge variant="secondary" className="text-[11px]">{isNb ? "Kommer" : "Coming"}</Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isNb
                ? "Når leverandøren overtar sin Trust Profile i Mynder Trust Engine, hentes sertifikater, databehandleravtaler og underleverandører automatisk – og merkes som verifisert kilde."
                : "Once the vendor claims its Trust Profile in Mynder Trust Engine, certificates, DPAs and subprocessors are retrieved automatically – marked as a verified source."}
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={() => setInviteOpen(true)}>
            {isNb ? "Inviter til Trust Engine" : "Invite to Trust Engine"}
          </Button>
        </div>
      </section>

      <SaraOnboardingDialog open={saraOpen} onOpenChange={setSaraOpen} />
      <SaraActivityLogDialog open={logOpen} onOpenChange={setLogOpen} isNb={isNb} />
      <InviteVendorDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        vendor={{ id: assetId, name: vendorName || assetName }}
      />
    </div>
  );
};
