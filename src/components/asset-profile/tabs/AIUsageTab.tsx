import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Users, 
  FileText,
  Clock,
  Plus,
  Settings,
  Brain,
  Sparkles
} from "lucide-react";
import { AIUsageWizard } from "./AIUsageWizard";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface AIUsageTabProps {
  assetId: string;
  assetCategory?: string;
  assetVendor?: string;
  assetName?: string;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  [key: string]: string; // Index signature for Json compatibility
}

const riskCategoryConfig = {
  unacceptable: {
    label: "Forbudt",
    color: "bg-destructive text-destructive-foreground",
    icon: AlertTriangle,
    description: "Ikke tillatt under EU AI Act"
  },
  high: {
    label: "Høy risiko",
    color: "bg-orange-500 text-white",
    icon: AlertTriangle,
    description: "Krever full conformity assessment"
  },
  limited: {
    label: "Begrenset risiko",
    color: "bg-yellow-500 text-white",
    icon: Eye,
    description: "Krever transparenstiltak"
  },
  minimal: {
    label: "Minimal risiko",
    color: "bg-green-500 text-white",
    icon: CheckCircle2,
    description: "Ingen spesifikke krav"
  }
};

const humanOversightLabels = {
  none: "Ingen",
  review: "Gjennomgang",
  approval: "Godkjenning",
  full_control: "Full kontroll"
};

const complianceStatusConfig = {
  not_assessed: { label: "Ikke vurdert", color: "bg-muted text-muted-foreground" },
  compliant: { label: "I samsvar", color: "bg-green-500 text-white" },
  partial: { label: "Delvis i samsvar", color: "bg-yellow-500 text-white" },
  non_compliant: { label: "Ikke i samsvar", color: "bg-destructive text-destructive-foreground" }
};

export function AIUsageTab({ assetId, assetCategory, assetVendor, assetName }: AIUsageTabProps) {
  const { t } = useTranslation();
  const [wizardOpen, setWizardOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: aiUsage, isLoading } = useQuery({
    queryKey: ['asset-ai-usage', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_ai_usage')
        .select('*')
        .eq('asset_id', assetId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: aiDocuments } = useQuery({
    queryKey: ['asset-ai-documents', aiUsage?.id],
    queryFn: async () => {
      if (!aiUsage?.id) return [];
      const { data, error } = await supabase
        .from('asset_ai_documents')
        .select('*')
        .eq('asset_ai_usage_id', aiUsage.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!aiUsage?.id
  });

  const aiFeatures = (aiUsage?.ai_features as unknown as AIFeature[] | null) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!aiUsage || !aiUsage.has_ai) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ingen AI-bruk registrert</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Registrer om dette systemet bruker kunstig intelligens for å sikre samsvar med EU AI Act.
            </p>
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrer AI-bruk
            </Button>
          </CardContent>
        </Card>

        {/* AI Act Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Om EU AI Act
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              EU AI Act krever at organisasjoner klassifiserer og dokumenterer all bruk av kunstig intelligens.
              Kravene varierer basert på risikonivå:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(riskCategoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{config.description}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <AIUsageWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          assetId={assetId}
          assetCategory={assetCategory}
          assetVendor={assetVendor}
          assetName={assetName}
        />
      </div>
    );
  }

  const riskConfig = aiUsage.risk_category ? riskCategoryConfig[aiUsage.risk_category as keyof typeof riskCategoryConfig] : null;
  const complianceConfig = complianceStatusConfig[aiUsage.compliance_status as keyof typeof complianceStatusConfig];

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI-status</p>
                <p className="font-semibold text-green-600">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risikonivå</p>
                {riskConfig ? (
                  <Badge className={riskConfig.color}>{riskConfig.label}</Badge>
                ) : (
                  <span className="text-muted-foreground">Ikke klassifisert</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <Badge className={complianceConfig.color}>{complianceConfig.label}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neste vurdering</p>
                <p className="font-semibold">
                  {aiUsage.next_assessment_date 
                    ? format(new Date(aiUsage.next_assessment_date), 'dd. MMM yyyy', { locale: nb })
                    : 'Ikke satt'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Features */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-funksjoner
            </CardTitle>
            <CardDescription>
              Registrerte AI-funksjoner i dette systemet
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Rediger
          </Button>
        </CardHeader>
        <CardContent>
          {aiFeatures.length > 0 ? (
            <div className="space-y-3">
              {aiFeatures.map((feature) => {
                const featureRisk = riskCategoryConfig[feature.riskLevel];
                return (
                  <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                    <Badge className={featureRisk.color}>{featureRisk.label}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Ingen AI-funksjoner registrert ennå.</p>
          )}
        </CardContent>
      </Card>

      {/* Transparency & Oversight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5" />
              Transparens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Transparenskrav oppfylt</span>
              <Badge variant={aiUsage.transparency_implemented ? "default" : "secondary"}>
                {aiUsage.transparency_implemented ? "Ja" : "Nei"}
              </Badge>
            </div>
            {aiUsage.transparency_description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Beskrivelse</p>
                <p className="text-sm bg-muted/50 p-2 rounded">{aiUsage.transparency_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Menneskelig tilsyn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tilsynsnivå</span>
              <Badge variant="outline">
                {aiUsage.human_oversight_level 
                  ? humanOversightLabels[aiUsage.human_oversight_level as keyof typeof humanOversightLabels]
                  : 'Ikke definert'
                }
              </Badge>
            </div>
            {aiUsage.human_oversight_description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Beskrivelse</p>
                <p className="text-sm bg-muted/50 p-2 rounded">{aiUsage.human_oversight_description}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Logging aktivert</span>
              <Badge variant={aiUsage.logging_enabled ? "default" : "secondary"}>
                {aiUsage.logging_enabled ? "Ja" : "Nei"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Tilleggsinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {aiUsage.ai_provider && (
              <div>
                <p className="text-sm text-muted-foreground">AI-leverandør</p>
                <p className="font-medium">{aiUsage.ai_provider}</p>
              </div>
            )}
            {aiUsage.model_info && (
              <div>
                <p className="text-sm text-muted-foreground">Modellinformasjon</p>
                <p className="font-medium">{aiUsage.model_info}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Data brukt til trening</p>
              <p className="font-medium">{aiUsage.data_used_for_training ? "Ja" : "Nei"}</p>
            </div>
            {aiUsage.last_assessment_date && (
              <div>
                <p className="text-sm text-muted-foreground">Siste vurdering</p>
                <p className="font-medium">
                  {format(new Date(aiUsage.last_assessment_date), 'dd. MMM yyyy', { locale: nb })}
                </p>
              </div>
            )}
          </div>
          {aiUsage.purpose_description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Formål med AI-bruk</p>
              <p className="text-sm bg-muted/50 p-3 rounded">{aiUsage.purpose_description}</p>
            </div>
          )}
          {aiUsage.risk_justification && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Begrunnelse for risikoklassifisering</p>
              <p className="text-sm bg-muted/50 p-3 rounded">{aiUsage.risk_justification}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      {aiDocuments && aiDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Dokumentasjon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Se dokument
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AIUsageWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        assetId={assetId}
        assetCategory={assetCategory}
        assetVendor={assetVendor}
        assetName={assetName}
        existingData={aiUsage}
      />
    </div>
  );
}
