import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBrregLookup, type BrregRolle } from "@/hooks/useBrregLookup";
import mynderLogo from "@/assets/mynder-logo.png";
import {
  Mail, ArrowRight, Upload, Shield, LogIn, CheckCircle2,
  Building2, User, AtSign, FileText, Clock, ChevronLeft,
  Loader2, AlertCircle, Search, ExternalLink, Inbox,
  UserCheck, Send, Bell, Play
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "landing" | "upload" | "upload-done" | "trust-org" | "trust-roles" | "trust-pending" | "trust-profile";

// Demo context: we know who the vendor is from the email
const DEMO_VENDOR = {
  companyName: "Acme Consulting AS",
  contactPerson: "Erik Hansen",
  contactEmail: "erik@acmeconsulting.no",
};

// Mock roles for SE/DK demo companies
const MOCK_ROLES: Record<string, BrregRolle[]> = {
  "Spotify AB": [
    { navn: "Daniel Ek", rolletype: "Daglig leder" },
    { navn: "Martin Lorentzon", rolletype: "Styrets leder" },
  ],
  "Novo Nordisk A/S": [
    { navn: "Lars Fruergaard Jørgensen", rolletype: "Daglig leder" },
    { navn: "Helge Lund", rolletype: "Styrets leder" },
  ],
};

interface SelectedCompany {
  organisasjonsnummer: string;
  navn: string;
  naeringskode1?: { kode: string; beskrivelse: string };
  forretningsadresse?: { kommune: string; poststed: string };
}

export default function VendorResponseDemo() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the user's company profile to personalize the demo
  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_demo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const senderCompanyName = companyProfile?.name || "Din virksomhet";

  // Trust profile flow state
  const [searchQuery, setSearchQuery] = useState(DEMO_VENDOR.companyName);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null);
  const [companyRoles, setCompanyRoles] = useState<BrregRolle[]>([]);
  const [roleEmails, setRoleEmails] = useState<Record<string, string>>({});
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  const {
    searchByName, lookupRoller, lookupByOrgNumber,
    searchResults, rawData, roles,
    isLoading, rolesLoading, rolesError, error,
  } = useBrregLookup();

  // Auto-search when trust-org step loads
  useEffect(() => {
    if (step === "trust-org" && !hasAutoSearched && searchQuery.trim().length >= 2) {
      setHasAutoSearched(true);
      searchByName(searchQuery);
    }
  }, [step, hasAutoSearched, searchQuery, searchByName]);

  const handleSelectCompany = (result: SelectedCompany) => {
    setSelectedCompanyId(result.organisasjonsnummer);
    setSelectedCompany(result);
  };

  const handleConfirmCompany = async () => {
    if (!selectedCompany) return;
    // Fetch roles from Brreg
    const fetchedRoles = await lookupRoller(selectedCompany.organisasjonsnummer);
    if (fetchedRoles.length > 0) {
      setCompanyRoles(fetchedRoles);
    } else {
      // Fallback: check mock data or create generic placeholders
      const mockMatch = MOCK_ROLES[selectedCompany.navn];
      if (mockMatch) {
        setCompanyRoles(mockMatch);
      } else {
        setCompanyRoles([
          { navn: "(Ikke funnet)", rolletype: "Daglig leder" },
          { navn: "(Ikke funnet)", rolletype: "Styrets leder" },
        ]);
      }
    }
    // Also fetch full data for the profile view
    await lookupByOrgNumber(selectedCompany.organisasjonsnummer);
    setStep("trust-roles");
  };

  const handleSendVerification = () => {
    setVerificationSent(true);
    setStep("trust-pending");
  };

  const handleSimulateConfirmation = () => {
    setVerificationConfirmed(true);
  };

  const atLeastOneEmailFilled = Object.values(roleEmails).some(e => e && e.includes("@"));

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const progressPercent = {
    email: 0, landing: 15, upload: 30, "upload-done": 100,
    "trust-org": 30, "trust-roles": 55, "trust-pending": 80, "trust-profile": 100,
  }[step];

  const renderBackButton = (target: Step) => (
    <button onClick={() => setStep(target)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
      <ChevronLeft className="h-4 w-4" /> Tilbake
    </button>
  );

  const companyDisplayName = selectedCompany?.navn || rawData?.navn || DEMO_VENDOR.companyName;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <img src={mynderLogo} alt="Mynder" className="h-7" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">Leverandørdemo</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ExternalLink className="h-4 w-4 mr-1" /> Tilbake til Mynder
            </Button>
          </div>
        </div>
      </header>

      {/* Progress */}
      {step !== "email" && (
        <div className="container max-w-4xl mx-auto px-4 pt-4">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      <main className="container max-w-4xl mx-auto px-4 py-8">

        {/* ===================== STEP 1: EMAIL ===================== */}
        {step === "email" && (
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground mb-4 text-center">Simulert e-postvisning</p>
            <Card className="border-2 shadow-lg">
              <div className="bg-muted/50 px-6 py-4 border-b space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Fra: <strong className="text-foreground">{senderCompanyName}</strong> via Mynder &lt;no-reply@mynder.io&gt;</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Til: {DEMO_VENDOR.contactEmail}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> I dag kl. 09:32
                </div>
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <img src={mynderLogo} alt="Mynder" className="h-6" />
                </div>
                <h2 className="text-xl font-semibold">Forespørsel om oppdatert databehandleravtale</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hei {DEMO_VENDOR.contactPerson},
                  <br /><br />
                   <strong>{senderCompanyName}</strong> bruker Mynder for å administrere sin leverandørkjede og compliance-dokumentasjon.
                   De ber <strong>{DEMO_VENDOR.companyName}</strong> om å sende inn en <strong>oppdatert databehandleravtale (DPA)</strong> innen <strong>15. mars 2026</strong>.
                 </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">Forespørselsdetaljer:</p>
                  <p className="text-sm text-muted-foreground">📄 Dokumenttype: Databehandleravtale (DPA)</p>
                  <p className="text-sm text-muted-foreground">🏢 Fra: {senderCompanyName}</p>
                  <p className="text-sm text-muted-foreground">🏢 Til: {DEMO_VENDOR.companyName}</p>
                  <p className="text-sm text-muted-foreground">⏰ Frist: 15. mars 2026</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Klikk knappen under for å se forespørselen og svare.
                </p>
                <Button size="lg" className="w-full" onClick={() => setStep("landing")}>
                  Se forespørselen <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Denne e-posten er sendt via Mynder på vegne av {senderCompanyName}.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===================== STEP 2: LANDING ===================== */}
        {step === "landing" && (
          <div className="max-w-3xl mx-auto space-y-8">
            {renderBackButton("email")}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">{senderCompanyName} ber om en oppdatert databehandleravtale</h1>
              <p className="text-muted-foreground">Velg hvordan du vil svare på forespørselen</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setStep("upload")}>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">Last opp direkte</CardTitle>
                  <CardDescription className="text-xs">Raskeste alternativet</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Last opp DPA-dokumentet direkte uten å opprette konto.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 hover:border-primary transition-colors cursor-pointer group relative" onClick={() => setStep("trust-org")}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">Anbefalt</span>
                </div>
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base">Opprett Trust Profil</CardTitle>
                  <CardDescription className="text-xs">Gratis — selvdeklarering</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Opprett din egen compliance-profil og administrer alle forespørsler.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate("/auth")}>
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-muted/80 transition-colors">
                    <LogIn className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">Allerede bruker?</CardTitle>
                  <CardDescription className="text-xs">Logg inn</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Har du allerede Mynder? Logg inn og koble forespørselen.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===================== STEP 3A: UPLOAD ===================== */}
        {step === "upload" && (
          <div className="max-w-xl mx-auto space-y-6">
            {renderBackButton("landing")}
            <h2 className="text-xl font-semibold">Last opp databehandleravtale</h2>
            <p className="text-sm text-muted-foreground">Dokumentet sendes direkte til {senderCompanyName}.</p>

            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                uploadedFile && "border-primary bg-primary/5"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileSelect} />
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-10 w-10" />
                  <p className="font-medium">Dra og slipp filen her</p>
                  <p className="text-xs">eller klikk for å velge fil (PDF, DOC, DOCX)</p>
                </div>
              )}
            </div>

             <Button size="lg" className="w-full" disabled={!uploadedFile} onClick={() => setStep("upload-done")}>
               Send dokument til {senderCompanyName} <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
          </div>
        )}

        {/* ===================== STEP 3A DONE ===================== */}
        {step === "upload-done" && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-12">
            <div className="mx-auto h-20 w-20 rounded-full bg-status-closed/10 dark:bg-status-closed/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-status-closed dark:text-status-closed" />
            </div>
            <h2 className="text-2xl font-bold">Dokumentet er sendt!</h2>
            <p className="text-muted-foreground">
              Din databehandleravtale er sendt til <strong>{senderCompanyName}</strong>. De vil gjennomgå dokumentet og komme tilbake til deg.
            </p>
            <Card className="text-left">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm"><strong>Dokument:</strong> {uploadedFile?.name}</p>
                <p className="text-sm"><strong>Sendt til:</strong> {senderCompanyName}</p>
                <p className="text-sm"><strong>Status:</strong> <span className="text-status-closed">Mottatt</span></p>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Vil du ha full kontroll over dine compliance-dokumenter?</p>
              <Button variant="outline" onClick={() => setStep("trust-org")}>
                <Shield className="h-4 w-4 mr-2" /> Opprett gratis Trust Profil
              </Button>
            </div>
          </div>
        )}

        {/* ===================== STEP 3B-1: ORG SEARCH ===================== */}
        {step === "trust-org" && (
          <div className="max-w-lg mx-auto space-y-6">
            {renderBackButton("landing")}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 1 av 3</p>
              <h2 className="text-xl font-semibold">Finn din virksomhet</h2>
              <p className="text-sm text-muted-foreground">
                Vi har forhåndsutfylt basert på forespørselen. Bekreft at dette er riktig selskap.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Selskapsnavn</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Søk etter selskapsnavn..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCompanyId(null);
                    setSelectedCompany(null);
                  }}
                />
                <Button onClick={() => searchByName(searchQuery)} disabled={isLoading || searchQuery.trim().length < 2}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <RadioGroup
                value={selectedCompanyId || ""}
                onValueChange={(val) => {
                  const match = searchResults.find(r => r.organisasjonsnummer === val);
                  if (match) handleSelectCompany(match);
                }}
                className="space-y-2"
              >
                {searchResults.map((result) => (
                  <label
                    key={result.organisasjonsnummer}
                    className={cn(
                      "flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-colors",
                      selectedCompanyId === result.organisasjonsnummer
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <RadioGroupItem value={result.organisasjonsnummer} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{result.navn}</p>
                      <p className="text-xs text-muted-foreground">Org.nr: {result.organisasjonsnummer}</p>
                      {result.naeringskode1 && (
                        <p className="text-xs text-muted-foreground">{result.naeringskode1.beskrivelse}</p>
                      )}
                      {result.forretningsadresse && (
                        <p className="text-xs text-muted-foreground">
                          {result.forretningsadresse.poststed}{result.forretningsadresse.kommune ? `, ${result.forretningsadresse.kommune}` : ""}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}

            {searchResults.length === 0 && !isLoading && hasAutoSearched && (
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Ingen treff. Prøv å justere søket.</p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedCompany || rolesLoading}
              onClick={handleConfirmCompany}
            >
              {rolesLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Henter ledelse...</>
              ) : (
                <>Bekreft og gå videre <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}

        {/* ===================== STEP 3B-2: ROLES ===================== */}
        {step === "trust-roles" && (
          <div className="max-w-lg mx-auto space-y-6">
            {renderBackButton("trust-org")}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 2 av 3</p>
              <h2 className="text-xl font-semibold">Bekreft ledelsen i {companyDisplayName}</h2>
              <p className="text-sm text-muted-foreground">
                En av disse må bekrefte at du representerer selskapet. Oppgi e-postadresse til styrets leder og/eller daglig leder.
              </p>
            </div>

            {rolesError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {rolesError}
              </p>
            )}

            <div className="space-y-4">
              {companyRoles.map((role, idx) => (
                <Card key={idx} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{role.navn}</p>
                        <p className="text-xs text-muted-foreground">{role.rolletype}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">E-postadresse</label>
                      <Input
                        type="email"
                        placeholder={`E-post til ${role.rolletype.toLowerCase()}`}
                        value={roleEmails[`${role.rolletype}-${idx}`] || ""}
                        onChange={(e) =>
                          setRoleEmails(prev => ({ ...prev, [`${role.rolletype}-${idx}`]: e.target.value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
              <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Vi sender en verifiserings-e-post til den/de du oppgir. Når en av dem bekrefter, får du beskjed og kan fortsette.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!atLeastOneEmailFilled}
              onClick={handleSendVerification}
            >
              <Send className="h-4 w-4 mr-2" /> Send verifisering
            </Button>
          </div>
        )}

        {/* ===================== STEP 3B-3: PENDING ===================== */}
        {step === "trust-pending" && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 3 av 3</p>
              <h2 className="text-xl font-semibold">Venter på bekreftelse</h2>
              <p className="text-sm text-muted-foreground">
                Vi har sendt verifisering til ledelsen i {companyDisplayName}. Du kan ikke gå videre før en av dem har bekreftet.
              </p>
            </div>

            <div className="space-y-3">
              {companyRoles.map((role, idx) => {
                const email = roleEmails[`${role.rolletype}-${idx}`];
                const hasSent = !!email && email.includes("@");
                return (
                  <Card key={idx} className={cn("border", verificationConfirmed && hasSent && "border-status-closed/50 bg-status-closed/10 dark:bg-status-closed/10")}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        verificationConfirmed && hasSent
                          ? "bg-status-closed/10 dark:bg-status-closed/30"
                          : hasSent
                            ? "bg-warning/10 dark:bg-warning/30"
                            : "bg-muted"
                      )}>
                        {verificationConfirmed && hasSent ? (
                          <CheckCircle2 className="h-5 w-5 text-status-closed dark:text-status-closed" />
                        ) : hasSent ? (
                          <Clock className="h-5 w-5 text-warning dark:text-warning" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{role.navn}</p>
                        <p className="text-xs text-muted-foreground">{role.rolletype}</p>
                        {hasSent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {verificationConfirmed ? "✅ Bekreftet" : `📧 Sendt til ${email}`}
                          </p>
                        )}
                        {!hasSent && (
                          <p className="text-xs text-muted-foreground mt-1">Ingen e-post oppgitt</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!verificationConfirmed && (
              <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
                <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Du får varsel på e-post når bekreftelsen er mottatt. Du trenger ikke holde denne siden åpen.
                </p>
              </div>
            )}

            {verificationConfirmed && (
              <div className="bg-status-closed/10 dark:bg-status-closed/10 border border-status-closed/20 dark:border-status-closed rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-status-closed dark:text-status-closed flex-shrink-0 mt-0.5" />
                <p className="text-sm text-status-closed dark:text-status-closed">
                  Bekreftelse mottatt! Du kan nå opprette Trust Profilen din.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {!verificationConfirmed && (
                <Button variant="outline" onClick={handleSimulateConfirmation} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Simuler bekreftelse (demo)
                </Button>
              )}

              <Button
                size="lg"
                className="w-full"
                disabled={!verificationConfirmed}
                onClick={() => setStep("trust-profile")}
              >
                Fortsett til Trust Profil <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ===================== STEP 4: TRUST PROFILE ===================== */}
        {step === "trust-profile" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-status-closed/10 dark:bg-status-closed/30 flex items-center justify-center animate-fade-in">
                <CheckCircle2 className="h-8 w-8 text-status-closed dark:text-status-closed" />
              </div>
              <h2 className="text-2xl font-bold">Trust Profilen din er opprettet!</h2>
              <p className="text-muted-foreground">Velkommen til {companyDisplayName} sin compliance-profil.</p>
            </div>

            {/* Profile header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{companyDisplayName}</h3>
                    <p className="text-sm text-muted-foreground">Org.nr: {selectedCompany?.organisasjonsnummer || rawData?.organisasjonsnummer || ""}</p>
                    {(selectedCompany?.naeringskode1 || rawData?.naeringskode1) && (
                      <p className="text-sm text-muted-foreground">{(selectedCompany?.naeringskode1 || rawData?.naeringskode1)?.beskrivelse}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-status-closed/10 dark:bg-status-closed/30 text-status-closed dark:text-status-closed px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Verifisert
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> Selverklæring
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incoming requests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Inbox className="h-5 w-5" /> Innkommende forespørsler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 dark:bg-warning/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-warning dark:text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Databehandleravtale (DPA)</p>
                    <p className="text-xs text-muted-foreground">Fra {senderCompanyName} · Frist: 15. mars 2026</p>
                    <div className="mt-2">
                      <span className="text-xs bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning px-2 py-0.5 rounded-full">
                        Venter på svar
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => {
                    setStep("upload");
                    setUploadedFile(null);
                  }}>
                    <Upload className="h-4 w-4 mr-1" /> Last opp
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upload documents section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Dokumenter
                </CardTitle>
                <CardDescription>Administrer compliance-dokumenter for din virksomhet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Ingen dokumenter lastet opp ennå</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                    setStep("upload");
                    setUploadedFile(null);
                  }}>
                    <Upload className="h-4 w-4 mr-1" /> Last opp dokument
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                Tilbake til Mynder-dashboardet
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
