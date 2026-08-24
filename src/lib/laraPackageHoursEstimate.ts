/**
 * Lar Lara lage et grovt timeestimat per oppgave i en rådgivningspakke.
 * Kaller edge-funksjonen `estimate-package-hours`.
 */

import { supabase } from "@/integrations/supabase/client";

export interface TaskEstimateInput {
  id: string;
  name: string;
  kind: string;
  category: string;
  requirementCount: number;
}

export interface TaskHoursEstimate {
  taskId: string;
  hoursMin: number;
  hoursMax: number;
  rationale: string;
}

export async function estimatePackageHours(
  frameworkName: string,
  tasks: TaskEstimateInput[],
): Promise<TaskHoursEstimate[]> {
  const { data, error } = await supabase.functions.invoke("estimate-package-hours", {
    body: { framework_name: frameworkName, tasks },
  });
  if (error) throw error;
  return (data?.estimates ?? []) as TaskHoursEstimate[];
}
