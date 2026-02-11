import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Shield, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import mynderLogo from "@/assets/mynder-logo.png";
import mynderLogoInverted from "@/assets/mynder-logo-inverted.png";
import laraButterfly from "@/assets/lara-butterfly.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Velkommen tilbake!");
      navigate("/");
      setLoading(false);
    }, 800);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Registrering vellykket! Sjekk e-posten din for å bekrefte kontoen.");
      setActiveTab("login");
      setLoading(false);
    }, 800);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-accent/20">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10">
          <img src={mynderLogo} alt="Mynder" className="h-10 dark:hidden" />
          <img src={mynderLogoInverted} alt="Mynder" className="h-10 hidden dark:block" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <img 
              src={laraButterfly} 
              alt="Lara" 
              className="h-20 w-20 object-contain"
            />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Møt Lara</h2>
              <p className="text-muted-foreground">Din AI-partner for compliance</p>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            AI-Native Trust <br />
            <span className="text-primary">Management Platform</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md">
            Automatiser samsvarsstyring med intelligente agenter. 
            La Lara håndtere ISO 27001, GDPR og AI Act - mens du fokuserer på det som virkelig betyr noe.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">38% autonom håndtering</p>
                <p className="text-sm text-muted-foreground">AI-agenter fullfører krav automatisk</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Kontinuerlig compliance</p>
                <p className="text-sm text-muted-foreground">Sanntidsovervåking av etterlevelse</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-foreground">Intelligent prioritering</p>
                <p className="text-sm text-muted-foreground">Fokuser på det som krever din oppmerksomhet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">
            © 2025 Mynder. Norges ledende AI-native compliance-plattform.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <img src={mynderLogo} alt="Mynder" className="h-8 dark:hidden" />
          <img src={mynderLogoInverted} alt="Mynder" className="h-8 hidden dark:block" />
          <ThemeToggle />
        </div>
        
        {/* Desktop theme toggle */}
        <div className="hidden lg:flex justify-end p-6">
          <ThemeToggle />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              {/* Mobile Lara */}
              <div className="lg:hidden flex justify-center mb-4">
                <img 
                  src={laraButterfly} 
                  alt="Lara" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <CardTitle className="text-2xl font-semibold">
                {activeTab === "login" ? "Velkommen tilbake" : "Kom i gang"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login" 
                  ? "Logg inn for å fortsette til Mynder" 
                  : "Opprett en konto for å starte din compliance-reise"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Logg inn</TabsTrigger>
                  <TabsTrigger value="signup">Registrer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-post</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@epost.no"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Passord</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full gap-2" 
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Logg inn
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-post</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="din@epost.no"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Passord</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minst 6 tegn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Må være minst 6 tegn</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full gap-2" 
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Opprett konto
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Ved å registrere deg godtar du våre vilkår og personvernregler.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
