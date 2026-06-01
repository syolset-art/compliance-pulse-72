import { CustomerCatalogPreview } from "../CustomerCatalogPreview";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_SERVICES } from "./demoServices";

export function CatalogView() {
  return (
    <PreviewFrame
      title="Tjenestekatalog i kundens Trust Center"
      subtitle="Kunden ser dette innlogget — én seksjon per aktiv tjeneste."
      channel="Innlogget"
      surface="muted"
      note={{
        file: "src/pages/TrustCenterSaaS.tsx",
        component: "<CustomerCatalogPreview /> (uten asEmail)",
        channel: "Kundeportal — fane «Tjenester fra leverandør»",
        trigger: "Lasting av Trust Center når kunden har minst én aktiv tjeneste fra partner",
        propsExample: `<CustomerCatalogPreview services={activeServices} />`,
      }}
    >
      <CustomerCatalogPreview services={DEMO_CUSTOMER_SERVICES} />
    </PreviewFrame>
  );
}
