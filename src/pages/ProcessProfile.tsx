import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { ProcessCard } from "@/components/process/ProcessCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ProcessProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: process, isLoading, error } = useQuery({
    queryKey: ["process", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("system_processes")
        .select("*, systems(work_area_id)")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto md:pt-11">
          <div className="max-w-5xl mx-auto space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto md:pt-11">
          <div className="max-w-5xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tilbake
            </Button>
            <div className="text-center py-12 text-muted-foreground">
              Prosessen ble ikke funnet
            </div>
          </div>
        </main>
      </div>
    );
  }

  const workAreaId = (process.systems as any)?.work_area_id;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto md:pt-11">
        <div className="max-w-5xl mx-auto">
          {/* Navigation bar */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tilbake
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => workAreaId ? navigate('/work-areas') : navigate(-1)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Process Card */}
          <ProcessCard 
            processId={id!} 
            workAreaId={workAreaId}
            onEdit={() => {
              // Open edit dialog or navigate to edit page
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default ProcessProfile;
