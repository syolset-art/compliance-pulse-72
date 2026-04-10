import { useEffect } from "react";

/**
 * Listens for the global "open-page-help" event dispatched from TopBar.
 * Call with the setter for your local helpOpen state.
 */
export function usePageHelpListener(setHelpOpen: (open: boolean) => void) {
  useEffect(() => {
    const handler = () => setHelpOpen(true);
    window.addEventListener("open-page-help", handler);
    return () => window.removeEventListener("open-page-help", handler);
  }, [setHelpOpen]);
}
