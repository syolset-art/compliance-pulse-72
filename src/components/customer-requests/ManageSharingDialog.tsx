import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  EyeOff,
  Search,
  RotateCcw,
  Info,
  Check,
  Filter,
  Plus,
  Mail,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface NetworkCustomer {
  id: string;
  name: string;
  isPriority: boolean;
  category: string | null;
  isShared: boolean;
  contactPerson?: string;
  contactEmail?: string;
  status: string; // 'accepted' | 'pending' | 'declined'
}

interface ManageSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestTitle: string;
  requestId: string;
  currentSharedMode?: string | null;
  currentSharedWith?: string[];
  onConfirm: (mode: string, customers: string[]) => void;
}

export function ManageSharingDialog({
  open,
  onOpenChange,
  requestTitle,
  requestId,
  currentSharedMode,
  currentSharedWith = [],
  onConfirm,
}: ManageSharingDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [step, setStep] = useState(1);
  const [sharingMode, setSharingMode] = useState<string>(currentSharedMode || "selected");
  const [search, setSearch] = useState("");
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch network connections from DB
  const { data: networkConnections = [] } = useQuery({
    queryKey: ["network-connections-sharing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_connections")
        .select("*")
        .order("organization_name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Map network connections to customer format
  const allCustomers: NetworkCustomer[] = useMemo(() => {
    return networkConnections.map((conn: any) => ({
      id: conn.id,
      name: conn.organization_name,
      isPriority: false,
      category: conn.connection_type === "customer" ? (isNb ? "Kunde" : "Customer") : (isNb ? "Leverandør" : "Vendor"),
      isShared: currentSharedWith.includes(conn.organization_name),
      contactPerson: conn.contact_person || undefined,
      contactEmail: conn.contact_email || undefined,
      status: conn.status,
    }));
  }, [networkConnections, currentSharedWith, isNb]);

  const acceptedCustomers = useMemo(() => allCustomers.filter((c) => c.status === "accepted"), [allCustomers]);

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    currentSharedWith.length > 0 ? currentSharedWith : []
  );

  const filteredCustomers = useMemo(() => {
    let list = allCustomers;
    if (search) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        c.contactEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (showPriorityOnly) {
      list = list.filter((c) => c.status === "accepted");
    }
    return list;
  }, [search, showPriorityOnly, allCustomers]);

  const handleNext = () => {
    if (sharingMode === "selected") {
      setStep(2);
    } else {
      const customers = sharingMode === "all" ? acceptedCustomers.map((c) => c.name) : [];
      onConfirm(sharingMode, customers);
      toast.success(
        sharingMode === "all"
          ? isNb ? `Delt med ${acceptedCustomers.length} kontakter` : `Shared with ${acceptedCustomers.length} contacts`
          : isNb ? "Deling oppdatert" : "Sharing updated"
      );
      resetAndClose();
    }
  };

  const handleConfirmSelected = () => {
    onConfirm("selected", selectedCustomers);
    toast.success(
      isNb
        ? `Delt med ${selectedCustomers.length} kontakter`
        : `Shared with ${selectedCustomers.length} contacts`
    );
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setSearch("");
    setShowPriorityOnly(false);
    setExpandedId(null);
    onOpenChange(false);
  };

  const toggleCustomer = (name: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => setSelectedCustomers(acceptedCustomers.map((c) => c.name));
  const handleDeselectAll = () => setSelectedCustomers([]);
  const handleResetToCurrentSharing = () => {
    setSelectedCustomers(currentSharedWith);
  };

  const totalSteps = 2;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isNb ? "Administrer deling" : "Manage Sharing"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{requestTitle}</p>
        </DialogHeader>

        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => step === 2 && setStep(1)}
              className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors ${
                step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              1. {isNb ? "Velg deling" : "Choose sharing"}
            </button>
            <button
              disabled={sharingMode !== "selected"}
              className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors ${
                step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              } ${sharingMode !== "selected" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              2. {isNb ? "Velg kunder" : "Select customers"}
            </button>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4 flex-1 overflow-auto">
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {isNb
                  ? "Steg 1 av 2: Velg hvem som skal få tilgang. Ingenting sendes ennå."
                  : "Step 1 of 2: Choose who should have access. Nothing is sent yet."}
              </p>
            </div>

            {currentSharedWith.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {isNb ? `Delt med ${currentSharedWith.length} kunder` : `Shared with ${currentSharedWith.length} customers`}
              </Badge>
            )}

            <RadioGroup value={sharingMode} onValueChange={setSharingMode} className="space-y-2">
              <label
                htmlFor="mode-all"
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  sharingMode === "all" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value="all" id="mode-all" className="mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{isNb ? "Del med alle kunder" : "Share with all customers"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isNb ? "Nye kunder får automatisk tilgang." : "New customers get access automatically."}
                  </p>
                </div>
              </label>

              <label
                htmlFor="mode-selected"
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  sharingMode === "selected" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value="selected" id="mode-selected" className="mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{isNb ? "Del med utvalgte kunder" : "Share with selected customers"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isNb ? "Velg nøyaktig hvem som får tilgang." : "Choose exactly who gets access."}
                  </p>
                </div>
              </label>

              <label
                htmlFor="mode-none"
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  sharingMode === "none" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value="none" id="mode-none" className="mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{isNb ? "Ikke del ennå" : "Don't share yet"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isNb ? "Ingen kunder ser dette foreløpig." : "No customers see this for now."}
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-3 flex-1 overflow-auto">
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {isNb
                  ? "Steg 2 av 2: Velg kunder og legg til kontaktperson med e-post."
                  : "Step 2 of 2: Select customers and add contact person with email."}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={handleResetToCurrentSharing}>
                <RotateCcw className="h-3 w-3" />
                {isNb ? "Tilbakestill" : "Reset"}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {selectedCustomers.length} {isNb ? "av" : "of"} {allCustomers.length} {isNb ? "valgt" : "selected"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={isNb ? "Søk etter kunde..." : "Search customers..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Button
                variant={showPriorityOnly ? "default" : "outline"}
                size="sm"
                className="h-8 text-[11px] gap-1"
                onClick={() => setShowPriorityOnly(!showPriorityOnly)}
              >
                <Filter className="h-3 w-3" />
                {isNb ? "Prioritet" : "Priority"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleSelectAll}>
                {isNb ? "Velg alle" : "Select all"}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleDeselectAll}>
                {isNb ? "Fjern alle" : "Deselect all"}
              </Button>
            </div>

            {allCustomers.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  {isNb
                    ? "Du har ingen kontakter i nettverket ennå. Gå til Forespørsler → Nettverk for å invitere kontakter."
                    : "You have no contacts in your network yet. Go to Requests → Network to invite contacts."}
                </p>
              </div>
            )}

            <div className="space-y-1 max-h-[280px] overflow-auto">
              {filteredCustomers.map((customer) => {
                const isSelected = selectedCustomers.includes(customer.name);
                const isExpanded = expandedId === customer.id;
                return (
                  <div key={customer.id} className="space-y-0">
                    <label
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-l-[3px] border-l-primary border-t border-r border-b border-primary/30 bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      } ${isExpanded ? "rounded-b-none" : ""}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCustomer(customer.name)}
                        aria-label={`${isNb ? "Velg" : "Select"} ${customer.name}`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {customer.contactPerson && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <User className="h-2.5 w-2.5" />
                              {customer.contactPerson}
                            </span>
                          )}
                          {customer.contactEmail && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Mail className="h-2.5 w-2.5" />
                              {customer.contactEmail}
                            </span>
                          )}
                          {customer.isShared ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[9px] px-1.5 py-0">
                              {isNb ? "Delt" : "Shared"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {isNb ? "Ikke delt" : "Not shared"}
                            </Badge>
                          )}
                          {customer.isPriority && (
                            <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30 text-[9px] px-1.5 py-0">
                              {isNb ? "Prioritet" : "Priority"}
                            </Badge>
                          )}
                          {customer.category && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {customer.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : customer.id);
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </label>
                    {isExpanded && (
                      <div className="border border-t-0 border-border rounded-b-lg bg-muted/30 px-3 py-2.5 ml-8 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">{isNb ? "Kontaktperson" : "Contact person"}</Label>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <User className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{customer.contactPerson || (isNb ? "Ikke angitt" : "Not set")}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">{isNb ? "E-post" : "Email"}</Label>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs">{customer.contactEmail || (isNb ? "Ikke angitt" : "Not set")}</span>
                            </div>
                          </div>
                        </div>
                        {!customer.contactPerson && !customer.contactEmail && (
                          <p className="text-[10px] text-muted-foreground italic">
                            {isNb ? "Ingen kontaktinfo registrert for denne kunden." : "No contact info registered for this customer."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={resetAndClose} className="text-xs">
            {isNb ? "Del senere" : "Share later"}
          </Button>
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                {isNb ? "Tilbake" : "Back"}
              </Button>
            )}
            {step === 1 && (
              <Button size="sm" onClick={handleNext} className="text-xs gap-1">
                {sharingMode === "selected"
                  ? isNb ? "Neste: Steg 2" : "Next: Step 2"
                  : isNb ? "Bekreft" : "Confirm"}
              </Button>
            )}
            {step === 2 && (
              <Button size="sm" onClick={handleConfirmSelected} className="text-xs gap-1" disabled={selectedCustomers.length === 0}>
                <Check className="h-3 w-3" />
                {isNb ? "Bekreft deling" : "Confirm sharing"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
