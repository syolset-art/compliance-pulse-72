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
  Upload, Check, X, Clock, HelpCircle, Handshake, Pencil, Plus, Trash2,
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
  GENERIC_ACCESS_OPTIONS,
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
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const TOTAL_STEPS = 7;
const STEP_LABELS = ["Organisasjon", "Lara skanner", "Bekreft", "Modenhet", "Kritiske leverandører", "Dokumenter", "Synlighet"];

export type CriticalVendorRow = {
  name: string;
  access: string;
  dpa: "yes" | "no" | "unknown" | null;
};
const EMPTY_VENDOR_ROW: CriticalVendorRow = { name: "", access: "", dpa: null };
const MAX_CRITICAL_VENDORS = 5;

export default function ActivateTrustProfileWizard({
  open, onOpenChange, onCompleted, inline, conversation,
  initialCompanyName, initialOrgNumber, initialDomain, initialMaturity,
}: Props) {
  const queryClient = useQueryClient();
  // When we already know the customer (logged-in), skip Welcome and start at Organisasjon.
  const hasPrefill = !!(initialCompanyName && initialCompanyName.trim());
  // When org number is also known, the wizard becomes a single "verify website" step.
  const hasOrgPrefill = hasPrefill && !!(initialOrgNumber && initialOrgNumber.trim());
  const [step, setStep] = useState<Step>(1);

  // Step 1: org
  const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
  const [orgNumber, setOrgNumber] = useState(initialOrgNumber ?? "");
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
        setCompanyName(initialCompanyName ?? "");
        setOrgNumber(initialOrgNumber ?? "");
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
        .map((v) => ({ name: v.name.trim(), access: v.access.trim(), dpa: v.dpa ?? "unknown" })),
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

  const header = (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Aktiver Trust Profile · Steg {step} av {TOTAL_STEPS}
        </span>
        {hasPrefill && step === 1 && (
          <Badge variant="outline" className="ml-auto text-[10px] gap-1 border-primary/30 text-primary">
            <CheckCircle2 className="h-3 w-3" /> Innlogget som {companyName}
          </Badge>
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {step === 1 && (hasOrgPrefill
          ? "Bekreft hjemmesiden din"
          : (hasPrefill ? "Bekreft organisasjonsnummer og hjemmeside" : "Bekreft organisasjonen din"))}
        {step === 2 && "Lara kartlegger informasjon og klargjør profilen din"}
        {step === 3 && "Bekreft og juster informasjonen"}
        {step === 4 && "Modenhet — bekreft det Lara fant"}
        {step === 5 && "Kritiske leverandører"}
        {step === 6 && "Last opp dokumenter"}
        {step === 7 && "Hvem skal se din Trust Profile?"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {step === 1 && (hasOrgPrefill
          ? "Vi har allerede selskapsnavn, organisasjonsnummer og land. For å fortsette trenger Lara hjemmesiden din."
          : (hasPrefill
            ? "Vi vet allerede hvem du er. For å gjøre resten automatisk trenger Lara organisasjonsnummeret og hjemmesiden din."
            : "Vi henter selskapsdata fra Brønnøysundregistrene slik at det meste er klart fra start."))}
        {step === 2 && "Lara henter inn bedriftsinfo, kontakter, personvern og sikkerhet fra hjemmesiden din. Dette kan ta ett til to minutter — du kan trygt lukke vinduet og komme tilbake for å verifisere senere."}
        {step === 3 && "Alt Lara fant er forhåndsutfylt. Endre det du vil, eller bare gå videre."}
        {step === 4 && "Bekreft, overstyr eller marker «Senere». Lara har forhåndsutfylt det hun fant fra dokumentene."}
        {step === 5 && "Hvilke leverandører har tilgang til dine viktigste systemer eller data? Legg til inntil 5 — dette gir oss et bilde av hvor dine viktigste data faktisk ligger."}
        {step === 6 && "Last opp policyer som dekker hullene. Når du laster opp en DPA, oppdaterer Lara svarene i Modenhet automatisk."}
        {step === 7 && "Velg hvem som skal kunne se Trust Profilen din. Du kan endre dette når som helst fra Trust Profile-siden."}
      </p>
      <Progress value={((step - 1) / (TOTAL_STEPS - 1)) * 100} className="h-1" />
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
          companyNameLocked={hasPrefill}
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
      {step === 4 && (
        <MaturityStep answers={maturityAnswers} sources={laraSources} onChange={updateMaturity} />
      )}
      {step === 5 && (
        <CriticalVendorsStep
          rows={criticalVendors}
          onChange={setCriticalVendors}
          subprocessorList={subprocessorList}
          onSubprocessorChange={setSubprocessorList}
        />

      )}
      {step === 6 && !isCalculating && (
        <DocumentsStep documents={documents} onUpload={uploadDocument} />
      )}
      {step === 7 && !isCalculating && (
        <div className="space-y-6">
          <PartnerSelectionBlock
            status={partnerStatus}
            setStatus={setPartnerStatus}
            name={partnerName}
            setName={setPartnerName}
            companyId={partnerCompanyId}
            setCompanyId={setPartnerCompanyId}
            partnerType={partnerType}
            setPartnerType={setPartnerType}
            showOnProfile={showPartnerOnProfile}
            setShowOnProfile={setShowPartnerOnProfile}
            additionalPartners={additionalPartners}
            setAdditionalPartners={setAdditionalPartners}
          />

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Hvem skal se Trust Profilen?</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Profilen er privat som standard. Andre Mynder-brukere kan finne deg og be om tilgang — du godkjenner hver forespørsel.
            </p>
            <VisibilityStep
              visibility={visibility}
              setVisibility={setVisibility}
              publicAcknowledged={publicAcknowledged}
              setPublicAcknowledged={setPublicAcknowledged}
            />
          </div>
        </div>
      )}
      {step === 7 && isCalculating && (
        <CalculatingScoreStep activeStep={calcStep} score={trustScore} />
      )}
    </div>
  );

  const footer = step === 2 ? null : (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
      <Button variant="ghost" onClick={(hasPrefill && step === 1) ? handleSkip : back} disabled={isPublishing || isCalculating}>
        {(hasPrefill && step === 1) ? "Hopp over" : (<><ArrowLeft className="h-4 w-4 mr-1.5" /> Tilbake</>)}
      </Button>

      {step < 7 ? (
        <div className="flex gap-2">
          <Button onClick={next} disabled={!canNext} className="gap-2 rounded-full bg-[hsl(var(--mynder-blue))] hover:bg-[hsl(var(--mynder-blue))]/90 text-white">
            {step === 1 && (<><Sparkles className="h-4 w-4" /> Fortsett — la Lara kartlegge</>)}
            {step === 3 && (<>Til modenhet <ArrowRight className="h-4 w-4" /></>)}
            {step === 4 && (<>Til kritiske leverandører <ArrowRight className="h-4 w-4" /></>)}
            {step === 5 && (<>Til dokumenter <ArrowRight className="h-4 w-4" /></>)}
            {step === 6 && (<>Velg synlighet <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => handlePublish()}
          disabled={
            isPublishing ||
            partnerStatus === null ||
            (partnerStatus === "yes" && !partnerName.trim())
          }

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
        step === 1 ? "Hei! Jeg er Lara. La oss sette opp Trust Profile-en din sammen — det tar bare et par minutter." :
        step === 2 ? "Jeg leter gjennom hjemmesiden din og offentlige kilder nå …" :
        step === 3 ? "Her er det jeg fant. Bekreft eller juster gjerne — alt er forhåndsutfylt." :
        step === 4 ? "La oss gå gjennom modenheten din. Jeg har gjettet basert på det jeg fant." :
        step === 5 ? "Hvem er de viktigste leverandørene som har tilgang til systemene eller dataene dine?" :
        step === 6 ? "Har du noen policyer å laste opp? Jeg kobler dem til riktig krav automatisk." :
        "Siste steg — hvem skal få se profilen?";
      return (
        <div className="max-w-3xl mx-auto space-y-4">
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
        {!isCalculating && header}
        {body}
        {!isCalculating && footer}
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-foreground/80 space-y-1.5">
            <p><strong>Velkommen!</strong> Du er i ferd med å lage ditt eget <strong>Trust Center</strong> i Mynder — en publiserbar profil som viser kunder og partnere at du tar sikkerhet og personvern på alvor.</p>
          </div>
        </div>
      </Card>
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Slik fungerer det</p>
        <p className="text-sm text-foreground/80">
          Lara kartlegger informasjon du har lagret i Mynder samt offentlige kilder — så slipper du å fylle alt ut fra skratsj.
        </p>
      </div>
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

      {verified && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="h-4 w-4" />
          Verifisert mot Brønnøysundregistrene
        </div>
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

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Loader2 className="h-4 w-4 text-primary animate-spin" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {done
                ? "Lara er ferdig med kartleggingen"
                : <>Lara kartlegger <span className="text-muted-foreground">{domain || "hjemmesiden"}</span>…</>}
            </p>
            <Progress value={progress} className="h-1 mt-1.5" />
          </div>
        </div>
      </Card>

      <div className="space-y-1.5">
        {scan.findings.map((f, i) => {
          const isRevealed = i < revealed;
          const isCurrent = i === revealed && !done;
          if (!isRevealed && !isCurrent) return null;
          return (
            <div
              key={f.key}
              className={`flex items-center gap-2 text-xs px-1 transition-opacity duration-300 ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}
            >
              {isCurrent ? (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
              )}
              <span className="truncate">{f.label}</span>
            </div>
          );
        })}
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
      <Sparkles className="h-3 w-3 text-primary/70" />
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
          <p className="text-xs text-foreground/80 leading-relaxed">
            Lara fylte ut dette fra <span className="font-medium">{props.website || "hjemmesiden din"}</span>. Endre det du vil — eller bare gå videre.
          </p>
        </div>
      )}

      <FieldGroup icon={Building2} title="Om virksomheten">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            Beskrivelse
            {sources.description && <Sparkles className="h-3 w-3 text-primary/70" />}
          </Label>
          <Textarea value={props.description} onChange={(e) => props.setDescription(e.target.value)} rows={3} />
          {sources.description && <PrefilledHint source={sources.description} />}
        </div>
      </FieldGroup>

      <FieldGroup icon={Users} title="Kontakter">
        <div className="space-y-4">
          {[
            { key: "main", label: "Hovedkontakt", sub: "Mottar avtaler og DPA-er", name: props.contactName, setName: props.setContactName, email: props.contactEmail, setEmail: props.setContactEmail, emailPh: "kontakt@firma.no", source: sources.primary, extra: null as React.ReactNode },
            {
              key: "privacy", label: "Personvern", sub: null,
              name: props.dpoName, setName: props.setDpoName, email: props.dpoEmail, setEmail: props.setDpoEmail, emailPh: "personvern@firma.no",
              source: sources.dpo,
              extra: (
                <div className="space-y-1.5">
                  <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5 text-[11px]">
                    <button type="button" onClick={() => props.setDpoType("dpo")} className={`px-2.5 py-0.5 rounded-full transition ${props.dpoType === "dpo" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>DPO</button>
                    <button type="button" onClick={() => props.setDpoType("contact")} className={`px-2.5 py-0.5 rounded-full transition ${props.dpoType === "contact" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>Kontakt</button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">DPO = formelt utnevnt og uavhengig</p>
                </div>
              ),
            },
            { key: "security", label: "Sikkerhetskontakt", sub: "For sårbarheter og hendelser", name: props.securityName, setName: props.setSecurityName, email: props.securityEmail, setEmail: props.setSecurityEmail, emailPh: "sikkerhet@firma.no", source: sources.security, extra: null as React.ReactNode },
          ].map((row) => (
            <div key={row.key} className="grid grid-cols-[180px_1fr_1fr] items-start gap-3">
              <div className="pt-2">
                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {row.label}
                  {row.source && <Sparkles className="h-3 w-3 text-primary/70" />}
                </div>
                {row.sub && <div className="text-xs text-muted-foreground mt-0.5">{row.sub}</div>}
                {row.extra}
              </div>
              <div className="space-y-1">
                <Input value={row.name} onChange={(e) => row.setName(e.target.value)} placeholder="Navn" />
              </div>
              <div className="space-y-1">
                <Input type="email" value={row.email} onChange={(e) => row.setEmail(e.target.value)} placeholder={row.emailPh} />
                {row.source && <PrefilledHint source={row.source} />}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2.5">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            <span className="font-semibold">For mindre selskaper</span> er det helt vanlig at samme person dekker både personvern og sikkerhet — bruk gjerne samme e-post. <span className="font-semibold">DPO-pliktige virksomheter</span> må ha personvernombud som er uavhengig av daglig ledelse.
          </p>
        </div>
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
        <p className="text-sm text-foreground/80">{description}</p>

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
  const fromRegelverkCount = Object.values(sources).filter((s) => s?.includes("Regelverk")).length;
  const laraPrefillIds = Object.keys(sources).filter((id) => !sources[id]?.includes("Regelverk"));
  const laraYes = laraPrefillIds.filter((id) => answers[id] === "yes").length;
  const laraNa = laraPrefillIds.filter((id) => answers[id] === "n_a").length;
  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2.5">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            {fromRegelverkCount > 0 ? (
              <p className="text-xs text-foreground/80 leading-relaxed">
                Lara har hentet data fra <span className="font-medium">Regelverk</span> og fylt ut svarene under. Du kan velge å fortsette å oppdatere i Regelverk før du deler eller publiserer — det <span className="font-medium">må ikke fullføres nå</span>.
              </p>
            ) : (
              <p className="text-xs text-foreground/80 leading-relaxed">
                Lara har svart på <span className="font-medium">{laraYes + laraNa}</span> spørsmål basert på sikre kilder fra kartleggingen
                {laraYes > 0 && <> — <span className="font-medium">{laraYes}</span> bekreftet</>}
                {laraNa > 0 && <>, <span className="font-medium">{laraNa}</span> markert som ikke aktuelt</>}.
                Du kan overstyre alle svar. Resten er satt til «Senere» — fyll inn det du vet.
              </p>
            )}
            <p className="text-xs text-foreground/70 leading-relaxed">
              <span className="font-medium">Tips:</span> Du kan fortsette å heve modenheten din når som helst under <span className="font-medium">Regelverk</span> i menyen — der jobber du systematisk med kontroller per rammeverk, og endringene speiles automatisk her på Trust Profile.
            </p>
          </div>
        </div>


        {MATURITY_AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <Card key={area.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold leading-tight">{area.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{area.subtitle}</p>
                </div>
              </div>
              <div className="space-y-2">
                {area.questions.map((q) => {
                  const val = answers[q.id] ?? "later";
                  const laraSrc = sources[q.id];
                  return (
                    <div key={q.id} className="flex items-start gap-3 py-1.5 border-t border-border first:border-t-0 first:pt-0">
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help ${
                                val === "n_a" ? "bg-muted text-muted-foreground border border-border" : "bg-primary/10 text-primary"
                              }`}>
                                <Sparkles className="h-2.5 w-2.5" />
                                {val === "n_a" ? "Lara: ikke aktuelt (sikker kilde)" : "Svart av Lara (sikker kilde)"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs text-xs">
                              {laraSrc} · Du kan overstyre svaret.
                            </TooltipContent>
                          </Tooltip>
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

      {/* Aggregated subprocessor list — optional upload or public URL */}
      <Card className="p-4 space-y-3 mt-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            Har du en samlet liste over alle underleverandører?
          </p>
          <p className="text-xs text-muted-foreground">
            Mange virksomheter har en åpen oversikt. Last opp listen eller lim inn lenken — så analyserer Lara den
            og kobler hver leverandør mot Mynder-katalogen når du fullfører aktiveringen.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {([
            { id: "upload", label: "Last opp liste", icon: FileUp },
            { id: "url", label: "Lim inn lenke", icon: Link2 },
            { id: "none", label: "Har ikke" },
          ] as const).map((opt) => (
            <Button
              key={opt.id}
              size="sm"
              variant={subprocessorList.source === opt.id ? "default" : "outline"}
              className="h-8 gap-1.5"
              onClick={() => onSubprocessorChange({ source: opt.id })}
            >
              {"icon" in opt && opt.icon ? <opt.icon className="h-3.5 w-3.5" /> : null}
              {opt.label}
            </Button>
          ))}
        </div>

        {subprocessorList.source === "upload" && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors">
              <FileUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {subprocessorList.fileName ?? "Velg CSV, XLSX eller PDF…"}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {subprocessorList.fileName && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => onSubprocessorChange({ source: "upload" })}
              >
                <X className="h-3 w-3 mr-1" /> Fjern fil
              </Button>
            )}
          </div>
        )}

        {subprocessorList.source === "url" && (
          <div className="space-y-1">
            <Input
              value={subprocessorList.url ?? ""}
              onChange={(e) => onSubprocessorChange({ source: "url", url: e.target.value })}
              placeholder="https://leverandor.no/subprocessors"
              className="text-sm h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              Bruk dette hvis Lara ikke fant siden automatisk.
            </p>
          </div>
        )}
      </Card>

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

  // Access stored as comma-separated string for backwards compatibility with seed code.
  const accessChips = useMemo(
    () => row.access.split(",").map((s) => s.trim()).filter(Boolean),
    [row.access],
  );
  const setAccessChips = (chips: string[]) => onChange({ access: chips.join(", ") });
  const toggleChip = (chip: string) => {
    if (accessChips.includes(chip)) setAccessChips(accessChips.filter((c) => c !== chip));
    else setAccessChips([...accessChips, chip]);
  };
  const [customAccess, setCustomAccess] = useState("");

  const selectVendor = (v: VendorSuggestion) => {
    const patch: Partial<CriticalVendorRow> = { name: v.name };
    // Only prefill access if user hasn't typed anything yet
    if (accessChips.length === 0) patch.access = v.suggestedAccess.join(", ");
    // For standard-DPA vendors we set dpa=yes (covered by vendor's standard DPA)
    if (v.dpaType === "standard") patch.dpa = "yes";
    onChange(patch);
    setQuery(v.name);
    setOpen(false);
  };

  // Quick-pick: known vendor's suggestions union generic; deduped
  const accessQuickPicks = useMemo(() => {
    const base = knownVendor?.suggestedAccess ?? GENERIC_ACCESS_OPTIONS;
    return Array.from(new Set([...base, ...GENERIC_ACCESS_OPTIONS])).slice(0, 8);
  }, [knownVendor]);

  const dpaOptions: { value: "yes" | "no" | "unknown"; label: string }[] = [
    { value: "yes", label: "Ja" },
    { value: "no", label: "Nei" },
    { value: "unknown", label: "Vet ikke" },
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

      {/* Access scopes — chips + custom */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Hva har de tilgang til?</Label>

        {accessChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {accessChips.map((chip) => (
              <Badge
                key={chip}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className="rounded hover:bg-background/60 p-0.5"
                  aria-label={`Fjern ${chip}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {accessQuickPicks
            .filter((opt) => !accessChips.includes(opt))
            .map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleChip(opt)}
                className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                + {opt}
              </button>
            ))}
        </div>

        <div className="flex gap-1.5 pt-1">
          <Input
            value={customAccess}
            onChange={(e) => setCustomAccess(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customAccess.trim()) {
                e.preventDefault();
                if (!accessChips.includes(customAccess.trim())) {
                  setAccessChips([...accessChips, customAccess.trim()]);
                }
                setCustomAccess("");
              }
            }}
            placeholder="Legg til egendefinert tilgang og trykk Enter"
            className="text-xs h-8"
          />
        </div>
      </div>

      {/* DPA — special handling for standard-DPA vendors */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Databehandleravtale (DPA)
        </Label>
        {knownVendor?.dpaType === "standard" ? (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 flex gap-2 text-xs text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              {knownVendor.dpaNote ??
                `${knownVendor.name} tilbyr en standard databehandleravtale som gjelder for alle kunder. Egen signert avtale er normalt ikke nødvendig.`}
            </span>
          </div>
        ) : knownVendor?.dpaType === "none" ? (
          <div className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            DPA er normalt ikke aktuelt for denne leverandøren — de behandler ikke personopplysninger på dine vegne.
          </div>
        ) : (
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

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2.5">
        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Last opp policyer som dekker hullene. Når du laster opp en <span className="font-semibold">DPA</span>, oppdaterer Lara automatisk svaret i Modenhet-steget. Alt er valgfritt — du kan komme tilbake senere.
        </p>
      </div>

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

      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/40">
        <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Mangler du dokumenter? Hopp over — du kan laste opp senere fra Trust Profile under «Dokumenter».</span>
      </div>
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
                <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              <span className={done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground/70"}>
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
                  selected ? "border-[hsl(var(--mynder-blue))] bg-[hsl(var(--mynder-blue))]" : "border-muted-foreground/40"
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
