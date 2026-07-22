import { motion } from "motion/react";
import type { AvailabilityView, SuggestedSlotView } from "../../types/foodMatch";
import { PlanProgressIndicator } from "./PlanProgressIndicator";
import { Button } from "../Button";

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m?.slice(0, 2) ?? "00"} ${ampm}`;
}

interface NoOverlapCardProps {
  yours?: AvailabilityView | null;
  theirs?: AvailabilityView | null;
  suggested?: SuggestedSlotView | null;
  onEditAvailability: () => void;
  onAcceptSuggestion?: () => void;
  accepting?: boolean;
}

export function NoOverlapCard({
  yours,
  theirs,
  suggested,
  onEditAvailability,
  onAcceptSuggestion,
  accepting,
}: NoOverlapCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-2 my-2 rounded-2xl border border-bs-red/20 bg-white p-4 shadow-sm space-y-3"
    >
      <PlanProgressIndicator status="no_overlap" />
      <p className="font-semibold text-bs-neutral-900">
        No matching availability found.
      </p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-bs-neutral-50 p-3">
          <p className="text-xs text-bs-neutral-500 mb-1">Your Availability</p>
          {yours ? (
            <>
              <p className="font-medium">{yours.available_date}</p>
              <p>
                {fmtTime(yours.start_time)} – {fmtTime(yours.end_time)}
              </p>
            </>
          ) : (
            <p className="text-bs-neutral-400">—</p>
          )}
        </div>
        <div className="rounded-xl bg-bs-neutral-50 p-3">
          <p className="text-xs text-bs-neutral-500 mb-1">Their Availability</p>
          {theirs ? (
            <>
              <p className="font-medium">{theirs.available_date}</p>
              <p>
                {fmtTime(theirs.start_time)} – {fmtTime(theirs.end_time)}
              </p>
            </>
          ) : (
            <p className="text-bs-neutral-400">—</p>
          )}
        </div>
      </div>

      {suggested && (
        <div className="rounded-xl border border-dashed border-bs-gold/50 bg-bs-gold/5 p-3 text-sm">
          <p className="text-xs font-medium text-bs-neutral-500 mb-1">
            Suggested closest time (midpoint)
          </p>
          <p className="font-semibold text-bs-neutral-900">
            {suggested.date} · {fmtTime(suggested.meeting_time)}
          </p>
          <p className="text-bs-neutral-600 mt-1 text-xs">{suggested.rationale}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        {suggested && onAcceptSuggestion && (
          <Button
            className="flex-1"
            onClick={onAcceptSuggestion}
            disabled={accepting}
          >
            {accepting ? "Accepting…" : "Use Suggested Time"}
          </Button>
        )}
        <Button
          className="flex-1"
          variant="secondary"
          onClick={onEditAvailability}
        >
          Edit Availability
        </Button>
      </div>
    </motion.div>
  );
}
