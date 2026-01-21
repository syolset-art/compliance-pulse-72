import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Brain, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { frameworks } from "@/lib/frameworkDefinitions";
import { DomainSummaryCard } from "./DomainSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

interface DomainSummarySectionProps {
  onDomainClick?: (domainId: string) => void;
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

export function DomainSummarySection({ onDomainClick }: DomainSummarySectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['domain-summary-regulations'],
    queryFn: async () => {
      const [frameworksResult, tasksResult] = await Promise.all([
        supabase.from('selected_frameworks').select('*').eq('is_selected', true),
        supabase.from('tasks').select('id, status, relevant_for')
      ]);

      const selectedFrameworks = frameworksResult.data || [];
      const tasks = tasksResult.data || [];

      // Calculate progress for each domain
      const domainData = domainConfigs.map(domain => {
        const domainFrameworks = frameworks.filter(f => f.category === domain.id);
        const activeFrameworks = domainFrameworks.filter(df => 
          selectedFrameworks.some(sf => sf.framework_id === df.id)
        );

        // Calculate progress based on relevant tasks
        let totalTasks = 0;
        let completedTasks = 0;

        activeFrameworks.forEach(framework => {
          const keywords = frameworkTaskMapping[framework.id] || [];
          const relevantTasks = tasks.filter(task => {
            const relevantFor = task.relevant_for || [];
            return keywords.some(keyword => 
              relevantFor.some((rf: string) => rf.toLowerCase().includes(keyword.toLowerCase()))
            );
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
          status
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
        status: 'notStarted' as const
      };

      return { domains: domainData, other: otherData };
    }
  });

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Three main domains */}
      {domains.map(domain => (
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
          onClick={() => onDomainClick?.(domain.id)}
        />
      ))}

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
        />
      )}
    </div>
  );
}
