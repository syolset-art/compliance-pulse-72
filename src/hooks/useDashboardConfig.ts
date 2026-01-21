import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "./useUserRole";
import { getWidgetsForRole, DASHBOARD_LAYOUTS, WidgetConfig } from "@/lib/dashboardLayouts";

export interface DashboardPreferences {
  hiddenWidgets: string[];
  pinnedWidgets: string[];
  widgetOrder: Record<string, number>;
  activeView: string;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  hiddenWidgets: [],
  pinnedWidgets: [],
  widgetOrder: {},
  activeView: 'auto'
};

// Demo mode storage
const DEMO_PREFS_KEY = 'mynder_dashboard_prefs';

function getDemoPreferences(): DashboardPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  const stored = localStorage.getItem(DEMO_PREFS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
}

function setDemoPreferences(prefs: DashboardPreferences): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_PREFS_KEY, JSON.stringify(prefs));
  }
}

export function useDashboardConfig(role: AppRole) {
  const queryClient = useQueryClient();

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['dashboard-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return getDemoPreferences();
      }

      const { data, error } = await supabase
        .from('user_dashboard_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return DEFAULT_PREFERENCES;
      }

      return {
        hiddenWidgets: data.hidden_widgets || [],
        pinnedWidgets: data.pinned_widgets || [],
        widgetOrder: data.widget_order || {},
        activeView: data.active_view || 'auto'
      } as DashboardPreferences;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Get layout for role
  const layout = DASHBOARD_LAYOUTS[role];
  const { primary, secondary, all } = getWidgetsForRole(role);

  // Apply user preferences to widget list
  const getConfiguredWidgets = (): {
    primaryWidgets: WidgetConfig[];
    secondaryWidgets: WidgetConfig[];
    allWidgets: WidgetConfig[];
  } => {
    const prefs = preferences || DEFAULT_PREFERENCES;
    
    // Filter out hidden widgets
    const filterHidden = (widgets: WidgetConfig[]) => 
      widgets.filter(w => !prefs.hiddenWidgets.includes(w.id));

    // Sort by pinned status and custom order
    const sortWidgets = (widgets: WidgetConfig[]) => {
      return [...widgets].sort((a, b) => {
        const aIsPinned = prefs.pinnedWidgets.includes(a.id);
        const bIsPinned = prefs.pinnedWidgets.includes(b.id);
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        
        const aOrder = prefs.widgetOrder[a.id] ?? a.priority;
        const bOrder = prefs.widgetOrder[b.id] ?? b.priority;
        
        return aOrder - bOrder;
      });
    };

    const filteredPrimary = sortWidgets(filterHidden(primary));
    const filteredSecondary = sortWidgets(filterHidden(secondary));

    return {
      primaryWidgets: filteredPrimary,
      secondaryWidgets: filteredSecondary,
      allWidgets: [...filteredPrimary, ...filteredSecondary]
    };
  };

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (newPrefs: Partial<DashboardPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentPrefs = preferences || DEFAULT_PREFERENCES;
      const mergedPrefs = { ...currentPrefs, ...newPrefs };
      
      if (!user) {
        setDemoPreferences(mergedPrefs);
        return mergedPrefs;
      }

      // Upsert preferences
      const { error } = await supabase
        .from('user_dashboard_preferences')
        .upsert({
          user_id: user.id,
          hidden_widgets: mergedPrefs.hiddenWidgets,
          pinned_widgets: mergedPrefs.pinnedWidgets,
          widget_order: mergedPrefs.widgetOrder,
          active_view: mergedPrefs.activeView,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return mergedPrefs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-preferences'] });
    }
  });

  // Helper functions
  const hideWidget = (widgetId: string) => {
    const current = preferences?.hiddenWidgets || [];
    if (!current.includes(widgetId)) {
      updatePreferences.mutate({ hiddenWidgets: [...current, widgetId] });
    }
  };

  const showWidget = (widgetId: string) => {
    const current = preferences?.hiddenWidgets || [];
    updatePreferences.mutate({ 
      hiddenWidgets: current.filter(id => id !== widgetId) 
    });
  };

  const pinWidget = (widgetId: string) => {
    const current = preferences?.pinnedWidgets || [];
    if (!current.includes(widgetId)) {
      updatePreferences.mutate({ pinnedWidgets: [...current, widgetId] });
    }
  };

  const unpinWidget = (widgetId: string) => {
    const current = preferences?.pinnedWidgets || [];
    updatePreferences.mutate({ 
      pinnedWidgets: current.filter(id => id !== widgetId) 
    });
  };

  const resetToDefaults = () => {
    updatePreferences.mutate(DEFAULT_PREFERENCES);
  };

  return {
    layout,
    ...getConfiguredWidgets(),
    preferences: preferences || DEFAULT_PREFERENCES,
    isLoading,
    hideWidget,
    showWidget,
    pinWidget,
    unpinWidget,
    resetToDefaults,
    updatePreferences: updatePreferences.mutate,
    isPending: updatePreferences.isPending
  };
}
