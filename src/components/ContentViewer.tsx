import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FileText, 
  Users, 
  Server, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  ExternalLink,
  Edit,
  Trash2,
  Info,
  List
} from "lucide-react";

interface ContentViewerProps {
  contentType: string;
  filter?: string;
  viewMode?: "cards" | "table" | "list" | "names-only";
  sortBy?: string;
  filterCriteria?: {
    risk_level?: string;
    has_dpa?: boolean;
    country?: string;
    priority?: string;
    status?: string;
  };
  explanation?: string;
}

const mockData = {
  protocols: [
    {
      id: "1",
      name: "Kunderegistersystem",
      purpose: "Behandling av kundedata for fakturering",
      dataCategories: ["Navn", "Adresse", "E-post", "Fakturainformasjon"],
      legalBasis: "Kontraktsoppfyllelse",
      retention: "5 år etter siste transaksjon",
      status: "Aktiv"
    },
    {
      id: "2",
      name: "HR-system",
      purpose: "Administrasjon av ansattdata",
      dataCategories: ["Navn", "Fødselsnummer", "Lønn", "Ansettelsesforhold"],
      legalBasis: "Arbeidsmiljøloven",
      retention: "10 år etter avsluttet arbeidsforhold",
      status: "Aktiv"
    },
    {
      id: "3",
      name: "Markedsføring",
      purpose: "Nyhetsbrev og målrettet markedsføring",
      dataCategories: ["E-post", "Navn", "Interesser"],
      legalBasis: "Samtykke",
      retention: "2 år eller til samtykke trekkes",
      status: "Under gjennomgang"
    }
  ],
  "third-parties": [
    {
      id: "1",
      name: "Microsoft Azure",
      type: "Sky-infrastruktur",
      dataProcessing: true,
      country: "Norge",
      dpa: true,
      certifications: ["ISO 27001", "SOC 2", "GDPR"],
      systems: ["CRM System", "Kundeportal", "Analytics Platform"]
    },
    {
      id: "2",
      name: "Microsoft 365",
      type: "Produktivitetsverktøy",
      dataProcessing: true,
      country: "EU",
      dpa: true,
      certifications: ["ISO 27001", "SOC 2", "GDPR"],
      systems: ["E-post", "Dokumenthåndtering", "Teams"]
    },
    {
      id: "3",
      name: "Mailchimp",
      type: "E-postmarkedsføring",
      dataProcessing: true,
      country: "USA",
      dpa: true,
      certifications: ["Privacy Shield"],
      systems: ["Markedsføringssystem"]
    },
    {
      id: "4",
      name: "Visma",
      type: "Økonomisystem",
      dataProcessing: true,
      country: "Norge",
      dpa: true,
      certifications: ["ISO 27001", "NEN 7510"],
      systems: ["HR-system", "Lønnssystem", "Regnskap"]
    },
    {
      id: "5",
      name: "Amazon Web Services",
      type: "Sky-infrastruktur",
      dataProcessing: true,
      country: "EU/USA",
      dpa: true,
      certifications: ["ISO 27001", "SOC 2", "GDPR"],
      systems: ["Database", "Backup-løsning"]
    }
  ],
  systems: [
    {
      id: "1",
      name: "CRM System",
      vendor: "Microsoft Dynamics",
      riskLevel: "Medium",
      dataTypes: ["Kundedata", "Kontaktinformasjon"],
      users: 45,
      lastReview: "2024-11-15"
    },
    {
      id: "2",
      name: "HR Portal",
      vendor: "Visma",
      riskLevel: "High",
      dataTypes: ["Persondata", "Lønnsinformasjon"],
      users: 12,
      lastReview: "2024-10-20"
    },
    {
      id: "3",
      name: "Kundeportal",
      vendor: "Egenutviklet",
      riskLevel: "Low",
      dataTypes: ["Kontaktinformasjon"],
      users: 230,
      lastReview: "2024-11-01"
    }
  ]
};

