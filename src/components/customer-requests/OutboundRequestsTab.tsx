import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { OutboundRequestCard, type OutboundRequest } from "./OutboundRequestCard";
import { SendRequestWizard } from "./SendRequestWizard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Inbox, ShieldAlert } from "lucide-react";
import { toast } from "sonner";


const STORAGE_KEY = "mynder_outbound_requests_v2";
const AUTO_DELETE_DAYS = 180; // 6 months retention

const DEMO_OUTBOUND_REQUESTS: OutboundRequest[] = [
  {
    id: "demo-out-1",
    vendor_name: "Stripe Payments Europe",
    request_type: "dpa",
    status: "awaiting",
    due_date: "",
    sent_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    sent_by_lara: true,
    approved_by: "Synnøve",
  },
  {
    id: "demo-out-2",
    vendor_name: "Acme Cloud AS",
    request_type: "dpa",
    status: "received",
    due_date: "",
    sent_date: new Date(Date.now() - 16 * 86400000).toISOString().split("T")[0],
    response_date: new Date(Date.now() - 16 * 86400000).toISOString().split("T")[0],
    sent_by_lara: true,
    approved_by: "Synnøve",
  },
  {
    id: "demo-out-3",
    vendor_name: "ADVOKATFIRMA HØYER",
    request_type: "dpa",
    status: "awaiting",
    due_date: "",
    sent_date: new Date(Date.now() - 18 * 86400000).toISOString().split("T")[0],
    approved_by: "Synnøve",
  },
  {
    id: "demo-out-4",
    vendor_name: "Microsoft Norge AS",
    request_type: "dpa",
    status: "overdue",
    due_date: new Date(Date.now() - 11 * 86400000).toISOString().split("T")[0],
    sent_date: new Date(Date.now() - 26 * 86400000).toISOString().split("T")[0],
    sent_by_lara: true,
    approved_by: "Synnøve",
  },
];

function loadOutboundRequests(): OutboundRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEMO_OUTBOUND_REQUESTS;
}

