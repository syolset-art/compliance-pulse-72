import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Info
} from "lucide-react";

interface ContentViewerProps {
  contentType: string;
  filter?: string;
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

const filterData = (data: any[], filter?: string) => {
  if (!filter) return data;
  
  const lowerFilter = filter.toLowerCase();
  return data.filter(item => {
    // Search in name
    if (item.name?.toLowerCase().includes(lowerFilter)) return true;
    // Search in vendor
    if (item.vendor?.toLowerCase().includes(lowerFilter)) return true;
    // Search in type
    if (item.type?.toLowerCase().includes(lowerFilter)) return true;
    // Search in systems array
    if (item.systems?.some((s: string) => s.toLowerCase().includes(lowerFilter))) return true;
    return false;
  });
};

export function ContentViewer({ contentType, filter }: ContentViewerProps) {
  const renderProtocols = () => {
    const filteredData = filterData(mockData.protocols, filter);
    
    if (filteredData.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen behandlingsprotokoller funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredData.map((protocol) => (
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
    const filteredData = filterData(mockData["third-parties"], filter);
    
    if (filteredData.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen tredjeparter funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredData.map((party) => (
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
    const filteredData = filterData(mockData.systems, filter);
    
    if (filteredData.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ingen systemer funnet{filter ? ` for "${filter}"` : ''}.</p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredData.map((system) => (
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
      default: return "Innhold";
    }
  };

  const getIcon = () => {
    switch (contentType) {
      case "protocols": return <FileText className="h-6 w-6" />;
      case "third-parties": return <Users className="h-6 w-6" />;
      case "systems": return <Server className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };

  const renderContent = () => {
    switch (contentType) {
      case "protocols": return renderProtocols();
      case "third-parties": return renderThirdParties();
      case "systems": return renderSystems();
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
    const filtered = filterData(data, filter);
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
    if (filter) {
      return `Viser ${resultCount} av ${totalCount} ${title} som matcher "${filter}"`;
    }
    return `Det er registrert ${totalCount} ${title} i systemet`;
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
