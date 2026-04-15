import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/widgets/MetricCard";
import { CustomerRequestCard } from "@/components/customer-requests/CustomerRequestCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Inbox, Clock, Send, AlertCircle, Search } from "lucide-react";

const INITIAL_DEMO_REQUESTS = [
  {
    id: "demo-1",
    customer_name: "Allier AS",
    customer_email: "compliance@allier.no",
    request_type: "vendor_assessment",
    title: "Norsk leverandørvurdering",
    description: "Forespørsel om komplett leverandørvurdering inkl. GDPR.",
    status: "read",
    progress_percent: 100,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    shared_mode: null as string | null,
    shared_with_customers: [] as string[],
  },
  {
    id: "demo-2",
    customer_name: "TechCorp AS",
    customer_email: "security@techcorp.no",
    request_type: "iso_documentation",
    title: "ISO 27001 dokumentasjon",
    description: "Ber om kopi av ISO 27001-sertifisering og tilhørende dokumentasjon.",
    status: "read",
    progress_percent: 60,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    shared_mode: null as string | null,
    shared_with_customers: [] as string[],
  },
  {
    id: "demo-3",
    customer_name: "Nordic Solutions",
    customer_email: "legal@nordicsolutions.no",
    request_type: "dpa",
    title: "DPA-forespørsel",
    description: "Ønsker å inngå databehandleravtale.",
    status: "new",
    progress_percent: 30,
    due_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    shared_mode: null as string | null,
    shared_with_customers: [] as string[],
  },
  {
    id: "demo-4",
    customer_name: "Bergen Finans AS",
    customer_email: "risk@bergenfinans.no",
    request_type: "soc2",
    title: "SOC 2-rapport",
    description: "Forespørsel om SOC 2 Type II-rapport.",
    status: "responded",
    progress_percent: 100,
    due_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    shared_mode: "selected",
    shared_with_customers: ["Allier AS", "Bergen Finans AS"],
  },
  {
    id: "demo-5",
    customer_name: "Visma Software AS",
    customer_email: "security@visma.com",
    request_type: "gdpr_report",
    title: "GDPR-samsvarserklæring",
    description: "Ber om dokumentasjon på GDPR-etterlevelse og databehandlingsoversikt.",
    status: "new",
    progress_percent: 0,
    due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    shared_mode: null as string | null,
    shared_with_customers: [] as string[],
  },
  {
    id: "demo-6",
    customer_name: "DNB Bank ASA",
    customer_email: "vendor-risk@dnb.no",
    request_type: "vendor_assessment",
    title: "Leverandørvurdering – årlig revisjon",
    description: "Årlig revisjon av leverandørforholdet. Ber om oppdatert sikkerhetsdokumentasjon.",
    status: "read",
    progress_percent: 45,
    due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    shared_mode: null as string | null,
    shared_with_customers: [] as string[],
  },
];

export function InboundRequestsContent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("open");
  const [demoRequests, setDemoRequests] = useState(INITIAL_DEMO_REQUESTS);

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

  const requests = dbRequests.length > 0 ? dbRequests : demoRequests;

  const filtered = requests.filter((r: any) =>
    !search || r.customer_name.toLowerCase().includes(search.toLowerCase()) || r.title.toLowerCase().includes(search.toLowerCase())
  );

  const open = filtered.filter((r: any) => r.status === "new" || r.status === "read");
  const responded = filtered.filter((r: any) => r.status === "responded");
  const archived = filtered.filter((r: any) => r.status === "archived");
  const overdue = filtered.filter((r: any) => r.due_date && new Date(r.due_date) < new Date() && r.status !== "responded" && r.status !== "archived");

  const tabData: Record<string, any[]> = { open, responded, all: filtered, archived };


  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title={t("customerRequests.metrics.total", "Totale meldinger")} value={requests.length} icon={Inbox} />
        <MetricCard title={t("customerRequests.metrics.new", "Nye")} value={requests.filter((r: any) => r.status === "new").length} icon={Clock} className="border-l-4 border-l-amber-400" />
        <MetricCard title={t("customerRequests.metrics.responded", "Besvart")} value={responded.length} icon={Send} />
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
          <TabsTrigger value="open" className="gap-1.5">
            {t("customerRequests.tabs.open", "Åpne")}
            <Badge variant="secondary" className="text-[13px] px-1.5 py-0">{open.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="responded" className="gap-1.5">
            {t("customerRequests.tabs.responded", "Besvart")}
            <Badge variant="secondary" className="text-[13px] px-1.5 py-0">{responded.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            {t("customerRequests.tabs.all", "Alle")}
            <Badge variant="secondary" className="text-[13px] px-1.5 py-0">{filtered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">{t("customerRequests.tabs.archived", "Arkivert")}</TabsTrigger>
        </TabsList>

        {["open", "responded", "all", "archived"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {(tabData[tab] || []).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">{t("customerRequests.empty", "Ingen forespørsler her")}</p>
              </div>
            ) : (
              (tabData[tab] || []).map((req: any) => (
                <CustomerRequestCard key={req.id} request={req} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
