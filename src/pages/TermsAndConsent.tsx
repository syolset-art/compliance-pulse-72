import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Eye, Download, ExternalLink, Check, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const legalDocuments = [
  {
    id: "terms",
    title: "Brukervilkår",
    description: "Vilkår for bruk av Mynder-plattformen",
    version: "2.1",
    lastUpdated: "15. januar 2026",
    acceptedDate: "20. januar 2026",
  },
  {
    id: "privacy",
    title: "Personvernerklæring",
    description: "Hvordan vi behandler dine personopplysninger",
    version: "3.0",
    lastUpdated: "1. desember 2025",
    acceptedDate: "20. januar 2026",
  },
  {
    id: "dpa",
    title: "Databehandleravtale (DPA)",
    description: "Avtale om behandling av personopplysninger",
    version: "1.5",
    lastUpdated: "10. november 2025",
    acceptedDate: "20. januar 2026",
  },
  {
    id: "sla",
    title: "Tjenestenivåavtale (SLA)",
    description: "Garantier for oppetid og ytelse",
    version: "1.2",
    lastUpdated: "5. oktober 2025",
    acceptedDate: "20. januar 2026",
  },
];

const consentOptions = [
  {
    id: "marketing",
    title: "Markedsføring",
    description: "Motta nyheter, tips og tilbud fra Mynder",
    enabled: true,
  },
  {
    id: "product_updates",
    title: "Produktoppdateringer",
    description: "Viktige oppdateringer om nye funksjoner og endringer",
    enabled: true,
    required: true,
  },
  {
    id: "analytics",
    title: "Bruksanalyse",
    description: "Hjelp oss å forbedre produktet gjennom anonymisert bruksdata",
    enabled: true,
  },
  {
    id: "third_party",
    title: "Tredjepartsintegrasjoner",
    description: "Tillat deling av data med godkjente partnere",
    enabled: false,
  },
];

export default function TermsAndConsent() {
  const navigate = useNavigate();
  const [consents, setConsents] = useState(consentOptions);
  const [saving, setSaving] = useState(false);

  const handleConsentChange = (id: string, enabled: boolean) => {
    setConsents(prev => 
      prev.map(c => c.id === id ? { ...c, enabled } : c)
    );
  };

  const handleSaveConsents = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success("Samtykkeinnstillinger oppdatert");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Betingelser og samtykke</h1>
            <p className="text-muted-foreground">Juridiske dokumenter og personverninnstillinger</p>
          </div>
        </div>

        {/* Legal Documents */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Juridiske dokumenter</h2>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {legalDocuments.map((doc, index) => (
                <div key={doc.id}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{doc.title}</h3>
                        <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Oppdatert: {doc.lastUpdated}
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-success" />
                          Akseptert: {doc.acceptedDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Les
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {index < legalDocuments.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Consent Management */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Samtykkeinnstillinger</h2>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Administrer dine samtykker</CardTitle>
              <CardDescription>
                Du kan når som helst endre hvilke data du deler med oss. 
                Noen samtykker er nødvendige for å bruke tjenesten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.map((consent, index) => (
                <div key={consent.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{consent.title}</h4>
                        {consent.required && (
                          <Badge variant="secondary" className="text-xs">Påkrevd</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{consent.description}</p>
                    </div>
                    <Switch
                      checked={consent.enabled}
                      onCheckedChange={(checked) => handleConsentChange(consent.id, checked)}
                      disabled={consent.required}
                    />
                  </div>
                  {index < consents.length - 1 && <Separator />}
                </div>
              ))}
              
              <div className="pt-4">
                <Button onClick={handleSaveConsents} disabled={saving}>
                  {saving ? "Lagrer..." : "Lagre endringer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Ofte stilte spørsmål</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Hvordan behandler dere mine personopplysninger?</AccordionTrigger>
              <AccordionContent>
                Vi behandler personopplysninger i henhold til GDPR og norsk personvernlovgivning. 
                All data lagres sikkert i EU, og vi selger aldri dine data til tredjeparter. 
                Se vår personvernerklæring for fullstendige detaljer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Kan jeg slette mine data?</AccordionTrigger>
              <AccordionContent>
                Ja, du har rett til å be om sletting av dine personopplysninger i henhold til GDPR artikkel 17. 
                Kontakt vår personvernansvarlig for å sende en forespørsel om sletting.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Hva skjer hvis jeg trekker tilbake samtykke?</AccordionTrigger>
              <AccordionContent>
                Du kan når som helst trekke tilbake samtykke uten at det påvirker lovligheten av 
                behandlingen som ble utført før tilbaketrekkingen. Noen funksjoner kan bli utilgjengelige 
                hvis samtykke trekkes tilbake.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Hvordan kan jeg kontakte personvernombudet?</AccordionTrigger>
              <AccordionContent>
                Du kan kontakte vårt personvernombud via e-post på personvern@mynder.no eller 
                via brev til vår hovedadresse. Vi svarer normalt innen 5 virkedager.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Contact Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Har du spørsmål om personvern?</p>
                <p className="text-sm text-muted-foreground">
                  Kontakt vårt personvernombud for spørsmål om behandling av dine data.
                </p>
              </div>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Kontakt oss
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
