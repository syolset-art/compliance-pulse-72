import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import mynderLogo from "@/assets/mynder-logo.png";
import {
  Mail, ArrowRight, Upload, Shield, LogIn, CheckCircle2,
  Building2, User, AtSign, FileText, Clock, ChevronLeft,
  Loader2, AlertCircle, Search, ExternalLink, Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "landing" | "upload" | "upload-done" | "trust-org" | "trust-contact" | "trust-verify" | "trust-profile";

export default function VendorResponseDemo() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trust profile form
  const [orgNumber, setOrgNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const { lookupByOrgNumber, rawData, isLoading: brregLoading, error: brregError } = useBrregLookup();

  const handleBrregLookup = async () => {
    await lookupByOrgNumber(orgNumber);
  };

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
    "trust-org": 30, "trust-contact": 55, "trust-verify": 80, "trust-profile": 100,
  }[step];

  const renderBackButton = (target: Step) => (
    <button onClick={() => setStep(target)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
      <ChevronLeft className="h-4 w-4" /> Tilbake
    </button>
  );

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
                  <span>Fra: <strong className="text-foreground">HULT IT AS</strong> via Mynder &lt;no-reply@mynder.io&gt;</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Til: leverandor@eksempel.no
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
                  Hei,
                  <br /><br />
                  <strong>HULT IT AS</strong> bruker Mynder for å administrere sin leverandørkjede og compliance-dokumentasjon.
                  De ber deg om å sende inn en <strong>oppdatert databehandleravtale (DPA)</strong> innen <strong>15. mars 2026</strong>.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium">Forespørselsdetaljer:</p>
                  <p className="text-sm text-muted-foreground">📄 Dokumenttype: Databehandleravtale (DPA)</p>
                  <p className="text-sm text-muted-foreground">🏢 Fra: HULT IT AS</p>
                  <p className="text-sm text-muted-foreground">⏰ Frist: 15. mars 2026</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Klikk knappen under for å se forespørselen og svare.
                </p>
                <Button size="lg" className="w-full" onClick={() => setStep("landing")}>
                  Se forespørselen <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Denne e-posten er sendt via Mynder på vegne av HULT IT AS.
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
              <h1 className="text-2xl font-bold">HULT IT AS ber om en oppdatert databehandleravtale</h1>
              <p className="text-muted-foreground">Velg hvordan du vil svare på forespørselen</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Option A: Quick upload */}
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

              {/* Option B: Trust Profile */}
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

              {/* Option C: Log in */}
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
            <p className="text-sm text-muted-foreground">Dokumentet sendes direkte til HULT IT AS.</p>

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
              Send dokument til HULT IT <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ===================== STEP 3A DONE ===================== */}
        {step === "upload-done" && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-12">
            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Dokumentet er sendt!</h2>
            <p className="text-muted-foreground">
              Din databehandleravtale er sendt til <strong>HULT IT AS</strong>. De vil gjennomgå dokumentet og komme tilbake til deg.
            </p>
            <Card className="text-left">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm"><strong>Dokument:</strong> {uploadedFile?.name}</p>
                <p className="text-sm"><strong>Sendt til:</strong> HULT IT AS</p>
                <p className="text-sm"><strong>Status:</strong> <span className="text-green-600">Mottatt</span></p>
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

        {/* ===================== STEP 3B-1: ORG LOOKUP ===================== */}
        {step === "trust-org" && (
          <div className="max-w-lg mx-auto space-y-6">
            {renderBackButton("landing")}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 1 av 3</p>
              <h2 className="text-xl font-semibold">Finn din virksomhet</h2>
              <p className="text-sm text-muted-foreground">Vi henter informasjon fra Brønnøysundregistrene.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Organisasjonsnummer</label>
              <div className="flex gap-2">
                <Input
                  placeholder="F.eks. 912 345 678"
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                />
                <Button onClick={handleBrregLookup} disabled={brregLoading || orgNumber.replace(/\s/g, "").length < 9}>
                  {brregLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {brregError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {brregError}
                </p>
              )}
            </div>

            {rawData && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <p className="font-semibold">{rawData.navn}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Org.nr: {rawData.organisasjonsnummer}</p>
                  {rawData.naeringskode1 && (
                    <p className="text-sm text-muted-foreground">Bransje: {rawData.naeringskode1.beskrivelse}</p>
                  )}
                  {rawData.forretningsadresse && (
                    <p className="text-sm text-muted-foreground">
                      Sted: {rawData.forretningsadresse.poststed}, {rawData.forretningsadresse.kommune}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Button size="lg" className="w-full" disabled={!rawData} onClick={() => setStep("trust-contact")}>
              Bekreft og gå videre <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ===================== STEP 3B-2: CONTACT INFO ===================== */}
        {step === "trust-contact" && (
          <div className="max-w-lg mx-auto space-y-6">
            {renderBackButton("trust-org")}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 2 av 3</p>
              <h2 className="text-xl font-semibold">Kontaktinformasjon</h2>
              <p className="text-sm text-muted-foreground">Hvem representerer {rawData?.navn || "selskapet"}?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Fullt navn
                </label>
                <Input placeholder="Ola Nordmann" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AtSign className="h-4 w-4" /> E-postadresse
                </label>
                <Input type="email" placeholder="ola@eksempel.no" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
            </div>

            <Button size="lg" className="w-full" disabled={!contactName || !contactEmail} onClick={() => setStep("trust-verify")}>
              Send verifiseringskode <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ===================== STEP 3B-3: VERIFY ===================== */}
        {step === "trust-verify" && (
          <div className="max-w-lg mx-auto space-y-6">
            {renderBackButton("trust-contact")}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Steg 3 av 3</p>
              <h2 className="text-xl font-semibold">Verifiser e-postadressen din</h2>
              <p className="text-sm text-muted-foreground">
                Vi har sendt en kode til <strong>{contactEmail}</strong>
              </p>
            </div>

            <div className="bg-muted/50 border rounded-lg p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Demo: bruk koden</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-primary">1 2 3 4 5 6</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verifiseringskode</label>
              <Input
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button size="lg" className="w-full" disabled={verifyCode.replace(/\s/g, "") !== "123456"} onClick={() => setStep("trust-profile")}>
              Verifiser og opprett profil <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ===================== STEP 4: TRUST PROFILE ===================== */}
        {step === "trust-profile" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-fade-in">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Trust Profilen din er opprettet!</h2>
              <p className="text-muted-foreground">Velkommen til {rawData?.navn || "din virksomhet"} sin compliance-profil.</p>
            </div>

            {/* Profile header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{rawData?.navn || "Ditt selskap"}</h3>
                    <p className="text-sm text-muted-foreground">Org.nr: {rawData?.organisasjonsnummer || orgNumber}</p>
                    {rawData?.naeringskode1 && (
                      <p className="text-sm text-muted-foreground">{rawData.naeringskode1.beskrivelse}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
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
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Databehandleravtale (DPA)</p>
                    <p className="text-xs text-muted-foreground">Fra HULT IT AS · Frist: 15. mars 2026</p>
                    <div className="mt-2">
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
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
