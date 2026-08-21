import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ChevronDown, ChevronUp, FileText, ExternalLink, Check, X, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { frameworks as allFrameworkDefs } from "@/lib/frameworkDefinitions";
import { resolveDocSource } from "@/lib/vendorDocumentSource";
import type { VendorFramework } from "@/lib/vendorFrameworkSuggestions";

/**
 * Sjekkpunkt: «Styringssystem etablert».
 *
 * Tre tilstander — Ja / Nei / Ikke vurdert. Tomt/ukjent vises ALLTID som
 * «Ikke vurdert», aldri som «Nei». Ingen score fabrikkeres: manglende
 * dokumentasjon er nøytralt, ikke et negativt hakemerke.
 *
 * Settes automatisk til «Ja» når det finnes gyldig dokumentasjon som støtter
 * et etablert styringssystem (styringsdokument, ISO 27001-sertifikat,
 * internrevisjonsrapport m.m.). Brukeren kan alltid overstyre manuelt.
 */

type CheckpointState = "ja" | "nei" | "ikke_vurdert";

/** Dokumenttyper som dokumenterer et etablert styringssystem. */
const SUPPORTING_DOC_TYPES = new Set([
  "iso27001",
  "soc2",
  "soc2_report",
  "security_policy",
  "audit_report",
  "internal_audit",
  "isms",
  "policy",
]);

/** Standard kravkobling per dokumenttype når ingen eksplisitt kobling finnes. */
const DEFAULT_REQ_BY_TYPE: Record<string, { frameworkId: string; reqNb: string; reqEn: string }> = {
  iso27001: { frameworkId: "iso27001", reqNb: "A.5.1 Policyer for informasjonssikkerhet", reqEn: "A.5.1 Policies for information security" },
  soc2: { frameworkId: "soc2", reqNb: "CC1 – Kontrollmiljø", reqEn: "CC1 – Control environment" },
  soc2_report: { frameworkId: "soc2", reqNb: "CC1 – Kontrollmiljø", reqEn: "CC1 – Control environment" },
  security_policy: { frameworkId: "iso27001", reqNb: "A.5.1 Policyer for informasjonssikkerhet", reqEn: "A.5.1 Policies for information security" },
  audit_report: { frameworkId: "iso27001", reqNb: "A.5.35 Uavhengig gjennomgang", reqEn: "A.5.35 Independent review of information security" },
  internal_audit: { frameworkId: "iso27001", reqNb: "A.5.35 Uavhengig gjennomgang", reqEn: "A.5.35 Independent review of information security" },
  isms: { frameworkId: "iso27001", reqNb: "Kap. 4–10 Ledelsessystem (ISMS)", reqEn: "Clauses 4–10 Management system (ISMS)" },
  policy: { frameworkId: "iso27001", reqNb: "A.5.1 Policyer for informasjonssikkerhet", reqEn: "A.5.1 Policies for information security" },
};

const STORAGE_KEY = "mynder-governance-checkpoint-v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readOverrides(): Record<string, CheckpointState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeOverride(assetId: string, state: CheckpointState | null) {
  const all = readOverrides();
  if (state === null) delete all[assetId];
  else all[assetId] = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

interface Props {
  assetId: string;
  /** Regelverk leverandøren er scopet mot — brukes til å vise opprinnelse på kravkoblingen. */
  frameworks?: VendorFramework[];
  className?: string;
}

