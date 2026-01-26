import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Brain, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { frameworks } from "@/lib/frameworkDefinitions";
import { DomainSummaryCard } from "./DomainSummaryCard";
import { DomainActionDialog } from "./DomainActionDialog";
import { DomainActivationWizard } from "./DomainActivationWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription, DOMAIN_ADDON_PRICES } from "@/hooks/useSubscription";

interface DomainSummarySectionProps {
  onDomainClick?: (domainId: string) => void;
  onOpenChat?: (context: string) => void;
}

interface DomainConfig {
  id: string;
  name: string;
  nameEn: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
}

const domainConfigs: DomainConfig[] = [
  { id: 'privacy', name: 'Personvern', nameEn: 'Privacy', icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'security', name: 'Informasjonssikkerhet', nameEn: 'Information Security', icon: Lock, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'ai', name: 'AI Management', nameEn: 'AI Management', icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
];

// Mapping from framework IDs to task keywords for progress calculation
const frameworkTaskMapping: Record<string, string[]> = {
  'gdpr': ['GDPR', 'Personvern', 'persondata'],
  'personopplysningsloven': ['GDPR', 'Personvern', 'persondata'],
  'iso27001': ['ISO 27001', 'Informasjonssikkerhet', 'sikkerhet'],
  'iso27701': ['ISO 27001', 'Informasjonssikkerhet', 'personvern'],
  'nis2': ['NIS2', 'Informasjonssikkerhet', 'sikkerhet'],
  'nsm': ['NSM', 'Informasjonssikkerhet', 'sikkerhet'],
  'soc2': ['SOC 2', 'Informasjonssikkerhet', 'sikkerhet'],
  'cra': ['CRA', 'Informasjonssikkerhet', 'cybersikkerhet'],
  'ai-act': ['AI Act', 'AI Governance', 'kunstig intelligens'],
  'iso42001': ['ISO 42001', 'AI Governance', 'AI Management'],
  'iso42005': ['ISO 42005', 'AI Governance', 'konsekvensanalyse'],
  'ai-ethics': ['AI', 'etikk', 'AI Governance'],
};

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  relevant_for: string[];
}

