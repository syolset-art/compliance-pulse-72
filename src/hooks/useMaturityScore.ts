import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MaturityBreakdown {
  frameworks: { count: number; points: number };
  tasks: { count: number; points: number };
  systems: { count: number; points: number };
  processes: { count: number; points: number };
  roles: { count: number; points: number };
}

interface NextMilestone {
  description: string;
  pointsToGain: number;
  action: string;
  actionPath?: string;
}

export type MaturityLevel = "beginner" | "developing" | "established" | "mature";

export interface MaturityScore {
  currentScore: number;
  initialScore: number;
  level: MaturityLevel;
  initialLevel: MaturityLevel;
  breakdown: MaturityBreakdown;
  nextMilestone: NextMilestone | null;
  milestones: Array<{
    id: string;
    type: string;
    description: string;
    points: number;
    achievedAt: Date;
  }>;
}

// Points configuration
const POINTS = {
  framework: 5,
  taskCompleted: 2,
  taskHighPriority: 3,
  systemDocumented: 3,
  systemWithAI: 5,
  processDocumented: 3,
  processWithRisk: 5,
  role: 2,
};

// Level thresholds
const LEVEL_THRESHOLDS = {
  beginner: 0,
  developing: 16,
  established: 36,
  mature: 61,
};

const getLevel = (score: number): MaturityLevel => {
  if (score >= LEVEL_THRESHOLDS.mature) return "mature";
  if (score >= LEVEL_THRESHOLDS.established) return "established";
  if (score >= LEVEL_THRESHOLDS.developing) return "developing";
  return "beginner";
};

const getLevelLabel = (level: MaturityLevel): string => {
  switch (level) {
    case "beginner": return "Nybegynner";
    case "developing": return "Under utvikling";
    case "established": return "Etablert";
    case "mature": return "Modent";
  }
};

// Map maturity string from onboarding to initial score
const getInitialScoreFromMaturity = (maturity: string | null | undefined): number => {
  switch (maturity) {
    case "beginner": return 5;
    case "intermediate": return 20;
    case "advanced": return 45;
    default: return 10;
  }
};

async function fetchMaturityData(): Promise<MaturityScore> {
  // Use type-safe individual queries
  const { data: companyData } = await supabase
    .from("company_profile")
    .select("maturity, initial_maturity")
    .limit(1)
    .maybeSingle();
  
  const frameworksResult = await (supabase as any)
    .from("selected_frameworks")
    .select("id")
    .eq("is_active", true);
  const frameworksData = frameworksResult.data as any[] | null;
  
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, priority, status");
  
  const { data: systemsData } = await supabase
    .from("systems")
    .select("id, risk_level");
  
  const { data: processesData } = await supabase
    .from("system_processes")
    .select("id, status");
  
  const { data: rolesData } = await supabase
    .from("roles")
    .select("id");
  
  const { data: assetAIData } = await supabase
    .from("asset_ai_usage")
    .select("id");
  
  // Milestones table might not exist in types yet
  let milestonesData: any[] = [];
  try {
    const result = await (supabase as any)
      .from("maturity_milestones")
      .select("*")
      .order("achieved_at", { ascending: false });
    milestonesData = result.data || [];
  } catch (e) {
    // Table might not exist yet
  }

  // Calculate framework points
  const frameworkCount = frameworksData?.length || 0;
  const frameworkPoints = frameworkCount * POINTS.framework;

  // Calculate task points (only completed tasks)
  const allTasks = tasksData || [];
  const completedTasks = allTasks.filter((t: any) => t.status === "completed");
  const highPriorityTasks = completedTasks.filter((t: any) => t.priority === "høy" || t.priority === "high");
  const normalTasks = completedTasks.length - highPriorityTasks.length;
  const taskPoints = (normalTasks * POINTS.taskCompleted) + (highPriorityTasks.length * POINTS.taskHighPriority);

  // Calculate system points (systems with risk assessment get more points)
  const systems = systemsData || [];
  const systemsWithRisk = systems.filter((s: any) => s.risk_level && s.risk_level !== "none" && s.risk_level !== "low");
  const normalSystems = systems.length - systemsWithRisk.length;
  const assetAICount = assetAIData?.length || 0;
  // Give bonus points for AI documentation
  const systemPoints = (normalSystems * POINTS.systemDocumented) + (systemsWithRisk.length * POINTS.systemWithAI) + (assetAICount > 0 ? 5 : 0);

  // Calculate process points
  const processes = processesData || [];
  const processesWithStatus = processes.filter((p: any) => p.status === "active" || p.status === "completed");
  const normalProcesses = processes.length - processesWithStatus.length;
  const processPoints = (normalProcesses * POINTS.processDocumented) + (processesWithStatus.length * POINTS.processWithRisk);

  // Calculate role points
  const roleCount = rolesData?.length || 0;
  const rolePoints = roleCount * POINTS.role;

  // Total score
  const currentScore = frameworkPoints + taskPoints + systemPoints + processPoints + rolePoints;

  // Get initial score
  const initialMaturity = companyData?.initial_maturity || companyData?.maturity;
  const initialScore = getInitialScoreFromMaturity(initialMaturity);

  // Determine levels
  const level = getLevel(currentScore);
  const initialLevel = getLevel(initialScore);

  // Build breakdown
  const breakdown: MaturityBreakdown = {
    frameworks: { count: frameworkCount, points: frameworkPoints },
    tasks: { count: completedTasks.length, points: taskPoints },
    systems: { count: systems.length, points: systemPoints },
    processes: { count: processes.length, points: processPoints },
    roles: { count: roleCount, points: rolePoints },
  };

  // Determine next milestone
  let nextMilestone: NextMilestone | null = null;

  if (systems.length === 0) {
    nextMilestone = {
      description: "Dokumenter dine systemer",
      pointsToGain: POINTS.systemWithAI * 3,
      action: "Legg til systemer",
      actionPath: "/systems",
    };
  } else if (processes.length === 0) {
    nextMilestone = {
      description: "Kartlegg dine prosesser",
      pointsToGain: POINTS.processWithRisk * 3,
      action: "Legg til prosesser",
      actionPath: "/processing-records",
    };
  } else if (frameworkCount < 3) {
    nextMilestone = {
      description: "Aktiver flere regelverk",
      pointsToGain: POINTS.framework * 2,
      action: "Se regelverk",
      actionPath: "/regulations",
    };
  } else if (completedTasks.length < 5) {
    nextMilestone = {
      description: "Fullfør flere oppgaver",
      pointsToGain: POINTS.taskHighPriority * 3,
      action: "Se oppgaver",
      actionPath: "/tasks",
    };
  }

  // Map milestones
  const milestones = milestonesData.map((m: any) => ({
    id: m.id,
    type: m.milestone_type,
    description: m.description || "",
    points: m.points || 1,
    achievedAt: new Date(m.achieved_at),
  }));

  return {
    currentScore,
    initialScore,
    level,
    initialLevel,
    breakdown,
    nextMilestone,
    milestones,
  };
}

export function useMaturityScore() {
  return useQuery({
    queryKey: ["maturity-score"],
    queryFn: fetchMaturityData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export { getLevelLabel, getLevel, LEVEL_THRESHOLDS };
