import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Building2, CreditCard, Mail, FileText, Save, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface BillingSettings {
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  vat_number: string;
  contact_email: string;
  invoice_email: string;
  delivery_method: string;
  payment_method: string;
  ehf_enabled: boolean;
  notes: string;
}

const defaults: BillingSettings = {
  address_line1: "",
  address_line2: "",
  postal_code: "",
  city: "",
  country: "Norge",
  vat_number: "",
  contact_email: "",
  invoice_email: "",
  delivery_method: "email",
  payment_method: "invoice",
  ehf_enabled: false,
  notes: "",
};

export default function MSPBillingSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BillingSettings>(defaults);

  // Fetch company profile (read-only company info)
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("name, org_number")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["msp-billing-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_billing_settings" as any)
        .select("*")
        .eq("msp_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        address_line1: existing.address_line1 || "",
        address_line2: existing.address_line2 || "",
        postal_code: existing.postal_code || "",
        city: existing.city || "",
        country: existing.country || "Norge",
        vat_number: existing.vat_number || "",
        contact_email: existing.contact_email || "",
        invoice_email: existing.invoice_email || "",
        delivery_method: existing.delivery_method || "email",
        payment_method: existing.payment_method || "invoice",
        ehf_enabled: existing.ehf_enabled || false,
        notes: existing.notes || "",
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async (data: BillingSettings) => {
      const payload = {
        ...data,
        company_name: companyProfile?.name || "",
        org_number: companyProfile?.org_number || "",
        msp_user_id: user!.id,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase
          .from("msp_billing_settings" as any)
          .update(payload as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("msp_billing_settings" as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Fakturainnstillinger lagret");
      queryClient.invalidateQueries({ queryKey: ["msp-billing-settings"] });
    },
    onError: (e: any) => toast.error("Feil: " + e.message),
  });

  const update = (key: keyof BillingSettings, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => mutation.mutate(form);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Laster...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-3xl mx-auto py-8 px-4 md:px-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/msp-dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fakturainnstillinger</h1>
              <p className="text-muted-foreground text-sm">Administrer fakturering, leveringsmetode og betalingsinformasjon</p>
            </div>
          </div>

          {/* Company info – read-only from company_profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Selskapsinformasjon
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Hentes fra firmaprofilen og kan endres under Innstillinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Firmanavn</Label>
                <Input value={companyProfile?.name || "–"} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Organisasjonsnummer</Label>
                <Input value={companyProfile?.org_number || "–"} disabled className="bg-muted/50" />
              </div>
            </CardContent>
          </Card>

          {/* Billing address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Fakturaadresse
              </CardTitle>
              <CardDescription>Adressen som vises på fakturaer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Adresselinje 1</Label>
                <Input value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} placeholder="Gateadresse" />
              </div>
              <div className="space-y-2">
                <Label>Adresselinje 2</Label>
                <Input value={form.address_line2} onChange={(e) => update("address_line2", e.target.value)} placeholder="Eventuelt tillegg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postnummer</Label>
                  <Input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} placeholder="0001" />
                </div>
                <div className="space-y-2">
                  <Label>Sted</Label>
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Oslo" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Land</Label>
                <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Kontakt og e-post
              </CardTitle>
              <CardDescription>E-postadresser for kontakt og fakturamottak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kontakt e-post</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} placeholder="kontakt@firma.no" />
              </div>
              <div className="space-y-2">
                <Label>Faktura e-post</Label>
                <Input type="email" value={form.invoice_email} onChange={(e) => update("invoice_email", e.target.value)} placeholder="faktura@firma.no" />
                <p className="text-xs text-muted-foreground">Hit sendes fakturaer om leveringsmetode er e-post</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Leveringsmetode
              </CardTitle>
              <CardDescription>Velg hvordan fakturaer skal leveres</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={form.delivery_method} onValueChange={(v) => update("delivery_method", v)} className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="email" id="dm-email" className="mt-0.5" />
                  <label htmlFor="dm-email" className="cursor-pointer">
                    <p className="font-medium text-sm">E-post</p>
                    <p className="text-xs text-muted-foreground">Fakturaen sendes som PDF til faktura e-post</p>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="ehf" id="dm-ehf" className="mt-0.5" />
                  <label htmlFor="dm-ehf" className="cursor-pointer">
                    <p className="font-medium text-sm">EHF (elektronisk faktura)</p>
                    <p className="text-xs text-muted-foreground">Krever organisasjonsnummer og VAT-nummer</p>
                  </label>
                </div>
              </RadioGroup>

              {form.delivery_method === "ehf" && (
                <div className="space-y-4 pt-2 pl-6 border-l-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.ehf_enabled} onCheckedChange={(v) => update("ehf_enabled", v)} />
                    <Label>EHF er aktivert hos oss</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>VAT-nummer</Label>
                    <Input value={form.vat_number} onChange={(e) => update("vat_number", e.target.value)} placeholder="NO123456789MVA" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Betalingsmetode
              </CardTitle>
              <CardDescription>Velg hvordan du vil betale</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={form.payment_method} onValueChange={(v) => update("payment_method", v)} className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="invoice" id="pm-invoice" className="mt-0.5" />
                  <label htmlFor="pm-invoice" className="cursor-pointer">
                    <p className="font-medium text-sm">Faktura</p>
                    <p className="text-xs text-muted-foreground">Betales innen 14 dager etter mottak</p>
                  </label>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="card" id="pm-card" className="mt-0.5" />
                  <label htmlFor="pm-card" className="cursor-pointer">
                    <p className="font-medium text-sm">Kredittkort (Stripe)</p>
                    <p className="text-xs text-muted-foreground">Trekkes automatisk ved kjøp og fornyelse</p>
                  </label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Merknad</CardTitle>
              <CardDescription>Eventuell informasjon som skal vises på fakturaer</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="F.eks. referansenummer, bestillingsnummer, prosjektkode..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end pb-8">
            <Button size="lg" onClick={handleSave} disabled={mutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {mutation.isPending ? "Lagrer..." : "Lagre innstillinger"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