const filterData = (data: any[], filter?: string, filterCriteria?: any) => {
  let filtered = data;
  
  // Text search filter
  if (filter) {
    const lowerFilter = filter.toLowerCase();
    filtered = filtered.filter(item => {
      if (item.name?.toLowerCase().includes(lowerFilter)) return true;
      if (item.vendor?.toLowerCase().includes(lowerFilter)) return true;
      if (item.type?.toLowerCase().includes(lowerFilter)) return true;
      if (item.systems?.some((s: string) => s.toLowerCase().includes(lowerFilter))) return true;
      return false;
    });
  }
  
  // Advanced criteria filters
  if (filterCriteria) {
    if (filterCriteria.risk_level) {
      filtered = filtered.filter(item => item.riskLevel === filterCriteria.risk_level);
    }
    if (filterCriteria.has_dpa !== undefined) {
      filtered = filtered.filter(item => item.dpa === filterCriteria.has_dpa);
    }
    if (filterCriteria.country) {
      filtered = filtered.filter(item => item.country?.toLowerCase().includes(filterCriteria.country.toLowerCase()));
    }
    if (filterCriteria.priority) {
      filtered = filtered.filter(item => item.priority?.toLowerCase() === filterCriteria.priority.toLowerCase());
    }
    if (filterCriteria.status) {
      filtered = filtered.filter(item => item.status?.toLowerCase().includes(filterCriteria.status.toLowerCase()));
    }
  }
  
  return filtered;
};

const sortData = (data: any[], sortBy?: string) => {
  if (!sortBy) return data;
  
  const sorted = [...data];
  
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "date":
      return sorted.sort((a, b) => new Date(b.lastReview || 0).getTime() - new Date(a.lastReview || 0).getTime());
    case "risk":
      const riskOrder = { "High": 3, "Medium": 2, "Low": 1 };
      return sorted.sort((a, b) => (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0));
    case "vendor":
      return sorted.sort((a, b) => (a.vendor || "").localeCompare(b.vendor || ""));
    case "country":
      return sorted.sort((a, b) => (a.country || "").localeCompare(b.country || ""));
    case "priority":
      const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
      return sorted.sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0));
    default:
      return sorted;
  }
};

