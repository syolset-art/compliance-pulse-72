import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, AlertTriangle, Pencil, Check, X, Copy, Phone, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "main" | "privacy" | "security";

interface RoleConfig {
  icon: typeof User;
  labelNb: string;
  labelEn: string;
  hintNb: string;
  hintEn: string;
}

const ROLES: Record<Role, RoleConfig> = {
  main: {
    icon: User,
    labelNb: "Hovedkontakt", labelEn: "Main contact",
    hintNb: "Generell kontakt hos leverandøren", hintEn: "General vendor contact",
  },
  privacy: {
    icon: Shield,
    labelNb: "Personvern (DPO)", labelEn: "Privacy (DPO)",
    hintNb: "Hvem skal kjøper kontakte ved innsynsbegjæring eller personvernhendelser?",
    hintEn: "Who should buyers contact for data subject requests or privacy incidents?",
  },
  security: {
    icon: AlertTriangle,
    labelNb: "Sikkerhet / hendelser", labelEn: "Security / incidents",
    hintNb: "Hvem skal kjøper kontakte ved sikkerhetshendelser?",
    hintEn: "Who should buyers contact for security incidents?",
  },
};

interface Props {
  assetId: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  privacyContactName?: string | null;
  privacyContactEmail?: string | null;
  securityContactName?: string | null;
  securityContactEmail?: string | null;
  isNb: boolean;
}

const emailValid = (v: string) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneValid = (v: string) => v === "" || /^[+\d][\d\s()-]{4,19}$/.test(v.trim());

