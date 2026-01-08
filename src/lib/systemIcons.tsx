import { 
  Bot, 
  Cloud, 
  Database, 
  FileText, 
  Globe, 
  Mail, 
  MessageSquare, 
  Shield, 
  Users, 
  Zap,
  Server,
  Lock,
  CreditCard,
  BarChart3,
  Briefcase,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  // Microsoft products
  "microsoft": Bot,
  "copilot": Bot,
  "azure": Cloud,
  "office": FileText,
  "outlook": Mail,
  "teams": MessageSquare,
  "sharepoint": Database,
  "dynamics": Briefcase,
  
  // Google products
  "google": Globe,
  "gmail": Mail,
  "workspace": Users,
  
  // Common vendors
  "salesforce": Users,
  "slack": MessageSquare,
  "zoom": MessageSquare,
  "aws": Cloud,
  "amazon": Cloud,
  "oracle": Database,
  "sap": Briefcase,
  "servicenow": Zap,
  
  // Security
  "okta": Lock,
  "auth0": Lock,
  "crowdstrike": Shield,
  "palo alto": Shield,
  
  // Categories
  "crm": Users,
  "erp": Briefcase,
  "hr": Users,
  "finance": CreditCard,
  "analytics": BarChart3,
  "security": Shield,
  "communication": MessageSquare,
  "storage": Database,
  "infrastructure": Server,
};

export const getSystemIcon = (name?: string | null, vendor?: string | null): LucideIcon => {
  const searchTerms = [name, vendor].filter(Boolean).join(" ").toLowerCase();
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (searchTerms.includes(key)) {
      return icon;
    }
  }
  
  return Server; // Default icon
};
