import { useState, useEffect, useMemo, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Building2, Mail, FileText, Save, Lock, TrendingUp, Wallet, ChevronRight, Upload, RotateCcw, Percent, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  customerLicenseSummary,
  deriveActivatedProducts,
  deriveActivatedFrameworks,
} from "@/lib/offerSuggestions";
import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { CUSTOMER_MODULES_EVENT } from "@/lib/customerModuleState";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { computeTaxBreakdown } from "@/lib/partnerTax";

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
  partner_share_pct: number;
  agreement_start: string;
  agreement_note: string;
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
  partner_share_pct: 30,
  agreement_start: "",
  agreement_note: "",
};


const fmt = (n: number) => n.toLocaleString("nb-NO");

const MAX_LOGO_BYTES = 300 * 1024;

function fixedPriceForCustomer(customerId: string): number {
  const offers = getOffersForCustomer(customerId).filter((o) => o.status === "delivered");
  let total = 0;
  for (const offer of offers) {
    const keys = new Set([...(offer.templateIds || []), ...(offer.serviceKeys || [])]);
    for (const t of SERVICE_LIBRARY) {
      const match = keys.has(t.id) || keys.has(normalizeServiceKey(t.name));
      if (!match) continue;
      if (t.recommendedPrice.model !== "fixed") continue;
      total += t.recommendedPrice.min;
    }
  }
  return total;
}

interface CostSummary {
  monthly: number;
  fixed: number;
  setup: number;
  totalNet: number;
  gross: number;
  taxAmount: number;
  payingCustomers: number;
  customerCount: number;
  topLines: { label: string; price: number; count: number }[];
}