export function ContentViewer({ contentType, filter, viewMode = "cards", sortBy, filterCriteria, explanation }: ContentViewerProps) {
  // Render gap analysis or large reports as formatted markdown/text content
  const renderGapAnalysis = () => {
    if (!explanation) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen gap-analyse tilgjengelig</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap">{explanation}</div>
        </CardContent>
      </Card>
    );
  };

  const renderProtocols = () => {
    let data = mockData.protocols;
    data = filterData(data, filter, filterCriteria);
    data = sortData(data, sortBy);
    
    if (data.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen behandlingsprotokoller funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }

    // Names-only view
    if (viewMode === "names-only") {
      return (
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {data.map((protocol) => (
                <li key={protocol.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>{protocol.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {protocol.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    }

    // List view
    if (viewMode === "list") {
      return (
        <div className="space-y-2">
          {data.map((protocol) => (
            <Card key={protocol.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{protocol.name}</p>
                      <p className="text-sm text-muted-foreground">{protocol.legalBasis}</p>
                    </div>
                  </div>
                  <Badge variant={protocol.status === "Aktiv" ? "default" : "secondary"}>
                    {protocol.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Table view
    if (viewMode === "table") {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Formål</TableHead>
                  <TableHead>Rettslig grunnlag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((protocol) => (
                  <TableRow key={protocol.id}>
                    <TableCell className="font-medium">{protocol.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{protocol.purpose}</TableCell>
                    <TableCell>{protocol.legalBasis}</TableCell>
                    <TableCell>
                      <Badge variant={protocol.status === "Aktiv" ? "default" : "secondary"}>
                        {protocol.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }
    
    // Default: Cards view
    return (
      <div className="space-y-4">
        {data.map((protocol) => (
        <Card key={protocol.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{protocol.name}</CardTitle>
              </div>
              <Badge variant={protocol.status === "Aktiv" ? "default" : "secondary"}>
                {protocol.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Formål</p>
              <p className="text-sm">{protocol.purpose}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Datakategorier</p>
              <div className="flex flex-wrap gap-1">
                {protocol.dataCategories.map((cat, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Rettslig grunnlag</p>
                <p className="text-sm font-medium">{protocol.legalBasis}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lagringstid</p>
                <p className="text-sm font-medium">{protocol.retention}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                <Edit className="h-3 w-3 mr-1" />
                Rediger
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3 mr-1" />
                Detaljer
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    );
  };

  const renderThirdParties = () => {
    let data = mockData["third-parties"];
    data = filterData(data, filter, filterCriteria);
    data = sortData(data, sortBy);
    
    if (data.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen tredjeparter funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }

    // Names-only view
    if (viewMode === "names-only") {
      return (
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {data.map((party) => (
                <li key={party.id} className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{party.name}</span>
                  <span className="text-muted-foreground ml-2">({party.country})</span>
                  <Badge variant={party.dpa ? "default" : "destructive"} className="ml-auto text-xs">
                    {party.dpa ? "DPA" : "Ingen DPA"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    }

    // List view
    if (viewMode === "list") {
      return (
        <div className="space-y-2">
          {data.map((party) => (
            <Card key={party.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{party.name}</p>
                      <p className="text-sm text-muted-foreground">{party.type} • {party.country}</p>
                    </div>
                  </div>
                  <Badge variant={party.dpa ? "default" : "destructive"}>
                    {party.dpa ? "DPA signert" : "Mangler DPA"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Table view
    if (viewMode === "table") {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>DPA Status</TableHead>
                  <TableHead>Sertifiseringer</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell className="font-medium">{party.name}</TableCell>
                    <TableCell>{party.type}</TableCell>
                    <TableCell>{party.country}</TableCell>
                    <TableCell>
                      <Badge variant={party.dpa ? "default" : "destructive"}>
                        {party.dpa ? "Signert" : "Mangler"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {party.certifications.slice(0, 2).map((cert, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                        {party.certifications.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{party.certifications.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }
    
    // Default: Cards view
    return (
      <div className="space-y-4">
        {data.map((party) => (
        <Card key={party.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{party.name}</CardTitle>
              </div>
              <Badge variant={party.dpa ? "default" : "destructive"}>
                {party.dpa ? "DPA signert" : "Mangler DPA"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
              <p className="text-sm">{party.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Land</p>
                <p className="text-sm font-medium">{party.country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Databehandler</p>
                <p className="text-sm font-medium">{party.dataProcessing ? "Ja" : "Nei"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Sertifiseringer</p>
              <div className="flex flex-wrap gap-1">
                {party.certifications.map((cert, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Brukt i systemer</p>
              <div className="flex flex-wrap gap-1">
                {party.systems.map((system, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {system}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                <Edit className="h-3 w-3 mr-1" />
                Rediger
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3 mr-1" />
                Se DPA
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    );
  };

  const renderSystems = () => {
    let data = mockData.systems;
    data = filterData(data, filter, filterCriteria);
    data = sortData(data, sortBy);
    
    if (data.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen systemer funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }

    // Names-only view
    if (viewMode === "names-only") {
      return (
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {data.map((system) => (
                <li key={system.id} className="flex items-center gap-2 text-sm">
                  <Server className="h-4 w-4 text-primary" />
                  <span>{system.name}</span>
                  <span className="text-muted-foreground ml-2">({system.vendor})</span>
                  <Badge 
                    variant={
                      system.riskLevel === "High" ? "destructive" : 
                      system.riskLevel === "Medium" ? "default" : 
                      "secondary"
                    }
                    className="ml-auto text-xs"
                  >
                    {system.riskLevel}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      );
    }

    // List view
    if (viewMode === "list") {
      return (
        <div className="space-y-2">
          {data.map((system) => (
            <Card key={system.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{system.name}</p>
                      <p className="text-sm text-muted-foreground">{system.vendor} • {system.users} brukere</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      system.riskLevel === "High" ? "destructive" : 
                      system.riskLevel === "Medium" ? "default" : 
                      "secondary"
                    }
                  >
                    {system.riskLevel} risiko
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Table view
    if (viewMode === "table") {
      return (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Leverandør</TableHead>
                  <TableHead>Brukere</TableHead>
                  <TableHead>Risikonivå</TableHead>
                  <TableHead>Sist gjennomgått</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((system) => (
                  <TableRow key={system.id}>
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell>{system.vendor}</TableCell>
                    <TableCell>{system.users}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          system.riskLevel === "High" ? "destructive" : 
                          system.riskLevel === "Medium" ? "default" : 
                          "secondary"
                        }
                      >
                        {system.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{system.lastReview}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }
    
    // Default: Cards view
    return (
      <div className="space-y-4">
        {data.map((system) => (
        <Card key={system.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{system.name}</CardTitle>
              </div>
              <Badge 
                variant={
                  system.riskLevel === "High" ? "destructive" : 
                  system.riskLevel === "Medium" ? "default" : 
                  "secondary"
                }
              >
                {system.riskLevel} risiko
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Leverandør</p>
              <p className="text-sm">{system.vendor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Datatyper</p>
              <div className="flex flex-wrap gap-1">
                {system.dataTypes.map((type, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Antall brukere</p>
                <p className="text-sm font-medium">{system.users}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sist gjennomgått</p>
                <p className="text-sm font-medium">{system.lastReview}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                <Edit className="h-3 w-3 mr-1" />
                Rediger
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3 mr-1" />
                Risikovurdering
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    );
  };

  const getTitle = () => {
    switch (contentType) {
      case "protocols": return "Behandlingsprotokoller";
      case "third-parties": return "Tredjepartsleverandører";
      case "systems": return "IT-systemer";
      case "gap-analysis": return "Gap-analyse";
      default: return "Innhold";
    }
  };

  const getIcon = () => {
    switch (contentType) {
      case "protocols": return <FileText className="h-6 w-6" />;
      case "third-parties": return <Users className="h-6 w-6" />;
      case "systems": return <Server className="h-6 w-6" />;
      case "gap-analysis": return <AlertTriangle className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  const renderContent = () => {
    switch (contentType) {
      case "protocols": return renderProtocols();
      case "third-parties": return renderThirdParties();
      case "systems": return renderSystems();
      case "gap-analysis": return renderGapAnalysis();
      default: return <p className="text-muted-foreground">Innholdstype ikke støttet ennå</p>;
    }
  };

  const getResultCount = () => {
    let data: any[] = [];
    switch (contentType) {
      case "protocols": data = mockData.protocols; break;
      case "third-parties": data = mockData["third-parties"]; break;
      case "systems": data = mockData.systems; break;
    }
    const filtered = filterData(data, filter, filterCriteria);
    return filtered.length;
  };

  const resultCount = getResultCount();
  const totalCount = (() => {
    switch (contentType) {
      case "protocols": return mockData.protocols.length;
      case "third-parties": return mockData["third-parties"].length;
      case "systems": return mockData.systems.length;
      default: return 0;
    }
  })();

  const getInfoMessage = () => {
    const title = getTitle().toLowerCase();
    const viewModeText = viewMode === "table" ? "i tabellformat" : 
                         viewMode === "list" ? "som liste" :
                         viewMode === "names-only" ? "som navneliste" : "";
    
    if (filter || filterCriteria) {
      let filterDesc = [];
      if (filter) filterDesc.push(`søk: "${filter}"`);
      if (filterCriteria?.risk_level) filterDesc.push(`risiko: ${filterCriteria.risk_level}`);
      if (filterCriteria?.has_dpa !== undefined) filterDesc.push(`DPA: ${filterCriteria.has_dpa ? "Ja" : "Nei"}`);
      if (filterCriteria?.country) filterDesc.push(`land: ${filterCriteria.country}`);
      
      return `Viser ${resultCount} av ${totalCount} ${title} ${viewModeText} (${filterDesc.join(", ")})`;
    }
    
    if (sortBy) {
      const sortDesc = sortBy === "name" ? "sortert alfabetisk" :
                       sortBy === "risk" ? "sortert etter risiko" :
                       sortBy === "date" ? "sortert etter dato" :
                       sortBy === "vendor" ? "sortert etter leverandør" : "";
      return `Det er registrert ${totalCount} ${title} i systemet ${viewModeText}${sortDesc ? `, ${sortDesc}` : ""}`;
    }
    
    return `Det er registrert ${totalCount} ${title} i systemet${viewModeText ? ` ${viewModeText}` : ""}`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-3 p-6 border-b border-border bg-card">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
          <p className="text-sm text-muted-foreground">
            {filter 
              ? `Viser ${resultCount} resultat${resultCount !== 1 ? 'er' : ''} for "${filter}"` 
              : `${resultCount} element${resultCount !== 1 ? 'er' : ''} totalt`}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            {getInfoMessage()}
          </AlertDescription>
        </Alert>
        {renderContent()}
      </div>
    </div>
  );
}
