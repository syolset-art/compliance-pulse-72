import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Pencil, Check, X, AlertCircle, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContactPersonFieldProps {
  assetId: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isNb: boolean;
}

export const ContactPersonField = ({
  assetId,
  contactPerson,
  contactEmail,
  contactPhone,
  isNb,
}: ContactPersonFieldProps) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contactPerson || "");
  const [email, setEmail] = useState(contactEmail || "");
  const [phone, setPhone] = useState(contactPhone || "");
  const [errors, setErrors] = useState<{ email?: string; phone?: string; channel?: string }>({});

  // Status: ingen kontakt | mangler kanal (e-post/tlf) | komplett
  const hasName = !!contactPerson;
  const hasChannel = !!(contactEmail || contactPhone);
  const status: "missing" | "incomplete" | "complete" =
    !hasName ? "missing" : !hasChannel ? "incomplete" : "complete";

  const emailValid = (v: string) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneValid = (v: string) => v === "" || /^[+\d][\d\s()-]{4,19}$/.test(v.trim());

  const updateContact = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();
      const nextErrors: typeof errors = {};
      if (!emailValid(trimmedEmail)) nextErrors.email = isNb ? "Ugyldig e-post" : "Invalid email";
      if (!phoneValid(trimmedPhone)) nextErrors.phone = isNb ? "Ugyldig telefonnummer" : "Invalid phone";
      if (trimmedName && !trimmedEmail && !trimmedPhone) {
        nextErrors.channel = isNb
          ? "Telefon eller e-post må fylles ut"
          : "Phone or email is required";
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        throw new Error("validation");
      }
      const { error } = await supabase
        .from("assets")
        .update({
          contact_person: trimmedName || null,
          contact_email: trimmedEmail || null,
          contact_phone: trimmedPhone || null,
        } as any)
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset"] });
      queryClient.invalidateQueries({ queryKey: ["asset-tprm"] });
      toast.success(isNb ? "Kontaktperson oppdatert" : "Contact updated");
      setEditing(false);
    },
    onError: (err: any) => {
      if (err?.message !== "validation") {
        toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update");
      }
    },
  });

  const handleCancel = () => {
    setName(contactPerson || "");
    setEmail(contactEmail || "");
    setPhone(contactPhone || "");
    setErrors({});
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            {isNb ? "Kontaktperson" : "Contact person"}
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isNb ? "For- og etternavn" : "Full name"}
            className="h-7 text-xs"
            maxLength={100}
          />
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email || errors.channel) setErrors({}); }}
              placeholder={isNb ? "kontakt@leverandor.no" : "contact@vendor.com"}
              className={cn("h-7 text-xs", errors.email && "border-destructive focus-visible:ring-destructive")}
              maxLength={255}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-[11px] text-destructive mt-0.5">{errors.email}</p>}
          </div>
          <div>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (errors.phone || errors.channel) setErrors({}); }}
              placeholder={isNb ? "+47 xxx xx xxx" : "+1 xxx xxx xxxx"}
              className={cn("h-7 text-xs", errors.phone && "border-destructive focus-visible:ring-destructive")}
              maxLength={20}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-[11px] text-destructive mt-0.5">{errors.phone}</p>}
          </div>
          {errors.channel && (
            <p className="text-[11px] text-warning flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.channel}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground italic">
            {isNb ? "Telefon eller e-post er obligatorisk." : "Phone or email is required."}
          </p>
          <div className="flex gap-1 pt-0.5">
            <Button
              size="sm"
              variant="default"
              className="h-6 text-xs px-2"
              onClick={() => updateContact.mutate()}
              disabled={updateContact.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              {isNb ? "Lagre" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs px-2"
              onClick={handleCancel}
            >
              <X className="h-3 w-3 mr-1" />
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Read mode ----
  // Subtil mangel-indikator: stiplet venstre-kant + dempet ikon-bakgrunn
  const wrapperBase = "flex items-center gap-2.5 group rounded-md transition-colors";
  const wrapperState =
    status === "missing"
      ? "border-l-2 border-dashed border-warning/60 bg-warning/[0.04] pl-2 py-1 -ml-2"
      : status === "incomplete"
      ? "border-l-2 border-dashed border-warning/50 bg-warning/[0.03] pl-2 py-1 -ml-2"
      : "";

  const iconBg =
    status === "complete"
      ? "bg-muted"
      : "bg-warning/10 ring-1 ring-warning/20";
  const iconColor =
    status === "complete" ? "text-muted-foreground" : "text-warning";

  const missingLabel =
    status === "missing"
      ? (isNb ? "Mangler kontaktperson" : "Missing contact person")
      : status === "incomplete"
      ? (isNb ? "Mangler e-post eller telefon" : "Missing email or phone")
      : "";

  const tooltipText =
    status === "missing"
      ? (isNb
          ? "Legg til en kontaktperson hos leverandøren med telefon eller e-post."
          : "Add a contact person at the vendor with phone or email.")
      : status === "incomplete"
      ? (isNb
          ? "Telefon eller e-post er obligatorisk for å kunne kontakte personen."
          : "Phone or email is required to reach this contact.")
      : "";

  return (
    <div className={cn(wrapperBase, wrapperState)}>
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", iconBg)}>
        <Mail className={cn("h-3.5 w-3.5", iconColor)} />
      </div>
      <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
        <div className="flex items-center gap-1">
          <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider">
            {isNb ? "Kontaktperson" : "Contact person"}
          </p>
          {status !== "complete" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <AlertCircle className="h-3 w-3 text-warning" aria-label={missingLabel} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-[12px]">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          )}
          <button
            onClick={() => setEditing(true)}
            className="p-0.5 rounded hover:bg-muted"
            aria-label={isNb ? "Rediger kontakt" : "Edit contact"}
          >
            <Pencil className="h-3 w-3 text-muted-foreground/60" />
          </button>
        </div>

        {status === "complete" && (
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="font-medium text-foreground">{contactPerson}</span>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline text-[13px]">
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="text-muted-foreground hover:underline text-[13px] flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contactPhone}
              </a>
            )}
          </div>
        )}

        {status === "incomplete" && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-medium text-foreground">{contactPerson}</span>
            <button
              onClick={() => setEditing(true)}
              className="text-[12px] text-warning hover:underline inline-flex items-center gap-1 font-medium"
            >
              <AlertCircle className="h-3 w-3" />
              {isNb ? "Legg til e-post eller telefon" : "Add email or phone"}
            </button>
          </div>
        )}

        {status === "missing" && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-warning hover:underline inline-flex items-center gap-1 font-medium"
          >
            <UserPlus className="h-3 w-3" />
            {isNb ? "Legg til kontaktperson" : "Add contact person"}
          </button>
        )}
      </div>
    </div>
  );
};