function buildCostSummary(customers: any[], tax: any): CostSummary {
  const lineMap = new Map<string, { price: number; count: number }>();
  let monthly = 0;
  let fixed = 0;
  let setup = 0;

  for (const c of customers) {
    const summary = customerLicenseSummary(c);
    monthly += summary.monthly;
    for (const l of summary.lines) {
      const existing = lineMap.get(l.label) || { price: 0, count: 0 };
      existing.price += l.price;
      existing.count += 1;
      lineMap.set(l.label, existing);
    }
    fixed += fixedPriceForCustomer(c.id);
    setup += Number(c.setup_fee) > 0 ? Number(c.setup_fee) : 0;
  }

  const totalNet = monthly + fixed + setup;
  const breakdown = computeTaxBreakdown(totalNet, tax);
  // Samme definisjon som på Fakturagrunnlag: kunder med løpende abonnement.
  const payingCustomers = customers.filter((c) => customerLicenseSummary(c).monthly > 0).length;

  const topLines = Array.from(lineMap.entries())
    .map(([label, { price, count }]) => ({ label, price, count }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);

  return {
    monthly,
    fixed,
    setup,
    totalNet,
    gross: breakdown.gross,
    taxAmount: breakdown.taxAmount,
    payingCustomers,
    customerCount: customers.length,
    topLines,
  };
}

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
        partner_share_pct:
          existing.partner_share_pct === null || existing.partner_share_pct === undefined
            ? 30
            : Number(existing.partner_share_pct),
        agreement_start: existing.agreement_start || "",
        agreement_note: existing.agreement_note || "",
      });

    }
  }, [existing]);

  const { branding, save: saveBranding, clearField: clearBrandingField } = usePartnerBranding();
  const tax = branding.tax;
  const logoFileRef = useRef<HTMLInputElement>(null);

  const handleLogoSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Ugyldig filtype", { description: "Velg en PNG- eller JPG-fil." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logoen er for stor", { description: "Maks 300 KB. Komprimer bildet og prøv igjen." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      saveBranding({ logoDataUrl: String(reader.result) });
      toast.success("Logo lagret", { description: "Logoen brukes på fakturagrunnlag og tilbud." });
    };
    reader.readAsDataURL(file);
  };

  // Fetch all customers to show what Mynder will invoice the partner for.
  // Samme datakilde og query-nøkkel som Fakturagrunnlag, slik at tallene alltid er identiske.
  const { data: customers = [] } = useQuery({
    queryKey: ["msp-customers-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });


  const summary = useMemo(() => buildCostSummary(customers, tax), [customers, tax]);

  // Refresh customer list when modules change elsewhere.
  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["msp-customers-invoices"] });
    window.addEventListener(CUSTOMER_MODULES_EVENT, refresh);
    window.addEventListener("modules:changed", refresh);
    return () => {
      window.removeEventListener(CUSTOMER_MODULES_EVENT, refresh);
      window.removeEventListener("modules:changed", refresh);
    };
  }, [queryClient]);

  const mutation = useMutation({
    mutationFn: async (data: BillingSettings) => {
      // Partneravtalen (andel, virkningsdato, notat) forvaltes av Mynder — partneren kan ikke endre den her.
      const { partner_share_pct, agreement_start, agreement_note, ...editable } = data as any;
      const payload = {
        ...editable,
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
      <main className="flex-1 overflow-auto pt-11">
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
              <p className="text-muted-foreground text-sm">Administrer hvordan Mynder fakturerer deg, og se kostnader for aktiverte produkter og tjenester</p>
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

          {/* Logo på faktura og tilbud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo
              </CardTitle>
              <CardDescription>Vis på fakturagrunnlag og tilbud du sender til kundene dine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Firmalogo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm text-foreground">
                    {branding.isAutoLogo
                      ? branding.autoLogoUrl
                        ? "Hentet automatisk fra organisasjonsprofilen."
                        : "Ingen logo lagt inn ennå."
                      : "Egen logo lastet opp."}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG eller JPG, maks 300 KB</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!branding.isAutoLogo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => { clearBrandingField("logoDataUrl"); toast.success("Tilbakestilt til automatisk logo"); }}
                    >
                      <RotateCcw className="h-3 w-3" /> Auto
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => logoFileRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {branding.logoUrl ? "Bytt logo" : "Last opp logo"}
                  </Button>
                </div>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoSelect(file);
                    e.target.value = "";
                  }}
                />
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
                <p className="text-xs text-muted-foreground">Hit sendes fakturaer fra Mynder når fakturering til deg er e-post</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery method: how Mynder invoices the partner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mynders fakturering til deg
              </CardTitle>
              <CardDescription>Hvordan Mynder skal sende fakturaer til deg som partner</CardDescription>
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

          {/* Partneravtale: prosentsats som avgjør hva Mynder fakturerer partneren */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Partneravtale
              </CardTitle>
              <CardDescription>
                Andelen av abonnementsinntekten du beholder. Vilkårene forvaltes av Mynder og kan ikke endres her.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Partnerandel</Label>
                  <div className="text-lg font-semibold tabular-nums">{form.partner_share_pct} %</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Gjelder fra</Label>
                  <div className="text-lg font-semibold tabular-nums">
                    {form.agreement_start
                      ? new Date(form.agreement_start).toLocaleDateString("nb-NO")
                      : "Ikke registrert"}
                  </div>
                </div>
              </div>
              {form.agreement_note && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Avtalereferanse</Label>
                  <p className="text-sm text-foreground">{form.agreement_note}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Ønsker du å endre partnerandelen? Ta kontakt med Mynder — endringer registreres i partneravtalen og
                logges med virkningsdato.
              </p>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Abonnement per måned (til kundene)</span>
                  <span className="tabular-nums">{fmt(summary.monthly)} kr</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Din andel ({form.partner_share_pct} %)</span>
                  <span className="tabular-nums">
                    {fmt(Math.round((summary.monthly * form.partner_share_pct) / 100))} kr
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t font-medium">
                  <span>Mynder fakturerer deg</span>
                  <span className="tabular-nums">
                    {fmt(summary.monthly - Math.round((summary.monthly * form.partner_share_pct) / 100))} kr/mnd
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Activated products and costs: what Mynder will invoice the partner for */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Dine aktiverte produkter og kostnader
              </CardTitle>
              <CardDescription>Dette faktureres deg av Mynder basert på aktiverte produkter og tjenester hos kundene dine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-[12px] uppercase tracking-wide text-muted-foreground">Abonnement per måned</div>
                  <div className="text-xl font-semibold text-foreground tabular-nums mt-1">{fmt(summary.monthly)} kr</div>
                  <div className="text-xs text-muted-foreground mt-0.5">ekskl. mva</div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-[12px] uppercase tracking-wide text-muted-foreground">Engangsbeløp</div>
                  <div className="text-xl font-semibold text-foreground tabular-nums mt-1">{fmt(summary.fixed + summary.setup)} kr</div>
                  <div className="text-xs text-muted-foreground mt-0.5">fastpris + etablering</div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-[12px] uppercase tracking-wide text-muted-foreground">Kunder med kostnader</div>
                  <div className="text-xl font-semibold text-foreground tabular-nums mt-1">{summary.payingCustomers}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">av {summary.customerCount} kunder</div>
                </div>
              </div>

              {summary.topLines.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Største aktiverte kostnader</div>
                  <div className="space-y-2">
                    {summary.topLines.map((line) => (
                      <div key={line.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">{line.count} kunde{line.count === 1 ? "" : "r"}</Badge>
                          <span className="text-foreground/90">{line.label}</span>
                        </div>
                        <span className="tabular-nums font-medium">{fmt(line.price)} kr/mnd</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-foreground">Total å betale Mynder</div>
                  <div className="text-xs text-muted-foreground">Netto {fmt(summary.totalNet)} kr + {tax.label.toLowerCase()} {fmt(summary.taxAmount)} kr</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-foreground tabular-nums">{fmt(summary.gross)} kr</div>
                  <div className="text-xs text-muted-foreground">inkl. mva</div>
                </div>
              </div>

              <Link to="/msp-invoices" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <TrendingUp className="h-4 w-4" />
                Se fullt fakturagrunnlag
                <ChevronRight className="h-4 w-4" />
              </Link>
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
