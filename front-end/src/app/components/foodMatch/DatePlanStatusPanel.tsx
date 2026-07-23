import type { DatePlan } from "../../types/foodMatch";
import { WaitingForPartnerCard } from "./WaitingForPartnerCard";
import { NoOverlapCard } from "./NoOverlapCard";
import { OverlapFoundCard } from "./OverlapFoundCard";

interface DatePlanStatusPanelProps {
  plan: DatePlan | null;
  onEditAvailability: () => void;
  onAcceptSuggestion: () => void;
  onOpenRecommendation: () => void;
  acceptingSuggestion?: boolean;
}

/** Inline chat panel reflecting current date-plan status */
export function DatePlanStatusPanel({
  plan,
  onEditAvailability,
  onAcceptSuggestion,
  onOpenRecommendation,
  acceptingSuggestion,
}: DatePlanStatusPanelProps) {
  if (!plan) return null;

  if (plan.status === "waiting_partner") {
    return <WaitingForPartnerCard />;
  }

  if (plan.status === "no_overlap") {
    return (
      <NoOverlapCard
        yours={plan.yours}
        theirs={plan.theirs}
        suggested={plan.suggested}
        onEditAvailability={onEditAvailability}
        onAcceptSuggestion={onAcceptSuggestion}
        accepting={acceptingSuggestion}
      />
    );
  }

  if (plan.status === "overlap_found" || plan.status === "recommending") {
    if (!plan.overlap) return null;

    const noRestaurant =
      plan.status === "overlap_found" &&
      (plan.candidate_count ?? 0) === 0 &&
      Boolean(plan.ranking_reason);

    return (
      <div className="mx-2 my-2">
        <OverlapFoundCard
          overlap={plan.overlap}
          loadingRestaurant={
            !noRestaurant &&
            (plan.status === "recommending" || !plan.recommendation)
          }
        />
        {noRestaurant && (
          <p className="mt-2 rounded-2xl border border-bs-neutral-200 bg-bs-neutral-50 px-4 py-3 text-sm text-bs-neutral-700">
            {plan.ranking_reason ||
              "No suitable restaurant found near both of you for this time."}
          </p>
        )}
      </div>
    );
  }

  if (plan.status === "restaurant_ready" && plan.recommendation) {
    return (
      <div className="mx-2 my-2">
        <OverlapFoundCard overlap={plan.overlap!} loadingRestaurant={false} />
        <button
          type="button"
          onClick={onOpenRecommendation}
          className="mt-2 w-full rounded-2xl border border-bs-gold bg-bs-gold/15 px-4 py-3 text-sm font-semibold text-bs-neutral-900 hover:bg-bs-gold/25 transition-colors"
        >
          View restaurant recommendation →
        </button>
      </div>
    );
  }

  if (plan.status === "accepted" && plan.recommendation) {
    return (
      <div className="mx-2 my-2 rounded-2xl border border-bs-green/30 bg-bs-green/10 p-4 text-sm">
        <p className="font-semibold text-bs-neutral-900">Food date locked in!</p>
        <p className="text-bs-neutral-700 mt-1">
          {plan.recommendation.name}
          {plan.overlap
            ? ` · ${plan.overlap.date} at ${plan.overlap.meeting_time.slice(0, 5)}`
            : ""}
        </p>
        <button
          type="button"
          onClick={onOpenRecommendation}
          className="mt-2 text-bs-red font-medium underline"
        >
          View details
        </button>
      </div>
    );
  }

  return null;
}
