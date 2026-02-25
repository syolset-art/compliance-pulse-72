import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [companyInfoCompleted, setCompanyInfoCompleted] = useState(false);
  const [frameworksCompleted, setFrameworksCompleted] = useState(false);
  const [assetsAdded, setAssetsAdded] = useState(false);
  const [workAreasDefined, setWorkAreasDefined] = useState(false);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    
    // Check company_profile table
    const { data: companyData } = await supabase
      .from("company_profile")
      .select("id")
      .limit(1);
    
    // Check selected_frameworks table for at least one selected framework
    const { data: frameworksData } = await supabase
      .from("selected_frameworks")
      .select("id")
      .eq("is_selected", true)
      .limit(1);
    
    // Check assets table
    const { data: assetsData } = await supabase
      .from("assets")
      .select("id")
      .limit(1);
    
    // Check work_areas table
    const { data: workAreasData } = await supabase
      .from("work_areas")
      .select("id")
      .limit(1);

    setCompanyInfoCompleted(!!companyData && companyData.length > 0);
    setFrameworksCompleted(!!frameworksData && frameworksData.length > 0);
    setAssetsAdded(!!assetsData && assetsData.length > 0);
    setWorkAreasDefined(!!workAreasData && workAreasData.length > 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProgress();

    // Refetch when tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchProgress();
    };
    const handleFocus = () => fetchProgress();
    // Refetch when any instance signals a change (custom event)
    const handleOnboardingChange = () => fetchProgress();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("onboarding-progress-changed", handleOnboardingChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("onboarding-progress-changed", handleOnboardingChange);
    };
  }, [fetchProgress]);

  // Helper to notify all hook instances of a change
  const notifyChange = useCallback(() => {
    window.dispatchEvent(new Event("onboarding-progress-changed"));
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'company-info',
      title: t("chat.onboarding.steps.companyInfo"),
      description: t("chat.onboarding.steps.companyInfoDesc"),
      isCompleted: companyInfoCompleted,
      action: 'inline-form',
      icon: 'Building2'
    },
    {
      id: 'frameworks',
      title: t("chat.onboarding.steps.frameworks"),
      description: t("chat.onboarding.steps.frameworksDesc"),
      isCompleted: frameworksCompleted,
      action: 'inline-form',
      icon: 'Scale'
    },
    {
      id: 'assets',
      title: t("chat.onboarding.steps.assets"),
      description: t("chat.onboarding.steps.assetsDesc"),
      isCompleted: assetsAdded,
      action: 'dialog',
      actionTarget: 'AddAssetDialog',
      icon: 'Server'
    },
    {
      id: 'work-areas',
      title: t("chat.onboarding.steps.workAreas"),
      description: t("chat.onboarding.steps.workAreasDesc"),
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
    await supabase.from("selected_frameworks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("assets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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
    notifyChange,
    resetOnboarding
  };
};
