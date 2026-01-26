import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  vendor: string | null;
  work_area_id: string | null;
}

interface WorkArea {
  id: string;
  name: string;
}

// Mapping of asset categories/vendors to work area types
const assetToWorkAreaMapping: Record<string, string[]> = {
  // IT-related assets
  "IT": ["IT", "IT og drift", "Teknologi"],
  "Software": ["IT", "IT og drift", "Teknologi"],
  "Infrastructure": ["IT", "IT og drift", "Teknologi"],
  "Development": ["IT", "IT og drift", "Utviklingsavdeling"],
  "Security": ["IT", "Informasjonssikkerhet", "IT og drift"],
  
  // HR-related assets
  "HR": ["HR", "Personal", "Administrasjon"],
  "Payroll": ["HR", "Økonomi", "Personal"],
  "Recruitment": ["HR", "Personal"],
  
  // Finance-related assets
  "Finance": ["Økonomi", "Finans", "Administrasjon"],
  "Accounting": ["Økonomi", "Finans"],
  "ERP": ["Økonomi", "IT", "Administrasjon"],
  
  // Communication/Productivity
  "Communication": ["Administrasjon", "IT", "Ledelse"],
  "Productivity": ["IT", "Administrasjon"],
  "Collaboration": ["IT", "Administrasjon"],
  
  // Sales & Marketing
  "CRM": ["Salg", "Markedsføring", "Kundeservice"],
  "Marketing": ["Markedsføring", "Salg"],
  "Sales": ["Salg", "Kundeservice"],
  
  // Support
  "Support": ["Kundeservice", "IT", "Support"],
  "Helpdesk": ["IT", "Kundeservice", "Support"],
};

// Common system vendors mapped to work areas
const vendorToWorkAreaMapping: Record<string, string[]> = {
  // Productivity & Communication
  "Microsoft": ["IT", "Administrasjon"],
  "Google": ["IT", "Administrasjon"],
  "Slack": ["IT", "Administrasjon"],
  "Zoom": ["IT", "Administrasjon"],
  
  // Development
  "GitHub": ["IT", "Utviklingsavdeling"],
  "GitLab": ["IT", "Utviklingsavdeling"],
  "Atlassian": ["IT", "Utviklingsavdeling"],
  "Jira": ["IT", "Utviklingsavdeling"],
  
  // HR Systems
  "Workday": ["HR", "Personal"],
  "SAP SuccessFactors": ["HR", "Personal"],
  "BambooHR": ["HR", "Personal"],
  
  // Finance
  "SAP": ["Økonomi", "IT"],
  "Oracle": ["Økonomi", "IT"],
  "Xero": ["Økonomi"],
  "QuickBooks": ["Økonomi"],
  
  // CRM
  "Salesforce": ["Salg", "Kundeservice"],
  "HubSpot": ["Markedsføring", "Salg"],
  "Pipedrive": ["Salg"],
  
  // Security
  "Acronis": ["IT", "Informasjonssikkerhet"],
  "CrowdStrike": ["IT", "Informasjonssikkerhet"],
  "Okta": ["IT", "Informasjonssikkerhet"],
};

/**
 * Finds the best matching work area for an asset
 */
function findBestWorkArea(asset: Asset, workAreas: WorkArea[]): WorkArea | null {
  const workAreaNames = workAreas.map(wa => wa.name.toLowerCase());
  
  // Try to match by category first
  if (asset.category) {
    const categoryMappings = assetToWorkAreaMapping[asset.category];
    if (categoryMappings) {
      for (const mapping of categoryMappings) {
        const matchIndex = workAreaNames.findIndex(name => 
          name.includes(mapping.toLowerCase()) || mapping.toLowerCase().includes(name)
        );
        if (matchIndex !== -1) {
          return workAreas[matchIndex];
        }
      }
    }
  }
  
  // Try to match by vendor
  if (asset.vendor) {
    for (const [vendorKey, mappings] of Object.entries(vendorToWorkAreaMapping)) {
      if (asset.vendor.toLowerCase().includes(vendorKey.toLowerCase())) {
        for (const mapping of mappings) {
          const matchIndex = workAreaNames.findIndex(name => 
            name.includes(mapping.toLowerCase()) || mapping.toLowerCase().includes(name)
          );
          if (matchIndex !== -1) {
            return workAreas[matchIndex];
          }
        }
      }
    }
  }
  
  // Default to IT for system type assets
  if (asset.asset_type === 'system') {
    const itArea = workAreas.find(wa => 
      wa.name.toLowerCase().includes('it') || 
      wa.name.toLowerCase().includes('teknologi')
    );
    if (itArea) return itArea;
  }
  
  // Return null if no match found
  return null;
}

