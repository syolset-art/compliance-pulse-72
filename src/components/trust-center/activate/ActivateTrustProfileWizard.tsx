import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Building2, Globe, Loader2,
  CheckCircle2, Search, Mail, Lock, FileText, Users, Eye, AlertCircle, Lightbulb, Info,
  Upload, Check, X, Clock, HelpCircle, Handshake, Pencil, Plus, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

import { toast } from "sonner";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import { getLaraScanForDomain, SCAN_STEPS_MS, type LaraScanResult } from "@/lib/demoTrustActivation";
import { seedFromActivation, type ActivationValues, type ActivationDocument } from "@/lib/demoSeedTrustProfile";
import { VISIBILITY_META, ALL_VISIBILITY_LEVELS, DEFAULT_VISIBILITY, type TrustVisibility } from "@/lib/trustVisibility";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MATURITY_AREAS, ALL_MATURITY_QUESTIONS, DOCUMENT_SLOTS,
  deriveDefaultAnswers, deriveLaraSources,
  type MaturityAnswers, type MaturityAnswer,
} from "@/lib/trustMaturityQuestions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  findVendorSuggestions,
  findVendorByName,
  type VendorSuggestion,
} from "@/lib/vendorCatalog";
import {
  analyzeSubprocessorFile,
  analyzeSubprocessorUrl,
  type SubprocessorListData,
} from "@/lib/demoSubprocessorAnalysis";
import { Link2, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PARTNER_TYPE_LABEL, type PartnerType } from "@/hooks/usePartnerInfo";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import DemoCursor, { type DemoCursorHandle } from "./DemoCursor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  /** Render inline (no modal). Use when embedded directly on the Trust Profile page. */
  inline?: boolean;
  /** When true (and inline), render with a conversational Lara shell instead of a plain card. */
  conversation?: boolean;
  /** Pre-known company name (e.g. from logged-in customer's company_profile). Skips Welcome and auto-searches Brreg. */
  initialCompanyName?: string;
  /** Pre-known org number. When set, Brreg lookup is skipped and the org block is shown as confirmed. */
  initialOrgNumber?: string;
  /** Pre-known domain/website. Used as the website suggestion to verify. */
  initialDomain?: string;
  /** Existing maturity answers from prior work in Regelverk module. Merged over Lara defaults. */
  initialMaturity?: MaturityAnswers;
  /** When true, the wizard auto-advances through every step with calm pauses
   *  so the activation flow can be recorded as a demo. Manual clicks still
   *  work and timers are cancelled on unmount or step change. */
  autoPlay?: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const TOTAL_STEPS = 7;
const STEP_LABELS = ["Organisasjon", "Lara skanner", "Bekreft", "Dokumenter", "Kritiske leverandører", "Modenhet", "Synlighet"];

export type CriticalVendorRow = {
  name: string;
  purpose: string;
  processesPersonalData: "yes" | "no" | null;
  dataCategories: string[];
  dpa: "yes" | "no" | "unknown" | null;
};
const EMPTY_VENDOR_ROW: CriticalVendorRow = {
  name: "",
  purpose: "",
  processesPersonalData: null,
  dataCategories: [],
  dpa: null,
};
const DATA_CATEGORY_OPTIONS = ["Ansattdata", "Kundedata", "Pasientdata", "Annet"];
const MAX_CRITICAL_VENDORS = 5;

