import { supabase } from "@/integrations/supabase/client";

interface WorkAreaTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  industry: string;
}

interface SystemTemplate {
  id: string;
  work_area_type: string;
  name: string;
  description: string | null;
  category: string | null;
  vendor: string | null;
  has_ai: boolean;
  ai_features: string | null;
  sort_order: number;
}

/**
 * Creates default work areas for a company based on their industry.
 * Combines industry-specific templates with universal default templates.
 * Also creates default systems for each work area based on system templates.
 */
export const createDefaultWorkAreas = async (industry: string): Promise<boolean> => {
  try {
    // Fetch templates: industry-specific + universal defaults
    const { data: templates, error: templatesError } = await supabase
      .from("work_area_templates")
      .select("*")
      .or(`industry.eq.${industry},industry.eq.default`)
      .order("sort_order", { ascending: true });

    if (templatesError) {
      console.error("Error fetching work area templates:", templatesError);
      return false;
    }

    if (!templates || templates.length === 0) {
      console.log("No work area templates found for industry:", industry);
      return false;
    }

    // Deduplicate by name (prefer industry-specific over default)
    const uniqueTemplates = templates.reduce((acc: WorkAreaTemplate[], template) => {
      const existingIndex = acc.findIndex(t => t.name === template.name);
      if (existingIndex === -1) {
        acc.push(template);
      } else if (template.industry !== 'default' && acc[existingIndex].industry === 'default') {
        // Replace default with industry-specific
        acc[existingIndex] = template;
      }
      return acc;
    }, []);

    // Check if work areas already exist
    const { data: existingAreas } = await supabase
      .from("work_areas")
      .select("name")
      .limit(1);

    if (existingAreas && existingAreas.length > 0) {
      console.log("Work areas already exist, skipping auto-creation");
      return true;
    }

    // Create work areas from templates
    const workAreasToCreate = uniqueTemplates.map(template => ({
      name: template.name,
      description: template.description,
      responsible_person: null
    }));

    const { data: createdWorkAreas, error: insertError } = await supabase
      .from("work_areas")
      .insert(workAreasToCreate)
      .select("id, name");

    if (insertError) {
      console.error("Error creating work areas:", insertError);
      return false;
    }

    // Fetch system templates for the created work areas
    const workAreaNames = createdWorkAreas?.map(wa => wa.name) || [];
    
    if (workAreaNames.length > 0) {
      const { data: systemTemplates, error: systemTemplatesError } = await supabase
        .from("system_templates")
        .select("*")
        .in("work_area_type", workAreaNames)
        .order("sort_order", { ascending: true });

      if (systemTemplatesError) {
        console.error("Error fetching system templates:", systemTemplatesError);
        // Continue anyway, work areas are created
      } else if (systemTemplates && systemTemplates.length > 0) {
        // Create systems for each work area
        const systemsToCreate = [];
        
        for (const workArea of createdWorkAreas || []) {
          const matchingTemplates = systemTemplates.filter(
            (st: SystemTemplate) => st.work_area_type === workArea.name
          );
          
          for (const template of matchingTemplates) {
            systemsToCreate.push({
              work_area_id: workArea.id,
              name: template.name,
              description: template.description,
              category: template.category,
              vendor: template.vendor,
              status: 'active',
            });
          }
        }

        if (systemsToCreate.length > 0) {
          const { error: systemsInsertError } = await supabase
            .from("systems")
            .insert(systemsToCreate);

          if (systemsInsertError) {
            console.error("Error creating systems:", systemsInsertError);
            // Continue anyway, work areas are created
          } else {
            console.log(`Created ${systemsToCreate.length} systems for work areas`);
          }
        }
      }
    }

    // Update onboarding progress
    await supabase
      .from("onboarding_progress")
      .upsert({ 
        id: "default", 
        work_areas_defined: true,
        systems_added: true 
      });

    console.log(`Created ${workAreasToCreate.length} work areas for industry: ${industry}`);
    return true;
  } catch (error) {
    console.error("Error in createDefaultWorkAreas:", error);
    return false;
  }
};
