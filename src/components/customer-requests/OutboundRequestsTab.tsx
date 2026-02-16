import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "@/components/widgets/MetricCard";
import { OutboundRequestCard, type OutboundRequest } from "./OutboundRequestCard";
import { SendRequestWizard } from "./SendRequestWizard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Clock, CheckCircle2, AlertTriangle, Search, Plus, Inbox } from "lucide-react";

const DEMO_OUTBOUND_REQUESTS: OutboundRequest[] = [
  {
    id: "out-1",
    vendor_name: "Microsoft Norge",
    vendor_category: "SaaS",
    request_type: "vendor_assessment",
    status: "received",
    due_date: "2026-01-15",
    sent_date: "2025-12-01",
    response_date: "2026-01-10",
  },
  {
    id: "out-2",
    vendor_name: "Atea AS",
    vendor_category: "IT-drift",
    request_type: "dpa",
    status: "awaiting",
    due_date: "2026-03-01",
    sent_date: "2026-01-15",
  },
  {
    id: "out-3",
    vendor_name: "AWS (Amazon)",
    vendor_category: "Infrastruktur",
    request_type: "soc2",
    status: "overdue",
    due_date: "2026-02-01",
    sent_date: "2025-12-15",
  },
  {
    id: "out-4",
    vendor_name: "Visma",
    vendor_category: "SaaS",
    request_type: "iso_documentation",
    status: "received",
    due_date: "2026-02-10",
    sent_date: "2026-01-05",
    response_date: "2026-02-08",
  },
  {
    id: "out-5",
    vendor_name: "Basefarm",
    vendor_category: "Infrastruktur",
    request_type: "vendor_assessment",
    status: "in_progress",
    due_date: "2026-04-01",
    sent_date: "2026-02-01",
  },
];

export function OutboundRequestsTab() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [requests, setRequests] = useState<OutboundRequest[]>(DEMO_OUTBOUND_REQUESTS);
  const [wizardOpen, setWizardOpen] = useState(false);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch = !search || r.vendor_name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.request_type === typeFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [requests, search, typeFilter, statusFilter]);

  const totalSent = requests.length;
  const awaiting = requests.filter((r) => r.status === "awaiting" || r.status === "in_progress").length;
  const received = requests.filter((r) => r.status === "received").length;
  const overdue = requests.filter((r) => r.status === "overdue").length;

  const handleSend = (types: string[], vendorIds: string[], dueDate: string) => {
    const newRequests: OutboundRequest[] = types.flatMap((type) =>
      vendorIds.map((id, i) => ({
        id: `out-new-${Date.now()}-${type}-${i}`,
        vendor_name: `Leverandør ${id.substring(0, 6)}`,
        request_type: type,
        status: "awaiting" as const,
        due_date: dueDate,
        sent_date: new Date().toISOString().split("T")[0],
      }))
    );
    setRequests((prev) => [...newRequests, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title={isNb ? "Totalt sendt" : "Total Sent"}
          value={totalSent}
          icon={Send}
        />
        <MetricCard
          title={isNb ? "Avventer svar" : "Awaiting Response"}
          value={awaiting}
          icon={Clock}
          className="border-l-4 border-l-amber-400"
        />
        <MetricCard
          title={isNb ? "Mottatt" : "Received"}
          value={received}
          icon={CheckCircle2}
          className="border-l-4 border-l-emerald-400"
        />
        <MetricCard
          title={isNb ? "Forfalt" : "Overdue"}
          value={overdue}
          icon={AlertTriangle}
          className={overdue > 0 ? "border-l-4 border-l-destructive" : ""}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isNb ? "Søk leverandør..." : "Search vendor..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={isNb ? "Type" : "Type"} />
          </SelectTrigger>
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isNb ? "Alle" : "All"}</SelectItem>
            <SelectItem value="awaiting">{isNb ? "Avventer" : "Awaiting"}</SelectItem>
            <SelectItem value="in_progress">{isNb ? "Under arbeid" : "In Progress"}</SelectItem>
            <SelectItem value="received">{isNb ? "Mottatt" : "Received"}</SelectItem>
            <SelectItem value="overdue">{isNb ? "Forfalt" : "Overdue"}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setWizardOpen(true)} className="gap-1.5 ml-auto">
          <Plus className="h-4 w-4" />
          {isNb ? "Send forespørsel" : "Send Request"}
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {isNb ? "Ingen forespørsler funnet" : "No requests found"}
            </p>
          </div>
        ) : (
          filtered.map((req) => <OutboundRequestCard key={req.id} request={req} />)
        )}
      </div>

      <SendRequestWizard open={wizardOpen} onOpenChange={setWizardOpen} onSend={handleSend} />
    </div>
  );
}