export function DomainSummarySection({ onDomainClick, onOpenChat }: DomainSummarySectionProps) {
  const { isDomainIncluded, activateAddon, isActivatingAddon } = useSubscription();
  
  // Dialog states
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    domain: DomainConfig | null;
    tasks: Task[];
  }>({ open: false, domain: null, tasks: [] });
  
  const [upgradeDialog, setUpgradeDialog] = useState<{
    open: boolean;
    domain: DomainConfig | null;
  }>({ open: false, domain: null });

  const { data, isLoading } = useQuery({
    queryKey: ['domain-summary-regulations'],
    queryFn: async () => {
      const [frameworksResult, tasksResult] = await Promise.all([
        supabase.from('selected_frameworks').select('*').eq('is_selected', true),
        supabase.from('tasks').select('id, title, description, status, priority, relevant_for')
      ]);

      const selectedFrameworks = frameworksResult.data || [];
      const tasks = (tasksResult.data || []) as Task[];

      // Calculate progress for each domain
      const domainData = domainConfigs.map(domain => {
        const domainFrameworks = frameworks.filter(f => f.category === domain.id);
        const activeFrameworks = domainFrameworks.filter(df => 
          selectedFrameworks.some(sf => sf.framework_id === df.id)
        );

        // Calculate progress based on relevant tasks
        let totalTasks = 0;
        let completedTasks = 0;
        const domainTasks: Task[] = [];

        activeFrameworks.forEach(framework => {
          const keywords = frameworkTaskMapping[framework.id] || [];
          const relevantTasks = tasks.filter(task => {
            const relevantFor = task.relevant_for || [];
            return keywords.some(keyword => 
              relevantFor.some((rf: string) => rf.toLowerCase().includes(keyword.toLowerCase()))
            );
          });

          // Add unique tasks
          relevantTasks.forEach(task => {
            if (!domainTasks.some(t => t.id === task.id)) {
              domainTasks.push(task);
            }
          });

          totalTasks += relevantTasks.length;
          completedTasks += relevantTasks.filter(t => t.status === 'completed').length;
        });

        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        let status: 'good' | 'attention' | 'notStarted' = 'notStarted';
        if (activeFrameworks.length > 0) {
          if (totalTasks > 0) {
            status = progress >= 70 ? 'good' : 'attention';
          } else {
            status = 'notStarted';
          }
        }

        return {
          ...domain,
          activeCount: activeFrameworks.length,
          totalCount: domainFrameworks.length,
          progress,
          status,
          tasks: domainTasks
        };
      });

      // Calculate "Øvrige" category
      const otherFrameworks = frameworks.filter(f => f.category === 'other');
      const activeOther = otherFrameworks.filter(of => 
        selectedFrameworks.some(sf => sf.framework_id === of.id)
      );

      const otherData = {
        id: 'other',
        name: 'Øvrige regelverk',
        nameEn: 'Other Regulations',
        icon: Scale,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        activeCount: activeOther.length,
        totalCount: otherFrameworks.length,
        progress: 0,
        status: 'notStarted' as const,
        tasks: [] as Task[]
      };

      return { domains: domainData, other: otherData };
    }
  });

  const handleDomainClick = (domain: typeof domainConfigs[0] & { tasks: Task[]; status: 'good' | 'attention' | 'notStarted' }) => {
    const isIncluded = isDomainIncluded(domain.id);
    
    if (!isIncluded) {
      // Show upgrade dialog
      setUpgradeDialog({ open: true, domain });
    } else if (domain.status === 'attention') {
      // Show action dialog with tasks
      setActionDialog({ open: true, domain, tasks: domain.tasks });
    } else {
      // Just scroll to the category
      onDomainClick?.(domain.id);
    }
  };

  const handleActivateAddon = () => {
    if (upgradeDialog.domain) {
      activateAddon(upgradeDialog.domain.id);
      setUpgradeDialog({ open: false, domain: null });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  const { domains, other } = data || { domains: [], other: null };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Three main domains */}
        {domains.map(domain => {
          const isIncluded = isDomainIncluded(domain.id);
          const addonPrice = !isIncluded ? DOMAIN_ADDON_PRICES[domain.id] : null;
          
          return (
            <DomainSummaryCard
              key={domain.id}
              id={domain.id}
              name={domain.name}
              icon={domain.icon}
              color={domain.color}
              bgColor={domain.bgColor}
              activeCount={domain.activeCount}
              totalCount={domain.totalCount}
              progress={domain.progress}
              status={domain.status}
              onClick={() => handleDomainClick(domain)}
              isIncludedInPlan={isIncluded}
              addonPrice={addonPrice}
              onActivateAddon={() => setUpgradeDialog({ open: true, domain })}
            />
          );
        })}

        {/* Compact "Øvrige" card */}
        {other && (
          <DomainSummaryCard
            id={other.id}
            name={other.name}
            icon={other.icon}
            color={other.color}
            bgColor={other.bgColor}
            activeCount={other.activeCount}
            totalCount={other.totalCount}
            progress={other.progress}
            status={other.status}
            onClick={() => onDomainClick?.(other.id)}
            compact
            isIncludedInPlan={isDomainIncluded(other.id)}
          />
        )}
      </div>

      {/* Action Dialog */}
      {actionDialog.domain && (
        <DomainActionDialog
          open={actionDialog.open}
          onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}
          domainId={actionDialog.domain.id}
          domainName={actionDialog.domain.name}
          domainIcon={actionDialog.domain.icon}
          domainColor={actionDialog.domain.color}
          domainBgColor={actionDialog.domain.bgColor}
          tasks={actionDialog.tasks}
          onOpenChat={onOpenChat}
        />
      )}

      {/* Upgrade Wizard */}
      {upgradeDialog.domain && (
        <DomainActivationWizard
          open={upgradeDialog.open}
          onOpenChange={(open) => setUpgradeDialog(prev => ({ ...prev, open }))}
          domainId={upgradeDialog.domain.id}
          domainName={upgradeDialog.domain.name}
          domainIcon={upgradeDialog.domain.icon}
          domainColor={upgradeDialog.domain.color}
          domainBgColor={upgradeDialog.domain.bgColor}
          monthlyPrice={DOMAIN_ADDON_PRICES[upgradeDialog.domain.id] || 0}
          onActivate={handleActivateAddon}
          isActivating={isActivatingAddon}
          onOpenChat={onOpenChat}
        />
      )}
    </>
  );
}
