import type { DatePlanStatus } from "../../types/foodMatch";

const STEPS = [
  { key: "availability", label: "Availability" },
  { key: "matching", label: "Matching" },
  { key: "restaurant", label: "Restaurant" },
  { key: "confirmed", label: "Confirmed" },
] as const;

function stepIndex(status: DatePlanStatus | null | undefined): number {
  switch (status) {
    case "draft":
    case "waiting_partner":
      return 0;
    case "no_overlap":
    case "overlap_found":
      return 1;
    case "recommending":
    case "restaurant_ready":
      return 2;
    case "accepted":
      return 3;
    default:
      return 0;
  }
}

export function PlanProgressIndicator({
  status,
}: {
  status?: DatePlanStatus | null;
}) {
  const active = stepIndex(status);
  return (
    <div className="flex items-center gap-1 w-full mb-3">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-1.5 w-full rounded-full transition-colors ${
              i <= active ? "bg-bs-gold" : "bg-bs-neutral-200"
            }`}
          />
          <span
            className={`text-[10px] ${
              i <= active ? "text-bs-neutral-800 font-medium" : "text-bs-neutral-400"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
