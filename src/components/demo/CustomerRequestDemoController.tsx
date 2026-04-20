import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useDemoSync } from "@/contexts/DemoSyncContext";
import { EmailPreviewModal } from "./EmailPreviewModal";

export function CustomerRequestDemoController() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { customerRequestDemo, startCustomerRequestDemo, endCustomerRequestDemo } = useDemoSync();
  const [emailOpen, setEmailOpen] = useState(false);
  const timeoutsRef = useState<number[]>([])[0];

  const clearAll = () => {
    timeoutsRef.forEach((t) => window.clearTimeout(t));
    timeoutsRef.length = 0;
  };

  const stopDemo = () => {
    clearAll();
    setEmailOpen(false);
    endCustomerRequestDemo();
    toast.dismiss();
    toast.info(isNb ? "Demo avsluttet" : "Demo ended");
  };

  // Listen for trigger event
  useEffect(() => {
    const handler = () => {
      startCustomerRequestDemo();

      toast.info(
        isNb
          ? "Sparebank Vest sender en forespørsel om leverandøroppdatering..."
          : "Sparebank Vest is sending a vendor update request...",
        { duration: 3000 }
      );

      // Step 2 + 3: bell pulse already on, then open email modal
      const t1 = window.setTimeout(() => {
        setEmailOpen(true);
      }, 1800);
      timeoutsRef.push(t1);
    };

    window.addEventListener("start-customer-request-demo", handler);
    return () => window.removeEventListener("start-customer-request-demo", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNb]);

  // After email is closed, continue sequence
  const handleEmailClose = () => {
    setEmailOpen(false);

    // Step 4: navigate
    const t1 = window.setTimeout(() => {
      navigate("/customer-requests");
    }, 200);
    timeoutsRef.push(t1);

    // Step 5: highlight already shown via injected demo row in InboundRequestsContent
    const t2 = window.setTimeout(() => {
      toast.info(
        isNb
          ? "Mynder har analysert forespørselen og foreslår et utkast"
          : "Mynder has analyzed the request and prepared a draft",
        { duration: 3500 }
      );
    }, 1500);
    timeoutsRef.push(t2);

    // Step 8: final toast with end button
    const t3 = window.setTimeout(() => {
      toast.success(
        isNb
          ? "Du kan godkjenne svaret med ett klikk"
          : "You can approve the response with one click",
        {
          duration: 8000,
          action: {
            label: isNb ? "Avslutt demo" : "End demo",
            onClick: () => stopDemo(),
          },
        }
      );
    }, 4500);
    timeoutsRef.push(t3);
  };

  if (!customerRequestDemo) return null;

  return (
    <>
      <EmailPreviewModal open={emailOpen} onClose={handleEmailClose} />

      {/* Floating end-demo pill */}
      <div className="fixed top-14 right-4 z-50 animate-fade-in">
        <Button
          onClick={stopDemo}
          size="sm"
          variant="outline"
          className="shadow-md gap-1.5 border-primary/40 bg-background/95 backdrop-blur-sm text-primary hover:bg-primary/5"
        >
          <X className="h-3.5 w-3.5" />
          {isNb ? "Avslutt demo" : "End demo"}
        </Button>
      </div>
    </>
  );
}
