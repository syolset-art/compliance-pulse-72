import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  action: 'inline-form' | 'dialog' | 'navigate';
  actionTarget?: string;
  icon: string;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  nextStep: OnboardingStep | null;
  isFullyComplete: boolean;
  isLoading: boolean;
}

export const useOnboardingProgress = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [companyInfoCompleted, setCompanyInfoCompleted] = useState(false);
  const [systemsAdded, setSystemsAdded] = useState(false);
  const [workAreasDefined, setWorkAreasDefined] = useState(false);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    
    // Check company_profile table
    const { data: companyData } = await supabase
      .from("company_profile")
      .select("id")
      .limit(1);
    
    // Check systems table
    const { data: systemsData } = await supabase
      .from("systems")
      .select("id")
      .limit(1);
    
    // Check work_areas table
    const { data: workAreasData } = await supabase
      .from("work_areas")
      .select("id")
      .limit(1);

    setCompanyInfoCompleted(!!companyData && companyData.length > 0);
    setSystemsAdded(!!systemsData && systemsData.length > 0);
    setWorkAreasDefined(!!workAreasData && workAreasData.length > 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const steps: OnboardingStep[] = [
    {
      id: 'company-info',
      title: 'Selskapsinformasjon',
      description: 'Legg til grunnleggende informasjon om selskapet',
      isCompleted: companyInfoCompleted,
      action: 'inline-form',
      icon: 'Building2'
    },
    {
      id: 'systems',
      title: 'Legg til systemer',
      description: 'Registrer IT-systemer og applikasjoner',
      isCompleted: systemsAdded,
      action: 'dialog',
      actionTarget: 'AddSystemDialog',
      icon: 'Server'
    },
    {
      id: 'work-areas',
      title: 'Definer arbeidsområder',
      description: 'Opprett arbeidsområder i organisasjonen',
      isCompleted: workAreasDefined,
      action: 'navigate',
      actionTarget: '/work-areas',
      icon: 'Building'
    }
  ];

  const completedCount = steps.filter(s => s.isCompleted).length;
  const totalCount = steps.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  const nextStep = steps.find(s => !s.isCompleted) || null;
  const isFullyComplete = completedCount === totalCount;

  const resetOnboarding = useCallback(async () => {
    setIsLoading(true);
    
    // Delete all data from relevant tables to reset onboarding
    await supabase.from("company_profile").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("systems").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("work_areas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    // Refetch to update state
    await fetchProgress();
  }, [fetchProgress]);

  return {
    steps,
    completedCount,
    totalCount,
    percentComplete,
    nextStep,
    isFullyComplete,
    isLoading,
    refetch: fetchProgress,
    resetOnboarding
  };
};
