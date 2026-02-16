import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/widgets/MetricCard";
import { CustomerRequestCard } from "@/components/customer-requests/CustomerRequestCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Clock, Send, AlertCircle, Search } from "lucide-react";

const DEMO_REQUESTS = [
  {
    id: "demo-1",
    customer_name: "Allier AS",
    customer_email: "compliance@allier.no",
    request_type: "vendor_assessment",
    title: "Norsk leverandørvurdering",
    description: "Forespørsel om komplett leverandørvurdering inkl. GDPR.",
    status: "in_progress",
    progress_percent: 100,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "demo-2",
    customer_name: "TechCorp AS",
    customer_email: "security@techcorp.no",
    request_type: "iso_documentation",
    title: "ISO 27001 dokumentasjon",
    description: "Ber om kopi av ISO 27001-sertifisering og tilhørende dokumentasjon.",
    status: "in_progress",
    progress_percent: 60,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "demo-3",
    customer_name: "Nordic Solutions",
    customer_email: "legal@nordicsolutions.no",
    request_type: "dpa",
    title: "DPA-forespørsel",
    description: "Ønsker å inngå databehandleravtale.",
    status: "pending",
    progress_percent: 30,
    due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "demo-4",
    customer_name: "Bergen Finans AS",
    customer_email: "risk@bergenfinans.no",
    request_type: "soc2",
    title: "SOC 2-rapport",
    description: "Forespørsel om SOC 2 Type II-rapport.",
    status: "completed",
    progress_percent: 100,
    due_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export function InboundRequestsContent() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: dbRequests = [] } = useQuery({
    queryKey: ["customer-compliance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const requests = dbRequests.length > 0 ? dbRequests : DEMO_REQUESTS;

  const filtered = requests.filter((r: any) =>
    !search || r.customer_name.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((r: any) => r.status === "pending" || r.status === "in_progress");
  const completed = filtered.filter((r: any) => r.status === "completed");
  const archived = filtered.filter((r: any) => r.status === "archived");
  const overdue = filtered.filter((r: any) => r.due_date && new Date(r.due_date) < new Date() && r.status !== "completed" && r.status !== "archived");

  const tabData: Record<string, any[]> = { pending, completed, all: filtered, archived };

  const handleShare = async (id: string, mode: string, customers: string[]) => {
    if (id.startsWith("demo-")) {
      const req = requests.find((r: any) => r.id === id);
      if (req) {
        (req as any).status = "completed";
        (req as any).shared_mode = mode;
        (req as any).shared_with_customers = customers;
        (req as any).progress_percent = 100;
      }
      return;
    }
    await supabase
      .from("customer_compliance_requests" as any)
      .update({
        status: "completed",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        shared_mode: mode,
        shared_with_customers: customers,
      } as any)
      .eq("id", id);
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title={t("customerRequests.metrics.total", "Totale forespørsler")} value={requests.length} icon={Inbox} />
        <MetricCard title={t("customerRequests.metrics.pending", "Ventende")} value={pending.length} icon={Clock} className="border-l-4 border-l-amber-400" />
        <MetricCard title={t("customerRequests.metrics.inProgress", "Under arbeid")} value={requests.filter((r: any) => r.status === "in_progress").length} icon={Send} />
        <MetricCard title={t("customerRequests.metrics.overdue", "Forfalt")} value={overdue.length} icon={AlertCircle} className={overdue.length > 0 ? "border-l-4 border-l-destructive" : ""} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("customerRequests.search", "Søk i forespørsler...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            {t("customerRequests.tabs.pending", "Avventer")}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            {t("customerRequests.tabs.completed", "Fullført")}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{completed.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            {t("customerRequests.tabs.all", "Alle")}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{filtered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">{t("customerRequests.tabs.archived", "Arkivert")}</TabsTrigger>
        </TabsList>

        {["pending", "completed", "all", "archived"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {(tabData[tab] || []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">{t("customerRequests.empty", "Ingen forespørsler her")}</p>
              </div>
            ) : (
              (tabData[tab] || []).map((req: any) => (
                <CustomerRequestCard key={req.id} request={req} onShare={handleShare} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
