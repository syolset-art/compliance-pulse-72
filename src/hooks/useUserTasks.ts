import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserTask {
  id: string;
  user_id: string;
  asset_id: string | null;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  asset_name?: string;
}

export function useUserTasks() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["user-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch asset names for linked tasks
      const assetIds = (data || []).filter(t => t.asset_id).map(t => t.asset_id!);
      let assetMap: Record<string, string> = {};
      if (assetIds.length > 0) {
        const { data: assets } = await supabase
          .from("assets")
          .select("id, name")
          .in("id", assetIds);
        assetMap = Object.fromEntries((assets || []).map(a => [a.id, a.name]));
      }

      return (data || []).map(t => ({
        ...t,
        asset_name: t.asset_id ? assetMap[t.asset_id] : undefined,
      })) as UserTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      assignee?: string;
      due_date?: string;
      asset_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_tasks").insert({
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        assignee: task.assignee || null,
        due_date: task.due_date || null,
        asset_id: task.asset_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-tasks"] }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("user_tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-tasks"] }),
  });

  return { tasks, isLoading, createTask, updateTaskStatus, deleteTask };
}
