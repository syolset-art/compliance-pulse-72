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
  /** Ett timetall — spenn fra modellen slås sammen før det brukes. */
  hours: number;
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
  const raw = (data?.estimates ?? []) as {
    taskId: string;
    hours?: number;
    hoursMin?: number;
    hoursMax?: number;
    rationale?: string;
  }[];
  return raw.map((e) => ({
    taskId: e.taskId,
    hours:
      e.hours != null
        ? Math.max(0.5, Math.round(e.hours * 2) / 2)
        : Math.max(
            0.5,
            Math.round((((e.hoursMin ?? 1) + (e.hoursMax ?? e.hoursMin ?? 1)) / 2) * 2) / 2,
          ),
    rationale: e.rationale ?? "",
  }));
}