export function GovernanceSystemCheckpoint({ assetId, frameworks = [], className }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [expanded, setExpanded] = useState(false);
  const [override, setOverride] = useState<CheckpointState | null>(() => readOverrides()[assetId] ?? null);

  const { data: docs = [] } = useQuery({
    queryKey: ["governance-checkpoint-docs", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, file_name, display_name, document_type, status, source, uploaded_by, valid_to, file_path, external_url, created_at")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Gyldig, støttende dokumentasjon — utløpte/avviste/erstattede teller ikke.
  const supportingDocs = useMemo(
    () =>
      docs.filter((d) => {
        if (!SUPPORTING_DOC_TYPES.has(d.document_type)) return false;
        if (!["current", "approved", "verified"].includes(d.status)) return false;
        if (d.valid_to && new Date(d.valid_to) < new Date()) return false;
        return true;
      }),
    [docs],
  );

  const supportingIds = useMemo(() => supportingDocs.map((d) => d.id), [supportingDocs]);

  // Eksplisitte kravkoblinger (dokument → krav i regelverk) for de støttende dokumentene.
  const { data: evidenceLinks = [] } = useQuery({
    queryKey: ["governance-checkpoint-evidence", supportingIds],
    enabled: supportingIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_evidence")
        .select("document_id, framework_id, requirement_id")
        .in("document_id", supportingIds);
      if (error) throw error;
      return data as { document_id: string; framework_id: string; requirement_id: string }[];
    },
  });

  const derived: CheckpointState = supportingDocs.length > 0 ? "ja" : "ikke_vurdert";
  const effective: CheckpointState = override ?? derived;

  /** Opprinnelse på kravkoblingen — samme mønster som gap-analysen. */
  const originLabel = (frameworkId: string): string => {
    const f = frameworks.find((x) => x.id === frameworkId);
    if (f?.manual) return isNb ? "Lagt til av operatør" : "Added by operator";
    if (f?.confidence === "medium") return isNb ? "Foreslått av baseline" : "Suggested by baseline";
    return isNb ? "Lovpålagt" : "Mandatory by law";
  };

  const frameworkName = (frameworkId: string): string =>
    allFrameworkDefs.find((f) => f.id === frameworkId)?.name ?? frameworkId;

  /** Kravkoblingene som vises i detaljvisningen. */
  const requirementLinks = useMemo(() => {
    if (evidenceLinks.length > 0) {
      const seen = new Set<string>();
      return evidenceLinks
        .filter((l) => {
          const key = `${l.framework_id}:${l.requirement_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((l) => ({
          key: `${l.framework_id}:${l.requirement_id}`,
          frameworkId: l.framework_id,
          label: `${frameworkName(l.framework_id)} · ${l.requirement_id}`,
        }));
    }
    // Fallback: utled fra dokumenttype.
    const seen = new Set<string>();
    return supportingDocs
      .map((d) => DEFAULT_REQ_BY_TYPE[d.document_type])
      .filter(Boolean)
      .filter((r) => {
        const key = `${r.frameworkId}:${r.reqNb}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((r) => ({
        key: `${r.frameworkId}:${r.reqNb}`,
        frameworkId: r.frameworkId,
        label: `${frameworkName(r.frameworkId)} · ${isNb ? r.reqNb : r.reqEn}`,
      }));
  }, [evidenceLinks, supportingDocs, isNb]);

  /** Proveniens som tekst — levert av kunden eller av leverandøren selv. */
  const provenanceLabel = (doc: any): string => {
    const src = resolveDocSource(doc.source);
    if (src === "vendor") return isNb ? "Levert av leverandøren" : "Provided by the vendor";
    if (src === "trustEngine") return isNb ? "Hentet fra leverandørens Trust Engine" : "Retrieved from the vendor's Trust Engine";
    if (src === "agent") return isNb ? "Hentet av Sara (lokal agent)" : "Collected by Sara (local agent)";
    const by = doc.uploaded_by && !UUID_RE.test(doc.uploaded_by) ? ` (${doc.uploaded_by})` : "";
    return isNb ? `Lastet opp av kunden${by}` : `Uploaded by the customer${by}`;
  };

  const openDoc = async (doc: any) => {
    if (doc.external_url) {
      window.open(doc.external_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!doc.file_path) return;
    const { data } = await supabase.storage.from("vendor-documents").createSignedUrl(doc.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const setState = (s: CheckpointState) => {
    // Velger brukeren det samme som dokumentasjonen tilsier, fjernes overstyringen (tilbake til auto).
    if (s === derived) {
      setOverride(null);
      writeOverride(assetId, null);
    } else {
      setOverride(s);
      writeOverride(assetId, s);
    }
  };

  const stateMeta: Record<CheckpointState, { nb: string; en: string; icon: typeof Check; cls: string }> = {
    ja: { nb: "Ja", en: "Yes", icon: Check, cls: "border-success/40 bg-success/5 text-success" },
    nei: { nb: "Nei", en: "No", icon: X, cls: "border-destructive/40 bg-destructive/5 text-destructive" },
    ikke_vurdert: { nb: "Ikke vurdert", en: "Not assessed", icon: CircleDashed, cls: "border-border bg-muted/40 text-muted-foreground" },
  };

  const current = stateMeta[effective];
  const StateIcon = current.icon;
  const locale = isNb ? "nb-NO" : "en-US";

  return (
    <section className={cn("rounded-2xl border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-muted/30 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground truncate">
            {isNb ? "Styringssystem etablert" : "Management system established"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", current.cls)}>
            <StateIcon className="h-3 w-3" aria-hidden="true" />
            {isNb ? current.nb : current.en}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 pt-1 space-y-4 border-t border-border/60">
          {/* Statusvelger — brukeren kan alltid overstyre */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <span className="text-xs text-muted-foreground">
              {isNb ? "Status:" : "Status:"}
            </span>
            <div role="radiogroup" aria-label={isNb ? "Status for styringssystem" : "Management system status"} className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
              {(["ja", "nei", "ikke_vurdert"] as CheckpointState[]).map((s) => {
                const meta = stateMeta[s];
                const active = effective === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setState(s)}
                    className={cn(
                      "h-7 rounded-md px-2.5 text-xs font-medium transition-colors",
                      active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isNb ? meta.nb : meta.en}
                  </button>
                );
              })}
            </div>
            {override !== null && override !== derived && (
              <span className="text-[11px] text-muted-foreground">
                {isNb
                  ? `Satt manuelt — dokumentasjonsgrunnlaget tilsier «${stateMeta[derived].nb}».`
                  : `Set manually — the documentation suggests “${stateMeta[derived].en}”.`}
              </span>
            )}
          </div>

          {/* Kravkobling med opprinnelse */}
          {requirementLinks.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                {isNb ? "Koblet til krav" : "Linked to requirements"}
              </p>
              <ul className="space-y-1.5">
                {requirementLinks.map((r) => (
                  <li key={r.key} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-foreground">{r.label}</span>
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {originLabel(r.frameworkId)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dokumentasjonsgrunnlag med proveniens */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {isNb ? "Dokumentasjonsgrunnlag" : "Supporting documentation"}
            </p>
            {supportingDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Ingen styringsdokumentasjon er registrert ennå. Last opp et styringsdokument, ISO 27001-sertifikat eller internrevisjonsrapport under Dokumentasjon for at sjekkpunktet skal settes til «Ja»."
                  : "No governance documentation is registered yet. Upload a governance document, ISO 27001 certificate or internal audit report under Documentation to set this checkpoint to “Yes”."}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {supportingDocs.map((d) => {
                  const name = d.display_name || d.file_name || (isNb ? "Dokument" : "Document");
                  const canOpen = Boolean(d.external_url || d.file_path);
                  return (
                    <li key={d.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      {canOpen ? (
                        <button
                          type="button"
                          onClick={() => openDoc(d)}
                          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {name}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{isNb ? "Åpne dokument" : "Open document"}</span>
                        </button>
                      ) : (
                        <span className="font-medium text-foreground">{name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {provenanceLabel(d)}
                        {d.created_at && <> · {new Date(d.created_at).toLocaleDateString(locale)}</>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
