/** Forbruksvennlige forsinkelsesklasser for staggered fade-in-up. */
export const STAGGER_DELAY_STEPS = [
  "",
  "motion-safe:animate-delay-50",
  "motion-safe:animate-delay-100",
  "motion-safe:animate-delay-150",
  "motion-safe:animate-delay-200",
  "motion-safe:animate-delay-250",
  "motion-safe:animate-delay-300",
  "motion-safe:animate-delay-350",
  "motion-safe:animate-delay-400",
] as const;

/** Returnerer en Tailwind-klasse med `motion-safe:animate-fade-in-up` + økende delay. */
export function staggerEntranceClass(index: number): string {
  const delay = STAGGER_DELAY_STEPS[Math.min(Math.max(index, 0), STAGGER_DELAY_STEPS.length - 1)] ?? "";
  return delay ? `motion-safe:animate-fade-in-up ${delay}` : "motion-safe:animate-fade-in-up";
}