export default function ActivateTrustProfileWizard({
  open, onOpenChange, onCompleted, inline, conversation,
  initialCompanyName, initialOrgNumber, initialDomain, initialMaturity,
  autoPlay,
}: Props) {
  const queryClient = useQueryClient();
  // When we already know the customer (logged-in), skip Welcome and start at Organisasjon.
  const hasPrefill = !!(initialCompanyName && initialCompanyName.trim());
  // When org number is also known, the wizard becomes a single "verify website" step.
  const hasOrgPrefill = hasPrefill && !!(initialOrgNumber && initialOrgNumber.trim());
  const [step, setStep] = useState<Step>(1);

  // Step 1: org
  const [companyName, setCompanyName] = useState(hasOrgPrefill ? (initialCompanyName ?? "") : "");
  const [orgNumber, setOrgNumber] = useState(hasOrgPrefill ? (initialOrgNumber ?? "") : "");
  const [country] = useState("Norge");
  const normalizeUrl = (u: string) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);
  const [website, setWebsite] = useState(initialDomain ? normalizeUrl(initialDomain) : "");
  const [hasWebsite, setHasWebsite] = useState<"yes" | "no" | null>(initialDomain ? "yes" : null);
  const [websiteVerified, setWebsiteVerified] = useState(false);
  const [verified, setVerified] = useState(hasOrgPrefill);
  const { searchByName, lookupByOrgNumber, searchResults, isLoading } = useBrregLookup();
  const autoSearchedRef = useRef(false);

  // Step 2: scan
  const [scanProgress, setScanProgress] = useState(0);
  const [revealed, setRevealed] = useState<number>(0);
  const [scan, setScan] = useState<LaraScanResult | null>(null);

  // Step 3: confirmed values (prefilled from scan)
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [dpoEmail, setDpoEmail] = useState("");
  const [securityName, setSecurityName] = useState("");
  const [securityEmail, setSecurityEmail] = useState("");
  const [incidentName, setIncidentName] = useState("");
  const [incidentEmail, setIncidentEmail] = useState("");
  const [incidentPhone, setIncidentPhone] = useState("");
  const [dpoType, setDpoType] = useState<"dpo" | "contact">("contact");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [encryption, setEncryption] = useState("");
  const [mfa, setMfa] = useState("");
  const [subProcessors, setSubProcessors] = useState("");

  // Step 4: maturity answers
  const [maturityAnswers, setMaturityAnswers] = useState<MaturityAnswers>({});
  const [laraSources, setLaraSources] = useState<Record<string, string>>({});

  // Step 5: critical vendors
  const [criticalVendors, setCriticalVendors] = useState<CriticalVendorRow[]>([{ ...EMPTY_VENDOR_ROW }]);
  // Step 5: optional aggregated subprocessor list (upload or URL)
  const [subprocessorList, setSubprocessorList] = useState<{
    source: "upload" | "url" | "none";
    file?: File | null;
    fileName?: string;
    url?: string;
  }>({ source: "none" });

  // Step 6: documents
  const [documents, setDocuments] = useState<ActivationDocument[]>([]);

  // Step 6: visibility
  const [visibility, setVisibility] = useState<TrustVisibility>(DEFAULT_VISIBILITY);
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);

  // Step 6: partner relationship (asked above visibility)
  const [partnerStatus, setPartnerStatus] = useState<"auto" | "yes" | "no" | "unknown" | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerCompanyId, setPartnerCompanyId] = useState<string | null>(null);
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [showPartnerOnProfile, setShowPartnerOnProfile] = useState(true);
  type AdditionalPartner = { name: string; companyId: string | null; type: PartnerType | null };
  const [additionalPartners, setAdditionalPartners] = useState<AdditionalPartner[]>([]);

  const { activeOrg } = useActiveOrganization();

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);

  // Score calculation transition (between step 4 and 5)
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcStep, setCalcStep] = useState(0);

  // Preliminary Trust Score derived from maturity answers (live updates as documents flip answers to "yes")
  const trustScore = useMemo(() => {
    const total = ALL_MATURITY_QUESTIONS.length;
    if (!total) return 0;
    const yes = ALL_MATURITY_QUESTIONS.filter((q) => maturityAnswers[q.id] === "yes").length;
    return Math.round((yes / total) * 100);
  }, [maturityAnswers]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setCompanyName(hasOrgPrefill ? (initialCompanyName ?? "") : "");
        setOrgNumber(hasOrgPrefill ? (initialOrgNumber ?? "") : "");
        setWebsite(initialDomain ? normalizeUrl(initialDomain) : "");
        setWebsiteVerified(false);
        setVerified(hasOrgPrefill);
        setScan(null);
        setScanProgress(0);
        setRevealed(0);
        autoSearchedRef.current = false;
        setPartnerStatus(null);
        setPartnerName("");
        setPartnerCompanyId(null);
        setPartnerType(null);
        setShowPartnerOnProfile(true);
      }, 200);
    }
  }, [open, hasPrefill, hasOrgPrefill, initialCompanyName, initialOrgNumber, initialDomain]);

  // Auto-detect partner relationship when wizard opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: cp } = await supabase
          .from("company_profile")
          .select("managed_by_partner, partner_name, partner_company_id, partner_type")
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (cp && (cp as any).managed_by_partner && (cp as any).partner_name) {
          setPartnerStatus("auto");
          setPartnerName((cp as any).partner_name ?? "");
          setPartnerCompanyId((cp as any).partner_company_id ?? null);
          setPartnerType(((cp as any).partner_type as PartnerType) ?? null);
          return;
        }
        // MSP-side: any partner has registered this org as their customer
        const orgnr = activeOrg?.orgNumber || initialOrgNumber;
        if (orgnr) {
          const { data: mc } = await supabase
            .from("msp_customers" as any)
            .select("msp_user_id")
            .eq("org_number", orgnr)
            .limit(1)
            .maybeSingle();
          if (cancelled) return;
          if (mc) {
            setPartnerStatus("auto");
            setPartnerName("Mynder-partner"); // generic — user can refine
          }
        }
      } catch {
        // ignore — fall back to manual question
      }
    })();
    return () => { cancelled = true; };
  }, [open, activeOrg?.orgNumber, initialOrgNumber]);

  // Auto-search Brreg only when we know the name but NOT the org number.
  useEffect(() => {
    if (!open || !hasPrefill || hasOrgPrefill || autoSearchedRef.current) return;
    if (orgNumber) return;
    autoSearchedRef.current = true;
    searchByName(initialCompanyName!).catch(() => {});
  }, [open, hasPrefill, hasOrgPrefill, initialCompanyName, orgNumber, searchByName]);

  // Auto-derive a website suggestion from company name when org is prefilled but no domain provided.
  // Lara has "mapped" the address — pre-mark as verified so Fortsett is active by default.
  useEffect(() => {
    if (!open || !hasOrgPrefill) return;
    if (!website) {
      const slug = (initialCompanyName ?? "")
        .toLowerCase()
        .replace(/\s+(as|asa)\s*$/i, "")
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "");
      if (slug) {
        setWebsite(`https://${slug}.no`);
        setWebsiteVerified(true);
      }
    } else if (initialDomain) {
      // Domain came from the customer record — treat as already verified.
      setWebsiteVerified(true);
    }
  }, [open, hasOrgPrefill, initialCompanyName, initialDomain, website]);

  // Run scan animation when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    const result = getLaraScanForDomain(website || companyName);
    setScan(result);
    setRevealed(0);
    setScanProgress(0);
    let i = 0;
    const total = result.findings.length;
    const interval = setInterval(() => {
      i += 1;
      setRevealed(i);
      setScanProgress(Math.min(100, Math.round((i / total) * 100)));
      if (i >= total) clearInterval(interval);
    }, SCAN_STEPS_MS);
    return () => clearInterval(interval);
  }, [step, website, companyName]);

  // When scan finishes, prefill confirm step + maturity defaults
  useEffect(() => {
    if (!scan) return;
    setDescription(scan.description);
    setContactName(scan.contacts.primaryName || "");
    setContactEmail(scan.contacts.primaryEmail || "");
    setDpoName(scan.contacts.dpoName || "");
    setDpoEmail(scan.contacts.dpoEmail || "");
    setSecurityName(scan.contacts.dpoName || scan.contacts.primaryName || "");
    setSecurityEmail((scan.contacts as any).securityEmail || scan.contacts.dpoEmail || "");
    setPrivacyUrl(scan.privacy.policyUrl || "");
    setEncryption(scan.security.encryption || "");
    setMfa(scan.security.mfa || "");
    setSubProcessors(scan.dataStorage.subProcessors.join(", "));
    const defaults = deriveDefaultAnswers(scan);
    const sources = deriveLaraSources(scan);
    // Merge in any existing answers from the Regelverk module — these win over Lara defaults
    if (initialMaturity) {
      for (const [k, v] of Object.entries(initialMaturity)) {
        if (v) {
          defaults[k] = v as MaturityAnswer;
          sources[k] = "Hentet fra ditt arbeid i Regelverk";
        }
      }
    }
    setMaturityAnswers(defaults);
    setLaraSources(sources);
    // Pre-populate documents found by scan
    setDocuments(
      DOCUMENT_SLOTS.map((slot) => {
        const found = scan.documents.find((d) => d.type === slot.scanType);
        return found
          ? { slot: slot.id, title: slot.title, status: "found" as const, fileName: found.title }
          : { slot: slot.id, title: slot.title, status: "skipped" as const };
      }),
    );
  }, [scan]);

  // Auto-advance from scan step to confirm step when Lara is done
  useEffect(() => {
    if (step !== 2 || !scan) return;
    if (revealed < scan.findings.length) return;
    const t = window.setTimeout(() => {
      setStep((s) => (s === 2 ? (3 as Step) : s));
    }, 700);
    return () => window.clearTimeout(t);
  }, [step, scan, revealed]);

  const handleSearchName = async () => {
    if (companyName.trim().length < 2) return;
    await searchByName(companyName);
  };

  const pickRegistry = async (orgnr: string, navn: string) => {
    setOrgNumber(orgnr);
    setCompanyName(navn);
    setVerified(true);
    const result = await lookupByOrgNumber(orgnr);
    // Always auto-derive a website guess so user can verify
    const slug = navn.toLowerCase()
      .replace(/\s+as\s*$/i, "")
      .replace(/\s+asa\s*$/i, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (slug) {
      setWebsite(`https://${slug}.no`);
    }
    // Pre-mark Lara's suggestion as verified so user can click Fortsett right away.
    setWebsiteVerified(true);
  };

  const canNext = useMemo(() => {
    if (step === 1) {
      const orgOk = companyName.trim().length > 1 && orgNumber.trim().length > 0;
      if (!orgOk || hasWebsite === null) return false;
      if (hasWebsite === "no") return true;
      return website.trim().length > 3 && websiteVerified;
    }
    if (step === 2) return revealed >= (scan?.findings.length ?? 0) && scan != null;
    if (step === 3) return description.trim().length > 0;
    return true;
  }, [step, companyName, orgNumber, website, revealed, scan, description, websiteVerified, hasWebsite]);

  const next = () => {
    setStep((s) => {
      // Skip scan step when user has no website
      if (s === 1 && hasWebsite === "no") {
        // seed maturity defaults so step 4 is usable without a scan
        setMaturityAnswers((prev) => (Object.keys(prev).length === 0 ? deriveDefaultAnswers(null) : prev));
        return 3 as Step;
      }
      return Math.min(7, s + 1) as Step;
    });
  };
  const back = () => {
    setStep((s) => {
      if (s === 3 && hasWebsite === "no") return 1 as Step;
      return Math.max(1, s - 1) as Step;
    });
  };

  const updateMaturity = (id: string, answer: MaturityAnswer) => {
    setMaturityAnswers((prev) => ({ ...prev, [id]: answer }));
  };

  const uploadDocument = (slotId: string, fileName: string) => {
    setDocuments((prev) => {
      const slot = DOCUMENT_SLOTS.find((s) => s.id === slotId);
      const next = prev.filter((d) => d.slot !== slotId);
      next.push({ slot: slotId, title: slot?.title || slotId, status: "uploaded", fileName });
      return next;
    });
    const slot = DOCUMENT_SLOTS.find((s) => s.id === slotId);
    if (slot?.resolvesQuestion) {
      const current = maturityAnswers[slot.resolvesQuestion];
      if (current !== "yes") {
        setMaturityAnswers((prev) => ({ ...prev, [slot.resolvesQuestion!]: "yes" }));
        toast.success("Lara oppdaterte svaret i Modenhet-steget");
      }
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Run Lara "calculation" animation before actually publishing
    setIsCalculating(true);
    setCalcStep(0);
    await new Promise((r) => setTimeout(r, 500));
    setCalcStep(1);
    await new Promise((r) => setTimeout(r, 600));
    setCalcStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setCalcStep(3);
    await new Promise((r) => setTimeout(r, 500));

    // Lara analyses the optional subprocessor list (file or URL)
    let analyzedSubprocessors: SubprocessorListData | null = null;
    try {
      if (subprocessorList.source === "upload" && subprocessorList.file) {
        const vendors = await analyzeSubprocessorFile(subprocessorList.file);
        analyzedSubprocessors = {
          source: "upload",
          fileName: subprocessorList.fileName,
          analyzedAt: new Date().toISOString(),
          vendors,
        };
      } else if (subprocessorList.source === "url" && subprocessorList.url) {
        const vendors = await analyzeSubprocessorUrl(subprocessorList.url);
        analyzedSubprocessors = {
          source: "url",
          url: subprocessorList.url,
          analyzedAt: new Date().toISOString(),
          vendors,
        };
      }
    } catch {
      // ignore — keep null
    }

    const values: ActivationValues = {
      name: companyName,
      orgNumber,
      country,
      region: scan?.region,
      industry: scan?.industry,
      employees: scan?.employees,
      description,
      url: website,
      contactPerson: contactName,
      contactEmail,
      dpoEmail,
      securityEmail,
      maturityAnswers,
      criticalVendors: criticalVendors
        .filter((v) => v.name.trim().length > 0)
        .map((v) => ({
          name: v.name.trim(),
          purpose: v.purpose.trim(),
          processesPersonalData: v.processesPersonalData,
          dataCategories: v.dataCategories,
          dpa: v.dpa ?? "unknown",
        })),
      subprocessorList: analyzedSubprocessors,
      documents,
      visibility,
      partner: partnerStatus
        ? {
            status: partnerStatus,
            name: partnerName || null,
            companyId: partnerCompanyId,
            type: partnerType,
            showOnProfile: showPartnerOnProfile,
            additional: additionalPartners.filter((p) => p.name.trim().length > 0),
          }
        : undefined,
    };

    try {
      await seedFromActivation(values);
      try { localStorage.setItem("mynder.trustprofile.activated", "1"); } catch {}
      await queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
      if (analyzedSubprocessors && analyzedSubprocessors.vendors.length > 0) {
        const tp = analyzedSubprocessors.vendors.filter((v) => v.hasTrustProfile).length;
        toast.success(
          `Trust Profile aktivert · Lara analyserte ${analyzedSubprocessors.vendors.length} underleverandører (${tp} med Trust Profile)`,
        );
      } else {
        toast.success("Trust Profile aktivert");
      }
      onOpenChange(false);
      onCompleted?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Noe gikk galt");
    } finally {
      setIsPublishing(false);
      setIsCalculating(false);
    }
  };

  const handleSkip = () => {
    try { localStorage.setItem("mynder.trustprofile.activated", "skipped"); } catch {}
    onOpenChange(false);
  };

  // ─── Auto-play (demo mode) ─────────────────────────────────────────────
  // Drives the wizard forward on a calm rhythm so the activation flow can be
  // filmed without manual clicks. Each step's timer waits long enough for the
  // viewer to read the screen, moves the demo cursor to the primary CTA,
  // emits a click pulse, then calls the same handler a real user would.
  // Step 2 is skipped here because the Lara-scan effect already auto-advances.
  const cursorRef = useRef<DemoCursorHandle | null>(null);
  useEffect(() => {
    if (!autoPlay || !open) return;
    if (isCalculating || isPublishing) return;
    // Read-time before the cursor starts moving (lets the viewer see the step).
    const readDelays: Record<number, number> = {
      1: 3200,
      3: 4000,
      4: 3000,
      5: 7000,
      6: 5000,
      7: 4000,
    };
    const readDelay = readDelays[step];
    if (!readDelay) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      if (cancelled) return;
      try {
        await cursorRef.current?.moveToSelector('[data-demo-target="wizard-primary-cta"]');
        if (cancelled) return;
        await cursorRef.current?.click();
        if (cancelled) return;
      } catch {
        // ignore — fall through to advance even if cursor failed
      }
      if (step === 7) {
        handlePublish();
      } else {
        next();
      }
    }, readDelay);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [autoPlay, open, step, isCalculating, isPublishing]);



  const stepHint =
    step === 1 ? "Bekreft hvor du jobber." :
    step === 2 ? "Lara henter offentlig informasjon." :
    step === 3 ? "Bekreft kort om virksomheten." :
    step === 4 ? "Valgfritt — last opp om du har." :
    step === 5 ? "Hvem har tilgang til dine viktigste systemer?" :
    step === 6 ? "Bekreft eller juster Laras svar." :
    step === 7 ? "Hvem skal kunne se profilen?" : "";

  const header = (
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      <span className="text-primary">Steg {step}</span>
      <span>·</span>
      <span>{stepHint}</span>
    </div>
  );

  const body = (
    <div className="flex-1 overflow-y-auto py-2 pr-1">
      {step === 1 && (
        <OrgStep
          companyName={companyName}
          setCompanyName={setCompanyName}
          orgNumber={orgNumber}
          setOrgNumber={setOrgNumber}
          website={website}
          setWebsite={(v: string) => { setWebsite(v); setWebsiteVerified(false); }}
          websiteVerified={websiteVerified}
          onVerifyWebsite={() => setWebsiteVerified(true)}
          verified={verified}
          isLoading={isLoading}
          searchResults={searchResults}
          onSearch={handleSearchName}
          onPick={pickRegistry}
          companyNameLocked={hasOrgPrefill}
          orgPrefilled={hasOrgPrefill}
          hasWebsite={hasWebsite}
          setHasWebsite={(v: "yes" | "no") => {
            setHasWebsite(v);
            if (v === "no") {
              setWebsite("");
              setWebsiteVerified(false);
            }
          }}
        />
      )}
      {step === 2 && scan && (
        <ScanStep scan={scan} revealed={revealed} progress={scanProgress} domain={website || companyName} />
      )}
      {step === 3 && (
        <ConfirmStep
          description={description} setDescription={setDescription}
          contactName={contactName} setContactName={setContactName}
          contactEmail={contactEmail} setContactEmail={setContactEmail}
          dpoName={dpoName} setDpoName={setDpoName}
          dpoEmail={dpoEmail} setDpoEmail={setDpoEmail}
          securityName={securityName} setSecurityName={setSecurityName}
          securityEmail={securityEmail} setSecurityEmail={setSecurityEmail}
          incidentName={incidentName} setIncidentName={setIncidentName}
          incidentEmail={incidentEmail} setIncidentEmail={setIncidentEmail}
          incidentPhone={incidentPhone} setIncidentPhone={setIncidentPhone}
          dpoType={dpoType} setDpoType={setDpoType}
          privacyUrl={privacyUrl} setPrivacyUrl={setPrivacyUrl}
          encryption={encryption} setEncryption={setEncryption}
          mfa={mfa} setMfa={setMfa}
          subProcessors={subProcessors} setSubProcessors={setSubProcessors}
          hasWebsite={hasWebsite}
          website={website}
          scan={scan}
        />
      )}
      {step === 4 && !isCalculating && (
        <DocumentsStep documents={documents} onUpload={uploadDocument} />
      )}
      {step === 5 && (
        <CriticalVendorsStep
          rows={criticalVendors}
          onChange={setCriticalVendors}
          subprocessorList={subprocessorList}
          onSubprocessorChange={setSubprocessorList}
        />

      )}
      {step === 6 && (
        <MaturityStep answers={maturityAnswers} sources={laraSources} onChange={updateMaturity} />
      )}
      {step === 7 && !isCalculating && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Profilen er privat som standard. Andre Mynder-brukere kan finne deg og be om tilgang — du godkjenner hver forespørsel.
          </p>
          <VisibilityStep
            visibility={visibility}
            setVisibility={setVisibility}
            publicAcknowledged={publicAcknowledged}
            setPublicAcknowledged={setPublicAcknowledged}
          />
          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            Partner-relasjon kan legges til senere i Rediger profil.
          </p>
        </div>
      )}
      {step === 7 && isCalculating && (
        <CalculatingScoreStep activeStep={calcStep} score={trustScore} />
      )}
    </div>
  );

  const footer = step === 2 ? null : (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
      <Button variant="ghost" onClick={(hasOrgPrefill && step === 1) ? handleSkip : back} disabled={isPublishing || isCalculating}>
        {(hasOrgPrefill && step === 1) ? "Hopp over" : (<><ArrowLeft className="h-4 w-4 mr-1.5" /> Tilbake</>)}
      </Button>

      {step < 7 ? (
        <div className="flex gap-2">
          <Button data-demo-target="wizard-primary-cta" onClick={next} disabled={!canNext} className="gap-2 rounded-full bg-[hsl(var(--mynder-blue))] hover:bg-[hsl(var(--mynder-blue))]/90 text-white">
            {step === 1 && (<><Sparkles className="h-4 w-4" /> Fortsett — la Lara kartlegge</>)}
            {step === 3 && (<>Til dokumenter <ArrowRight className="h-4 w-4" /></>)}
            {step === 4 && (<>Til kritiske leverandører <ArrowRight className="h-4 w-4" /></>)}
            {step === 5 && (<>Til modenhet <ArrowRight className="h-4 w-4" /></>)}
            {step === 6 && (<>Velg synlighet <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      ) : (
        <Button
          data-demo-target="wizard-primary-cta"
          onClick={() => handlePublish()}
          disabled={isPublishing}

          className="gap-2 rounded-full bg-[hsl(var(--mynder-blue))] hover:bg-[hsl(var(--mynder-blue))]/90 text-white"
        >
          {isPublishing || isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isCalculating ? "Lara beregner Trust Score …" : "Fullfør aktivering — gå til Trust Profile"}
        </Button>
      )}
    </div>
  );

  if (inline) {
    if (!open) return null;
    if (conversation) {
      const laraIntro =
        step === 1 ? "Hei! Jeg er Lara. La oss aktivere Trust Center-profilen din sammen — det tar bare et par minutter." :
        step === 2 ? "Jeg leter gjennom hjemmesiden din og offentlige kilder nå …" :
        step === 3 ? "Her er det jeg fant. Bekreft eller juster gjerne — alt er forhåndsutfylt." :
        step === 4 ? "Har du noen policyer å laste opp? Jeg kobler dem til riktig krav automatisk." :
        step === 5 ? "Hvem er de viktigste leverandørene som har tilgang til systemene eller dataene dine?" :
        step === 6 ? "La oss gå gjennom modenheten din. Jeg har gjettet basert på det jeg fant." :
        step === 7 ? "Siste steg — hvem skal få se profilen?" :
        "";
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          {autoPlay && <DemoCursor ref={cursorRef} />}
          {/* Stepper */}
          <nav aria-label="Aktiveringssteg" className="px-1">
            <ol className="flex items-start gap-2">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const isDone = n < step;
                const isCurrent = n === step;
                return (
                  <li key={label} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : isDone
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`h-px flex-1 ${n < step ? "bg-primary/40" : "bg-border"}`} />
                      )}
                    </div>
                    <div
                      className={`mt-1.5 text-[11px] leading-tight truncate ${
                        isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      title={label}
                    >
                      {label}
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Lara message */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground">Lara · Steg {step} av {TOTAL_STEPS}</div>
              <p className="text-sm text-foreground leading-snug">{laraIntro}</p>
            </div>
          </div>

          {/* User reply area: the actual step content */}
          <Card className="p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300" key={step}>
            {body}
            {!isCalculating && footer}
          </Card>
        </div>
      );
    }
    return (
      <Card className="max-w-3xl mx-auto p-6 space-y-4">
        {autoPlay && <DemoCursor ref={cursorRef} />}
        {!isCalculating && header}
        {body}
        {!isCalculating && footer}
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {autoPlay && <DemoCursor ref={cursorRef} />}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {!isCalculating && (
          <DialogHeader className="space-y-3">
            {header}
          </DialogHeader>
        )}
        {body}
        {!isCalculating && footer}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Steps -------------------- */

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Lara kartlegger det hun finner — du bekrefter eller justerer. Det tar under 10 minutter.
      </p>
    </div>
  );
}

function OrgStep({
  companyName, setCompanyName, orgNumber, setOrgNumber, website, setWebsite,
  websiteVerified, onVerifyWebsite,
  verified, isLoading, searchResults, onSearch, onPick, companyNameLocked, orgPrefilled,
  hasWebsite, setHasWebsite,
}: any) {
  const showSearchHint = companyNameLocked && !orgNumber && (searchResults?.length ?? 0) === 0 && !isLoading;

  // Compact "confirmed organisation" summary when everything except website is known.
  if (orgPrefilled) {
    return (
      <div className="space-y-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{companyName}</p>
                <Badge variant="outline" className="text-[10px] gap-1 border-success/40 text-success">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verifisert
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Org.nr {orgNumber} · Norge
              </p>
            </div>
          </div>
        </Card>

        <WebsiteChoice hasWebsite={hasWebsite} setHasWebsite={setHasWebsite} />

        {hasWebsite === "yes" && (
          <WebsiteVerifyField
            website={website}
            setWebsite={setWebsite}
            websiteVerified={websiteVerified}
            onVerifyWebsite={onVerifyWebsite}
            enabled={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selskapsnavn</Label>
        <div className="flex gap-2">
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="F.eks. DIPS Arena AS"
            autoFocus={!companyNameLocked}
            disabled={companyNameLocked}
          />
          {!companyNameLocked && (
            <Button variant="outline" onClick={onSearch} disabled={isLoading || companyName.trim().length < 2} className="gap-1.5 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Søk i Brreg
            </Button>
          )}
        </div>
        {companyNameLocked && (
          <p className="text-xs text-muted-foreground">Hentet fra kontoen din. Skriv inn org.nr eller velg fra treffene under.</p>
        )}
      </div>

      {isLoading && companyNameLocked && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Slår opp i Brønnøysundregistrene…
        </div>
      )}

      {searchResults?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {companyNameLocked ? "Velg riktig organisasjon" : "Treff i registeret"}
          </p>
          {searchResults.slice(0, 4).map((r: any) => (
            <Card key={r.organisasjonsnummer}
              className={`p-2.5 cursor-pointer transition-colors ${orgNumber === r.organisasjonsnummer ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
              onClick={() => onPick(r.organisasjonsnummer, r.navn)}>
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.navn}</p>
                  <p className="text-xs text-muted-foreground">Org.nr {r.organisasjonsnummer}{r.forretningsadresse?.poststed ? ` · ${r.forretningsadresse.poststed}` : ""}</p>
                </div>
                {orgNumber === r.organisasjonsnummer && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showSearchHint && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" /> Fant ingen automatiske treff — skriv inn org.nr manuelt.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Organisasjonsnummer</Label>
          <Input value={orgNumber} onChange={(e) => { setOrgNumber(e.target.value); }} placeholder="9 sifre" autoFocus={companyNameLocked && !orgNumber} />
        </div>
        <div className="space-y-2">
          <Label>Land</Label>
          <Input value="Norge" disabled />
        </div>
      </div>

      <WebsiteChoice hasWebsite={hasWebsite} setHasWebsite={setHasWebsite} disabled={!verified} />

      {hasWebsite === "yes" && (
        <WebsiteVerifyField
          website={website}
          setWebsite={setWebsite}
          websiteVerified={websiteVerified}
          onVerifyWebsite={onVerifyWebsite}
          enabled={verified}
        />
      )}

    </div>
  );
}

function WebsiteChoice({
  hasWebsite, setHasWebsite, disabled,
}: {
  hasWebsite: "yes" | "no" | null;
  setHasWebsite: (v: "yes" | "no") => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>Oppgi hjemmeside</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={hasWebsite === "yes" ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-1.5"
          disabled={disabled}
          onClick={() => setHasWebsite("yes")}
        >
          <Globe className="h-3.5 w-3.5" /> Ja, har hjemmeside
        </Button>
        <Button
          type="button"
          variant={hasWebsite === "no" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          disabled={disabled}
          onClick={() => setHasWebsite("no")}
        >
          Har ikke hjemmeside
        </Button>
      </div>
      {hasWebsite === "no" && (
        <p className="text-xs text-muted-foreground">
          Greit — Lara hopper over nettside-skanningen. Du fyller inn beskrivelse og kontakter manuelt i neste steg.
        </p>
      )}
    </div>
  );
}



function WebsiteVerifyField({
  website, setWebsite, websiteVerified, onVerifyWebsite, enabled,
}: {
  website: string;
  setWebsite: (v: string) => void;
  websiteVerified: boolean;
  onVerifyWebsite: () => void;
  enabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Hjemmeside</Label>
        {enabled && website && !websiteVerified && (
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
            <Sparkles className="h-2.5 w-2.5" /> Forslag fra Lara
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.no"
          disabled={!enabled}
          autoFocus={enabled && !websiteVerified}
        />
        <Button
          variant={websiteVerified ? "outline" : "default"}
          onClick={onVerifyWebsite}
          disabled={!enabled || website.trim().length < 4 || websiteVerified}
          className="gap-1.5 shrink-0"
        >
          {websiteVerified ? (<><CheckCircle2 className="h-4 w-4" /> Bekreftet</>) : "Bekreft"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {!enabled
          ? "Velg organisasjon først — så foreslår Lara hjemmesiden automatisk."
          : websiteVerified
            ? "Lara bruker denne i neste steg for å hente bedriftsinfo, kontakter, personvern og sikkerhet."
            : "Stemmer adressen? Juster hvis ikke, og trykk Bekreft."}
      </p>
    </div>
  );
}

function ScanStep({ scan, revealed, progress, domain }: { scan: LaraScanResult; revealed: number; progress: number; domain: string }) {
  const done = revealed >= scan.findings.length;
  const currentFinding = !done ? scan.findings[Math.min(revealed, scan.findings.length - 1)] : null;
  const currentLabel = done
    ? "Ferdig med kartleggingen"
    : (currentFinding?.label ?? "Forbereder kartlegging");

  return (
    <div className="py-10 flex flex-col items-center text-center space-y-5">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          {done ? (
            <CheckCircle2 className="h-7 w-7 text-success" />
          ) : (
            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
          )}
        </div>
        {!done && (
          <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary animate-spin" />
        )}
      </div>

      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold">
          {done
            ? "Lara er ferdig med kartleggingen"
            : <>Lara kartlegger <span className="text-muted-foreground">{domain || "hjemmesiden"}</span>…</>}
        </p>
        <p className="text-xs text-muted-foreground min-h-[1rem] transition-opacity duration-300" key={currentLabel}>
          {currentLabel}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}


function FieldGroup({ icon: Icon, title, children }: any) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </Card>
  );
}

function PrefilledHint({ source }: { source: string }) {
  return (
    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
      <Sparkles className="h-3 w-3 text-primary" />
      <span>Fra {source}</span>
    </p>
  );
}

function ConfirmStep(props: any) {
  const fromLara = props.hasWebsite === "yes" && !!props.scan;
  const sources = fromLara ? {
    description: "hjemmesiden",
    primary: props.scan?.contacts?.primaryEmail ? "kontaktside" : null,
    dpo: props.scan?.contacts?.dpoEmail ? "personvernerklæring" : null,
    security: (props.scan?.contacts as any)?.securityEmail ? "security.txt" : null,
  } : { description: null, primary: null, dpo: null, security: null };

  return (
    <div className="space-y-3">
      {fromLara && (
        <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lara fylte ut dette fra <span className="font-medium">{props.website || "hjemmesiden din"}</span>. Endre det du vil — eller bare gå videre.
          </p>
        </div>
      )}

      <FieldGroup icon={Building2} title="Om virksomheten">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            Beskrivelse
            {sources.description && <Sparkles className="h-3 w-3 text-primary" />}
          </Label>
          <Textarea value={props.description} onChange={(e) => props.setDescription(e.target.value)} rows={3} />
          {sources.description && <PrefilledHint source={sources.description} />}
        </div>
      </FieldGroup>

      <FieldGroup icon={Users} title="Hovedkontakt">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Navn</Label>
            <Input value={props.contactName} onChange={(e) => props.setContactName(e.target.value)} placeholder="Navn" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              E-post
              {sources.primary && <Sparkles className="h-3 w-3 text-primary" />}
            </Label>
            <Input type="email" value={props.contactEmail} onChange={(e) => props.setContactEmail(e.target.value)} placeholder="kontakt@firma.no" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Du kan legge til personvern-, sikkerhets- og beredskapskontakter senere i Rediger profil.
        </p>
      </FieldGroup>
    </div>
  );
}

function PreviewStep({ name, orgNumber, description, website, contactName, contactEmail, privacyUrl, encryption, certifications, subProcessors, maturityAnswers, documents }: any) {
  const answered = maturityAnswers ? Object.values(maturityAnswers).filter((v) => v === "yes" || v === "no" || v === "n_a").length : 0;
  const later = maturityAnswers ? Object.values(maturityAnswers).filter((v) => v === "later").length : 0;
  const docCount = documents ? documents.filter((d: ActivationDocument) => d.status === "uploaded" || d.status === "found").length : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" /> Forhåndsvisning av Trust Profile
      </div>
      <Card className="p-5 space-y-4 bg-gradient-to-br from-card to-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate">{name || "Bedriften din"}</h3>
            <p className="text-xs text-muted-foreground">Org.nr {orgNumber || "—"} {website ? `· ${website.replace(/^https?:\/\//, "")}` : ""}</p>
          </div>
          <Badge variant="outline" className="border-success/40 text-success gap-1">
            <ShieldCheck className="h-3 w-3" /> Aktiv
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Kontakt</p>
              <p className="truncate">{contactName || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{contactEmail || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Personvern</p>
              <p className="text-xs truncate">{privacyUrl || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 col-span-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Sikkerhet</p>
              <p className="text-xs">{encryption || "—"}</p>
              {certifications?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {certifications.map((c: string) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
                </div>
              )}
            </div>
          </div>
          {subProcessors && (
            <div className="flex items-start gap-2 col-span-2">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Underleverandører</p>
                <p className="text-xs">{subProcessors}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {(maturityAnswers || documents) && (
        <Card className="p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span><span className="font-medium text-foreground">Modenhet:</span> {answered} av {ALL_MATURITY_QUESTIONS.length} besvart{later > 0 ? ` · ${later} markert «Senere»` : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span><span className="font-medium text-foreground">Dokumenter:</span> {docCount} klart for profilen</span>
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/40">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Når du publiserer blir profilen tilgjengelig på <code className="px-1 bg-background rounded">trust.mynder.no</code> og kan deles med kunder og partnere.</span>
      </div>
    </div>
  );
}

/* -------------------- Maturity step -------------------- */

function MaturityStep({ answers, sources, onChange }: {
  answers: MaturityAnswers;
  sources: Record<string, string>;
  onChange: (id: string, answer: MaturityAnswer) => void;
}) {
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});
  const toggleArea = (id: string) => setOpenAreas((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Lara har svart for deg. Bekreft eller juster.
        </p>

        {MATURITY_AREAS.map((area) => {
          const Icon = area.icon;
          const isOpen = openAreas[area.id] ?? false;
          const total = area.questions.length;
          const laraAnswered = area.questions.filter(
            (q) => sources[q.id] && !sources[q.id]?.includes("Regelverk") && (answers[q.id] === "yes" || answers[q.id] === "n_a"),
          ).length;
          return (
            <Card key={area.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleArea(area.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition text-left"
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-tight">{area.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {total} spørsmål{laraAnswered > 0 ? ` · ${laraAnswered} bekreftet av Lara` : ""}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-border">
                  {area.questions.map((q) => {
                    const val = answers[q.id] ?? "later";
                    const laraSrc = sources[q.id];
                    return (
                      <div key={q.id} className="flex items-start gap-3 py-1.5 border-t border-border first:border-t-0 first:pt-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5">
                            <p className="text-sm text-foreground leading-snug">{q.text}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0">
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                GDPR {q.article}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {laraSrc && !laraSrc.includes("Regelverk") && (val === "yes" || val === "n_a") && (
                            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              val === "n_a" ? "bg-muted text-muted-foreground border border-border" : "bg-primary/10 text-primary"
                            }`}>
                              <Sparkles className="h-2.5 w-2.5" />
                              {val === "n_a" ? "Lara: ikke aktuelt" : "Svart av Lara"}
                            </span>
                          )}
                        </div>
                        <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5 shrink-0">
                          {[
                            { v: "yes" as const, label: "Ja" },
                            { v: "no" as const, label: "Nei" },
                            { v: "n_a" as const, label: "Ikke aktuelt" },
                            { v: "later" as const, label: "Senere" },
                          ].map((opt) => {
                            const active = val === opt.v;
                            return (
                              <button
                                key={opt.v}
                                type="button"
                                onClick={() => onChange(q.id, opt.v)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                                  active
                                    ? opt.v === "yes" ? "bg-success text-success-foreground"
                                    : opt.v === "no" ? "bg-destructive text-destructive-foreground"
                                    : opt.v === "n_a" ? "bg-muted text-muted-foreground border border-border"
                                    : "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

/* -------------------- Critical vendors step -------------------- */

type SubprocessorListInput = {
  source: "upload" | "url" | "none";
  file?: File | null;
  fileName?: string;
  url?: string;
};

function CriticalVendorsStep({ rows, onChange, subprocessorList, onSubprocessorChange }: {
  rows: CriticalVendorRow[];
  onChange: (rows: CriticalVendorRow[]) => void;
  subprocessorList: SubprocessorListInput;
  onSubprocessorChange: (next: SubprocessorListInput) => void;
}) {
  const updateRow = (idx: number, patch: Partial<CriticalVendorRow>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onChange(next.length === 0 ? [{ ...EMPTY_VENDOR_ROW }] : next);
  };
  const addRow = () => {
    if (rows.length >= MAX_CRITICAL_VENDORS) return;
    onChange([...rows, { ...EMPTY_VENDOR_ROW }]);
  };

  const onFile = (file: File | null) => {
    if (!file) return;
    onSubprocessorChange({ source: "upload", file, fileName: file.name });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <VendorRowCard
            key={idx}
            row={row}
            index={idx}
            canRemove={rows.length > 1}
            onChange={(patch) => updateRow(idx, patch)}
            onRemove={() => removeRow(idx)}
          />
        ))}
      </div>

      {rows.length < MAX_CRITICAL_VENDORS && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-sm"
          onClick={addRow}
        >
          <Plus className="h-3.5 w-3.5" /> Legg til leverandør
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground pt-1">
        Samlet liste over alle underleverandører kan lastes opp senere i Rediger profil.
      </p>


    </div>
  );
}

function VendorRowCard({ row, index, canRemove, onChange, onRemove }: {
  row: CriticalVendorRow;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<CriticalVendorRow>) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState(row.name);
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => findVendorSuggestions(query, 6), [query]);
  const knownVendor = useMemo(() => findVendorByName(row.name), [row.name]);

  const selectVendor = (v: VendorSuggestion) => {
    const patch: Partial<CriticalVendorRow> = { name: v.name };
    if (!row.purpose.trim()) patch.purpose = v.category;
    if (v.dpaType === "standard") patch.dpa = "yes";
    onChange(patch);
    setQuery(v.name);
    setOpen(false);
  };

  const toggleCategory = (cat: string) => {
    const has = row.dataCategories.includes(cat);
    onChange({
      dataCategories: has
        ? row.dataCategories.filter((c) => c !== cat)
        : [...row.dataCategories, cat],
    });
  };

  const dpaOptions: { value: "yes" | "no" | "unknown"; label: string }[] = [
    { value: "yes", label: "Ja" },
    { value: "no", label: "Nei" },
    { value: "unknown", label: "Vet ikke" },
  ];

  const ppdOptions: { value: "yes" | "no"; label: string }[] = [
    { value: "yes", label: "Ja" },
    { value: "no", label: "Nei" },
  ];

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Leverandør {index + 1}
        </span>
        {canRemove && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Fjern leverandør"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Vendor name with autosuggest */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Navn på leverandør</Label>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({ name: e.target.value });
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder="Begynn å skriv — f.eks. Microsoft, Tripletex, AWS …"
            className="text-sm"
            autoComplete="off"
          />
          {open && query.length > 0 && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow-md">
              {suggestions.map((v) => (
                <li key={v.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectVendor(v);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted text-sm flex flex-col"
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="text-[11px] text-muted-foreground">{v.category}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Purpose — short sentence / category */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Hva gjør de for dere?</Label>
        <Input
          value={row.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          placeholder={'f.eks. "Skylagring", "HR-system", "Fakturering"'}
          className="text-sm"
        />
        {knownVendor && row.purpose.trim() !== knownVendor.category && (
          <button
            type="button"
            onClick={() => onChange({ purpose: knownVendor.category })}
            className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            + Bruk forslag: {knownVendor.category}
          </button>
        )}
      </div>

      {/* Personal data processing */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Behandler de personopplysninger på dine vegne?
        </Label>
        <div className="flex gap-1.5">
          {ppdOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={row.processesPersonalData === opt.value ? "default" : "outline"}
              className="h-8 flex-1"
              onClick={() =>
                onChange({
                  processesPersonalData: opt.value,
                  ...(opt.value === "no" ? { dataCategories: [] } : {}),
                })
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {row.processesPersonalData === "yes" && (
          <div className="pt-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hvilken kategori?</Label>
            <div className="flex flex-wrap gap-1.5">
              {DATA_CATEGORY_OPTIONS.map((cat) => {
                const active = row.dataCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={
                      active
                        ? "text-xs px-2.5 py-1 rounded-full bg-primary text-primary-foreground border border-primary"
                        : "text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DPA — special handling for standard-DPA vendors */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Har dere en DPA med dem?
        </Label>
        {knownVendor?.dpaType === "standard" ? (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 flex gap-2 text-xs text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              {knownVendor.dpaNote ??
                `${knownVendor.name} tilbyr en standard databehandleravtale som gjelder for alle kunder. Egen signert avtale er normalt ikke nødvendig.`}
            </span>
          </div>
        ) : (
          <>
            <div className="flex gap-1.5">
              {dpaOptions.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={row.dpa === opt.value ? "default" : "outline"}
                  className="h-8 flex-1"
                  onClick={() => onChange({ dpa: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {row.processesPersonalData === "no" && (
              <p className="text-[11px] text-muted-foreground">
                DPA er normalt ikke påkrevd når leverandøren ikke behandler personopplysninger.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}



/* -------------------- Documents step -------------------- */


function DocumentsStep({ documents, onUpload }: {
  documents: ActivationDocument[];
  onUpload: (slotId: string, fileName: string) => void;
}) {
  const getDoc = (slotId: string) => documents.find((d) => d.slot === slotId);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Valgfritt. Du kan også laste opp senere.
      </p>


      {DOCUMENT_SLOTS.map((slot) => {
        const doc = getDoc(slot.id);
        const status = doc?.status ?? "skipped";
        return (
          <Card key={slot.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">{slot.title}</h4>
                  {status === "found" && (
                    <Badge variant="secondary" className="bg-success/15 text-success border-success/30 gap-1 text-[10px]">
                      <Check className="h-2.5 w-2.5" /> Funnet av Lara
                    </Badge>
                  )}
                  {status === "uploaded" && (
                    <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30 gap-1 text-[10px]">
                      <Check className="h-2.5 w-2.5" /> Lastet opp
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
                {doc?.fileName && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 italic truncate">{doc.fileName}</p>
                )}
              </div>
              <div className="shrink-0">
                <label className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/50 cursor-pointer transition">
                  <Upload className="h-3.5 w-3.5" />
                  {status === "uploaded" || status === "found" ? "Bytt ut" : "Last opp"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(slot.id, f.name);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </Card>
        );
      })}

    </div>
  );
}

/* -------------------- Score gauge + calculating step -------------------- */

function ScoreGauge({ score, strokeClass }: { score: number; strokeClass: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} className="stroke-muted fill-none" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={radius}
          className={`${strokeClass} fill-none transition-all duration-700`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums">{score}</span>
      </div>
    </div>
  );
}

function CalculatingScoreStep({ activeStep, score }: { activeStep: number; score: number }) {
  const items = [
    "Vekter modenhetssvar mot rammeverk",
    "Sammenstiller dokumenter Lara har funnet",
    "Sammenligner mot bransjestandard",
  ];
  return (
    <div className="py-8 flex flex-col items-center text-center space-y-5">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-primary animate-pulse" />
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 text-primary animate-spin" />
      </div>
      <div>
        <p className="text-sm font-semibold">Lara beregner foreløpig Trust Score …</p>
        <p className="text-xs text-muted-foreground mt-1">
          Skåren er en aggregert vurdering opp mot bransjestandard. Den vises på neste steg{score > 0 ? ` (≈ ${score} / 100)` : ""}.
        </p>
      </div>
      <ul className="space-y-2 text-left w-full max-w-sm">
        {items.map((label, i) => {
          const done = activeStep > i;
          const active = activeStep === i;
          return (
            <li key={label} className="flex items-center gap-2 text-xs">
              {done ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground"}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function VisibilityStep({
  visibility,
  setVisibility,
  publicAcknowledged,
  setPublicAcknowledged,
}: {
  visibility: TrustVisibility;
  setVisibility: (v: TrustVisibility) => void;
  publicAcknowledged: boolean;
  setPublicAcknowledged: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {ALL_VISIBILITY_LEVELS.map((level) => {
        const meta = VISIBILITY_META[level];
        const Icon = meta.icon;
        const selected = visibility === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => setVisibility(level)}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${
              selected
                ? "border-[hsl(var(--mynder-blue))] bg-[hsl(var(--mynder-blue))]/5 ring-2 ring-[hsl(var(--mynder-blue))]/20"
                : "border-border hover:border-foreground/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
                  selected ? "bg-[hsl(var(--mynder-blue))] text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{meta.labelNb}</h3>
                  {level === "ecosystem" && (
                    <Badge variant="outline" className="text-[10px] border-[hsl(var(--mynder-blue))]/40 text-[hsl(var(--mynder-blue))]">
                      Anbefalt
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.descNb}</p>
              </div>
              <div
                className={`mt-1 h-4 w-4 rounded-full border-2 ${
                  selected ? "border-[hsl(var(--mynder-blue))] bg-[hsl(var(--mynder-blue))]" : "border-muted-foreground"
                }`}
              />
            </div>
          </button>
        );
      })}

    </div>
  );
}

/* -------------------- Partner relationship block -------------------- */

const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: "msp", label: "MSP" },
  { value: "mssp", label: "MSSP" },
  { value: "it_partner", label: "IT-partner" },
  { value: "consultant", label: "Konsulent" },
  { value: "other", label: "Annet" },
];

type AdditionalPartnerItem = { name: string; companyId: string | null; type: PartnerType | null };

function PartnerSelectionBlock({
  status, setStatus,
  name, setName,
  companyId, setCompanyId,
  partnerType, setPartnerType,
  showOnProfile, setShowOnProfile,
  additionalPartners, setAdditionalPartners,
}: {
  status: "auto" | "yes" | "no" | "unknown" | null;
  setStatus: (s: "auto" | "yes" | "no" | "unknown" | null) => void;
  name: string;
  setName: (v: string) => void;
  companyId: string | null;
  setCompanyId: (v: string | null) => void;
  partnerType: PartnerType | null;
  setPartnerType: (v: PartnerType | null) => void;
  showOnProfile: boolean;
  setShowOnProfile: (v: boolean) => void;
  additionalPartners: AdditionalPartnerItem[];
  setAdditionalPartners: (v: AdditionalPartnerItem[] | ((p: AdditionalPartnerItem[]) => AdditionalPartnerItem[])) => void;
}) {

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; type?: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  // Debounced search of partner companies in Mynder ecosystem
  useEffect(() => {
    if (status !== "yes" || manualEntry || search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from("company_profile")
          .select("id, name, partner_type, is_msp_partner")
          .ilike("name", `%${search.trim()}%`)
          .limit(8);
        setResults(
          (data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            type: r.partner_type ?? (r.is_msp_partner ? "msp" : null),
          })),
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, status, manualEntry]);

  // Auto-detected: confirmation card
  if (status === "auto") {
    return (
      <Card className="p-4 bg-success/5 border-success/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-success/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              Lara har sett at <strong>{name || "en partner"}</strong> forvalter sikkerheten din.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bekreft at dette skal vises på Trust Profilen din.
            </p>

          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-7 px-2 text-xs gap-1"
            onClick={() => { setStatus("yes"); setManualEntry(true); }}
          >
            <Pencil className="h-3 w-3" /> Endre
          </Button>
        </div>
        <label className="flex items-start gap-2 cursor-pointer select-none rounded-md bg-background/60 border border-border p-2.5">
          <Checkbox
            checked={showOnProfile}
            onCheckedChange={(v) => setShowOnProfile(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground leading-snug">
            Vis partner-tilknytningen på Trust Profilen min
          </span>
        </label>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Handshake className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold">IT- og/eller sikkerhetspartner</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Her kan du oppgi om du bruker en IT- og/eller sikkerhetspartner. Du kan legge til flere.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { v: "yes" as const, label: "Ja, koblet til partner" },
          { v: "no" as const, label: "Nei, jeg forvalter selv" },
          { v: "unknown" as const, label: "Vet ikke ennå" },
        ].map((opt) => {
          const selected = status === opt.v;
          return (
            <button
              key={opt.v}
              type="button"
              onClick={() => { setStatus(opt.v); if (opt.v !== "yes") { setName(""); setCompanyId(null); setPartnerType(null); } }}
              className={`text-left rounded-xl border p-3 text-xs font-medium transition-all ${
                selected
                  ? "border-[hsl(var(--mynder-blue))] bg-[hsl(var(--mynder-blue))]/5 ring-2 ring-[hsl(var(--mynder-blue))]/20"
                  : "border-border hover:border-foreground/20"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {status === "yes" && (
        <Card className="p-3 space-y-3 border-primary/20 bg-primary/5">
          {!manualEntry && !companyId && (
            <div className="space-y-2">
              <Label className="text-xs">Søk etter partner i Mynder-økosystemet</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Skriv navn på partner…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              {searching && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Søker…
                </p>
              )}
              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setName(r.name);
                        setCompanyId(r.id);
                        setPartnerType((r.type as PartnerType) || null);
                      }}
                      className="w-full text-left rounded-md border border-border bg-background p-2 hover:border-primary/40 transition flex items-center gap-2"
                    >
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{r.name}</span>
                      {r.type && (
                        <Badge variant="outline" className="text-[10px]">
                          {PARTNER_TYPE_LABEL[r.type as PartnerType] ?? r.type}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setManualEntry(true)}
                className="text-[11px] text-primary hover:underline"
              >
                Ikke i listen? Skriv inn manuelt →
              </button>
            </div>
          )}

          {(manualEntry || companyId) && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Partnernavn</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (companyId) setCompanyId(null); }}
                    placeholder="F.eks. Atea, Sopra Steria"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Partner-type</Label>
                  <Select
                    value={partnerType ?? ""}
                    onValueChange={(v) => setPartnerType(v as PartnerType)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {companyId && (
                <p className="text-[11px] text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Koblet til partner i Mynder-økosystemet
                </p>
              )}
              {manualEntry && (
                <button
                  type="button"
                  onClick={() => { setManualEntry(false); setName(""); setCompanyId(null); setPartnerType(null); }}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  ← Tilbake til søk
                </button>
              )}
            </div>
          )}

          {(name.trim().length > 0 || additionalPartners.length > 0) && (
            <div className="space-y-2 pt-1">
              {additionalPartners.map((p, idx) => (
                <div key={idx} className="rounded-md border border-border bg-background/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Partner {idx + 2}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdditionalPartners((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Fjern partner"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        setAdditionalPartners((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, name: e.target.value, companyId: null } : it)),
                        )
                      }
                      placeholder="Partnernavn"
                      className="h-9 text-sm"
                    />
                    <Select
                      value={p.type ?? ""}
                      onValueChange={(v) =>
                        setAdditionalPartners((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, type: v as PartnerType } : it)),
                        )
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Velg type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAdditionalPartners((prev) => [...prev, { name: "", companyId: null, type: null }])
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Legg til en partner til
              </button>
            </div>
          )}

          <label className="flex items-start gap-2 cursor-pointer select-none rounded-md bg-background/60 border border-border p-2.5">
            <Checkbox
              checked={showOnProfile}
              onCheckedChange={(v) => setShowOnProfile(v === true)}
              className="mt-0.5"
            />
            <span className="text-xs text-foreground leading-snug">
              Vis partner-tilknytningen på Trust Profilen min
            </span>
          </label>

        </Card>
      )}
    </div>
  );
}