/**
 * Automatically assigns unassigned assets to work areas based on their type, category, and vendor
 */
export async function autoAssignAssetsToWorkAreas(): Promise<{ 
  assigned: number; 
  workAreasCreated: boolean;
  suggestedWorkAreas: string[];
}> {
  try {
    // Fetch unassigned assets
    const { data: unassignedAssets, error: assetsError } = await supabase
      .from("assets")
      .select("id, name, asset_type, category, vendor, work_area_id")
      .is("work_area_id", null);
    
    if (assetsError) {
      console.error("Error fetching unassigned assets:", assetsError);
      return { assigned: 0, workAreasCreated: false, suggestedWorkAreas: [] };
    }
    
    if (!unassignedAssets || unassignedAssets.length === 0) {
      console.log("No unassigned assets to process");
      return { assigned: 0, workAreasCreated: false, suggestedWorkAreas: [] };
    }
    
    // Fetch existing work areas
    let { data: workAreas, error: workAreasError } = await supabase
      .from("work_areas")
      .select("id, name");
    
    if (workAreasError) {
      console.error("Error fetching work areas:", workAreasError);
      return { assigned: 0, workAreasCreated: false, suggestedWorkAreas: [] };
    }
    
    let workAreasCreated = false;
    const suggestedWorkAreas: string[] = [];
    
    // If no work areas exist, we need to create them first
    if (!workAreas || workAreas.length === 0) {
      // Get company industry for work area templates
      const { data: companyData } = await supabase
        .from("company_profile")
        .select("industry")
        .limit(1)
        .maybeSingle();
      
      const industry = companyData?.industry || "default";
      
      // Fetch work area templates
      const { data: templates } = await supabase
        .from("work_area_templates")
        .select("*")
        .or(`industry.eq.${industry},industry.eq.default`)
        .order("sort_order", { ascending: true });
      
      if (templates && templates.length > 0) {
        // Deduplicate by name (prefer industry-specific)
        const uniqueTemplates = templates.reduce((acc: typeof templates, template) => {
          const existingIndex = acc.findIndex(t => t.name === template.name);
          if (existingIndex === -1) {
            acc.push(template);
          } else if (template.industry !== 'default' && acc[existingIndex].industry === 'default') {
            acc[existingIndex] = template;
          }
          return acc;
        }, []);
        
        // Create work areas
        const workAreasToCreate = uniqueTemplates.map(t => ({
          name: t.name,
          description: t.description,
        }));
        
        const { data: createdAreas, error: createError } = await supabase
          .from("work_areas")
          .insert(workAreasToCreate)
          .select("id, name");
        
        if (createError) {
          console.error("Error creating work areas:", createError);
        } else {
          workAreas = createdAreas;
          workAreasCreated = true;
          suggestedWorkAreas.push(...(createdAreas?.map(wa => wa.name) || []));
          console.log(`Created ${createdAreas?.length} work areas`);
        }
      }
    }
    
    if (!workAreas || workAreas.length === 0) {
      console.log("No work areas available for assignment");
      return { assigned: 0, workAreasCreated, suggestedWorkAreas };
    }
    
    // Assign each asset to the best matching work area
    let assignedCount = 0;
    const updates: { id: string; work_area_id: string }[] = [];
    
    for (const asset of unassignedAssets) {
      const bestMatch = findBestWorkArea(asset, workAreas);
      if (bestMatch) {
        updates.push({ id: asset.id, work_area_id: bestMatch.id });
      }
    }
    
    // Batch update assets
    for (const update of updates) {
      const { error } = await supabase
        .from("assets")
        .update({ work_area_id: update.work_area_id })
        .eq("id", update.id);
      
      if (!error) {
        assignedCount++;
      }
    }
    
    console.log(`Auto-assigned ${assignedCount} assets to work areas`);
    return { assigned: assignedCount, workAreasCreated, suggestedWorkAreas };
    
  } catch (error) {
    console.error("Error in autoAssignAssetsToWorkAreas:", error);
    return { assigned: 0, workAreasCreated: false, suggestedWorkAreas: [] };
  }
}
