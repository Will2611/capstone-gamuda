import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import type { OverlapView } from "../../types/foodMatch";
import { PlanProgressIndicator } from "./PlanProgressIndicator";

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m?.slice(0, 2) ?? "00"} ${ampm}`;
}

export function OverlapFoundCard({
  overlap,
  loadingRestaurant,
}: {
  overlap: OverlapView;
  loadingRestaurant?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-2 my-2 rounded-2xl border border-bs-green/30 bg-gradient-to-br from-bs-green/10 to-white p-4 shadow-sm"
    >
      <PlanProgressIndicator
        status={loadingRestaurant ? "recommending" : "overlap_found"}
      />
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-bs-green shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-bs-neutral-900 text-lg">Date Confirmed</p>
          <p className="text-bs-neutral-800 mt-1">
            {overlap.date}
            <span className="mx-2 text-bs-neutral-400">·</span>
            {fmtTime(overlap.meeting_time)}
          </p>
          <p className="text-xs text-bs-neutral-500 mt-1">
            Overlap {fmtTime(overlap.start_time)} – {fmtTime(overlap.end_time)}
          </p>
          {loadingRestaurant && (
            <p className="text-sm text-bs-gold mt-2 animate-pulse">
              Finding the best restaurant for both of you…
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
