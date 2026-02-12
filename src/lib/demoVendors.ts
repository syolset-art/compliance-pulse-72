// Hardcoded demo vendors used as fallback when PDF analysis returns 0 suppliers
export const DEMO_VENDORS = [
  {
    name: "Microsoft 365",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: true,
    certifications: ["ISO 27001", "SOC 2 Type II"],
  },
  {
    name: "Google Workspace",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: true,
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27017"],
  },
  {
    name: "Salesforce",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: true,
    certifications: ["ISO 27001", "SOC 2 Type II"],
  },
  {
    name: "Slack",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: false,
    certifications: ["SOC 2 Type II"],
  },
  {
    name: "HubSpot",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: false,
    certifications: ["SOC 2 Type II"],
  },
  {
    name: "Amazon Web Services",
    type: "Cloud",
    dataProcessing: true,
    hasDPA: true,
    certifications: ["ISO 27001", "SOC 2 Type II", "ISO 27018"],
  },
  {
    name: "Dropbox Business",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: false,
    certifications: ["ISO 27001"],
  },
  {
    name: "Visma",
    type: "SaaS",
    dataProcessing: true,
    hasDPA: true,
    certifications: ["ISO 27001"],
  },
];
