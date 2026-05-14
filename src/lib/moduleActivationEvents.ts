// Lightweight pub/sub for module activation skeletons in the sidebar.
// Any flow that activates a module should dispatch start, then end
// (or rely on the auto-timeout) so the sidebar can show a placeholder.

export type ActivatableModule = "vendors" | "core" | "assets";

const START = "module:activating";
const END = "module:activated";

export function notifyModuleActivating(module: ActivatableModule) {
  window.dispatchEvent(new CustomEvent(START, { detail: { module } }));
}

export function notifyModuleActivated(module: ActivatableModule) {
  window.dispatchEvent(new CustomEvent(END, { detail: { module } }));
}

export const MODULE_ACTIVATION_EVENTS = { START, END } as const;
