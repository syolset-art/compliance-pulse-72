import { CustomerCatalogPreview } from "../CustomerCatalogPreview";
import { PreviewFrame } from "./PreviewFrame";
import { DEMO_CUSTOMER_NAME, DEMO_CUSTOMER_SERVICES, DEMO_PARTNER_NAME } from "./demoServices";

export function EmailOfferView() {
  return (
    <PreviewFrame
      title="E-post med tilbud"
      subtitle="Sendes når partner deler tjenestekatalogen som tilbud."
      channel="E-post"
      surface="muted"
      note={{
        file: "src/components/msp/CustomerCatalogPreview.tsx",
        component: "<CustomerCatalogPreview asEmail />",
        channel: "Utgående e-post (transaksjonell)",
        trigger: "Partner klikker «Del tilbud» i ShareOfferDialog",
        propsExample: `<CustomerCatalogPreview
  asEmail
  customerName="${DEMO_CUSTOMER_NAME}"
  partnerName="${DEMO_PARTNER_NAME}"
  services={visibleServices}
/>`,
      }}
    >
      <CustomerCatalogPreview
        asEmail
        customerName={DEMO_CUSTOMER_NAME}
        partnerName={DEMO_PARTNER_NAME}
        services={DEMO_CUSTOMER_SERVICES}
      />
    </PreviewFrame>
  );
}
