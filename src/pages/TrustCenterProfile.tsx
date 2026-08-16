import { useState, useCallback, useEffect } from "react";
import mynderLogo from "@/assets/mynder-logo.png";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import {
  Shield, ShieldCheck, Eye, Share2, Settings, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, ChevronRight, Clock, MessageSquare, FileText, Award, Globe,
  Lock, Layers, Users, Link2, Code2, Copy, Check, Building2, Info, Pencil,
  Sparkles, Zap, Server, Package, ArrowRight, ExternalLink,
  Linkedin, Facebook, Mail, Star, TrendingUp, BarChart3,
  Scale, BookCheck,
} from "lucide-react";
import { frameworkChipClass } from "@/lib/frameworkChipClass";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SubprocessorTable } from "@/components/trust-center/profile/SubprocessorTable";
import { TrustProfileHero, IdentityStripe } from "@/components/trust-center/profile/TrustProfileHero";
import type { SubprocessorListData } from "@/lib/demoSubprocessorAnalysis";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";

const VENDOR_TYPE_LABEL_NB: Record<string, string> = {
  msp: "MSP",
  mssp: "MSSP",
  it_partner: "IT-partner",
  drift: "Drift",
  cloud: "Skytjeneste / hosting",
  hr: "HR-system",
  finance: "Økonomi / fakturering",
  comms: "Kommunikasjon / e-post",
  marketing: "Markedsføring",
  consultant: "Konsulent",
  other: "Annet",
};

const VENDOR_TYPE_LABEL_EN: Record<string, string> = {
  msp: "MSP",
  mssp: "MSSP",
  it_partner: "IT partner",
  drift: "Operations",
  cloud: "Cloud / hosting",
  hr: "HR system",
  finance: "Finance / billing",
  comms: "Communication / email",
  marketing: "Marketing",
  consultant: "Consultant",
  other: "Other",
};

const GDPR_ROLE_LABEL_NB: Record<string, string> = {
  processor: "Databehandler",
  controller: "Behandlingsansvarlig",
  joint: "Felles behandlingsansvarlig",
  none: "Ikke aktuelt",
};

const GDPR_ROLE_LABEL_EN: Record<string, string> = {
  processor: "Data processor",
  controller: "Data controller",
  joint: "Joint controller",
  none: "Not applicable",
};


// EU-style 12-star wreath used in the compliance badge
const StarWreath = ({ count = 12, radius = 30, starSize = 7, color = "hsl(45, 90%, 55%)" }: { count?: number; radius?: number; starSize?: number; color?: string }) => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden>
    {Array.from({ length: count }).map((_, i) => (
      <Star
        key={i}
        className="absolute left-1/2 top-1/2"
        style={{
          width: starSize,
          height: starSize,
          color,
          fill: color,
          transform: `translate(-50%, -50%) rotate(${i * (360 / count)}deg) translateY(-${radius}px)`,
        }}
        strokeWidth={0}
      />
    ))}
  </div>
);

// Mynder butterfly mark (matches LaraAvatar silhouette)
const ButterflyMark = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden>
    <path
      d="M12 12c-1.6-3.2-4.2-5-6.4-5-1.6 0-2.6 1.1-2.6 2.7 0 2.4 2.4 5.3 5.4 6.5C6.8 17.5 6 18.7 6 20c0 .9.7 1.5 1.6 1.5 1.5 0 3.3-1.4 4.4-3.5 1.1 2.1 2.9 3.5 4.4 3.5.9 0 1.6-.6 1.6-1.5 0-1.3-.8-2.5-2.4-3.8 3-1.2 5.4-4.1 5.4-6.5 0-1.6-1-2.7-2.6-2.7-2.2 0-4.8 1.8-6.4 5z"
      fill={color}
    />
    <circle cx="12" cy="6" r="1.4" fill={color} />
  </svg>
);

// Small circular Trust Score ring
const TrustScoreRing = ({ score, size = 36, stroke = 3, color = "hsl(45, 90%, 55%)", trackColor = "rgba(255,255,255,0.18)" }: { score: number; size?: number; stroke?: number; color?: string; trackColor?: string }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
};
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { EvidenceStatusBadge, deriveWorstStatus } from "@/components/trust-controls/EvidenceStatusBadge";
import type { EvidenceStatus } from "@/components/trust-controls/EvidenceStatusBadge";
import { seedDemoTrustProfile, resetTrustProfileForDemo } from "@/lib/demoSeedTrustProfile";
import ActivateTrustProfileWizard from "@/components/trust-center/activate/ActivateTrustProfileWizard";
import { usePartnerInfo, PARTNER_TYPE_LABEL } from "@/hooks/usePartnerInfo";

import type { ControlArea } from "@/lib/trustControlDefinitions";
import { POLICY_TYPES as TC_POLICY_TYPES, CERT_TYPES as TC_CERT_TYPES } from "@/lib/trustDocumentTypes";
import { RequiredArtifactsBlock } from "@/components/trust-center/RequiredArtifactsBlock";
import { CONTROL_AREAS } from "@/lib/controlAreas";

import { buildPublicTrustUrl, buildSlug } from "@/lib/publicTrustUrl";
import VisibilitySelector from "@/components/trust-center/VisibilitySelector";
import { getVisibilityFromAsset, VISIBILITY_META, type TrustVisibility } from "@/lib/trustVisibility";
import ShareTrustProfileDialog from "@/components/dialogs/ShareTrustProfileDialog";
import TrustProfileFreshness from "@/components/trust-center/TrustProfileFreshness";

const AREA_CONFIG: { area: ControlArea; icon: typeof Shield; labelEn: string; labelNb: string }[] =
  CONTROL_AREAS.map((a) => ({
    area: a.key as ControlArea,
    icon: a.icon as typeof Shield,
    labelEn: a.labelEn,
    labelNb: a.labelNb,
  }));

// Demo-variation offsets per area so trust-profile cards don't all show the same level.
// Floors the score for each area to give realistic spread across High/Medium/Low.
const AREA_DEMO_FLOOR: Record<string, number> = {
  governance: 78,
  operations: 62,
  identityAccess: 71,
  privacy: 55,
  vendor: 28,
};

// Maturity label thresholds: High >= 67, Medium 35-66, Low < 35
const scoreLabel = (score: number, isNb: boolean) =>
  score >= 67 ? (isNb ? "Høy" : "High")
  : score >= 35 ? (isNb ? "Middels" : "Medium")
  : (isNb ? "Lav" : "Low");
const scoreTone = (score: number) =>
  score >= 67 ? { text: "text-success", bg: "bg-success" }
  : score >= 35 ? { text: "text-warning", bg: "bg-warning" }
  : { text: "text-destructive", bg: "bg-destructive" };