function saveOutboundRequests(requests: OutboundRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function autoCleanOldRequests(requests: OutboundRequest[]): OutboundRequest[] {
  const cutoff = Date.now() - AUTO_DELETE_DAYS * 86400000;
  return requests.filter((r) => new Date(r.sent_date).getTime() > cutoff);
}

interface OutboundRequestsTabProps {
  wizardOpen?: boolean;
  onWizardOpenChange?: (open: boolean) => void;
  /** Begrens til én leverandør (brukes fra leverandørprofilen) */
  assetId?: string;
  vendorName?: string;
  hideRetentionNote?: boolean;
}

export function OutboundRequestsTab({ wizardOpen: externalWizardOpen, onWizardOpenChange, assetId, vendorName, hideRetentionNote }: OutboundRequestsTabProps = {}) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState<OutboundRequest[]>(() => autoCleanOldRequests(loadOutboundRequests()));
  const [internalWizardOpen, setInternalWizardOpen] = useState(false);
  const wizardOpen = externalWizardOpen ?? internalWizardOpen;
  const setWizardOpen = onWizardOpenChange ?? setInternalWizardOpen;

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = vendorName?.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesVendor =
        !needle && !assetId
          ? true
          : (assetId && r.vendor_id === assetId) ||
            (!!needle && r.vendor_name.trim().toLowerCase() === needle);
      const matchesSearch = !search || r.vendor_name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.request_type === typeFilter;
      const matchesStatus = statusFilter === "all" ? r.status !== "archived" : r.status === statusFilter;
      return matchesVendor && matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, search, typeFilter, statusFilter, assetId, vendorName]);



  useEffect(() => {
    saveOutboundRequests(requests);
  }, [requests]);

  useEffect(() => {
    const handler = () => setRequests(autoCleanOldRequests(loadOutboundRequests()));
    window.addEventListener("outbound-requests-updated", handler);
    return () => window.removeEventListener("outbound-requests-updated", handler);
  }, []);

  const handleSend = (types: string[], vendorIds: string[], dueDate: string, vendorNames?: Record<string, string>) => {
    const newRequests: OutboundRequest[] = types.flatMap((type) =>
      vendorIds.map((id, i) => ({
        id: `out-new-${Date.now()}-${type}-${i}`,
        vendor_name: vendorNames?.[id] || `Leverandør ${id.substring(0, 6)}`,
        request_type: type,
        status: "sent" as const,
        due_date: dueDate,
        sent_date: new Date().toISOString().split("T")[0],
      }))
    );
    setRequests((prev) => [...newRequests, ...prev]);
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (!deleteId) return;
    setRequests((prev) => prev.filter((r) => r.id !== deleteId));
    toast.success(isNb ? "Melding slettet" : "Message deleted");
    setDeleteId(null);
  };

  const handleArchive = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "archived" as const } : r));
    toast.success(isNb ? "Melding arkivert" : "Message archived");
  };

  const handleToggleVisibility = (id: string, makePublic: boolean) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, visibility: makePublic ? "public" : "private" } : r));
    toast.success(isNb ? (makePublic ? "Satt til offentlig" : "Satt til privat") : (makePublic ? "Set to public" : "Set to private"));
  };

  return (
    <div className="space-y-6">
      {/* GDPR auto-cleanup info */}
      <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/30 px-4 py-3">
        <ShieldAlert className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isNb
            ? `Meldinger slettes automatisk etter ${AUTO_DELETE_DAYS} dager i tråd med dataminimeringsprinsippet (GDPR art. 5). Du kan også slette eller arkivere meldinger manuelt via menyen på hver rad.`
            : `Messages are automatically deleted after ${AUTO_DELETE_DAYS} days in accordance with the data minimization principle (GDPR Art. 5). You can also manually delete or archive messages via the menu on each row.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isNb ? "Søk leverandør..." : "Search vendor..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={isNb ? "Type" : "Type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isNb ? "Alle typer" : "All types"}</SelectItem>
            <SelectItem value="vendor_assessment">{isNb ? "Leverandørvurdering" : "Vendor Assessment"}</SelectItem>
            <SelectItem value="dpa">DPA</SelectItem>
            <SelectItem value="iso_documentation">ISO 27001</SelectItem>
            <SelectItem value="soc2">SOC 2</SelectItem>
            <SelectItem value="gdpr_report">GDPR</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isNb ? "Alle aktive" : "All active"}</SelectItem>
            <SelectItem value="sent">{isNb ? "Sendt" : "Sent"}</SelectItem>
            <SelectItem value="awaiting">{isNb ? "Venter på svar" : "Awaiting reply"}</SelectItem>
            <SelectItem value="received">{isNb ? "Mottatt" : "Received"}</SelectItem>
            <SelectItem value="overdue">{isNb ? "Forfalt" : "Overdue"}</SelectItem>
            <SelectItem value="archived">{isNb ? "Arkivert" : "Archived"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List grouped by month */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">{isNb ? "Ingen forespørsler funnet" : "No requests found"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const locale = isNb ? "nb-NO" : "en-US";
            const groups: { key: string; label: string; items: typeof filtered }[] = [];
            const map = new Map<string, { label: string; items: typeof filtered }>();
            for (const r of filtered) {
              const d = new Date(r.sent_date);
              const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
              const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" }).toUpperCase();
              if (!map.has(key)) { map.set(key, { label, items: [] }); groups.push({ key, label, items: [] }); }
              map.get(key)!.items.push(r);
            }
            return groups.map((g) => ({ ...g, items: map.get(g.key)!.items })).map((group) => (
              <div key={group.key} className="space-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[12px] font-semibold tracking-wider text-muted-foreground">{group.label}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[12px] text-muted-foreground tabular-nums">{group.items.length}</span>
                </div>
                <div className="divide-y divide-border/60">
                  {group.items.map((req) => (
                    <OutboundRequestCard key={req.id} request={req} onDelete={handleDelete} onArchive={handleArchive} onToggleVisibility={handleToggleVisibility} />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      <SendRequestWizard open={wizardOpen} onOpenChange={setWizardOpen} onSend={handleSend} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isNb ? "Slett melding" : "Delete message"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isNb
                ? "Er du sikker på at du vil slette denne meldingen? Handlingen kan ikke angres."
                : "Are you sure you want to delete this message? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isNb ? "Avbryt" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              {isNb ? "Slett" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
