import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, Mail, User, Users } from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_USERS } from "@/lib/platformUsers";

interface Recipient {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface ShareOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerNumber: string;
  serviceTitle?: string;
  customerName: string;
  customerEmail?: string;
}

export function ShareOfferDialog({
  open, onOpenChange, offerNumber, serviceTitle, customerName, customerEmail,
}: ShareOfferDialogProps) {
  const customerContacts: Recipient[] = useMemo(() => {
    const list: Recipient[] = [];
    if (customerEmail) {
      list.push({
        id: "primary",
        name: `${customerName} (hovedkontakt)`,
        email: customerEmail,
        role: "Hovedkontakt",
      });
    }
    return list;
  }, [customerName, customerEmail]);

  const partnerUsers: Recipient[] = PLATFORM_USERS.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.roleLabelNb ?? u.role,
  }));

  const [tab, setTab] = useState<"customer" | "partner" | "other">(
    customerContacts.length > 0 ? "customer" : "partner",
  );
  const [selectedId, setSelectedId] = useState<string>(customerContacts[0]?.id ?? partnerUsers[0]?.id ?? "");
  const [customEmail, setCustomEmail] = useState("");
  const [message, setMessage] = useState(
    `Hei!\n\nHer er tilbud ${offerNumber}${serviceTitle ? ` – ${serviceTitle}` : ""}. Ta gjerne kontakt om du har spørsmål.`,
  );

  useEffect(() => {
    if (!open) return;
    setTab(customerContacts.length > 0 ? "customer" : "partner");
    setSelectedId(customerContacts[0]?.id ?? partnerUsers[0]?.id ?? "");
    setCustomEmail("");
    setMessage(
      `Hei!\n\nHer er tilbud ${offerNumber}${serviceTitle ? ` – ${serviceTitle}` : ""}. Ta gjerne kontakt om du har spørsmål.`,
    );
  }, [open, offerNumber, serviceTitle, customerContacts, partnerUsers]);

  const activeList = tab === "customer" ? customerContacts : partnerUsers;
  const selected = activeList.find((r) => r.id === selectedId);

  const resolvedEmail = tab === "other" ? customEmail.trim() : selected?.email ?? "";
  const resolvedName = tab === "other" ? customEmail.trim() : selected?.name ?? "";

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail);

  const handleSend = () => {
    if (!isValidEmail) {
      toast.error("Ugyldig e-postadresse");
      return;
    }
    toast.success(`Tilbud ${offerNumber} delt`, {
      description: `Sendt til ${resolvedName} (${resolvedEmail})`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Del tilbud {offerNumber}
          </DialogTitle>
          <DialogDescription>
            Send tilbudet på e-post til en kontaktperson hos kunden eller en bruker i partnermodulen.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" className="gap-1.5" disabled={customerContacts.length === 0}>
              <User className="h-3.5 w-3.5" /> Kunde
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Partner
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Annen e-post
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-3">
            {customerContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Ingen kontaktpersoner registrert på {customerName}.
              </p>
            ) : (
              <RadioGroup value={selectedId} onValueChange={setSelectedId} className="space-y-2">
                {customerContacts.map((c) => (
                  <Label
                    key={c.id}
                    htmlFor={`cust-${c.id}`}
                    className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <RadioGroupItem value={c.id} id={`cust-${c.id}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                    {c.role && <Badge variant="outline" className="text-xs">{c.role}</Badge>}
                  </Label>
                ))}
              </RadioGroup>
            )}
          </TabsContent>

          <TabsContent value="partner" className="mt-3">
            <RadioGroup value={selectedId} onValueChange={setSelectedId} className="space-y-2 max-h-64 overflow-auto pr-1">
              {partnerUsers.map((u) => (
                <Label
                  key={u.id}
                  htmlFor={`part-${u.id}`}
                  className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/50"
                >
                  <RadioGroupItem value={u.id} id={`part-${u.id}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  {u.role && <Badge variant="outline" className="text-xs">{u.role}</Badge>}
                </Label>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="other" className="mt-3 space-y-2">
            <Label htmlFor="custom-email" className="text-sm">E-postadresse</Label>
            <Input
              id="custom-email"
              type="email"
              placeholder="navn@firma.no"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-2 mt-2">
          <Label htmlFor="share-message" className="text-sm">Melding (valgfritt)</Label>
          <Textarea
            id="share-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none text-sm"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSend} disabled={!isValidEmail} className="gap-1.5">
            <Send className="h-4 w-4" />
            Send tilbud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