export function VendorContactsBlock(props: Props) {
  const { assetId, isNb } = props;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);

  const update = useMutation({
    mutationFn: async (patch: Record<string, string | null>) => {
      const { error } = await supabase.from("assets").update(patch as any).eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asset"] });
      qc.invalidateQueries({ queryKey: ["asset-tprm"] });
      toast.success(isNb ? "Kontakt oppdatert" : "Contact updated");
      setEditing(null);
    },
    onError: () => toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update"),
  });

  const copyMain = (role: Exclude<Role, "main">) => {
    if (!props.contactPerson && !props.contactEmail) {
      toast.error(isNb ? "Hovedkontakt mangler" : "Main contact is empty");
      return;
    }
    const patch =
      role === "privacy"
        ? { privacy_contact_name: props.contactPerson ?? null, privacy_contact_email: props.contactEmail ?? null }
        : { security_contact_name: props.contactPerson ?? null, security_contact_email: props.contactEmail ?? null };
    update.mutate(patch);
  };

  const rows: { role: Role; name: string | null | undefined; email: string | null | undefined; phone?: string | null }[] = [
    { role: "main", name: props.contactPerson, email: props.contactEmail, phone: props.contactPhone },
    { role: "privacy", name: props.privacyContactName, email: props.privacyContactEmail },
    { role: "security", name: props.securityContactName, email: props.securityContactEmail },
  ];

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
        {isNb ? "Kontakter for kjøper" : "Contacts for buyers"}
      </p>
      <div className="space-y-1">
        {rows.map((row) => (
          <ContactRow
            key={row.role}
            role={row.role}
            name={row.name ?? null}
            email={row.email ?? null}
            phone={row.phone ?? null}
            isNb={isNb}
            isEditing={editing === row.role}
            onStartEdit={() => setEditing(row.role)}
            onCancel={() => setEditing(null)}
            onSave={(patch) => update.mutate(patch)}
            onCopyMain={row.role !== "main" ? () => copyMain(row.role as Exclude<Role, "main">) : undefined}
            mainHasValue={!!(props.contactPerson || props.contactEmail)}
            saving={update.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  role: Role;
  name: string | null;
  email: string | null;
  phone?: string | null;
  isNb: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Record<string, string | null>) => void;
  onCopyMain?: () => void;
  mainHasValue: boolean;
  saving: boolean;
}

function ContactRow({ role, name, email, phone, isNb, isEditing, onStartEdit, onCancel, onSave, onCopyMain, mainHasValue, saving }: RowProps) {
  const conf = ROLES[role];
  const Icon = conf.icon;
  const label = isNb ? conf.labelNb : conf.labelEn;
  const hint = isNb ? conf.hintNb : conf.hintEn;

  const [editName, setEditName] = useState(name ?? "");
  const [editEmail, setEditEmail] = useState(email ?? "");
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const isEmpty = !name && !email;
  const fieldKey = role === "main" ? "contact" : `${role}_contact`;

  const startEdit = () => {
    setEditName(name ?? "");
    setEditEmail(email ?? "");
    setEditPhone(phone ?? "");
    setErrors({});
    onStartEdit();
  };

  const handleSave = () => {
    const n = editName.trim();
    const e = editEmail.trim();
    const p = editPhone.trim();
    const errs: typeof errors = {};
    if (!emailValid(e)) errs.email = isNb ? "Ugyldig e-post" : "Invalid email";
    if (role === "main" && !phoneValid(p)) errs.phone = isNb ? "Ugyldig telefonnummer" : "Invalid phone";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const patch: Record<string, string | null> =
      role === "main"
        ? { contact_person: n || null, contact_email: e || null, contact_phone: p || null }
        : role === "privacy"
        ? { privacy_contact_name: n || null, privacy_contact_email: e || null }
        : { security_contact_name: n || null, security_contact_email: e || null };
    onSave(patch);
  };

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success(isNb ? "E-post kopiert" : "Email copied");
  };

  if (isEditing) {
    return (
      <div className="rounded-md border bg-muted/30 p-2.5 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder={isNb ? "For- og etternavn" : "Full name"}
          className="h-7 text-xs"
          maxLength={100}
        />
        <div>
          <Input
            type="email"
            value={editEmail}
            onChange={(e) => { setEditEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
            placeholder={role === "privacy" ? (isNb ? "personvern@leverandor.no" : "privacy@vendor.com") : role === "security" ? (isNb ? "sikkerhet@leverandor.no" : "security@vendor.com") : (isNb ? "kontakt@leverandor.no" : "contact@vendor.com")}
            className={cn("h-7 text-xs", errors.email && "border-destructive")}
            maxLength={255}
          />
          {errors.email && <p className="text-[11px] text-destructive mt-0.5">{errors.email}</p>}
        </div>
        {role === "main" && (
          <div>
            <Input
              type="tel"
              value={editPhone}
              onChange={(e) => { setEditPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: undefined }); }}
              placeholder={isNb ? "+47 xxx xx xxx" : "+1 xxx xxx xxxx"}
              className={cn("h-7 text-xs", errors.phone && "border-destructive")}
              maxLength={20}
            />
            {errors.phone && <p className="text-[11px] text-destructive mt-0.5">{errors.phone}</p>}
          </div>
        )}
        <div className="flex gap-1 pt-0.5">
          <Button size="sm" className="h-6 text-xs px-2" onClick={handleSave} disabled={saving}>
            <Check className="h-3 w-3 mr-1" />{isNb ? "Lagre" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />{isNb ? "Avbryt" : "Cancel"}
          </Button>
          {onCopyMain && mainHasValue && (
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2 ml-auto" onClick={onCopyMain} disabled={saving}>
              <Copy className="h-3 w-3 mr-1" />
              {isNb ? "Bruk hovedkontakt" : "Use main contact"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-md py-1 px-2 -mx-2 transition-colors hover:bg-muted/40",
        isEmpty && "border-l-2 border-dashed border-warning/50 bg-warning/[0.03]"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
            isEmpty ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-[12px]">{hint}</TooltipContent>
      </Tooltip>
      <div className="flex items-baseline gap-2 min-w-0 flex-1 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
        {isEmpty ? (
          <button
            onClick={startEdit}
            className="text-[12px] text-warning hover:underline inline-flex items-center gap-1 font-medium"
          >
            <AlertCircle className="h-3 w-3" />
            {isNb ? "Mangler — legg til" : "Missing — add"}
          </button>
        ) : (
          <div className="flex items-baseline gap-2 flex-wrap text-[13px]">
            {name && <span className="font-medium text-foreground">{name}</span>}
            {email && (
              <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="text-muted-foreground hover:underline inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />{phone}
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isEmpty && email && (
          <button onClick={copyEmail} className="p-1 rounded hover:bg-muted" aria-label={isNb ? "Kopier e-post" : "Copy email"}>
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {isEmpty && onCopyMain && mainHasValue && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onCopyMain} className="p-1 rounded hover:bg-muted" aria-label={isNb ? "Bruk hovedkontakt" : "Use main contact"}>
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[12px]">
              {isNb ? "Bruk hovedkontakt" : "Use main contact"}
            </TooltipContent>
          </Tooltip>
        )}
        <button onClick={startEdit} className="p-1 rounded hover:bg-muted" aria-label={isNb ? "Rediger" : "Edit"}>
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