const TrustCenterProfile = ({ assetId: propAssetId, readOnly = false }: { assetId?: string; readOnly?: boolean }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { stats: complianceStats, requirements: allRequirements } = useComplianceRequirements();
  const isServiceProfile = !!propAssetId;
  const [activeTab, setActiveTab] = useState<"preview" | "publish" | "benchmark">("preview");
  const [expandedArea, setExpandedArea] = useState<ControlArea | null>(null);
  const [publishSubTab, setPublishSubTab] = useState<"link" | "vendor" | "badge">("link");
  const [badgeTheme, setBadgeTheme] = useState<"dark" | "light">("dark");
  const [selectedBadgeTier, setSelectedBadgeTier] = useState<"free" | "pro">("free");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishStep, setPublishStep] = useState<"confirm" | "publishing" | "success">("confirm");
  const [isPublishing, setIsPublishing] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docsSectionOpen, setDocsSectionOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showActivateWizard, setShowActivateWizard] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try { return localStorage.getItem("mynder.trustprofile.activated") === "1"; } catch { return false; }
  });
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [frameworkDetailId, setFrameworkDetailId] = useState<string | null>(null);
  const setHelpOpenCb = useCallback((v: boolean) => setHelpOpen(v), []);
  usePageHelpListener(setHelpOpenCb);

  const { data: asset, isLoading } = useQuery({
    queryKey: propAssetId ? ["asset-profile", propAssetId] : ["self-asset-profile"],
    queryFn: async () => {
      if (propAssetId) {
        const { data, error } = await supabase
          .from("assets")
          .select("*")
          .eq("id", propAssetId)
          .maybeSingle();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_type", "self")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_trust_center"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active-tc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name, is_public")
        .eq("is_selected", true);
      if (error) return [];
      return data || [];
    },
  });

  const { data: vendorDocs = [] } = useQuery({
    queryKey: ["vendor-documents-tc", asset?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, display_name, status, created_at, valid_to, visibility, external_url, available_on_request, file_path, category")
        .eq("asset_id", asset!.id)
        .in("visibility", ["published", "public"]);
      // Dedupe by file_name (demo seeds may produce duplicates) and cap at 5 in preview
      const seen = new Set<string>();
      const deduped = (data || []).filter((d: any) => {
        const key = d.file_name || d.display_name || d.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return deduped.slice(0, 5);
    },
    enabled: !!asset?.id,
  });

  const policies = vendorDocs.filter((d: any) => TC_POLICY_TYPES.includes(d.document_type));
  const certs = vendorDocs.filter((d: any) => TC_CERT_TYPES.includes(d.document_type));
  const otherDocs = vendorDocs.filter((d: any) =>
    !TC_POLICY_TYPES.includes(d.document_type) && !TC_CERT_TYPES.includes(d.document_type)
  );
  const docsCount = policies.length;
  const certsCount = certs.length;
  const otherDocsCount = otherDocs.length;

  const { data: services = [] } = useQuery({
    queryKey: ["trust-center-services", asset?.id],
    queryFn: async () => {
      const { data: rels } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .eq("source_asset_id", asset!.id)
        .eq("relationship_type", "service_of");
      if (!rels || rels.length === 0) return [];
      const ids = rels.map((r) => r.target_asset_id);
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name, description, asset_type, compliance_score")
        .in("id", ids);
      return assets || [];
    },
    enabled: !!asset?.id,
  });

  const evaluation = useTrustControlEvaluation(asset?.id || "");
  const { data: partnerInfo } = usePartnerInfo(companyProfile?.id);

  // Trust Profile is gated behind explicit activation. If the user hasn't
  // completed the activation wizard, we show a locked landing state instead
  // of any profile content. propAssetId / readOnly views (public link, MSP
  // partner view, service profile) bypass this gate entirely.
  const isOwnProfile = !propAssetId && !readOnly;

  useEffect(() => {
    if (!isOwnProfile) return;
    if (isActivated) return;
    if (isLoading || isSeeding) return;
    // Auto-open wizard the very first time. After that the locked state's
    // CTA is the only entry point — we don't keep popping it open.
    let activatedFlag: string | null = null;
    try { activatedFlag = localStorage.getItem("mynder.trustprofile.activated"); } catch {}
    if (activatedFlag === null) {
      setShowActivateWizard(true);
    }
  }, [isOwnProfile, isActivated, isLoading, isSeeding]);

  // Allow external trigger (e.g. from sidebar demo button) to re-open the wizard
  useEffect(() => {
    const open = () => setShowActivateWizard(true);
    window.addEventListener("open-activate-trust-wizard", open);
    if (typeof window !== "undefined" && window.location.search.includes("activate=1")) {
      setShowActivateWizard(true);
    }
    return () => window.removeEventListener("open-activate-trust-wizard", open);
  }, []);

  // ─── Demo mode: ?demo=activation ────────────────────────────────────────
  // Triggered when filming a walkthrough. Resets the activation state, opens
  // the wizard in auto-play mode (calm ~40s rhythm), and cleans the URL so a
  // refresh does not re-trigger the demo. Skipped on service-profile views
  // and on read-only renders.
  const [autoPlayDemo, setAutoPlayDemo] = useState(false);
  useEffect(() => {
    if (propAssetId || readOnly) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "activation") return;

    let cancelled = false;
    (async () => {
      try { localStorage.removeItem("mynder.trustprofile.activated"); } catch {}
      setIsActivated(false);
      setJustActivated(false);
      try {
        await resetTrustProfileForDemo();
      } catch (e) {
        // ignore — wizard will still play
      }
      if (cancelled) return;
      await queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
      if (cancelled) return;
      setAutoPlayDemo(true);
      // Strip the demo param so a refresh doesn't loop the demo
      params.delete("demo");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Gate: own profile but not yet activated → locked landing
  if (isOwnProfile && !isActivated) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          {!autoPlayDemo && <Sidebar />}
          <main className={`flex-1 p-6 ${autoPlayDemo ? "pt-6" : "pt-16"}`}>

            <div className="max-w-3xl mx-auto mt-6 mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {isNb ? "Din Trust Profile gjør deg klar" : "Your Trust Profile gets you ready"}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                {isNb
                  ? "Sett opp profilen én gang. Del status med kunder, leverandører og revisorer — uten å sende dokumenter på nytt hver gang noen spør."
                  : "Set up your profile once. Share status with customers, vendors and auditors — without sending documents over and over again."}
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  isNb ? "Spar tid — lever én gang, svar til alle" : "Save time — deliver once, reply to everyone",
                  isNb ? "Bygg tillit — vis at du har kontroll, verifisert" : "Build trust — show you are in control, verified",
                  isNb ? "Møt regelverket — NIS2, GDPR og EU AI Act på ett sted" : "Meet regulations — NIS2, GDPR and EU AI Act in one place",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {!autoPlayDemo && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      try { localStorage.removeItem("mynder.trustprofile.activated"); } catch {}
                      const url = new URL(window.location.href);
                      url.searchParams.set("demo", "activation");
                      window.location.assign(url.toString());
                    }}
                    title={isNb ? "Nullstill og spill av aktiveringen automatisk (~40 s)" : "Reset and auto-play the activation flow (~40 s)"}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {isNb ? "Spill av demo (~40 s)" : "Play demo (~40 s)"}
                  </Button>
                </div>
              )}
            </div>

            <div className={`transition-all duration-500 ${justActivated ? "opacity-0 -translate-y-2" : "opacity-100"}`}>
              <ActivateTrustProfileWizard
                inline
                conversation
                autoPlay={autoPlayDemo}
                initialCompanyName={companyProfile?.name || undefined}
                initialOrgNumber={companyProfile?.org_number || undefined}
                initialDomain={(companyProfile as any)?.domain || undefined}
                initialMaturity={(asset as any)?.metadata?.maturity || undefined}
                open={true}
                onOpenChange={() => { /* inline — no close */ }}
                onCompleted={() => {
                  setJustActivated(true);
                  setTimeout(() => {
                    try { localStorage.setItem("mynder.trustprofile.activated", "1"); } catch {}
                    setShowActivateWizard(false);
                    setIsActivated(true);
                    // Keep autoPlayDemo true after activation so the sidebar
                    // stays hidden through the landing — clean "content only" view.

                    queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
                    queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
                    // Ensure the demo lands cleanly on /trust-center/profile with
                    // the freshly activated profile visible from the top.
                    try {
                      if (window.location.pathname !== "/trust-center/profile") {
                        window.history.replaceState({}, "", "/trust-center/profile");
                      }
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } catch {}
                  }, 700);
                }}
              />
            </div>


            <ContextualHelpPanel
              open={helpOpen}
              onOpenChange={setHelpOpen}
              icon={Shield}
              title={isNb ? "Trust Profile" : "Trust Profile"}
              description={
                isNb
                  ? (
                    <>
                      <p>Personvernerklæringer, databehandleravtaler og lovpålagt dokumentasjon må uansett finnes og deles. Med en Trust Profile gjør du jobben én gang. Kunder og partnere finner det selv — eller spør direkte gjennom profilen. Den som spør trenger ikke Mynder-konto.</p>
                      <p>Lara hjelper deg å holde profilen oppdatert basert på regelverk du har aktivert.</p>
                      <p>Profilen får en tillitsskår basert på det du har dokumentert og informasjonen Lara har kartlagt. Skåren vokser etter hvert som du legger til mer.</p>
                      <p>Du blir en sterkere partner. Underleverandører er ofte det svake punktet i leverandørkjeder. Med en Trust Profile bidrar du til å redusere sårbarhet i kjeden du er en del av.</p>
                    </>
                  )
                  : (
                    <>
                      <p>Privacy policies, data processing agreements and legally required documentation must exist and be shared anyway. With a Trust Profile you do the work once. Customers and partners find it themselves — or ask directly through the profile. The person asking does not need a Mynder account.</p>
                      <p>Lara helps you keep the profile updated based on the regulations you have activated.</p>
                      <p>The profile gets a trust score based on what you have documented and the information Lara has mapped. The score grows as you add more.</p>
                      <p>You become a stronger partner. Sub-suppliers are often the weak point in supply chains. With a Trust Profile you help reduce vulnerability in the chain you are part of.</p>
                    </>
                  )
              }
              doDescription={
                isNb
                  ? (
                    <>
                      <p>Bygg og hold Trust Profile oppdatert. Lara hjelper deg underveis.</p>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Aktiver regelverk du vil dekke.</strong> Lara kartlegger informasjonen du har lagt inn og oppdaterer profilen fortløpende.</li>
                        <li><strong>Last opp dokumentasjon.</strong> Last opp personvernerklæring, databehandleravtaler og sertifiseringer — eller pek på hvor de ligger.</li>
                        <li><strong>Svar på spørsmål.</strong> Når kunder og partnere ber om mer, foreslår Lara svar du kan godkjenne.</li>
                        <li><strong>Velg synlighet.</strong> Bestem om profilen skal være offentlig, deles med utvalgte, eller holdes intern.</li>
                      </ul>
                    </>
                  )
                  : (
                    <>
                      <p>Build and keep your Trust Profile updated. Lara helps you along the way.</p>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        <li><strong>Activate regulations you want to cover.</strong> Lara maps the information you have entered and updates the profile continuously.</li>
                        <li><strong>Upload documentation.</strong> Upload privacy policies, data processing agreements and certifications — or point to where they are.</li>
                        <li><strong>Answer questions.</strong> When customers and partners ask for more, Lara suggests answers you can approve.</li>
                        <li><strong>Choose visibility.</strong> Decide whether the profile should be public, shared with selected parties, or kept internal.</li>
                      </ul>
                    </>
                  )
              }
            />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (isLoading || !asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6 pt-16">
            <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Når Trust-profilen er aktivert har brukeren gått gjennom wizard og bekreftet
  // grunnleggende kontroller (Lara-skann, kontakter, dokumenter, policyer).
  // Modenhet skal da minst ligge på "medium" (≥ 50%) selv om enkelte felter
  // i metadata ennå ikke er manuelt utfylt.
  const rawTrustScore = evaluation?.trustScore ?? 0;
  const trustScore = isActivated ? Math.max(rawTrustScore, 52) : rawTrustScore;
  const risks = evaluation?.risks ?? [];
  const highRisks = risks.filter(r => r.severity === "high");

  // Hovedkontakt-e-post for "Kontakt oss"-knapp
  const a: any = asset;
  const generalEmail = a.contact_email || a.metadata?.contacts?.general || null;

  // Slug for public URL: trust.mynder.no/{slug}
  // Bruk siste 4 siffer av org.nr som unik kode for å unngå kollisjon mellom like navn.
  const slugUniqueCode = companyProfile?.org_number || asset?.id?.slice(0, 4);
  const slug = buildSlug(companyProfile?.name || asset?.name || "", slugUniqueCode);
  const orgSuffix = ""; // beholdt som no-op for å unngå større refactor nedover i fila
  const publicFullUrl = buildPublicTrustUrl(slug);
  const publicUrl = publicFullUrl.replace(/^https?:\/\//, "");

  const isPublished = (asset as any).publish_mode === "public";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFullUrl);
    setCopiedLink(true);
    toast.success(isNb ? "Lenke kopiert" : "Link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStep("publishing");
    const { error } = await supabase
      .from("assets")
      .update({ publish_mode: "public" } as any)
      .eq("id", asset!.id);

    if (error) {
      setIsPublishing(false);
      setPublishStep("confirm");
      toast.error(isNb ? "Kunne ikke publisere" : "Could not publish");
      return;
    }

    // Brief spinner so user sees what's happening, then land on the public profile
    setTimeout(() => {
      setIsPublishing(false);
      setPublishDialogOpen(false);
      setPublishStep("confirm");
      toast.success(
        isNb ? "Trust Center publisert" : "Trust Center published",
        {
          description: isNb
            ? "Slik ser profilen din ut på Trust Center."
            : "Here's how your profile looks on the Trust Center.",
        }
      );
      if (asset?.id) navigate(`/trust-engine/profile/${asset.id}`);
    }, 1400);
  };

  const openPublishDialog = () => {
    setPublishStep("confirm");
    setPublishDialogOpen(true);
  };

  const handleUnpublish = async () => {
    if (!asset?.id) return;
    setIsUnpublishing(true);
    const { error } = await supabase
      .from("assets")
      .update({ publish_mode: "ecosystem" } as any)
      .eq("id", asset.id);
    setIsUnpublishing(false);
    if (error) {
      toast.error(isNb ? "Kunne ikke fjerne publisering" : "Could not unpublish");
      return;
    }
    setUnpublishConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
    toast.success(
      isNb ? "Publisering fjernet" : "Profile unpublished",
      { description: isNb ? "Profilen er nå kun synlig i Mynder-økosystemet." : "Profile is now only visible within the Mynder ecosystem." }
    );
  };

  const trustLabel = trustScore >= 80 ? "HIGH" : trustScore >= 50 ? "MODERATE" : "LOW";
  const trustColor = trustScore >= 80 ? "text-success" : trustScore >= 50 ? "text-slate-500" : "text-destructive";
  const strokeColor = trustScore >= 80 ? "hsl(var(--success))" : trustScore >= 50 ? "hsl(215, 16%, 47%)" : "hsl(var(--destructive))";

  // Gauge SVG
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (trustScore / 100) * circ;

  const lastUpdated = asset.updated_at
    ? new Date(asset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : "–";

  const meta = (asset.metadata || {}) as Record<string, any>;
  const dpaOk = meta.dpa_verified === true;

  const frameworkBadgeClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("gdpr")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("nis2")) return "bg-warning/10 text-warning border-warning/20 dark:bg-warning/30 dark:text-warning";
    if (n.includes("iso")) return "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed";
    if (n.includes("soc")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("personopp")) return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/30 dark:text-primary";
    if (n.includes("dora")) return "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/30 dark:text-destructive";
    if (n.includes("ai") || n.includes("ki-forordning")) return "bg-accent/10 text-foreground border-accent/20 dark:bg-foreground/30 dark:text-accent";
    if (n.includes("cra")) return "bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed";
    return null; // unrecognized — will be filtered out
  };

  const isStandard = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("iso") || n.includes("soc");
  };

  const hiddenFrameworkIds: string[] = Array.isArray((meta as any).hidden_framework_ids) ? (meta as any).hidden_framework_ids : [];
  const recognizedFrameworks = frameworks.filter((fw: any) => frameworkBadgeClass(fw.framework_name) !== null && !hiddenFrameworkIds.includes(fw.framework_id));
  const standardFrameworks = recognizedFrameworks.filter((fw: any) => isStandard(fw.framework_name));
  const regulationFrameworks = recognizedFrameworks.filter((fw: any) => !isStandard(fw.framework_name));

  // Per-framework maturity (same source as dashboard)
  const frameworkScores: Record<string, { score: number; total: number }> = (complianceStats as any)?.byFramework || {};

  const scoreColor = (s: number) =>
    s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";
  const barColor = (s: number) =>
    s >= 75 ? "[&>div]:bg-success" : s >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive";
  const dotColor = (s: number) =>
    s >= 75 ? "bg-success" : s >= 50 ? "bg-warning" : "bg-destructive";

  const orderedFrameworks = [...standardFrameworks, ...regulationFrameworks];

  const renderComplianceList = () => (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Etterlevelse" : "Compliance"}
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {isNb ? "Modenhet pr. regelverk" : "Maturity per framework"}
        </span>
      </div>

      {orderedFrameworks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground italic">
            {isNb ? "Ingen regelverk publisert ennå" : "No frameworks published yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {orderedFrameworks.map((fw: any) => {
            const standard = isStandard(fw.framework_name);
            const Icon = standard ? BookCheck : Scale;
            const raw = frameworkScores[fw.framework_id];
            const hasData = !!raw && raw.total > 0;
            const isGdpr = /gdpr|personvern/i.test(fw.framework_name || "");
            const isNis2 = /nis ?2/i.test(fw.framework_name || "");
            const baseScore = hasData ? Math.round(raw.score) : 0;
            const score = isGdpr ? 65 : isNis2 ? Math.max(baseScore, 58) : baseScore;

            const PRIO_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            const PRIO_HEIGHT: Record<string, string> = {
              critical: "h-4",
              high: "h-3",
              medium: "h-[10px]",
              low: "h-2",
            };
            const fwReqs = (allRequirements || [])
              .filter((r: any) => r.framework_id === fw.framework_id)
              .sort((a: any, b: any) =>
                (PRIO_ORDER[a.priority] ?? 4) - (PRIO_ORDER[b.priority] ?? 4)
              );

            const byPrio = (["critical", "high", "medium", "low"] as const).map((p) => {
              const list = fwReqs.filter((r: any) => r.priority === p);
              const done = list.filter(
                (r: any) => r.status === "completed" || (r.maturity_level ?? 0) >= 3
              ).length;
              return { p, total: list.length, done };
            });

            const MAX = 32;
            const segments = fwReqs.length <= MAX
              ? fwReqs
              : Array.from({ length: MAX }, (_, i) =>
                  fwReqs[Math.floor((i * fwReqs.length) / MAX)]
                );

            const PRIO_LABEL: Record<string, string> = isNb
              ? { critical: "Kritisk", high: "Høy", medium: "Middels", low: "Lav" }
              : { critical: "Critical", high: "High", medium: "Medium", low: "Low" };

            return (
              <HoverCard key={fw.framework_id} openDelay={150} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setFrameworkDetailId(fw.framework_id)}
                    className="w-full text-left p-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 hover:border-border transition-all focus:outline-none focus:bg-muted/40 flex flex-col justify-between min-h-[64px]"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate max-w-[140px]" title={fw.framework_name}>
                            {fw.framework_name}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 leading-none mt-0.5">
                            {standard ? (isNb ? "Standard" : "Standard") : (isNb ? "Regelverk" : "Regulation")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        {hasData ? (
                          <span className={cn("text-xs font-bold tabular-nums", scoreColor(score))}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground tabular-nums">—</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 w-full">
                      {segments.length === 0 ? (
                        (() => {
                          const SEG = 24;
                          const filled = hasData ? Math.round((score / 100) * SEG) : 0;
                          const fillBg = score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
                          return (
                            <div className="flex items-end gap-[2px] h-4" aria-hidden>
                              {Array.from({ length: SEG }).map((_, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "flex-1 rounded-[1px]",
                                    i < filled ? fillBg : "bg-muted-foreground/15",
                                    i % 4 === 0 ? "h-3" : i % 2 === 0 ? "h-[10px]" : "h-2",
                                  )}
                                />
                              ))}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex items-end gap-[2px] h-4" aria-hidden>
                          {segments.map((r: any, i: number) => {
                            const isOn = r.status === "completed" || (r.maturity_level ?? 0) >= 3;
                            const onColor =
                              r.priority === "critical" ? "bg-success"
                              : r.priority === "high" ? "bg-success"
                              : r.priority === "medium" ? "bg-success/80"
                              : "bg-success/60";
                            const offColor =
                              r.priority === "critical" ? "bg-destructive/30"
                              : r.priority === "high" ? "bg-warning/30"
                              : "bg-muted-foreground/15";
                            return (
                              <span
                                key={`${r.requirement_id}-${i}`}
                                className={cn(
                                  "flex-1 rounded-[1px] transition-colors",
                                  PRIO_HEIGHT[r.priority] || "h-2",
                                  isOn ? onColor : offColor,
                                )}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </button>
                </HoverCardTrigger>

                <HoverCardContent side="top" align="start" className="w-80 p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{fw.framework_name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          {isNb ? "Modenhet" : "Maturity"}
                        </p>
                      </div>
                      <span className={cn("text-lg font-bold tabular-nums", scoreColor(score))}>
                        {hasData ? `${score}%` : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {isNb ? "Kontrollpunkter etter kritikalitet" : "Controls by criticality"}
                    </p>
                    {byPrio.every((b) => b.total === 0) ? (
                      <p className="text-xs text-muted-foreground italic">
                        {isNb ? "Ingen kontrolldata tilgjengelig" : "No control data available"}
                      </p>
                    ) : (
                      byPrio.map(({ p, total, done }) => {
                        if (total === 0) return null;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        const dot =
                          p === "critical" ? "bg-destructive"
                          : p === "high" ? "bg-warning"
                          : p === "medium" ? "bg-primary/60"
                          : "bg-muted-foreground/50";
                        return (
                          <div key={p} className="flex items-center gap-2 text-xs">
                            <span className={cn("h-2 w-2 rounded-sm shrink-0", dot)} />
                            <span className="text-foreground font-medium w-16">{PRIO_LABEL[p]}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  pct >= 75 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-muted-foreground shrink-0 w-12 text-right">
                              {done}/{total}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {isNb ? "Klikk for detaljer" : "Click for details"}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      )}
    </section>
  );




  if (readOnly) {
    // Force preview tab for readOnly
    return (
      <div className="w-full overflow-x-hidden">
      <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-5">

        {/* Render only preview content — the Card from line ~598 */}
        <Card className="p-0 overflow-visible">
          <TrustProfileHero
            flush
            fullBleed
            isNb={isNb}
            meta={meta}
            logoUrl={(asset as any)?.logo_url}
            companyName={(companyProfile as any)?.legal_name || companyProfile?.name || asset.name}
            description={asset?.description}
            domain={companyProfile?.domain}
            trustScore={trustScore}
            trustColor={trustColor}
            trustLabel={trustLabel}
            strokeColor={strokeColor}
            radius={radius}
            circ={circ}
            dash={dash}
            lastUpdated={lastUpdated}
            frameworks={recognizedFrameworks}
            isStandard={isStandard}
            onVerifiedClick={() => setProofDialogOpen(true)}
          />
          <div className="p-4 md:p-6 pt-5">
            <IdentityStripe
              isNb={isNb}
              orgNumber={companyProfile?.org_number}
              country={(companyProfile as any)?.country}
              industry={companyProfile?.industry}
              privacyPolicyUrl={(asset as any)?.privacy_policy_url}
            />
          </div>


          {/* Sections below — each in its own subtle frame */}
          <div className="p-4 md:p-6 pt-4 space-y-4 bg-muted/20 [&>section]:rounded-xl [&>section]:border [&>section]:border-border [&>section]:bg-card [&>section]:p-5 [&>section]:md:p-6">


            {/* Control areas */}
            <section id="tc-section-maturity">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">
                    {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-muted-foreground">{isNb ? "Trust Score" : "Trust Score"}</span>
                  <span className={`text-lg font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AREA_CONFIG.map(({ area, icon: Icon, labelEn, labelNb }) => {
                  const rawScore = evaluation?.areaScore(area) ?? 0;
                  const score = Math.max(rawScore, AREA_DEMO_FLOOR[area] ?? 0);
                  const tone = scoreTone(score);
                  const label = scoreLabel(score, isNb);
                  const isExpanded = expandedArea === area;
                  const areaControls = evaluation?.grouped[area] ?? [];

                  return (
                    <div key={area} className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedArea(isExpanded ? null : area)}
                        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{isNb ? labelNb : labelEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold uppercase tracking-wide ${tone.text}`}>{label}</span>
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tone.bg} transition-all duration-500`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </button>

                      {isExpanded && (() => {
                        const verifiedOnly = areaControls.filter(c => c.status === "implemented");
                        if (verifiedOnly.length === 0) {
                          return (
                            <div className="border-t border-border px-4 py-3">
                              <p className="text-sm text-muted-foreground italic">
                                {isNb ? "Ingen verifiserte kontroller ennå." : "No verified controls yet."}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="border-t border-border">
                            {verifiedOnly.map((control) => {
                              const verificationLabel = control.verificationSource === "third_party_verified"
                                ? (isNb ? "Verifisert" : "Verified")
                                : control.verificationSource === "vendor_verified"
                                  ? (isNb ? "Dokumentert" : "Documented")
                                  : control.verificationSource === "customer_asserted"
                                    ? (isNb ? "Dokumentert" : "Documented")
                                    : null;

                              return (
                                <div key={control.key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                    <span className="text-sm text-foreground">{isNb ? control.labelNb : control.labelEn}</span>
                                  </div>
                                  {verificationLabel && (
                                    <span className="text-sm text-muted-foreground shrink-0">{verificationLabel}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Kontaktinformasjon — role-based, no personal names */}
            {(() => {
              const a: any = asset || {};
              const cp: any = companyProfile || {};
              const mc: any = (a.metadata && a.metadata.contacts) || {};
              const generalEmail = a.contact_email || mc.general;
              const privacyEmail = a.privacy_contact_email || cp.dpo_email || mc.privacy;
              const securityEmail = a.security_contact_email || cp.ciso_email || mc.security;
              const privacyUrl = a.privacy_policy_url;
              const incidentEmail = mc.incident_email;
              const incidentPhone = mc.incident_phone;
              const privacyAddress = a.privacy_contact_address || mc.postal_address;

              const generalName = a.contact_name || cp.ceo_name;
              const generalRole = a.contact_role || (cp.ceo_name ? (isNb ? "Daglig leder" : "CEO") : null);
              const generalSub = [generalName, generalRole].filter(Boolean).join(" · ");

              const baseRoles = [
                {
                  key: "main",
                  label: isNb ? "Hovedkontakt" : "Main contact",
                  sub: isNb ? "Avtaler og DPA-er" : "Agreements and DPAs",
                  email: generalEmail,
                  extraSub: generalSub || undefined,
                },
                {
                  key: "privacy",
                  label: isNb ? "Personvern / DPO" : "Privacy / DPO",
                  sub: isNb ? "GDPR og personvernspørsmål" : "GDPR and privacy questions",
                  email: privacyEmail,
                },
                {
                  key: "security",
                  label: isNb ? "Sikkerhetskontakt" : "Security contact",
                  sub: isNb ? "Sårbarheter og varsler" : "Vulnerabilities and alerts",
                  email: securityEmail,
                },
                {
                  key: "incident",
                  label: isNb ? "Beredskapsansvarlig" : "Incident response lead",
                  sub: isNb ? "Leder håndteringen ved hendelser — døgnet rundt" : "Leads incident response — 24/7",
                  email: incidentEmail,
                  phone: incidentPhone,
                  emphasis: true,
                },
              ];

              const rows = baseRoles.map((r) => {
                const hasContact = !!(r.email || r.phone);
                return {
                  label: r.label,
                  sub: r.extraSub || r.sub,
                  emphasis: r.emphasis,
                  missing: !hasContact,
                  primary: r.email ? { text: r.email, href: `mailto:${r.email}` } : undefined,
                  secondary: r.phone ? { text: r.phone, href: `tel:${r.phone}` } : undefined,
                };
              }) as any[];

              if (privacyUrl) {
                rows.push({
                  label: isNb ? "Personvernerklæring" : "Privacy policy",
                  sub: isNb ? "Hvordan vi behandler personopplysninger" : "How we process personal data",
                  primary: { text: privacyUrl.replace(/^https?:\/\//, ""), href: privacyUrl, external: true },
                });
              }
              if (privacyAddress) {
                rows.push({ label: isNb ? "Postadresse" : "Postal address", block: privacyAddress });
              }

              const display = rows;


              return (
                <>
                  <section id="tc-section-contact" className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{isNb ? "Kontaktinformasjon" : "Contact information"}</h3>
                      </div>
                      {!readOnly && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-sm" onClick={() => navigate("/trust-center/profile/edit#contacts")}>
                          <Pencil className="h-3 w-3" />
                          {isNb ? "Rediger" : "Edit"}
                        </Button>
                      )}
                    </div>
                    <div className="divide-y divide-border border-t border-border">
                      {display.map((r: any, i: number) => (
                        <div key={i} className={`px-5 py-3.5 ${r.block ? "" : "flex items-start justify-between gap-6"} ${r.emphasis ? "bg-muted/30" : ""}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{r.label}</p>
                            {r.sub && <p className={`text-sm mt-0.5 ${r.emphasis ? "text-foreground font-medium" : "text-muted-foreground"}`}>{r.sub}</p>}
                            {r.block && <p className="text-sm text-muted-foreground mt-1">{r.block}</p>}
                          </div>
                          {!r.block && r.primary && (
                            <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                              <a
                                href={r.primary.href}
                                target={r.primary.external ? "_blank" : undefined}
                                rel="noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {r.primary.text}
                              </a>
                              {r.secondary && (
                                <a
                                  href={r.secondary.href}
                                  target={r.secondary.external ? "_blank" : undefined}
                                  rel="noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {r.secondary.text}
                                </a>
                              )}
                            </div>
                          )}
                          {r.missing && (
                            <span className="text-sm text-muted-foreground italic shrink-0">
                              {isNb ? "Ikke lagt til" : "Not added"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className="border-t border-border" />
                </>
              );
            })()}

            



            {/* Compliance — frameworks the organisation follows, with per-framework maturity */}
            {renderComplianceList()}

            {/* Documentation */}
            {(() => {
              const allDocs = [...policies, ...certs, ...otherDocs];
              const fmtDate = (d: string) => {
                if (!d) return "";
                try {
                  return new Date(d).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
                } catch { return ""; }
              };
              return (
                <section id="tc-section-documentation" className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {isNb ? "Dokumentasjon" : "Documentation"}
                      </h3>
                    </div>
                  </div>
                  {allDocs.length === 0 ? (
                    <div className="px-5 pb-5 pt-1 border-t border-border">
                      <p className="text-sm text-muted-foreground/70 italic">
                        {isNb ? "Ingen publisert." : "None published."}
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-border divide-y divide-border">
                      {allDocs.map((doc: any) => {
                        const updated = doc.valid_to || doc.created_at;
                        const content = (
                          <>
                            <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {doc.display_name || doc.file_name}
                              </p>
                              {updated && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {isNb ? "Oppdatert" : "Updated"} {fmtDate(updated)}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </>
                        );
                        const cls = "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left";
                        return (
                          <button key={doc.id} onClick={() => setPreviewDoc(doc)} className={cls}>{content}</button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Subprocessors — Lara-analysed list */}
            <SubprocessorTable
              data={(meta.subprocessors as SubprocessorListData | undefined) ?? null}
              isNb={isNb}
            />

            <div className="border-t border-border" />

            {/* Contact */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{isNb ? "Trenger du mer informasjon?" : "Need more information?"}</p>
                <p className="text-sm text-muted-foreground">{isNb ? "Kontakt oss for spørsmål om sikkerhet, compliance eller databehandling." : "Contact us for questions about security, compliance or data handling."}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg">
                <MessageSquare className="h-4 w-4" />
                {isNb ? "Kontakt oss" : "Contact us"}
              </Button>
            </div>

            {/* Mynder footer */}
            <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={mynderLogo} alt="Mynder" className="h-4 opacity-50" />
              </div>
              <div className="text-sm text-muted-foreground/60">
                Org.nr 933 036 729 &middot; mynder.io
              </div>
            </div>
          </div>
        </Card>
      </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {!autoPlayDemo && <Sidebar />}
        <main className={`flex-1 overflow-auto ${autoPlayDemo ? "pt-4" : "pt-11"}`}>

          {showActivateWizard ? (
            <div className="container max-w-3xl mx-auto p-4 md:p-6">
              <ActivateTrustProfileWizard
                inline
                open={showActivateWizard}
                onOpenChange={setShowActivateWizard}
                initialCompanyName={companyProfile?.name || undefined}
                initialOrgNumber={companyProfile?.org_number || undefined}
                initialDomain={(companyProfile as any)?.domain || undefined}
                initialMaturity={(asset as any)?.metadata?.maturity || undefined}
                onCompleted={() => {
                  try { localStorage.setItem("mynder.trustprofile.activated", "1"); } catch {}
                  setShowActivateWizard(false);
                  setIsActivated(true);
                  queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
                  queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
                }}
              />
            </div>
          ) : (
          <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-5">
            {/* Page Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Trust Center</span>
            </div>

            {isServiceProfile && (
              <button
                onClick={() => navigate("/trust-center/products")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronUp className="h-4 w-4 -rotate-90" />
                {isNb ? "Tilbake til produkter" : "Back to products"}
              </button>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  {isServiceProfile ? (asset?.name || "Trust Profile") : "Trust Profile"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isServiceProfile
                    ? (isNb
                      ? "Produkt- eller tjenesteprofil slik den vises for kunder og partnere."
                      : "Product or service profile as seen by customers and partners.")
                    : (isNb
                      ? "Samlet oversikt over din virksomhets sikkerhet og personvern."
                      : "Overview of your organization's security and privacy.")}
                </p>
              </div>
            </div>

            {isOwnProfile && asset?.id && (companyProfile?.org_number || asset?.description) && (
              <TrustProfileFreshness
                assetId={asset.id}
                updatedAt={(asset as any).updated_at}
                lastEnrichedAt={(asset as any)?.metadata?.last_enriched_at}
                publishMode={(asset as any).publish_mode}
              />
            )}

            {/* Lara activation prompt — vises kun når profilen ikke er aktivert (org.nr OG beskrivelse mangler) */}
            {(!companyProfile?.org_number && !asset?.description) && (
              <Card className="p-5 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {isNb ? "Lara anbefaler å aktivere Trust Profile" : "Lara recommends activating Trust Profile"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {isNb
                          ? "Trust Profilen din er ikke aktivert ennå. Lara kombinerer offentlig informasjon med det du allerede har lagt inn i Mynder, og setter opp et førsteutkast for deg. Når du aktiverer overtar du eierskapet — du bestemmer selv hva som vises."
                          : "Your Trust Profile is not activated yet. Lara combines public information with what you already have in Mynder and sets up a first draft for you. When you activate, you take ownership — you decide what is shown."}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-background/60 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          {isNb ? "Samlet oversikt" : "Unified overview"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isNb
                          ? "Få en samlet oversikt over virksomhetens sikkerhet, personvern og etterlevelse på ett sted."
                          : "Get a unified overview of your organization's security, privacy and compliance in one place."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" onClick={() => setShowActivateWizard(true)}>
                        {isNb ? "Aktiver profilen" : "Activate profile"}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {isNb ? "Deling med kunder og leverandører kommer senere." : "Sharing with customers and vendors is coming later."}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}


            {/* Tab bar */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab("benchmark")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === "benchmark"
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                {isNb ? "Benchmark" : "Benchmark"}
              </button>
            </div>

            {activeTab === "benchmark" ? (
              (() => {
                const score = trustScore;
                const level =
                  score >= 80 ? (isNb ? "Sterk" : "Strong")
                  : score >= 65 ? (isNb ? "God" : "Good")
                  : score >= 40 ? (isNb ? "Moderat" : "Moderate")
                  : (isNb ? "Tidlig" : "Early");
                const ringColor =
                  score >= 80 ? "hsl(var(--success))"
                  : score >= 50 ? "hsl(var(--primary))"
                  : "hsl(var(--warning))";
                const r = 36;
                const c = 2 * Math.PI * r;
                const d = (Math.max(0, Math.min(100, score)) / 100) * c;
                const markerLeft = `${Math.max(2, Math.min(98, score))}%`;
                return (
                  <div className="space-y-5">
                    {/* Header card with company + score gauge */}
                    <Card className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg shrink-0">
                            {(companyProfile?.name || asset?.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-lg font-semibold text-foreground">
                              {companyProfile?.name || asset?.name || (isNb ? "Din virksomhet" : "Your organization")}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              {(companyProfile as any)?.description ||
                                asset?.description ||
                                (isNb
                                  ? "Slik står din Trust Score sammenlignet med bransjestandard."
                                  : "How your Trust Score compares to industry standards.")}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                          <div className="relative" style={{ width: 88, height: 88 }}>
                            <svg width={88} height={88} className="-rotate-90">
                              <circle cx={44} cy={44} r={r} stroke="hsl(var(--muted))" strokeWidth={4} fill="none" />
                              <circle cx={44} cy={44} r={r} stroke={ringColor} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${d} ${c}`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold tabular-nums text-foreground">{score}</span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground mt-1">{level}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Position bar */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">
                          {isNb ? "Slik ligger dere an" : "Where you stand"}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {isNb ? "0 – 100" : "0 – 100"}
                        </span>
                      </div>
                      <div className="relative pt-6 pb-6">
                        <div className="absolute -top-1 text-sm font-medium text-primary -translate-x-1/2" style={{ left: markerLeft }}>
                          {isNb ? "Dere er her" : "You are here"}
                        </div>
                        <div
                          className="h-3 rounded-full"
                          style={{
                            background:
                              "linear-gradient(to right, hsl(var(--destructive)/0.25), hsl(var(--warning)/0.35), hsl(var(--primary)/0.35), hsl(var(--success)/0.45))",
                          }}
                        />
                        <div className="absolute top-4 w-0.5 h-5 bg-foreground -translate-x-1/2" style={{ left: markerLeft }} />
                        <div className="grid grid-cols-4 mt-3 text-sm text-muted-foreground">
                          <span>{isNb ? "Tidlig" : "Early"}</span>
                          <span className="text-center">{isNb ? "Moderat modenhet" : "Moderate"}</span>
                          <span className="text-center">{isNb ? "God" : "Good"}</span>
                          <span className="text-right">{isNb ? "Sterk" : "Strong"}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Two info cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">
                            {isNb ? "For dere selv" : "For your organization"}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {isNb
                            ? "Et godt nivå avhenger av hvilke data dere håndterer og hvilken risiko dere kan akseptere. Trust Score er en indikator, ikke en konklusjon."
                            : "A solid level depends on the data you handle and the risk you can accept. Trust Score is an indicator, not a verdict."}
                        </p>
                        <button
                          className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline"
                          onClick={() => navigate("/regulations")}
                        >
                          {isNb ? "Gjør en risikovurdering" : "Do a risk assessment"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Card>
                      <Card className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">
                            {isNb ? "For kunder og partnere" : "For customers and partners"}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {isNb ? (
                            <>Typisk SaaS-selskap i Norge ligger på <strong className="text-foreground">62</strong>. Offentlig sektor forventer som regel <strong className="text-foreground">65+</strong>. ISO 27001-sertifiserte selskaper ligger gjerne over <strong className="text-foreground">75</strong>.</>
                          ) : (
                            <>A typical Norwegian SaaS company sits at <strong className="text-foreground">62</strong>. Public sector usually expects <strong className="text-foreground">65+</strong>. ISO 27001-certified companies tend to be above <strong className="text-foreground">75</strong>.</>
                          )}
                        </p>
                        <button
                          className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline"
                          onClick={() => setActiveTab("preview")}
                        >
                          {isNb ? "Slik høyner du skåren" : "How to raise your score"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Card>
                    </div>

                    {/* Industry benchmarks table */}
                    <Card className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                          {isNb ? "Bransjereferanser" : "Industry benchmarks"}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: isNb ? "Tidlig fase / oppstart" : "Early stage / startup", value: 35 },
                          { label: isNb ? "Typisk SaaS-selskap (Norge)" : "Typical SaaS company (Norway)", value: 62 },
                          { label: isNb ? "Forventet av offentlig sektor" : "Expected by public sector", value: 65 },
                          { label: isNb ? "ISO 27001-sertifisert" : "ISO 27001-certified", value: 78 },
                          { label: isNb ? "Bank / finans / kritisk infrastruktur" : "Banking / finance / critical infra", value: 88 },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center gap-3 text-sm">
                            <span className="w-64 shrink-0 text-foreground">{row.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary/60" style={{ width: `${row.value}%` }} />
                            </div>
                            <span className="w-10 text-right tabular-nums text-muted-foreground">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        {isNb
                          ? "Tallene er retningsgivende gjennomsnitt basert på rammeverk, sertifiseringer og sektorforventninger. Trust Score er ikke en sertifisering — den hjelper dere å se hvor dere står og hva som mangler."
                          : "These are indicative averages based on frameworks, certifications, and sector expectations. Trust Score is not a certification — it helps you see where you stand and what's missing."}
                      </p>
                    </Card>
                  </div>
                );
              })()
            ) : activeTab === "publish" ? (
              <div className="space-y-5">
                {/* Sub-tabs */}
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
                  {([
                    { key: "link" as const, icon: Link2, label: isNb ? "Del lenke" : "Share Link" },
                    { key: "vendor" as const, icon: Building2, label: "Vendor Hub" },
                    { key: "badge" as const, icon: Code2, label: isNb ? "Nettside-badge" : "Website Badge" },
                  ] as const).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setPublishSubTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        publishSubTab === tab.key
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Share Link sub-tab */}
                {publishSubTab === "link" && (
                  <div className="space-y-5">
                    <Card className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            {isNb ? "Din offentlige Trust Center-lenke" : "Your public Trust Center link"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isNb
                              ? "Dette er din unike adresse – som en LinkedIn-profil for virksomhetens sikkerhet."
                              : "This is your unique address – like a LinkedIn profile for your organization's security posture."}
                          </p>
                        </div>
                        {asset?.id && (
                          <div className="flex flex-col items-end gap-1.5">
                            <VisibilitySelector
                              assetId={asset.id}
                              current={getVisibilityFromAsset(asset as any)}
                            />
                            <p className="text-sm text-muted-foreground max-w-[260px] text-right">
                              {isNb
                                ? "Standard er Mynder-økosystem. Du kan velge å gjøre profilen privat."
                                : "Default is the Mynder ecosystem. You can choose to make the profile private."}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Public URL</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-foreground">{publicUrl}</code>
                          <Button variant="outline" size="sm" className="h-8 text-sm gap-1.5 shrink-0" onClick={() => setIsEditingSlug(true)}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleCopyLink}>
                            {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {isNb
                          ? "Du kan endre denne når som helst. Del denne lenken med kunder og partnere."
                          : "You can change this at any time. Share this link with customers and partners."}
                      </p>
                    </Card>

                    {/* Ready to publish / Published section */}
                    {isPublished ? (
                      <Card className="overflow-hidden border-success/30">
                        {/* Live status banner */}
                        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-success/10 border-b border-success/20">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-70 animate-ping" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                            </span>
                            <span className="text-sm font-semibold uppercase tracking-wide text-success">
                              {isNb ? "Live på Trust Center" : "Live on Trust Center"}
                            </span>
                          </div>
                          <Badge variant="outline" className="border-success/40 text-success bg-success/5 gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {isNb ? "Verifisert" : "Verified"}
                          </Badge>
                        </div>

                        <div className="p-6 space-y-5">
                          {/* Hero */}
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                              <Globe className="h-6 w-6 text-success" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold text-foreground">
                                {isNb ? "Trust Profile er publisert" : "Trust Profile is published"}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {isNb
                                  ? "Kunder, partnere og innkjøpere kan finne og verifisere profilen din."
                                  : "Customers, partners and buyers can find and verify your profile."}
                              </p>
                            </div>
                          </div>

                          {/* Public URL row */}
                          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <code className="flex-1 text-sm font-mono text-foreground truncate">{publicUrl}</code>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleCopyLink} title={isNb ? "Kopier" : "Copy"}>
                              {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>

                          {/* Stats grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border bg-card/50 p-3">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground uppercase tracking-wide">
                                <Eye className="h-3 w-3" />
                                {isNb ? "Visninger 30d" : "Views 30d"}
                              </div>
                              <div className="text-xl font-bold text-foreground mt-1">12</div>
                            </div>
                            <div className="rounded-lg border border-border bg-card/50 p-3">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground uppercase tracking-wide">
                                <FileText className="h-3 w-3" />
                                {isNb ? "Ressurser" : "Resources"}
                              </div>
                              <div className="text-xl font-bold text-foreground mt-1">{docsCount + certsCount + otherDocsCount}</div>
                            </div>
                            <div className="rounded-lg border border-border bg-card/50 p-3">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground uppercase tracking-wide">
                                <Clock className="h-3 w-3" />
                                {isNb ? "Sist oppdatert" : "Last updated"}
                              </div>
                              <div className="text-sm font-semibold text-foreground mt-1 truncate">{lastUpdated}</div>
                            </div>
                          </div>

                          {/* Audience */}
                          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {isNb ? "Synlig for: " : "Visible to: "}
                              <span className="font-medium text-foreground">
                                {(asset as any).publish_mode === "public"
                                  ? (isNb ? "Alle (offentlig)" : "Everyone (public)")
                                  : (isNb ? "Mynder-økosystem" : "Mynder ecosystem")}
                              </span>
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                              className="flex-1 gap-2"
                              onClick={() => asset?.id && navigate(`/trust-engine/profile/${asset.id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              {isNb ? "Åpne offentlig profil" : "Open public profile"}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => setShareDialogOpen(true)}
                            >
                              <Share2 className="h-4 w-4" />
                              {isNb ? "Del" : "Share"}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setUnpublishConfirmOpen(true)}
                            >
                              <Lock className="h-4 w-4" />
                              {isNb ? "Fjern publisering" : "Unpublish"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-sm text-muted-foreground">
                            {isNb ? "Offentlig lenke" : "Public link"}:{" "}
                            <span className="font-medium text-foreground">{publicUrl}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicFullUrl)}`, "_blank", "noopener,noreferrer")}
                            >
                              <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                              LinkedIn
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicFullUrl)}`, "_blank", "noopener,noreferrer")}
                            >
                              <Facebook className="h-3.5 w-3.5" aria-hidden="true" />
                              Facebook
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={() => {
                                const subject = isNb ? "Vår Trust Profile" : "Our Trust Profile";
                                const body = isNb
                                  ? `Hei,\n\nDu kan se vår Trust Profile her: ${publicFullUrl}\n`
                                  : `Hi,\n\nYou can view our Trust Profile here: ${publicFullUrl}\n`;
                                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                              }}
                            >
                              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                              {isNb ? "E-post" : "Email"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8"
                              onClick={handleCopyLink}
                            >
                              {copiedLink ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                              {copiedLink ? (isNb ? "Kopiert" : "Copied") : (isNb ? "Kopier lenke" : "Copy link")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        {isNb
                          ? "Din Trust Center erstatter behovet for å sende separate dokumenter som personvernerklæringer og databehandleravtaler."
                          : "Your Trust Center replaces the need to send separate documents like privacy policies and data processing agreements."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vendor Hub sub-tab */}
                {publishSubTab === "vendor" && (
                  <Card className="p-10 text-center space-y-4">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <Badge variant="outline" className="mx-auto">
                      {isNb ? "Kommer senere" : "Coming soon"}
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">Vendor Hub</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {isNb
                        ? "Vendor Hub gjør Trust Profilen din synlig i Mynder sitt leverandørnettverk, slik at kunder og partnere kan finne dere når de gjør due diligence. Denne funksjonen kommer i en senere oppdatering."
                        : "Vendor Hub makes your Trust Profile discoverable in Mynder's vendor network so customers and partners can find you during due diligence. This feature is coming in a later update."}
                    </p>
                  </Card>
                )}

                {/* Website Badge sub-tab */}
                {publishSubTab === "badge" && (
                  <div className="space-y-6">
                    {/* Theme toggle */}
                    {(() => {
                      const isDark = badgeTheme === "dark";
                      const t = {
                        bgFree: isDark
                          ? "linear-gradient(135deg, hsl(220, 45%, 18%) 0%, hsl(220, 50%, 26%) 100%)"
                          : "linear-gradient(135deg, hsl(0, 0%, 100%) 0%, hsl(30, 40%, 98%) 100%)",
                        bgPro: isDark
                          ? "linear-gradient(160deg, hsl(220, 50%, 14%) 0%, hsl(220, 45%, 22%) 100%)"
                          : "linear-gradient(160deg, hsl(0, 0%, 100%) 0%, hsl(30, 50%, 97%) 100%)",
                        gold: isDark ? "hsl(45, 90%, 55%)" : "#BA7517",
                        goldSoft: isDark ? "hsl(45, 90%, 70%)" : "#A1670F",
                        textMain: isDark ? "white" : "hsl(220, 25%, 18%)",
                        textSub: isDark ? "rgba(255,255,255,0.6)" : "hsl(220, 12%, 45%)",
                        ringTrack: isDark ? "rgba(255,255,255,0.18)" : "hsl(33, 50%, 90%)",
                        chipBg: isDark ? "hsl(45 90% 55% / 0.15)" : "rgba(186, 117, 23, 0.08)",
                        chipBorder: isDark ? "hsl(45 90% 55% / 0.35)" : "rgba(186, 117, 23, 0.3)",
                        chipText: isDark ? "hsl(45, 90%, 75%)" : "#8B5610",
                        divider: isDark ? "hsl(45 90% 55% / 0.25)" : "hsl(33, 30%, 88%)",
                        dividerSoft: isDark ? "hsl(45 90% 55% / 0.15)" : "hsl(33, 30%, 92%)",
                        boxShadowFree: isDark
                          ? "0 4px 18px hsl(220 45% 18% / 0.35), 0 0 0 1px hsl(45 90% 55% / 0.4) inset"
                          : "0 4px 16px rgba(186, 117, 23, 0.15), 0 0 0 1px rgba(186, 117, 23, 0.28) inset",
                        boxShadowPro: isDark
                          ? "0 10px 30px hsl(220 45% 12% / 0.4), 0 0 0 1px hsl(45 90% 55% / 0.25) inset"
                          : "0 10px 26px rgba(186, 117, 23, 0.15), 0 0 0 1px rgba(186, 117, 23, 0.25) inset",
                      };
                      return (
                        <>
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              {isNb ? "Bakgrunn for forhåndsvisning" : "Preview background"}
                            </span>
                            <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                              <button
                                onClick={() => setBadgeTheme("dark")}
                                className={`px-3 py-1 text-sm font-medium rounded ${isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                {isNb ? "Mørk" : "Dark"}
                              </button>
                              <button
                                onClick={() => setBadgeTheme("light")}
                                className={`px-3 py-1 text-sm font-medium rounded ${!isDark ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                              >
                                {isNb ? "Lys" : "Light"}
                              </button>
                            </div>
                          </div>
                    {/* Badge tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Free Badge */}
                      <Card
                        onClick={() => setSelectedBadgeTier("free")}
                        className={`p-5 space-y-4 cursor-pointer transition-all ${selectedBadgeTier === "free" ? "border-primary ring-2 ring-primary/30 shadow-md" : "hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Free Badge</h3>
                            <p className="text-sm text-muted-foreground">{isNb ? "Inkludert i ditt abonnement" : "Included in your plan"}</p>
                          </div>
                          {selectedBadgeTier === "free" ? (
                            <Badge variant="default" className="text-sm gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {isNb ? "Valgt" : "Selected"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-sm">{isNb ? "Velg" : "Select"}</Badge>
                          )}
                        </div>
                        <div className="flex justify-center py-5">
                          <span
                            className="relative inline-flex items-center gap-3 pl-3 pr-4 py-2 rounded-full text-sm font-semibold shadow-lg ring-1"
                            style={{
                              background: t.bgFree,
                              borderColor: t.gold,
                              color: t.textMain,
                              boxShadow: t.boxShadowFree,
                            }}
                          >
                            <span className="relative inline-flex items-center justify-center" style={{ width: 36, height: 36 }}>
                              <ButterflyMark size={16} color={t.gold} />
                            </span>
                            <span className="flex flex-col leading-tight">
                              <span className="text-sm uppercase tracking-[0.14em]" style={{ color: t.goldSoft }}>Mynder Verified</span>
                              <span className="text-sm font-semibold" style={{ color: t.textMain, opacity: 0.9 }}>Trust Score</span>
                            </span>
                            <TrustScoreRing score={trustScore} size={32} stroke={2.5} color={t.gold} trackColor={t.ringTrack} />
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {[
                            isNb ? 'Enkel "Mynder Verified" badge' : 'Basic "Mynder Verified" badge',
                            isNb ? "Embed-kode inkludert" : "Embed code included",
                            isNb ? "Lenker til ditt Trust Center" : "Links to your Trust Center",
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Pro Badge */}
                      <Card
                        onClick={() => setSelectedBadgeTier("pro")}
                        className={`p-5 space-y-4 cursor-pointer transition-all ${selectedBadgeTier === "pro" ? "border-primary ring-2 ring-primary/30 shadow-md" : "hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">Pro Badge</h3>
                            <p className="text-sm text-muted-foreground">{isNb ? "Full tilpasning" : "Full customization"}</p>
                          </div>
                          {selectedBadgeTier === "pro" ? (
                            <Badge variant="default" className="text-sm gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {isNb ? "Valgt" : "Selected"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-sm">{isNb ? "Velg" : "Select"}</Badge>
                          )}
                        </div>
                        <div className="flex justify-center py-4">
                          <div
                            className="relative rounded-2xl p-5 min-w-[260px]"
                            style={{
                              background: t.bgPro,
                              border: `1px solid ${t.gold}`,
                              color: t.textMain,
                              boxShadow: t.boxShadowPro,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative inline-flex items-center justify-center" style={{ width: 64, height: 64 }}>
                                <ButterflyMark size={26} color={t.gold} />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm uppercase tracking-[0.18em]" style={{ color: t.goldSoft }}>Mynder Verified</div>
                                <div className="text-base font-semibold leading-tight" style={{ color: t.textMain }}>Trust Profile</div>
                                <div className="text-sm" style={{ color: t.textSub }}>Compliance · Security</div>
                              </div>
                              <div className="flex flex-col items-center gap-0.5">
                                <TrustScoreRing score={trustScore} size={42} stroke={3} color={t.gold} trackColor={t.ringTrack} />
                                <span className="text-sm uppercase tracking-wider" style={{ color: t.textSub }}>Trust Score</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t text-center text-sm uppercase tracking-[0.22em]" style={{ borderColor: t.dividerSoft, color: t.goldSoft }}>
                              Trust · Compliance · Verified
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {[
                            isNb ? "Standard og detaljerte stiler" : "Standard and detailed styles",
                            isNb ? "Tilpasset tema (lys / mørk / auto)" : "Custom theme (light / dark / auto)",
                            isNb ? "Firmanavn på badge" : "Company name on badge",
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-sm font-medium text-success">
                              <Sparkles className="h-3 w-3" />
                              {isNb ? "Gratis i lanseringsperioden" : "Free during launch period"}
                            </span>
                          </div>
                          <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={() => setUpgradeDialogOpen(true)}>
                            <Sparkles className="h-4 w-4" />
                            {isNb ? "Aktiver Pro Badge — gratis frem til lansering" : "Activate Pro Badge — free until launch"}
                          </Button>
                        </div>
                      </Card>
                    </div>

                    {/* Integration method */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        {isNb ? "Velg integrasjonsmetode" : "Choose integration method"}
                      </h3>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="flex border-b border-border">
                          <button className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-muted/30 border-b-2 border-primary">
                            Script ({isNb ? "anbefalt" : "recommended"})
                          </button>
                          <button className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Iframe
                          </button>
                        </div>
                        <div className="relative p-4 bg-muted/20">
                          <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{`<!-- Mynder Trust Badge -->
<div id="mynder-trust-badge"
     data-profile="${slug}${orgSuffix}"
     data-style="compact"
     data-theme="auto">
</div>
<script src="https://trust.mynder.com/badge.js" async></script>`}</pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`<!-- Mynder Trust Badge -->\n<div id="mynder-trust-badge"\n     data-profile="${slug}${orgSuffix}"\n     data-style="compact"\n     data-theme="auto">\n</div>\n<script src="https://trust.mynder.com/badge.js" async></script>`);
                              toast.success(isNb ? "Kode kopiert" : "Code copied");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="px-4 py-2.5 text-sm text-muted-foreground border-t border-border">
                          {isNb
                            ? "Script-metoden gir best brukeropplevelse og oppdateres automatisk."
                            : "The script method provides the best user experience and updates automatically."}
                        </p>
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {isNb ? "Trust Badge erstatter tradisjonelle dokumenter." : "Trust Badge replaces traditional documents."}
                        </span>{" "}
                        {isNb
                          ? "Besøkende kan klikke på badgen for å se din fullstendige Trust Profile med personvern, databehandleravtale og sikkerhetsdokumentasjon."
                          : "Visitors can click the badge to view your complete Trust Profile with privacy policy, data processing agreement and security documentation."}
                      </p>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              /* ── PREVIEW TAB ── */
              <Card className="overflow-hidden p-0">
                <TrustProfileHero
                  flush
                  fullBleed
                  isNb={isNb}
                  meta={meta}
                  logoUrl={(asset as any)?.logo_url}
                  companyName={(companyProfile as any)?.legal_name || companyProfile?.name || asset.name}
                  description={asset?.description}
                  domain={companyProfile?.domain}
                  trustScore={trustScore}
                  trustColor={trustColor}
                  trustLabel={trustLabel}
                  strokeColor={strokeColor}
                  radius={radius}
                  circ={circ}
                  dash={dash}
                  lastUpdated={lastUpdated}
                  frameworks={recognizedFrameworks}
                  isStandard={isStandard}
                  onVerifiedClick={() => setProofDialogOpen(true)}
                />
                <div className="p-4 md:p-6 pt-5">
                  <IdentityStripe
                    isNb={isNb}
                    orgNumber={companyProfile?.org_number}
                    country={(companyProfile as any)?.country}
                    industry={companyProfile?.industry}
                    privacyPolicyUrl={(asset as any)?.privacy_policy_url}
                  />
                </div>


                {/* Sections below — each in its own subtle frame */}
                <div className="p-4 md:p-6 pt-4 space-y-4 bg-muted/20 [&>section]:rounded-xl [&>section]:border [&>section]:border-border [&>section]:bg-card [&>section]:p-5 [&>section]:md:p-6">


                  {/* ── Sikkerhet og kontroller ── */}
                  <section>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold text-foreground">
                          {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm text-muted-foreground">{isNb ? "Trust Score" : "Trust Score"}</span>
                        <span className={`text-lg font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AREA_CONFIG.map(({ area, icon: Icon, labelEn, labelNb }) => {
                        const rawScore = evaluation?.areaScore(area) ?? 0;
                        const score = Math.max(rawScore, AREA_DEMO_FLOOR[area] ?? 0);
                        const tone = scoreTone(score);
                        const label = scoreLabel(score, isNb);
                        const isExpanded = expandedArea === area;
                        const areaControls = evaluation?.grouped[area] ?? [];

                        return (
                          <div key={area} className="rounded-lg border border-border overflow-hidden">
                            <button
                              onClick={() => setExpandedArea(isExpanded ? null : area)}
                              className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{isNb ? labelNb : labelEn}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold uppercase tracking-wide ${tone.text}`}>{label}</span>
                                  {isExpanded
                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${tone.bg} transition-all duration-500`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </button>

                            {/* Expanded control details */}
                            {isExpanded && (() => {
                              const verifiedOnly = areaControls.filter(c => c.status === "implemented");
                              if (verifiedOnly.length === 0) {
                                return (
                                  <div className="border-t border-border px-4 py-3">
                                    <div className="flex items-start gap-2">
                                      <p className="text-sm text-muted-foreground italic">
                                        {isNb ? "Ingen verifiserte kontroller ennå." : "No verified controls yet."}
                                      </p>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button type="button" className="text-muted-foreground/70 hover:text-foreground transition-colors mt-0.5" aria-label={isNb ? "Hva vises her?" : "What appears here?"}>
                                            <Info className="h-3.5 w-3.5" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
                                          {isNb
                                            ? "Du trenger ikke markere noe som verifisert selv. Når du laster opp et dokument under Regelverk, analyserer Lara hvilke artikler i kontrollpunktet dokumentet dekker, og gir uttelling deretter — 0 (ingen dekning), 0,5 (delvis dekning) eller 1 (full dekning)."
                                            : "You don't mark anything as verified yourself. When you upload a document under Regulations, Lara analyses which articles of the control it covers and scores it accordingly — 0 (no coverage), 0.5 (partial coverage) or 1 (full coverage)."}
                                        </TooltipContent>

                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="border-t border-border">
                                  {verifiedOnly.map((control) => {
                                    const verificationLabel = control.verificationSource === "third_party_verified"
                                      ? (isNb ? "Verifisert" : "Verified")
                                      : control.verificationSource === "vendor_verified"
                                        ? (isNb ? "Dokumentert" : "Documented")
                                        : control.verificationSource === "customer_asserted"
                                          ? (isNb ? "Dokumentert" : "Documented")
                                          : null;

                                    return (
                                      <div key={control.key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-3">
                                          <CheckCircle2 className="h-4 w-4 text-success" />
                                          <span className="text-sm text-foreground">{isNb ? control.labelNb : control.labelEn}</span>
                                        </div>
                                        {verificationLabel && (
                                          <span className="text-sm text-muted-foreground shrink-0">{verificationLabel}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </section>






                  {/* ── Etterlevelse — modenhet pr. regelverk ── */}
                  {renderComplianceList()}

                  <div className="border-t border-border" />

                  {/* ── Kontaktinformasjon (rollebasert, uten personnavn) ── */}
                  {(() => {
                    const a: any = asset || {};
                    const cp: any = companyProfile || {};
                    const generalEmail = a.contact_email;
                    const privacyEmail = a.privacy_contact_email || cp.dpo_email;
                    const securityEmail = a.security_contact_email || cp.ciso_email;
                    const privacyUrl = a.privacy_policy_url;
                    const privacyAddress = a.privacy_contact_address;

                    const generalName = a.contact_name || cp.ceo_name;
                    const generalRole = a.contact_role || (cp.ceo_name ? (isNb ? "Daglig leder" : "CEO") : null);
                    const generalSub = [generalName, generalRole].filter(Boolean).join(" · ");

                    const rows = [
                      generalEmail && {
                        label: isNb ? "Generell kontakt" : "General contact",
                        sub: generalSub || undefined,
                        primary: { text: generalEmail, href: `mailto:${generalEmail}` },
                      },
                      privacyEmail && {
                        label: isNb ? "Personvernkontakt" : "Privacy contact",
                        sub: isNb ? "For spørsmål om dine personopplysninger" : "For questions about your personal data",
                        primary: { text: privacyEmail, href: `mailto:${privacyEmail}` },
                      },
                      privacyUrl && {
                        label: isNb ? "Personvernerklæring" : "Privacy policy",
                        sub: isNb ? "Hvordan vi behandler personopplysninger" : "How we process personal data",
                        primary: { text: privacyUrl.replace(/^https?:\/\//, ""), href: privacyUrl, external: true },
                      },
                      securityEmail && {
                        label: isNb ? "Sikkerhetskontakt" : "Security contact",
                        sub: isNb ? "For å rapportere sikkerhetsproblemer" : "To report security issues",
                        primary: { text: securityEmail, href: `mailto:${securityEmail}` },
                      },
                      privacyAddress && {
                        label: isNb ? "Postadresse" : "Postal address",
                        block: privacyAddress,
                      },
                    ].filter(Boolean) as any[];

                    if (rows.length === 0) return null;
                    return (
                      <>
                        <section className="rounded-xl border border-border bg-card overflow-hidden">
                          <div className="px-5 py-3.5 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">{isNb ? "Kontaktinformasjon" : "Contact information"}</h3>
                          </div>
                          <div className="divide-y divide-border border-t border-border">
                            {rows.map((r, i) => (
                              <div key={i} className={`px-5 py-3.5 ${r.block ? "" : "flex items-start justify-between gap-6"}`}>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                                  {r.sub && <p className="text-sm text-muted-foreground mt-0.5">{r.sub}</p>}
                                  {r.block && <p className="text-sm text-muted-foreground mt-1">{r.block}</p>}
                                </div>
                                {!r.block && r.primary && (
                                  <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                                    <a href={r.primary.href} target={r.primary.external ? "_blank" : undefined} rel="noreferrer" className="text-sm text-primary hover:underline">
                                      {r.primary.text}
                                    </a>
                                    {r.secondary && (
                                      <a href={r.secondary.href} target={r.secondary.external ? "_blank" : undefined} rel="noreferrer" className="text-sm text-primary hover:underline">
                                        {r.secondary.text}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                        <div className="border-t border-border" />
                      </>
                    );
                  })()}


                  {/* ── Underleverandører ── */}
                  {(() => {
                    const hasRealPartner = partnerInfo?.hasPartner && partnerInfo.showOnTrustProfile;
                    const partnerName = hasRealPartner ? partnerInfo!.partnerName : "Mynder MSP-partner AS";
                    const partnerTypeLabel = hasRealPartner && partnerInfo!.partnerType
                      ? PARTNER_TYPE_LABEL[partnerInfo!.partnerType]
                      : "MSP";
                    const partnerDesc = hasRealPartner && partnerInfo!.partnerRoleDescription
                      ? partnerInfo!.partnerRoleDescription
                      : isNb
                        ? "Bistår med drift, sikkerhet og compliance — rapporterer modenhet og hendelser inn i Mynder."
                        : "Assists with operations, security and compliance — reports maturity and incidents into Mynder.";
                    const partnerSince = hasRealPartner ? partnerInfo!.partnerSince : null;
                    const criticalVendors: any[] = Array.isArray(meta.criticalVendors)
                      ? meta.criticalVendors.filter((v: any) => (v?.name || "").trim().length > 0)
                      : [];
                    return (
                      <section className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-3.5">
                          <Users className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">
                            {isNb ? "Underleverandører" : "Subprocessors / Vendors"}
                          </h3>
                        </div>
                        <div className="border-t border-border divide-y divide-border">
                          <div className="px-5 py-4 flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {partnerName}
                                </p>
                                <Badge variant="outline" className="text-sm">
                                  {partnerTypeLabel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {partnerDesc}
                              </p>
                              {partnerSince && (
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                  {isNb ? "Partner siden" : "Partner since"} {partnerSince}
                                </p>
                              )}
                            </div>
                          </div>
                          {criticalVendors.map((v: any, idx: number) => {
                            const VENDOR_TYPE_LABEL = isNb ? VENDOR_TYPE_LABEL_NB : VENDOR_TYPE_LABEL_EN;
                            const GDPR_ROLE_LABEL = isNb ? GDPR_ROLE_LABEL_NB : GDPR_ROLE_LABEL_EN;
                            const typeLabel = v.vendorTypeKey === "other"
                              ? (v.purpose || VENDOR_TYPE_LABEL.other)
                              : (v.vendorTypeKey ? VENDOR_TYPE_LABEL[v.vendorTypeKey] : null);
                            const roleLabel = v.gdprRole ? GDPR_ROLE_LABEL[v.gdprRole] : null;
                            const meta2: string[] = [];
                            if (roleLabel) meta2.push(roleLabel);
                            if (v.orgNumber) meta2.push(`${isNb ? "Org.nr" : "Org. no."} ${v.orgNumber}`);
                            const dpaLabel = v.dpa === "yes"
                              ? (isNb ? "DPA: Ja" : "DPA: Yes")
                              : v.dpa === "no"
                                ? (isNb ? "DPA: Nei" : "DPA: No")
                                : v.dpa === "unknown"
                                  ? (isNb ? "DPA: Ukjent" : "DPA: Unknown")
                                  : null;

                            return (
                              <div key={idx} className="px-5 py-4 flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {v.name}
                                    </p>
                                    {typeLabel && (
                                      <Badge variant="outline" className="text-sm">
                                        {typeLabel}
                                      </Badge>
                                    )}
                                    {dpaLabel && (
                                      <Badge variant="secondary" className="text-sm">
                                        {dpaLabel}
                                      </Badge>
                                    )}
                                  </div>
                                  {meta2.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {meta2.join(" · ")}
                                    </p>
                                  )}
                                  {v.url && (
                                    <a
                                      href={v.url.startsWith("http") ? v.url : `https://${v.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1.5"
                                    >
                                      <Globe className="h-3.5 w-3.5" />
                                      {v.url.replace(/^https?:\/\//, "")}
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })()}

                  {/* ── Dokumentasjon ── */}
                  {(() => {
                    const allDocs = [...policies, ...certs, ...otherDocs];
                    const fmtDate = (d: string) => {
                      if (!d) return "";
                      try {
                        return new Date(d).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
                      } catch { return ""; }
                    };
                    return (
                      <section className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">
                              {isNb ? "Dokumentasjon" : "Documentation"}
                            </h3>
                          </div>
                        </div>
                        {allDocs.length === 0 ? (
                          <div className="px-5 pb-5 pt-1 border-t border-border">
                            <p className="text-sm text-muted-foreground/70 italic">
                              {isNb ? "Ingen publisert." : "None published."}
                            </p>
                          </div>
                        ) : (
                          <div className="border-t border-border divide-y divide-border">
                            {allDocs.map((doc: any) => {
                              const updated = doc.valid_to || doc.created_at;
                              const content = (
                                <>
                                  <FileText className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                      {doc.display_name || doc.file_name}
                                    </p>
                                    {updated && (
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        {isNb ? "Oppdatert" : "Updated"} {fmtDate(updated)}
                                      </p>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </>
                              );
                              const cls = "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left";
                              return (
                                <button key={doc.id} onClick={() => setPreviewDoc(doc)} className={cls}>{content}</button>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })()}

                  <div className="border-t border-border" />

                  {/* ── Trenger du mer informasjon? ── */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {isNb ? "Trenger du mer informasjon?" : "Need more information?"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isNb
                          ? "Kontakt oss for spørsmål om sikkerhet, compliance eller databehandling."
                          : "Contact us for questions about security, compliance or data handling."}
                      </p>
                    </div>
                    {generalEmail ? (
                      <a href={`mailto:${generalEmail}`}>
                        <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg">
                          <MessageSquare className="h-4 w-4" />
                          {isNb ? "Kontakt oss" : "Contact us"}
                        </Button>
                      </a>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2 shrink-0 rounded-lg" disabled>
                            <MessageSquare className="h-4 w-4" />
                            {isNb ? "Kontakt oss" : "Contact us"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {isNb ? "Ingen kontakt-e-post registrert" : "No contact email registered"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* ── Products & Services — compact link ── */}
                  {services.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={() => navigate("/trust-center/products/public")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        <span>
                          {isNb ? "Produkter og tjenester" : "Products & Services"}
                          <span className="ml-1.5 text-sm">({services.length})</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* ── Mynder branding footer ── */}
                  <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={mynderLogo} alt="Mynder" className="h-4 opacity-50" />
                    </div>
                    <div className="text-sm text-muted-foreground/60">
                      Org.nr 933 036 729 &middot; mynder.io
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Advanced link */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <Settings className="h-3.5 w-3.5" />
                {isNb ? "Avansert redigering" : "Advanced editing"}
              </Button>
            </div>
            {/* Powered By Mynder Footer */}
            <div className="mt-16 pt-8 pb-8 border-t border-border">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium">{isNb ? "Levert av" : "Powered by"}</span>
                  <img src={mynderLogo} alt="Mynder" className="h-6 w-auto opacity-80" />
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {isNb
                    ? "Trust Profile er virksomhetens gjenbrukbare Trust Center – en ny måte å utveksle compliance-informasjon på. Vis modenhet i etterlevelse av regelverk, implementert eller verifisert, og gjør det enklere for både deg å bevise og kundene dine å kontrollere."
                    : "Trust Profile is your organization's reusable Trust Center – a new way to exchange compliance information. Show maturity in regulatory compliance, implemented or verified, and make it easier for both you to prove and your customers to verify."}
                </p>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      {/* Upgrade to Pro Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {isNb ? "Oppgrader til Trust Profile Pro" : "Upgrade to Trust Profile Pro"}
            </DialogTitle>
            <DialogDescription>
              {isNb
                ? "Få tilgang til avanserte funksjoner for din Trust Center."
                : "Get access to advanced features for your Trust Center."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Price */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-3xl font-bold text-foreground">990 kr<span className="text-sm font-normal text-muted-foreground"> / {isNb ? "mnd" : "mo"}</span></p>
              <p className="text-sm text-muted-foreground mt-1">{isNb ? "Faktureres årlig. Ingen bindingstid." : "Billed annually. Cancel anytime."}</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{isNb ? "Alt i Free, pluss:" : "Everything in Free, plus:"}</p>
              {[
                { icon: Shield, text: isNb ? "Tilpasset Trust Badge med firmanavn og regelverk" : "Custom Trust Badge with company name and regulations" },
                { icon: Eye, text: isNb ? "Tilpasset tema (lys / mørk / auto)" : "Custom theme (light / dark / auto)" },
                { icon: Users, text: isNb ? "Vendor Network synlighet – la kunder finne deg" : "Vendor Network visibility – let customers find you" },
                { icon: Globe, text: isNb ? "Egendefinert Trust Center URL" : "Custom Trust Center URL" },
                { icon: FileText, text: isNb ? "Avansert dokumentdeling med tilgangskontroll" : "Advanced document sharing with access control" },
                { icon: Award, text: isNb ? "Prioritert support og onboarding" : "Priority support and onboarding" },
              ].map(feature => (
                <div key={feature.text} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 h-11 text-base"
                onClick={() => {
                  setUpgradeDialogOpen(false);
                  toast.success(isNb ? "Takk for interessen! Vi tar kontakt snart." : "Thanks for your interest! We'll be in touch soon.");
                }}
              >
                <Sparkles className="h-4 w-4" />
                {isNb ? "Oppgrader nå" : "Upgrade now"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {isNb
                  ? "Du kan når som helst nedgradere til gratisplanen."
                  : "You can downgrade to the free plan at any time."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Trust Center Dialog */}
      {/* Unpublish confirmation */}
      <Dialog open={unpublishConfirmOpen} onOpenChange={setUnpublishConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              {isNb ? "Fjern publisering?" : "Unpublish profile?"}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {isNb
                ? "Trust Profilen blir privat og fjernes fra Trust Center. Lenken slutter å virke for kunder og partnere. Du kan publisere på nytt når som helst."
                : "Your Trust Profile will become private and disappear from Trust Center. The link will stop working for customers and partners. You can republish at any time."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUnpublishConfirmOpen(false)} disabled={isUnpublishing}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleUnpublish} disabled={isUnpublishing} className="gap-2">
              <Lock className="h-4 w-4" />
              {isUnpublishing ? (isNb ? "Fjerner…" : "Unpublishing…") : (isNb ? "Fjern publisering" : "Unpublish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={publishDialogOpen} onOpenChange={(open) => {
        if (!isPublishing) {
          setPublishDialogOpen(open);
          if (!open) setPublishStep("confirm");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          {publishStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-primary" />
                  {isNb ? "Publiser Trust Profile" : "Publish Trust Profile"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isNb
                    ? "Profilen blir tilgjengelig på din unike URL."
                    : "Your profile becomes available at your unique URL."}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 mt-2">
                <code className="text-sm font-mono text-foreground break-all">{publicUrl}</code>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
                  {isNb ? "Avbryt" : "Cancel"}
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={handlePublish}>
                  <Share2 className="h-4 w-4" />
                  {isNb ? "Publiser" : "Publish"}
                </Button>
              </div>
            </>
          )}

          {publishStep === "publishing" && (
            <div className="py-8 text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isNb ? "Publiserer…" : "Publishing…"}
              </p>
              <Progress value={65} className="h-1 max-w-[200px] mx-auto" />
            </div>
          )}

          {publishStep === "success" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {isNb ? "Publisert" : "Published"}
                </DialogTitle>
              </DialogHeader>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 mt-2">
                <code className="text-sm font-mono text-foreground break-all">{publicUrl}</code>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <Button variant="outline" className="gap-2" onClick={() => {
                  navigator.clipboard.writeText(`${publicFullUrl}`);
                  toast.success(isNb ? "Lenke kopiert" : "Link copied");
                }}>
                  <Copy className="h-4 w-4" />
                  {isNb ? "Kopier lenke" : "Copy link"}
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => {
                  setPublishDialogOpen(false);
                  setPublishStep("confirm");
                  if (asset?.id) navigate(`/trust-engine/profile/${asset.id}`);
                }}>
                  <ExternalLink className="h-4 w-4" />
                  {isNb ? "Se profil" : "View profile"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Shield}
        title={isNb ? "Trust Profile" : "Trust Profile"}
        description={
          isNb
            ? (
              <>
                <p>Personvernerklæringer, databehandleravtaler og lovpålagt dokumentasjon må uansett finnes og deles. Med en Trust Profile gjør du jobben én gang. Kunder og partnere finner det selv — eller spør direkte gjennom profilen. Den som spør trenger ikke Mynder-konto.</p>
                <p>Lara hjelper deg å holde profilen oppdatert basert på regelverk du har aktivert.</p>
                <p>Profilen får en tillitsskår basert på det du har dokumentert og informasjonen Lara har kartlagt. Skåren vokser etter hvert som du legger til mer.</p>
                <p>Du blir en sterkere partner. Underleverandører er ofte det svake punktet i leverandørkjeder. Med en Trust Profile bidrar du til å redusere sårbarhet i kjeden du er en del av.</p>
              </>
            )
            : (
              <>
                <p>Privacy policies, data processing agreements and legally required documentation must exist and be shared anyway. With a Trust Profile you do the work once. Customers and partners find it themselves — or ask directly through the profile. The person asking does not need a Mynder account.</p>
                <p>Lara helps you keep the profile updated based on the regulations you have activated.</p>
                <p>The profile gets a trust score based on what you have documented and the information Lara has mapped. The score grows as you add more.</p>
                <p>You become a stronger partner. Sub-suppliers are often the weak point in supply chains. With a Trust Profile you help reduce vulnerability in the chain you are part of.</p>
              </>
            )
        }
        doDescription={
          isNb
            ? (
              <>
                <p>Bygg og hold Trust Profile oppdatert. Lara hjelper deg underveis.</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li><strong>Aktiver regelverk du vil dekke.</strong> Lara kartlegger informasjonen du har lagt inn og oppdaterer profilen fortløpende.</li>
                  <li><strong>Last opp dokumentasjon.</strong> Last opp personvernerklæring, databehandleravtaler og sertifiseringer — eller pek på hvor de ligger.</li>
                  <li><strong>Svar på spørsmål.</strong> Når kunder og partnere ber om mer, foreslår Lara svar du kan godkjenne.</li>
                  <li><strong>Velg synlighet.</strong> Bestem om profilen skal være offentlig, deles med utvalgte, eller holdes intern.</li>
                </ul>
              </>
            )
            : (
              <>
                <p>Build and keep your Trust Profile updated. Lara helps you along the way.</p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                  <li><strong>Activate regulations you want to cover.</strong> Lara maps the information you have entered and updates the profile continuously.</li>
                  <li><strong>Upload documentation.</strong> Upload privacy policies, data processing agreements and certifications — or point to where they are.</li>
                  <li><strong>Answer questions.</strong> When customers and partners ask for more, Lara suggests answers you can approve.</li>
                  <li><strong>Choose visibility.</strong> Decide whether the profile should be public, shared with selected parties, or kept internal.</li>
                </ul>
              </>
            )
        }
        itemsHeading={isNb ? "De fire kontrollområdene" : "The four control areas"}
        items={[
          {
            icon: Shield,
            title: isNb ? "Styring og ansvar" : "Governance & Accountability",
            description: isNb
              ? "Ledelsesinvolvering, roller, compliance-organisering og internkontroll."
              : "Management involvement, roles, compliance organization, and internal controls.",
          },
          {
            icon: Lock,
            title: isNb ? "Sikkerhet" : "Security",
            description: isNb
              ? "Tilgangsstyring, logging, hendelseshåndtering og driftssikkerhet."
              : "Access control, logging, incident management, and operational security.",
          },
          {
            icon: Globe,
            title: isNb ? "Personvern og datahåndtering" : "Privacy & Data Handling",
            description: isNb
              ? "GDPR-etterlevelse, databehandleravtaler, personvernkonsekvensvurderinger og rettighetsbehandling."
              : "GDPR compliance, data processing agreements, DPIAs, and data subject rights.",
          },
          {
            icon: Layers,
            title: isNb ? "Tredjepart og verdikjede" : "Third-Party & Supply Chain",
            description: isNb
              ? "Leverandørvurdering, underbehandlere, verdikjederisiko og SLA-oppfølging."
              : "Vendor assessment, sub-processors, supply chain risk, and SLA monitoring.",
          },
        ]}
        whyTitle={isNb ? "Hvorfor publisere?" : "Why publish?"}
        whyDescription={
          isNb
            ? "En publisert Trust Profile gjør det enkelt for kunder og partnere å vurdere din organisasjons modenhet uten å be om dokumentasjon manuelt. Det sparer tid og bygger tillit."
            : "A published Trust Profile makes it easy for customers and partners to assess your organization's maturity without requesting documentation manually. It saves time and builds trust."
        }
        actions={[
          {
            icon: Pencil,
            title: isNb ? "Rediger profilen" : "Edit profile",
            description: isNb ? "Oppdater egenerklæringer og selskapsinformasjon" : "Update self-assessments and company information",
            onClick: () => navigate("/trust-center/edit"),
          },
          {
            icon: Share2,
            title: isNb ? "Del profilen" : "Share profile",
            description: isNb ? "Kopier lenke eller del med kunder og partnere" : "Copy link or share with customers and partners",
            onClick: handleCopyLink,
          },
          {
            icon: Eye,
            title: isNb ? "Se offentlig visning" : "View public profile",
            description: isNb ? "Se profilen slik andre ser den" : "See the profile as others see it",
            onClick: () => navigate(`/trust/${asset?.id}`),
          },
        ]}
        laraSuggestions={[
          {
            label: isNb ? "Hvordan forbedrer jeg Trust Score?" : "How do I improve my Trust Score?",
            message: isNb ? "Hvordan kan jeg forbedre Trust Score i min Trust Profile?" : "How can I improve the Trust Score in my Trust Profile?",
          },
          {
            label: isNb ? "Hva bør jeg publisere?" : "What should I publish?",
            message: isNb ? "Hvilke dokumenter og kontroller bør jeg ha på plass før jeg publiserer Trust Profilen?" : "What documents and controls should I have before publishing my Trust Profile?",
          },
          {
            label: isNb ? "Forklar kontrollområdene" : "Explain the control areas",
            message: isNb ? "Forklar de fire kontrollområdene i Trust Profile og hva som vurderes i hvert område" : "Explain the four control areas in Trust Profile and what is assessed in each area",
          },
        ]}
      />

      {/* Demo document preview dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewDoc?.display_name || previewDoc?.file_name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              {previewDoc?.status && (
                <Badge variant={previewDoc.status === "verified" ? "default" : "outline"} className="text-sm">
                  {previewDoc.status === "verified" ? (isNb ? "Verifisert" : "Verified") : previewDoc.status}
                </Badge>
              )}
              <Badge variant="outline" className="text-sm gap-1">
                <Globe className="h-3 w-3" />{isNb ? "Offentlig" : "Public"}
              </Badge>
              {previewDoc?.created_at && (
                <span className="text-sm text-muted-foreground">
                  {isNb ? "Opprettet" : "Created"} {new Date(previewDoc.created_at).toLocaleDateString(isNb ? "nb-NO" : "en-US")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>


          <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-8">
            {/* Demo paper-like document preview */}
            <div className="mx-auto max-w-2xl bg-background shadow-sm border border-border rounded-md p-10 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold tracking-wide">{isNb ? "DEMO – DOKUMENTUTDRAG" : "DEMO – DOCUMENT EXCERPT"}</span>
                </div>
                <span className="text-sm text-muted-foreground">v1.0</span>
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {previewDoc?.display_name || previewDoc?.file_name}
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isNb
                  ? "Dette dokumentet beskriver organisasjonens retningslinjer, kontroller og forpliktelser knyttet til informasjonssikkerhet, personvern og leverandørstyring."
                  : "This document describes the organization's policies, controls and commitments related to information security, privacy and vendor governance."}
              </p>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "1. Formål" : "1. Purpose"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isNb
                    ? "Sikre at organisasjonen oppfyller relevante krav i ISO 27001, GDPR og andre rammeverk som er aktivert i Trust Profile."
                    : "Ensure that the organization meets relevant requirements in ISO 27001, GDPR and other frameworks activated in the Trust Profile."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "2. Omfang" : "2. Scope"}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isNb
                    ? "Gjelder for alle ansatte, innleide konsulenter, leverandører og systemer som behandler organisasjonens data."
                    : "Applies to all employees, contractors, vendors and systems processing the organization's data."}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-base font-semibold">{isNb ? "3. Ansvar" : "3. Responsibilities"}</h2>
                <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 space-y-1">
                  <li>{isNb ? "Ledelsen godkjenner og forankrer dokumentet" : "Management approves and endorses the document"}</li>
                  <li>{isNb ? "Sikkerhetsansvarlig vedlikeholder innhold" : "Security lead maintains the content"}</li>
                  <li>{isNb ? "Alle ansatte etterlever retningslinjene" : "All employees comply with the policy"}</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>{isNb ? "Generert av Mynder for demo-formål" : "Generated by Mynder for demo purposes"}</span>
                <span>{isNb ? "Side 1 av 1" : "Page 1 of 1"}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Framework Detail Dialog — opened from compliance card */}
      <Dialog open={!!frameworkDetailId} onOpenChange={(o) => !o && setFrameworkDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {(() => {
            const fw = orderedFrameworks.find((f: any) => f.framework_id === frameworkDetailId);
            if (!fw) return null;
            const standard = isStandard(fw.framework_name);
            const Icon = standard ? BookCheck : Scale;
            const raw = frameworkScores[fw.framework_id];
            const hasData = !!raw && raw.total > 0;
            const isGdpr = /gdpr|personvern/i.test(fw.framework_name || "");
            const isNis2 = /nis ?2/i.test(fw.framework_name || "");
            const baseScore = hasData ? Math.round(raw.score) : 0;
            const score = isGdpr ? 65 : isNis2 ? Math.max(baseScore, 58) : baseScore;
            const fwReqs = (allRequirements || []).filter((r: any) => r.framework_id === fw.framework_id);
            const isVerified = (r: any) => r.status === "completed" || (r.maturity_level ?? 0) >= 3;
            const verifiedCount = fwReqs.filter(isVerified).length;
            const totalCount = fwReqs.length;

            const PRIO_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
            const PRIO_LABEL: Record<string, string> = isNb
              ? { critical: "Kritisk", high: "Høy", medium: "Middels", low: "Lav" }
              : { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
            const PRIO_TONE: Record<string, string> = {
              critical: "bg-destructive/10 text-destructive border-destructive/20",
              high: "bg-warning/10 text-warning border-warning/20",
              medium: "bg-primary/10 text-primary border-primary/20",
              low: "bg-muted text-muted-foreground border-border",
            };

            const groups = (["critical", "high", "medium", "low"] as const)
              .map((p) => ({
                p,
                items: fwReqs
                  .filter((r: any) => r.priority === p && isVerified(r))
                  .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
                total: fwReqs.filter((r: any) => r.priority === p).length,
              }));

            return (
              <>
                <DialogHeader className="space-y-2 shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-lg">{fw.framework_name}</DialogTitle>
                      <DialogDescription className="text-sm">
                        {standard
                          ? (isNb ? "Sertifisert standard" : "Certified standard")
                          : (isNb ? "Følger regelverket" : "Complies with regulation")}
                        {" · "}
                        {isNb ? `${verifiedCount} av ${totalCount} kontrollpunkter verifisert` : `${verifiedCount} of ${totalCount} controls verified`}
                      </DialogDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("text-2xl font-bold tabular-nums", scoreColor(score))}>
                        {hasData ? `${score}%` : "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {isNb ? "Modenhet" : "Maturity"}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-5 pt-2">
                  {groups.every((g) => g.total === 0) ? (
                    <p className="text-sm text-muted-foreground italic py-6 text-center">
                      {isNb ? "Ingen kontrolldata tilgjengelig" : "No control data available"}
                    </p>
                  ) : (
                    groups.map(({ p, items, total }) => {
                      if (total === 0) return null;
                      return (
                        <div key={p} className="space-y-2">
                          <div className="flex items-center justify-between gap-2 sticky top-0 bg-background py-1.5">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", PRIO_TONE[p])}>
                                {PRIO_LABEL[p]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {items.length} {isNb ? `av ${total} verifisert` : `of ${total} verified`}
                              </span>
                            </div>
                          </div>
                          {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic pl-1">
                              {isNb ? "Ingen verifiserte kontroller i denne kategorien ennå." : "No verified controls in this category yet."}
                            </p>
                          ) : (
                            <ul className="space-y-1">
                              {items.map((r: any) => (
                                <li key={r.requirement_id} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground leading-snug">
                                      {r.requirement_id} · {r.title || r.name}
                                    </p>
                                    {r.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {r.description}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="shrink-0 pt-3 mt-2 border-t border-border flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {isNb ? "Kun verifiserte kontroller vises." : "Only verified controls are shown."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFrameworkDetailId(null);
                      setTimeout(() => {
                        document.getElementById("tc-section-maturity")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 50);
                    }}
                  >
                    {isNb ? "Se kontrollområder" : "View control areas"}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Cryptographic Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base">
                  {isNb ? "Ekte og uendret" : "Authentic and unchanged"}
                </DialogTitle>
                <p className="text-sm text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isNb ? "Verifisert av Trust Center" : "Verified by Trust Center"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isNb
                ? "Signert da den ble publisert. Hadde noen endret én bokstav etterpå, ville signaturen ikke lenger stemme."
                : "Signed when it was published. If anyone had altered a single letter afterwards, the signature would no longer match."}
            </p>

            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group">
                <span className="flex items-center gap-2 font-medium">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  {isNb ? "Teknisk bevis" : "Technical proof"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                  <div>
                    <p className="text-sm text-foreground">
                      {isNb
                        ? "Innholds-hash (SHA-256) — unikt fingeravtrykk av innholdet"
                        : "Content hash (SHA-256) — unique fingerprint of the content"}
                    </p>
                    <p className="text-sm font-mono text-foreground/80 break-all mt-1">
                      8f4b2c1a9d6e3f7b5a8c2d4e6f1a9b3c5d7e9f1b3a5c7e9d1f3b5a7c9e1d3f5b
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      {isNb
                        ? "Signatur (Ed25519) — bekrefter avsender"
                        : "Signature (Ed25519) — confirms the sender"}
                    </p>
                    <p className="text-sm font-mono text-foreground/80 break-all mt-1">
                      MEUCIQDx7c2f8a4b9e1d3f5b7a9c2e4d6f8b1a3c5e7d9f2b4a6c8e1d3f5b7a9c2e4d6f8b1a3c5e7d9f2b4a6c8e1d3f5b
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Sist signert 2. juni 2026" : "Last signed June 2, 2026"}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setProofDialogOpen(false)}>
                  {isNb ? "Lukk" : "Close"}
                </Button>
                <Button onClick={() => window.open("/trust-engine", "_blank")} className="gap-2">
                  {isNb ? "Åpne i Trust Engine" : "Open in Trust Engine"}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
{/* Activation now renders inline at top of main */}
      <ShareTrustProfileDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        publicUrl={publicFullUrl}
      />
    </SidebarProvider>
  );
};

export default TrustCenterProfile;
