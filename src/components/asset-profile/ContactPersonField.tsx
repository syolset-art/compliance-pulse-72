import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const updateContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("assets")
        .update({
          contact_person: name.trim() || null,
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
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
    onError: () => {
      toast.error(isNb ? "Kunne ikke oppdatere" : "Failed to update");
    },
  });

  const handleCancel = () => {
    setName(contactPerson || "");
    setEmail(contactEmail || "");
    setPhone(contactPhone || "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
            {isNb ? "Kontaktperson" : "Contact"}
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isNb ? "Navn" : "Name"}
            className="h-7 text-xs"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isNb ? "E-post" : "Email"}
            className="h-7 text-xs"
          />
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={isNb ? "Telefon" : "Phone"}
            className="h-7 text-xs"
          />
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

  return (
    <div className="flex items-start gap-2.5 group">
      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            {isNb ? "Kontaktperson" : "Contact"}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        {contactPerson ? (
          <div className="text-xs space-y-0.5">
            <p className="font-medium text-foreground">{contactPerson}</p>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline text-[11px] block">
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="text-muted-foreground hover:underline text-[11px] flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contactPhone}
              </a>
            )}
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground/50 italic hover:text-muted-foreground transition-colors"
          >
            {isNb ? "Legg til kontaktperson" : "Add contact"}
          </button>
        )}
      </div>
    </div>
  );
};
