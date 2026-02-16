import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, FileCheck, ChevronRight, ChevronLeft, Check, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";

const REQUEST_TYPES = [
  { value: "vendor_assessment", labelNb: "Leverandørvurdering", labelEn: "Vendor Assessment", icon: FileText,
    descNb: "En helhetlig vurdering av leverandørens sikkerhet, personvern og compliance-praksis. Brukes for å kartlegge risiko ved bruk av leverandøren.",
    descEn: "A comprehensive assessment of the vendor's security, privacy and compliance practices. Used to map risks associated with the vendor." },
  { value: "dpa", labelNb: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement", icon: FileCheck,
    descNb: "Avtale som regulerer hvordan leverandøren behandler personopplysninger på deres vegne (påkrevd av GDPR art. 28).",
    descEn: "Agreement governing how the vendor processes personal data on your behalf (required by GDPR Art. 28)." },
  { value: "iso_documentation", labelNb: "ISO 27001 dokumentasjon", labelEn: "ISO 27001 Documentation", icon: Shield,
    descNb: "Forespørsel om sertifikat eller dokumentasjon som viser at leverandøren følger ISO 27001 for informasjonssikkerhet.",
    descEn: "Request for certificate or documentation showing the vendor follows ISO 27001 for information security." },
  { value: "soc2", labelNb: "SOC 2-rapport", labelEn: "SOC 2 Report", icon: FileText,
    descNb: "Uavhengig revisjonsrapport som bekrefter leverandørens kontroller for sikkerhet, tilgjengelighet og konfidensialitet.",
    descEn: "Independent audit report confirming the vendor's controls for security, availability and confidentiality." },
  { value: "gdpr_report", labelNb: "GDPR-rapport", labelEn: "GDPR Report", icon: FileText,
    descNb: "Oversikt over leverandørens GDPR-etterlevelse, inkludert behandlingsaktiviteter og tekniske tiltak.",
    descEn: "Overview of the vendor's GDPR compliance, including processing activities and technical measures." },
  { value: "hms_documentation", labelNb: "HMS-dokumentasjon", labelEn: "HSE Documentation", icon: Shield,
    descNb: "Dokumentasjon på leverandørens helse-, miljø- og sikkerhetsarbeid (relevant for fysiske tjenester og arbeid på lokasjon).",
    descEn: "Documentation of the vendor's health, safety and environment practices (relevant for physical services and on-site work)." },
  { value: "quality_certification", labelNb: "Kvalitetssertifisering", labelEn: "Quality Certification", icon: FileCheck,
    descNb: "Sertifikat eller dokumentasjon som viser at leverandøren har et kvalitetsstyringssystem (f.eks. ISO 9001).",
    descEn: "Certificate or documentation showing the vendor has a quality management system (e.g. ISO 9001)." },
  { value: "audit_report", labelNb: "Internrevisjonsrapport", labelEn: "Internal Audit Report", icon: FileText,
    descNb: "Forespørsel om leverandørens siste internrevisjonsrapport for innsyn i deres egenkontroll.",
    descEn: "Request for the vendor's latest internal audit report for insight into their self-assessment." },
];

interface SendRequestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (types: string[], vendorIds: string[], dueDate: string) => void;
}

export function SendRequestWizard({ open, onOpenChange, onSend }: SendRequestWizardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-for-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, vendor_category, gdpr_role")
        .eq("asset_type", "vendor")
        .order("name");
      return data || [];
    },
    enabled: open,
  });

  const dataProcessors = vendors.filter((v: any) => v.gdpr_role === "databehandler");

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const selectAllProcessors = () => {
    const ids = dataProcessors.map((v: any) => v.id);
    setSelectedVendors((prev) => {
      const allSelected = ids.every((id: string) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSend = () => {
    onSend(selectedTypes, selectedVendors, dueDate);
    toast.success(isNb ? `${selectedTypes.length} forespørsel(er) sendt til ${selectedVendors.length} leverandør(er)` : `${selectedTypes.length} request(s) sent to ${selectedVendors.length} vendor(s)`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedTypes([]);
    setSelectedVendors([]);
    onOpenChange(false);
  };

  const selectedTypeNames = REQUEST_TYPES.filter((t) => selectedTypes.includes(t.value));

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNb ? "Send forespørsel til leverandører" : "Send Request to Vendors"}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Choose type */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {isNb ? "Hva slags forespørsler vil du sende? Du kan velge flere." : "What types of requests do you want to send? You can select multiple."}
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {REQUEST_TYPES.map((rt) => (
                <label
                  key={rt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedTypes.includes(rt.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleType(rt.value)}
                >
                  <Checkbox
                    checked={selectedTypes.includes(rt.value)}
                    onCheckedChange={() => toggleType(rt.value)}
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <rt.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{isNb ? rt.labelNb : rt.labelEn}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {isNb ? rt.descNb : rt.descEn}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedTypes.length} {isNb ? "valgt" : "selected"}
              </p>
            )}
          </div>
        )}

        {/* Step 2: Select vendors */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isNb ? "Velg leverandører" : "Select vendors"}
              </p>
              {dataProcessors.length > 0 && (
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectAllProcessors}>
                  {isNb ? "Velg alle databehandlere" : "Select all data processors"}
                  <Badge variant="secondary" className="ml-1 text-[10px]">{dataProcessors.length}</Badge>
                </Button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
              {vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isNb ? "Ingen leverandører registrert ennå" : "No vendors registered yet"}
                </p>
              ) : (
                vendors.map((v: any) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                      selectedVendors.includes(v.id) ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedVendors.includes(v.id)}
                      onCheckedChange={() => toggleVendor(v.id)}
                    />
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{v.name}</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {v.vendor_category && (
                          <Badge variant="outline" className="text-[10px] capitalize">{v.vendor_category}</Badge>
                        )}
                        {v.gdpr_role && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{v.gdpr_role}</Badge>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedVendors.length} {isNb ? "valgt" : "selected"}
            </p>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">{isNb ? "Typer" : "Types"}</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {selectedTypeNames.map((t) => (
                    <Badge key={t.value} variant="secondary" className="text-[10px]">
                      {isNb ? t.labelNb : t.labelEn}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isNb ? "Leverandører" : "Vendors"}</span>
                <span className="text-sm font-medium">{selectedVendors.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isNb ? "Frist" : "Due date"}</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-auto h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Forespørselen sendes per e-post til kontaktpersonene hos valgte leverandører."
                : "The request will be sent by email to the contact persons at selected vendors."}
            </p>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isNb ? "Tilbake" : "Back"}
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && selectedTypes.length === 0) || (step === 2 && selectedVendors.length === 0)}
            >
              {isNb ? "Neste" : "Next"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSend}>
              <Check className="h-4 w-4 mr-1" />
              {isNb ? "Bekreft og send" : "Confirm and send"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
