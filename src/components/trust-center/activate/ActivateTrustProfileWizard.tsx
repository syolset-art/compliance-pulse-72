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
  CheckCircle2, Search, Mail, Lock, FileText, Users, Eye, AlertCircle, Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import { getLaraScanForDomain, SCAN_STEPS_MS, type LaraScanResult } from "@/lib/demoTrustActivation";
import { seedFromActivation, type ActivationValues } from "@/lib/demoSeedTrustProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
  /** Render inline (no modal). Use when embedded directly on the Trust Profile page. */
  inline?: boolean;
  /** Pre-known company name (e.g. from logged-in customer's company_profile). Skips Welcome and auto-searches Brreg. */
  initialCompanyName?: string;
  /** Pre-known org number. When set, Brreg lookup is skipped and the org block is shown as confirmed. */
  initialOrgNumber?: string;
  /** Pre-known domain/website. Used as the website suggestion to verify. */
  initialDomain?: string;
}

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = ["Velkommen", "Organisasjon", "Lara skanner", "Bekreft", "Publiser"];

export default function ActivateTrustProfileWizard({
  open, onOpenChange, onCompleted, inline,
  initialCompanyName, initialOrgNumber, initialDomain,
}: Props) {
  const queryClient = useQueryClient();
  // When we already know the customer (logged-in), skip Welcome and start at Organisasjon.
  const hasPrefill = !!(initialCompanyName && initialCompanyName.trim());
  // When org number is also known, the wizard becomes a single "verify website" step.
  const hasOrgPrefill = hasPrefill && !!(initialOrgNumber && initialOrgNumber.trim());
  const [step, setStep] = useState<Step>(hasPrefill ? 1 : 0);

  // Step 1: org
  const [companyName, setCompanyName] = useState(initialCompanyName ?? "");
  const [orgNumber, setOrgNumber] = useState(initialOrgNumber ?? "");
  const [country] = useState("Norge");
  const normalizeUrl = (u: string) => (u && !/^https?:\/\//i.test(u) ? `https://${u}` : u);
  const [website, setWebsite] = useState(initialDomain ? normalizeUrl(initialDomain) : "");
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
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [encryption, setEncryption] = useState("");
  const [mfa, setMfa] = useState("");
  const [subProcessors, setSubProcessors] = useState("");

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(hasPrefill ? 1 : 0);
        setCompanyName(initialCompanyName ?? "");
        setOrgNumber(initialOrgNumber ?? "");
        setWebsite(initialDomain ? normalizeUrl(initialDomain) : "");
        setWebsiteVerified(false);
        setVerified(hasOrgPrefill);
        setScan(null);
        setScanProgress(0);
        setRevealed(0);
        autoSearchedRef.current = false;
      }, 200);
    }
  }, [open, hasPrefill, hasOrgPrefill, initialCompanyName, initialOrgNumber, initialDomain]);

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

  // When scan finishes, prefill confirm step
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
  }, [scan]);

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
    if (step === 0) return true;
    if (step === 1) return companyName.trim().length > 1 && orgNumber.trim().length > 0 && website.trim().length > 3 && websiteVerified;
    if (step === 2) return revealed >= (scan?.findings.length ?? 0) && scan != null;
    if (step === 3) return description.trim().length > 0;
    return true;
  }, [step, companyName, orgNumber, website, revealed, scan, description]);

  const next = () => setStep((s) => (Math.min(4, s + 1) as Step));
  const back = () => setStep((s) => (Math.max(0, s - 1) as Step));

  const handlePublish = async (publishNow: boolean) => {
    setIsPublishing(true);
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
      publishNow,
    };
    try {
      await seedFromActivation(values);
      try { localStorage.setItem("mynder.trustprofile.activated", "1"); } catch {}
      await queryClient.invalidateQueries({ queryKey: ["self-asset-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["company_profile_trust_center"] });
      toast.success(publishNow ? "Trust Profile publisert" : "Trust Profile lagret som utkast");
      onOpenChange(false);
      onCompleted?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Noe gikk galt");
    } finally {
      setIsPublishing(false);
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
          Aktiver Trust Profile · Steg {step + 1} av 5
        </span>
        {hasPrefill && step === 1 && (
          <Badge variant="outline" className="ml-auto text-[10px] gap-1 border-primary/30 text-primary">
            <CheckCircle2 className="h-3 w-3" /> Innlogget som {companyName}
          </Badge>
        )}
      </div>
      <h2 className="text-xl font-semibold">
        {step === 0 && "Lag din egen Trust Profile"}
        {step === 1 && (hasOrgPrefill
          ? "Bekreft hjemmesiden din"
          : (hasPrefill ? "Bekreft organisasjonsnummer og hjemmeside" : "Bekreft organisasjonen din"))}
        {step === 2 && "Lara kartlegger informasjon og klargjør profilen din"}
        {step === 3 && "Bekreft og juster informasjonen"}
        {step === 4 && "Forhåndsvis og publiser"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {step === 0 && "Du har valgt Mynder Core. Nå lager vi en publiserbar Trust Profile som viser kunder og partnere at du tar sikkerhet og personvern på alvor."}
        {step === 1 && (hasOrgPrefill
          ? "Vi har allerede selskapsnavn, organisasjonsnummer og land. For å fortsette trenger Lara hjemmesiden din."
          : (hasPrefill
            ? "Vi vet allerede hvem du er. For å gjøre resten automatisk trenger Lara organisasjonsnummeret og hjemmesiden din."
            : "Vi henter selskapsdata fra Brønnøysundregistrene slik at det meste er klart fra start."))}
        {step === 2 && "Lara henter inn bedriftsinfo, kontakter, personvern og sikkerhet fra hjemmesiden din. Dette kan ta ett til to minutter — du kan trygt lukke vinduet og komme tilbake for å verifisere senere."}
        {step === 3 && "Alt Lara fant er forhåndsutfylt. Endre det du vil, eller bare gå videre."}
        {step === 4 && "Sånn ser profilen ut. Du kan publisere nå eller lagre som utkast."}
      </p>
      <Progress value={(step / 4) * 100} className="h-1" />
    </div>
  );

  const body = (
    <div className="flex-1 overflow-y-auto py-2 pr-1">
      {step === 0 && <WelcomeStep />}
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
          privacyUrl={privacyUrl} setPrivacyUrl={setPrivacyUrl}
          encryption={encryption} setEncryption={setEncryption}
          mfa={mfa} setMfa={setMfa}
          subProcessors={subProcessors} setSubProcessors={setSubProcessors}
        />
      )}
      {step === 4 && (
        <PreviewStep
          name={companyName}
          orgNumber={orgNumber}
          description={description}
          website={website}
          contactName={contactName}
          contactEmail={contactEmail}
          privacyUrl={privacyUrl}
          encryption={encryption}
          certifications={scan?.security.certifications ?? []}
          subProcessors={subProcessors}
        />
      )}
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
      <Button variant="ghost" onClick={step === 0 || (hasPrefill && step === 1) ? handleSkip : back} disabled={isPublishing}>
        {step === 0 || (hasPrefill && step === 1) ? "Hopp over" : (<><ArrowLeft className="h-4 w-4 mr-1.5" /> Tilbake</>)}
      </Button>

      {step < 4 ? (
        <div className="flex gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Lukk — kom tilbake senere
            </Button>
          )}
          <Button onClick={next} disabled={!canNext} className="gap-2">
            {step === 0 && (<><Sparkles className="h-4 w-4" /> La Lara starte</>)}
            {step === 1 && (<><Sparkles className="h-4 w-4" /> Fortsett — la Lara kartlegge</>)}
            {step === 2 && (<>Se forslag <ArrowRight className="h-4 w-4" /></>)}
            {step === 3 && (<>Forhåndsvis <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handlePublish(false)} disabled={isPublishing}>
            Lagre som utkast
          </Button>
          <Button onClick={() => handlePublish(true)} disabled={isPublishing} className="gap-2">
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Publiser profil
          </Button>
        </div>
      )}
    </div>
  );

  if (inline) {
    if (!open) return null;
    return (
      <Card className="max-w-3xl mx-auto p-6 space-y-4">
        {header}
        {body}
        {footer}
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          {header}
        </DialogHeader>
        {body}
        {footer}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Steps -------------------- */

function WelcomeStep() {
  const items = [
    { icon: Building2, label: "Bedriftsinfo" },
    { icon: Users, label: "Kontakter" },
    { icon: Lock, label: "Personvern" },
    { icon: ShieldCheck, label: "Sikkerhet" },
    { icon: FileText, label: "Dokumenter" },
    { icon: Globe, label: "Underleverandører" },
  ];
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-foreground/80 space-y-1">
            <p><strong>Lara hjelper deg.</strong> Hun går gjennom hjemmesiden din og henter automatisk beskrivelse, kontaktinfo, personvernerklæring og sikkerhetstiltak.</p>
            <p>Du kan justere alt før profilen publiseres på <code className="text-xs bg-muted px-1 rounded">trust.mynder.no</code>.</p>
          </div>
        </div>
      </Card>
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Profilen vil inneholde</p>
        <div className="grid grid-cols-2 gap-2">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-card">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgStep({
  companyName, setCompanyName, orgNumber, setOrgNumber, website, setWebsite,
  websiteVerified, onVerifyWebsite,
  verified, isLoading, searchResults, onSearch, onPick, companyNameLocked, orgPrefilled,
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

        <WebsiteVerifyField
          website={website}
          setWebsite={setWebsite}
          websiteVerified={websiteVerified}
          onVerifyWebsite={onVerifyWebsite}
          enabled={true}
        />
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
            placeholder="F.eks. Framdrift Innovasjon AS"
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

      <WebsiteVerifyField
        website={website}
        setWebsite={setWebsite}
        websiteVerified={websiteVerified}
        onVerifyWebsite={onVerifyWebsite}
        enabled={verified}
      />

      {verified && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="h-4 w-4" />
          Verifisert mot Brønnøysundregistrene
        </div>
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
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
            {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Loader2 className="h-5 w-5 text-primary animate-spin" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {done ? "Lara er ferdig" : "Lara analyserer"} <span className="text-muted-foreground">{domain || "hjemmesiden"}…</span>
            </p>
            <Progress value={progress} className="h-1 mt-1.5" />
          </div>
        </div>
      </Card>

      <div className="space-y-1.5">
        {scan.findings.map((f, idx) => {
          const visible = idx < revealed;
          const status = f.status ?? "found";
          const Icon = status === "missing" ? AlertCircle : status === "info" ? FileText : CheckCircle2;
          const iconColor =
            status === "missing" ? "text-warning" : status === "info" ? "text-primary" : "text-success";
          const borderColor =
            status === "missing" ? "border-warning/30 bg-warning/5"
            : status === "info" ? "border-primary/20 bg-primary/5"
            : "border-border bg-card";
          return (
            <div key={f.key}
              className={`flex items-start gap-2.5 p-2.5 rounded-md border transition-all duration-300 ${
                visible ? `opacity-100 translate-y-0 ${borderColor}` : "opacity-0 -translate-y-1 border-transparent"
              }`}>
              <Icon className={`h-4 w-4 ${iconColor} mt-0.5 shrink-0`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{f.label}</p>
                {f.detail && <p className="text-xs text-muted-foreground">{f.detail}{f.source ? ` · ${f.source}` : ""}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {done && (() => {
        const found = scan.findings.filter((f) => (f.status ?? "found") === "found").length;
        const missing = scan.findings.filter((f) => f.status === "missing").length;
        return (
          <Card className="p-3 bg-success/5 border-success/30 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Sparkles className="h-4 w-4 text-success" />
              <span><strong>Lara fant {found} områder</strong> som er forhåndsutfylt i neste steg.</span>
            </div>
            {missing > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground pl-6">
                <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <span>
                  {missing} {missing === 1 ? "område mangler" : "områder mangler"} på nettsiden — du kan laste opp eller fylle inn dette manuelt etterpå.
                </span>
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
}

function LaraBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
      <Sparkles className="h-2.5 w-2.5" /> Lara
    </span>
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

function ConfirmStep(props: any) {
  return (
    <div className="space-y-3">
      <FieldGroup icon={Building2} title="Om virksomheten">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Beskrivelse</Label><LaraBadge />
          </div>
          <Textarea value={props.description} onChange={(e) => props.setDescription(e.target.value)} rows={3} />
        </div>
      </FieldGroup>

      <FieldGroup icon={Users} title="Kontakter">
        <div className="space-y-4">
          {[
            { key: "main", label: "Hovedkontakt", sub: "Mottar avtaler og DPA-er", name: props.contactName, setName: props.setContactName, email: props.contactEmail, setEmail: props.setContactEmail, emailPh: "kontakt@firma.no", extra: null as React.ReactNode },
            {
              key: "privacy", label: "Personvern", sub: null,
              name: props.dpoName, setName: props.setDpoName, email: props.dpoEmail, setEmail: props.setDpoEmail, emailPh: "personvern@firma.no",
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
            { key: "security", label: "Sikkerhetskontakt", sub: "For sårbarheter og hendelser", name: props.securityName, setName: props.setSecurityName, email: props.securityEmail, setEmail: props.setSecurityEmail, emailPh: "sikkerhet@firma.no", extra: null as React.ReactNode },
          ].map((row) => (
            <div key={row.key} className="grid grid-cols-[180px_1fr_1fr] items-start gap-3">
              <div className="pt-2">
                <div className="text-sm font-semibold text-foreground">{row.label}</div>
                {row.sub && <div className="text-xs text-muted-foreground mt-0.5">{row.sub}</div>}
                {row.extra}
              </div>
              <Input value={row.name} onChange={(e) => row.setName(e.target.value)} placeholder="Navn" />
              <Input type="email" value={row.email} onChange={(e) => row.setEmail(e.target.value)} placeholder={row.emailPh} />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2.5">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            <span className="font-semibold">For mindre selskaper</span> er det helt vanlig at samme person dekker både personvern og sikkerhet — bruk gjerne samme e-post. <span className="font-semibold">DPO-pliktige virksomheter</span> må ha personvernombud som er uavhengig av daglig ledelse.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Kontaktinformasjon vises kun til godkjente kjøpere
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            Usikker? Spør Lara
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </FieldGroup>

      <FieldGroup icon={Lock} title="Personvern">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label>Lenke til personvernerklæring</Label><LaraBadge /></div>
          <Input value={props.privacyUrl} onChange={(e) => props.setPrivacyUrl(e.target.value)} placeholder="https://…/personvern" />
        </div>
      </FieldGroup>

      <FieldGroup icon={ShieldCheck} title="Sikkerhet">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label>Kryptering</Label><LaraBadge /></div>
          <Input value={props.encryption} onChange={(e) => props.setEncryption(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label>Multifaktor (MFA)</Label><LaraBadge /></div>
          <Input value={props.mfa} onChange={(e) => props.setMfa(e.target.value)} />
        </div>
      </FieldGroup>

      <FieldGroup icon={Globe} title="Underleverandører">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label>Sub-processors (kommaseparert)</Label><LaraBadge /></div>
          <Input value={props.subProcessors} onChange={(e) => props.setSubProcessors(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Lara har funnet disse fra hjemmesiden og personvernerklæringen din. Mangler noen? Du kan legge til flere senere fra Trust Profile under «Underleverandører».
          </p>
        </div>
      </FieldGroup>
    </div>
  );
}

function PreviewStep({ name, orgNumber, description, website, contactName, contactEmail, privacyUrl, encryption, certifications, subProcessors }: any) {
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

      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-md bg-muted/40">
        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>Når du publiserer blir profilen tilgjengelig på <code className="px-1 bg-background rounded">trust.mynder.no</code> og kan deles med kunder og partnere.</span>
      </div>
    </div>
  );
}
